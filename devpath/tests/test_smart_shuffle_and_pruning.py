"""
DevPath — Smart Shuffle & Context-Aware Dependency Pruning Verification Suite.
Verifies:
1. Exhaustive Smart Shuffle:
   - Stage 3 Focus Discovery: 4 consecutive 5-card shuffles in a 20-item pool
     presents all 20 unique candidates with zero duplicate cards before recycling.
   - Invariant: Selected focus nodes never appear in discovery pool.
   - Stage 6 Infrastructure: Shuffling an infra group with >3 candidates
     cycles through unseen alternatives.
2. Context-Aware Prioritization (RelevanceScorer):
   - Dynamic tier ranking prioritizes highest affinity options on top.
   - Recommended badges (.stack-rec-badge, .infra-rec-badge) render for high scores (>= 15).
   - Website + Jamstack prioritizes Vercel / Netlify.
   - Game + Mobile Focus prioritizes Mobile Stores.
   - Software + CLI prioritizes GitHub Releases / Package Managers.
3. Mutual Exclusion & Dependency Pruning (Self-Healing State):
   - Selecting Godot 2D eliminates incompatible languages (GML, Lua).
   - Switching Engine to GameMaker automatically resets/clears incompatible downstream selection
     (GDScript -> null) and prunes options to GML.
   - Switching to Unity 2D resets GML and presents C#.
4. Zero console errors and uncaught exceptions.
"""
import os
import re
import sys
from playwright.sync_api import sync_playwright
from test_utils import setup_page, get_stage_badge

def run_smart_shuffle_and_pruning_tests(browser=None):
    results = {
        "suite": "Smart Shuffle & Dependency Pruning",
        "passed": 0,
        "failed": 0,
        "errors": [],
        "console_errors": 0,
        "uncaught_exceptions": 0
    }

    def record_pass(name):
        results["passed"] += 1
        print(f"  [PASS] {name}")

    def record_fail(name, detail=""):
        results["failed"] += 1
        err_msg = f"{name}: {detail}"
        results["errors"].append(err_msg)
        print(f"  [FAIL] {err_msg}")

    own_browser = False
    if browser is None:
        pw = sync_playwright().start()
        browser = pw.chromium.launch(headless=True)
        own_browser = True

    try:
        # ══════════════════════════════════════════════════════════
        # PART 1: EXHAUSTIVE SMART SHUFFLE (STAGE 3 FOCUS)
        # ══════════════════════════════════════════════════════════
        print("\n--- Part 1: Exhaustive Smart Shuffle in Stage 3 Focus ---")
        context, page, console_errs, page_errs = setup_page(browser, 1440, 900)

        page.locator("#bp-project-name-input").fill("OmniCraft")
        page.locator("#bp-btn-begin").click()
        page.wait_for_timeout(900)
        page.locator("[data-node-id='game'] .branch-card-inner").click()
        page.wait_for_timeout(900)

        # Collect 4 rounds of 5 discovery items (total 20 pool items in PROJECT_FOCUS['game'])
        all_seen_batches = []
        all_seen_flat = []

        for round_idx in range(4):
            current_batch = page.evaluate("""() => {
                const cards = Array.from(document.querySelectorAll('.focus-discovery-card'));
                return cards.map(c => {
                    const title = c.querySelector('.focus-disc-title');
                    return title ? title.innerText.trim() : '';
                }).filter(Boolean);
            }""")

            all_seen_batches.append(current_batch)
            all_seen_flat.extend(current_batch)

            if round_idx < 3:
                # Click shuffle button
                page.locator(".focus-shuffle-control").first.click()
                page.wait_for_timeout(600)

        # Invariant 1: Exactly 5 cards per batch
        batch_sizes = [len(b) for b in all_seen_batches]
        if all(size == 5 for size in batch_sizes):
            record_pass(f"Each discovery batch contains exactly 5 candidates: {batch_sizes}")
        else:
            record_fail("Discovery batch size invariant", f"Got batch sizes: {batch_sizes}")

        # Invariant 2: Zero duplicate cards across all 4 consecutive batches (20 unique items)
        unique_seen = set(all_seen_flat)
        if len(unique_seen) == 20:
            record_pass(f"Exhaustive 4-round shuffle presented all 20 unique pool options with zero duplicates: {len(unique_seen)}/20")
        else:
            # Check how many were unique
            record_fail("Exhaustive shuffle uniqueness", f"Expected 20 unique items across 4 rounds, got {len(unique_seen)} (duplicates: {len(all_seen_flat) - len(unique_seen)})")

        # Invariant 3: Select an item and ensure it never reappears in discovery pool on subsequent shuffles
        first_card = page.locator(".focus-discovery-card").first
        selected_text = first_card.locator(".focus-disc-title").inner_text().strip()
        first_card.click()
        page.wait_for_timeout(600)

        # Verify selected card is in selected list and removed from discovery
        is_in_discovery_after_select = page.evaluate("""(title) => {
            const cards = Array.from(document.querySelectorAll('.focus-discovery-card .focus-disc-title'));
            return cards.some(c => c.innerText.trim().toUpperCase() === title.toUpperCase());
        }""", selected_text)

        if not is_in_discovery_after_select:
            record_pass(f"Selected focus item '{selected_text}' immediately excised from discovery pool")
        else:
            record_fail("Selected focus item still visible in discovery pool", selected_text)

        # Shuffle again and ensure selected item STILL never reappears
        page.locator(".focus-shuffle-control").first.click()
        page.wait_for_timeout(600)

        is_in_discovery_after_reshuffle = page.evaluate("""(title) => {
            const cards = Array.from(document.querySelectorAll('.focus-discovery-card .focus-disc-title'));
            return cards.some(c => c.innerText.trim().toUpperCase() === title.toUpperCase());
        }""", selected_text)

        if not is_in_discovery_after_reshuffle:
            record_pass(f"Selected focus item '{selected_text}' never appears in discovery pool after reshuffle")
        else:
            record_fail("Selected focus item reappeared in discovery pool after reshuffle", selected_text)

        # ══════════════════════════════════════════════════════════
        # PART 2: CONTEXT-AWARE RELEVANCE SCORING & BADGES
        # ══════════════════════════════════════════════════════════
        print("\n--- Part 2: Context-Aware Relevance Prioritization ---")

        # Test RelevanceScorer directly in browser context
        scorer_test = page.evaluate("""() => {
            const Scorer = window.DevPath.RelevanceScorer;
            const groups = window.DevPath.DECISION_GROUPS;

            // Scenario A: Website + static-jamstack with interactive focus
            const jamstackContext = {
                type: 'website',
                architecturePath: 'static-jamstack',
                focus: ['interactive-visual'],
                stack: { framework: 'astro' }
            };
            const hostingGroup = groups['infra-web-hosting'];
            const sortedHosting = Scorer.sortOptions(hostingGroup.options, jamstackContext);

            // Scenario B: Game + game-2d with mobile focus
            const gameMobileContext = {
                type: 'game',
                architecturePath: 'game-2d',
                focus: ['mobile-touch'],
                stack: { engine: 'godot-2d' }
            };
            const distroGroup = groups['infra-game-distro'];
            const sortedDistro = Scorer.sortOptions(distroGroup.options, gameMobileContext);

            // Scenario C: Software + cli-utility
            const cliContext = {
                type: 'software',
                architecturePath: 'cli-utility',
                focus: ['cli-developer'],
                stack: { language: 'rust', cli_framework: 'clap' }
            };
            const cliDistroGroup = groups['infra-sw-distro'];
            const sortedCliDistro = Scorer.sortOptions(cliDistroGroup.options, cliContext);

            return {
                jamstackTop: sortedHosting[0]?.id,
                jamstackTopScore: sortedHosting[0]?._relevanceScore,
                gameMobileTop: sortedDistro[0]?.id,
                gameMobileTopScore: sortedDistro[0]?._relevanceScore,
                cliDistroTop: sortedCliDistro[0]?.id,
                cliDistroTopScore: sortedCliDistro[0]?._relevanceScore
            };
        }""")

        # Verify Scenario A
        if scorer_test["jamstackTop"] in ("netlify", "vercel", "cloudflare-infra"):
            record_pass(f"Static Jamstack prioritizes edge hosting on top: {scorer_test['jamstackTop']} (score: {scorer_test['jamstackTopScore']})")
        else:
            record_fail("Jamstack top recommendation", str(scorer_test))

        # Verify Scenario B (Mobile touch focus makes mobile-stores top priority)
        if scorer_test["gameMobileTop"] == "mobile-stores":
            record_pass(f"Mobile Game focus places 'mobile-stores' on top: {scorer_test['gameMobileTop']} (score: {scorer_test['gameMobileTopScore']})")
        else:
            record_fail("Game mobile recommendation", str(scorer_test))

        # Verify Scenario C (CLI utility prioritizes package managers / github releases)
        if scorer_test["cliDistroTop"] in ("package-managers", "github-releases"):
            record_pass(f"CLI utility prioritizes package managers / releases on top: {scorer_test['cliDistroTop']} (score: {scorer_test['cliDistroTopScore']})")
        else:
            record_fail("CLI distro recommendation", str(scorer_test))

        # ══════════════════════════════════════════════════════════
        # PART 3: MUTUAL EXCLUSION & DEPENDENCY PRUNING (SELF-HEALING)
        # ══════════════════════════════════════════════════════════
        print("\n--- Part 3: Mutual Exclusion & Dependency Pruning ---")

        # Advance to Stage 4 Architecture Path
        page.evaluate("() => window.DevPath.transitionToStage4()")
        page.wait_for_timeout(1000)

        # Select 2D Game Architecture Path
        page.locator("[data-node-id='game-2d'] .branch-card-inner").click()
        page.wait_for_timeout(2200)

        # In Stage 5 (game-2d): Check initial language options before selecting engine
        initial_lang_options = page.evaluate("""() => {
            const langCards = Array.from(document.querySelectorAll('[data-node-id^="stack-language-"]'));
            return langCards.map(c => c.getAttribute('data-node-id').replace('stack-language-', ''));
        }""")

        if len(initial_lang_options) >= 3:
            record_pass(f"Initial game-2d language tier presents candidate options: {initial_lang_options}")
        else:
            record_fail("Initial language options count", str(initial_lang_options))

        # 1. Select Godot 2D in Engine tier
        godot_card = page.locator("[data-node-id='stack-engine-godot-2d'] .stack-tech-inner")
        godot_card.click()
        page.wait_for_timeout(1500)

        # Verify incompatible languages (GML, Lua) are pruned from DOM
        godot_lang_options = page.evaluate("""() => {
            const langCards = Array.from(document.querySelectorAll('[data-node-id^="stack-language-"]'));
            return langCards.map(c => c.getAttribute('data-node-id').replace('stack-language-', ''));
        }""")

        if "gdscript" in godot_lang_options and "csharp" in godot_lang_options and "gml" not in godot_lang_options and "lua" not in godot_lang_options:
            record_pass(f"Godot 2D eliminates incompatible languages (GML, Lua). Remaining: {godot_lang_options}")
        else:
            record_fail("Godot language dependency pruning", f"Got: {godot_lang_options}")

        # Verify GDScript has the RECOMMENDED badge
        gdscript_has_badge = page.evaluate("""() => {
            const card = document.querySelector('[data-node-id="stack-language-gdscript"]');
            return Boolean(card && card.querySelector('.stack-rec-badge'));
        }""")
        if gdscript_has_badge:
            record_pass("GDScript renders RECOMMENDED badge when paired with Godot 2D")
        else:
            record_fail("GDScript recommended badge missing")

        # 2. Select GDScript
        gdscript_card = page.locator("[data-node-id='stack-language-gdscript'] .stack-tech-inner")
        gdscript_card.click()
        page.wait_for_timeout(1000)

        # Check that GDScript is locked in state
        selected_lang_1 = page.evaluate("() => window.ProjectBlueprint.store.get().selectedStack['language']")
        if selected_lang_1 == "gdscript":
            record_pass("GDScript locked in selectedStack")
        else:
            record_fail("GDScript state selection", str(selected_lang_1))

        # 3. Switch Engine to GameMaker!
        # GameMaker is only compatible with GML. GDScript must be self-healed (cleared)!
        gamemaker_card = page.locator("[data-node-id='stack-engine-gamemaker'] .stack-tech-inner")
        gamemaker_card.click()
        page.wait_for_timeout(1500)

        # Verify self-healing: GDScript was pruned/reset in selectedStack
        selected_lang_2 = page.evaluate("() => window.ProjectBlueprint.store.get().selectedStack['language']")
        gamemaker_lang_options = page.evaluate("""() => {
            const langCards = Array.from(document.querySelectorAll('[data-node-id^="stack-language-"]'));
            return langCards.map(c => c.getAttribute('data-node-id').replace('stack-language-', ''));
        }""")

        if selected_lang_2 is None or selected_lang_2 == "":
            record_pass("Self-healing state: switching Engine from Godot to GameMaker automatically cleared incompatible GDScript selection")
        else:
            record_fail("Self-healing language reset failed", f"selectedStack['language'] is still '{selected_lang_2}'")

        if gamemaker_lang_options == ["gml"]:
            record_pass(f"GameMaker strictly constrains language tier to GML: {gamemaker_lang_options}")
        else:
            record_fail("GameMaker language constraints", str(gamemaker_lang_options))

        # 4. Switch Engine to Unity 2D
        unity_card = page.locator("[data-node-id='stack-engine-unity-2d'] .stack-tech-inner")
        unity_card.click()
        page.wait_for_timeout(1500)

        unity_lang_options = page.evaluate("""() => {
            const langCards = Array.from(document.querySelectorAll('[data-node-id^="stack-language-"]'));
            return langCards.map(c => c.getAttribute('data-node-id').replace('stack-language-', ''));
        }""")

        if "csharp" in unity_lang_options and "gml" not in unity_lang_options and "gdscript" not in unity_lang_options:
            record_pass(f"Unity 2D constrains language tier to C#: {unity_lang_options}")
        else:
            record_fail("Unity 2D language constraints", str(unity_lang_options))

        # ══════════════════════════════════════════════════════════
        # PART 4: STAGE 6 INFRASTRUCTURE SMART SHUFFLE
        # ══════════════════════════════════════════════════════════
        print("\n--- Part 4: Stage 6 Infrastructure Smart Shuffle ---")

        # Advance to Stage 6
        page.evaluate("() => window.DevPath.transitionToStage6()")
        page.wait_for_timeout(2000)

        # Verify group with >3 options (e.g. infra-game-distro has 5 options: steam, itch, epic, gog, mobile-stores)
        has_shuffle_button = page.evaluate("""() => {
            const groupHeader = document.querySelector('[data-node-id="infra-header-infra-game-distro"]');
            if (!groupHeader) return false;
            const btn = groupHeader.querySelector('.infra-header-shuffle-btn');
            return Boolean(btn);
        }""")

        if has_shuffle_button:
            record_pass("Infrastructure group with >3 candidates renders '⟳ SHUFFLE' button")
        else:
            record_fail("Infrastructure shuffle button not found in infra-game-distro header")

        # Read visible options before shuffle
        distro_options_before = page.evaluate("""() => {
            const cards = Array.from(document.querySelectorAll('[data-node-id^="infra-opt-infra-game-distro-"]'));
            return cards.map(c => c.getAttribute('data-node-id').replace('infra-opt-infra-game-distro-', ''));
        }""")

        # Click Shuffle on the infra-game-distro group
        shuffle_clicked = page.evaluate("""() => {
            const btn = document.querySelector('[data-node-id="infra-header-infra-game-distro"] .infra-header-shuffle-btn');
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }""")

        page.wait_for_timeout(1000)

        distro_options_after = page.evaluate("""() => {
            const cards = Array.from(document.querySelectorAll('[data-node-id^="infra-opt-infra-game-distro-"]'));
            return cards.map(c => c.getAttribute('data-node-id').replace('infra-opt-infra-game-distro-', ''));
        }""")

        if distro_options_before != distro_options_after:
            record_pass(f"Infrastructure shuffle rotated visible candidates: before={distro_options_before} -> after={distro_options_after}")
        else:
            record_fail("Infrastructure shuffle did not rotate candidates", f"before={distro_options_before}, after={distro_options_after}")

        # Check console errors and uncaught exceptions
        results["console_errors"] = len(console_errs)
        results["uncaught_exceptions"] = len(page_errs)

        if len(console_errs) == 0 and len(page_errs) == 0:
            record_pass("Zero console errors and zero uncaught exceptions in smart shuffle and pruning tests")
        else:
            record_fail("Console/Page errors detected", f"Console: {console_errs}, Page: {page_errs}")

        context.close()

    finally:
        if own_browser:
            browser.close()

    return results

if __name__ == "__main__":
    res = run_smart_shuffle_and_pruning_tests()
    print(f"\n{res['passed']} passed, {res['failed']} failed")
    if res["failed"] > 0:
        sys.exit(1)
    sys.exit(0)

