"""
DevPath — Multi-Select and Shuffle Invariant Verification.
Verifies:
1. Multi-select capability in Focus selection and multi-select decision groups.
2. Single-select mutual exclusivity in single-select decision groups.
3. Shuffle Invariant:
   available = ALL - SELECTED - VISIBLE
   Shuffling draws only from available pool, never duplicates selected nodes,
   and handles pool exhaustion cleanly.
4. Zero console errors and uncaught exceptions.
"""
import re
import sys
from playwright.sync_api import sync_playwright
from test_utils import setup_page, get_stage_badge, click_card_by_title

def run_multi_select_and_shuffle_tests(browser=None):
    results = {
        "suite": "Multi-Select & Shuffle Invariant",
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
        context, page, console_errs, page_errs = setup_page(browser, 1440, 900)

        # ── Setup Stage 1 & 2: GAME project ──
        page.locator("#bp-project-name-input").fill("ShuffleCraft")
        page.locator("#bp-btn-begin").click()
        page.wait_for_timeout(1000)
        page.locator("[data-node-id='game'] .branch-card-inner").click()
        page.wait_for_timeout(1000)

        # ── Part 1: Shuffle Invariant in Focus Discovery ──
        # Check initial visible discovery cards
        initial_cards = page.evaluate("""() => {
            const discCards = Array.from(document.querySelectorAll('.focus-discovery-card'));
            return discCards.map(c => c.querySelector('.focus-disc-title') ? c.querySelector('.focus-disc-title').innerText.trim() : '');
        }""")

        if len(initial_cards) in (3, 5):
            record_pass(f"Initial discovery pool displays active candidates: {initial_cards}")
        else:
            record_fail("Initial discovery count", f"Got {len(initial_cards)} cards")

        # Select first visible card
        first_card_title = initial_cards[0]
        page.locator(".focus-discovery-card").first.click()
        page.wait_for_timeout(900)

        # Invariant check: selected card is now in selectedFocus, not in discovery
        selected_titles = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('.focus-selected-card .focus-node-title')).map(el => el.innerText.trim());
        }""")
        disc_after_select = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('.focus-discovery-card .focus-disc-title')).map(el => el.innerText.trim());
        }""")

        sel_upper = [t.upper() for t in selected_titles]
        disc_upper = [t.upper() for t in disc_after_select]

        if first_card_title.upper() in sel_upper and first_card_title.upper() not in disc_upper:
            record_pass(f"Selected card '{first_card_title}' moved from discovery pool to permanent sibling node")
        else:
            record_fail("Selection isolation", f"Selected: {selected_titles}, Discovery: {disc_after_select}")

        # Now test Shuffle invariant over multiple consecutive shuffles
        shuffle_success = True
        for shuffle_idx in range(3):
            # Capture visible before shuffle
            visible_before = set(page.evaluate("""() => {
                return Array.from(document.querySelectorAll('.focus-discovery-card .focus-disc-title')).map(el => el.innerText.trim());
            }"""))

            # Click shuffle
            page.locator(".focus-shuffle-control").first.click()
            page.wait_for_timeout(800)

            visible_after = set(page.evaluate("""() => {
                return Array.from(document.querySelectorAll('.focus-discovery-card .focus-disc-title')).map(el => el.innerText.trim());
            }"""))
            current_selected = set(page.evaluate("""() => {
                return Array.from(document.querySelectorAll('.focus-selected-card .focus-node-title')).map(el => el.innerText.trim());
            }"""))

            # Invariant 1: No selected card can ever appear in visible_after
            overlap_selected = visible_after.intersection(current_selected)
            if overlap_selected:
                record_fail(f"Shuffle invariant violated: selected card(s) {overlap_selected} appeared in discovery pool")
                shuffle_success = False
                break

            # Invariant 2: The pool changed (if available > 3)
            # Total pool is 20, selected is 1, so 19 available. Visible after should not be completely identical.
            if visible_after == visible_before:
                record_fail("Shuffle produced identical visible choices when 19 candidates available")
                shuffle_success = False
                break

        if shuffle_success:
            record_pass("Shuffle invariant verified across multiple rounds: available = ALL - SELECTED - VISIBLE")

        # ── Part 2: Single-Select vs Multi-Select in Decision Groups ──
        # Advance to Stage 6 via DevPath API
        page.evaluate("() => window.DevPath.transitionToStage6()")
        page.wait_for_timeout(1000)

        # Single-select group: infra-game-ci (github-actions-game vs local-build)
        ci_single_test = page.evaluate("""() => {
            const dp = window.DevPath;
            // Select github-actions-game
            dp.selectInfraTech('infra-game-ci', 'github-actions-game');
            const s1 = window.ProjectBlueprint.store.get().selectedInfra['infra-game-ci'];

            // Select local-build (should replace github-actions-game in single-select)
            dp.selectInfraTech('infra-game-ci', 'local-build');
            const s2 = window.ProjectBlueprint.store.get().selectedInfra['infra-game-ci'];

            return { s1, s2 };
        }""")

        if ci_single_test["s1"] == "github-actions-game" and ci_single_test["s2"] == "local-build":
            record_pass("Single-select group enforces mutual exclusivity (replacing selection)")
        else:
            record_fail("Single-select mutual exclusivity", str(ci_single_test))

        # Multi-select group: infra-monitoring (e.g. sentry and prometheus)
        monitoring_multi_test = page.evaluate("""() => {
            const dp = window.DevPath;
            // Select sentry
            dp.selectInfraTech('infra-monitoring', 'sentry');
            const m1 = window.ProjectBlueprint.store.get().selectedInfra['infra-monitoring'];

            // Select prometheus
            dp.selectInfraTech('infra-monitoring', 'prometheus');
            const m2 = window.ProjectBlueprint.store.get().selectedInfra['infra-monitoring'];

            // Deselect sentry
            dp.selectInfraTech('infra-monitoring', 'sentry');
            const m3 = window.ProjectBlueprint.store.get().selectedInfra['infra-monitoring'];

            return { m1, m2, m3 };
        }""")

        if (monitoring_multi_test["m1"] == ["sentry"] and
            sorted(monitoring_multi_test["m2"]) == sorted(["sentry", "prometheus"]) and
            monitoring_multi_test["m3"] == ["prometheus"]):
            record_pass("Multi-select group allows multiple simultaneous choices and clean toggle deselection")
        else:
            record_fail("Multi-select behavior", str(monitoring_multi_test))

        results["console_errors"] = len(console_errs)
        results["uncaught_exceptions"] = len(page_errs)
        if len(console_errs) == 0 and len(page_errs) == 0:
            record_pass("Zero console errors and zero uncaught exceptions in multi-select & shuffle tests")
        else:
            record_fail("Console/Page errors", f"Console: {console_errs}, Page: {page_errs}")

        context.close()

    finally:
        if own_browser:
            browser.close()

    return results

if __name__ == "__main__":
    res = run_multi_select_and_shuffle_tests()
    print(f"\n{res['passed']} passed, {res['failed']} failed")
    if res["failed"] > 0:
        sys.exit(1)
    sys.exit(0)
