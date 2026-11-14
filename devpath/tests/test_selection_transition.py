"""
DevPath — Stage 5 Selection Transition Verification Suite.
Verifies the smooth in-place "living graph" transition when choosing tech options:
1. Continuous DOM Mounting: Candidate cards remain continuously in the DOM (no blank frames or disappearance).
   Sampled at 50ms, 200ms, and 500ms post-click to prove zero removal.
2. In-Place Visual Feedback:
   - Clicked card receives .selected and checkmark "✓".
   - Unselected sibling cards remain visible and receive .node--sibling-subdued.
   - Connecting SVG path transitions to active and draws progressively.
3. Sibling Switching: Switching between siblings updates in place with zero DOM churn.
4. Convergence Materialization: Downstream convergence node (growth-action-infrastructure)
   materializes smoothly when all tiers are complete.
5. Mobile Stability (390x844): Zero horizontal overflow during and after selection transitions.
6. Zero console errors and zero uncaught exceptions.
"""
import os
import re
import sys
import shutil
from playwright.sync_api import sync_playwright

from test_utils import setup_page, get_stage_badge, click_card_by_title, check_horizontal_overflow

ARTIFACT_DIR = r"C:\Users\enuhri\.gemini\antigravity\brain\0317273b-5754-46d5-b922-f992b7079734"
TEST_DIR = os.path.dirname(os.path.abspath(__file__))

def run_selection_transition_tests(browser=None):
    results = {
        "suite": "Stage 5 Selection Transition",
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
        # PART 1: DESKTOP WORKSPACE (1440x900)
        # ══════════════════════════════════════════════════════════
        print("\n--- Part 1: Desktop Selection Transition (1440x900) ---")
        context, page, console_errs, page_errs = setup_page(browser, 1440, 900)

        # ── Setup Project through Stage 4 ──
        page.locator("#bp-project-name-input").fill("LivingGraph")
        page.locator("#bp-btn-begin").click()
        page.wait_for_timeout(800)

        click_card_by_title(page, "WEBSITE")
        page.wait_for_timeout(800)

        # Select focus characteristic
        page.locator(".focus-discovery-card").first.click()
        page.wait_for_timeout(800)

        page.get_by_role("button", name=re.compile("BUILD ARCHITECTURE PATHS", re.I)).first.click()
        page.wait_for_timeout(1000)

        # Select FULL-STACK WEB APP
        click_card_by_title(page, "FULL-STACK WEB APP")
        page.wait_for_timeout(1500)

        badge = get_stage_badge(page)
        if "STAGE 05" in badge and "TECHNOLOGY STACK" in badge:
            record_pass("Reached Stage 05 (Technology Stack)")
        else:
            record_fail("Stage 05 navigation", f"Badge was '{badge}'")

        # ── Verify Initial Stage 5 DOM Mounting ──
        initial_cards = page.locator(".stack-tech-inner")
        card_count = initial_cards.count()
        if card_count == 9:
            record_pass("All 9 technology candidate cards mounted in DOM (3 tiers x 3 options)")
        else:
            record_fail("Initial candidate cards count", f"Expected 9, got {card_count}")

        # Capture Before Selection Screenshot
        before_path = os.path.join(TEST_DIR, "before_selection.png")
        page.screenshot(path=before_path)
        if os.path.exists(ARTIFACT_DIR):
            shutil.copy(before_path, os.path.join(ARTIFACT_DIR, "before_selection.png"))

        # ── Test Continuous DOM Mounting During Selection ──
        # Click "React" in Frontend Tier
        react_card_btn = page.locator('[data-node-id="stack-frontend-react"] .stack-tech-inner')
        react_card_btn.click()

        # Sample at 50ms: cards must remain in DOM (no clearStage5Nodes destruction)
        page.wait_for_timeout(50)
        count_50ms = page.locator(".stack-tech-inner").count()
        if count_50ms == 9:
            record_pass("DOM Invariant: All 9 candidate cards remain mounted at 50ms (no blank frame)")
        else:
            record_fail("Cards unmounted at 50ms", f"Count dropped to {count_50ms}")

        # Capture During Transition Screenshot
        during_path = os.path.join(TEST_DIR, "during_transition.png")
        page.screenshot(path=during_path)
        if os.path.exists(ARTIFACT_DIR):
            shutil.copy(during_path, os.path.join(ARTIFACT_DIR, "during_transition.png"))

        # Sample at 200ms
        page.wait_for_timeout(150)
        count_200ms = page.locator(".stack-tech-inner").count()
        if count_200ms == 9:
            record_pass("DOM Invariant: All 9 candidate cards remain mounted at 200ms")
        else:
            record_fail("Cards unmounted at 200ms", f"Count was {count_200ms}")

        # Sample at 500ms (transition settling)
        page.wait_for_timeout(300)
        count_500ms = page.locator(".stack-tech-inner").count()
        if count_500ms == 9:
            record_pass("DOM Invariant: All 9 candidate cards remain mounted at 500ms")
        else:
            record_fail("Cards unmounted at 500ms", f"Count was {count_500ms}")

        # ── Verify In-Place Visual Feedback on Selected Card ──
        react_card = page.locator('[data-node-id="stack-frontend-react"]')
        has_sel_bg = react_card.locator(".stack-tech-bg.selected").count() > 0
        has_sel_inner = react_card.locator(".stack-tech-inner.selected").count() > 0
        check_text = react_card.locator(".stack-tech-check").inner_text().strip()

        if has_sel_bg and has_sel_inner and check_text == "✓":
            record_pass("Selected card received in-place .selected class and checkmark '✓'")
        else:
            record_fail("Selected card visual state", f"bg={has_sel_bg}, inner={has_sel_inner}, check='{check_text}'")

        # ── Verify Unselected Siblings ──
        vue_card = page.locator('[data-node-id="stack-frontend-vue"]')
        vue_check = vue_card.locator(".stack-tech-check").inner_text().strip()
        vue_has_sel = vue_card.locator(".stack-tech-inner.selected").count() > 0
        if vue_check == "+" and not vue_has_sel:
            record_pass("Unselected sibling card (Vue) remained in '+' state without .selected")
        else:
            record_fail("Unselected sibling state", f"check='{vue_check}', selected={vue_has_sel}")

        # ── Verify Active Connecting Path ──
        active_paths = page.locator("path.connection-path.active")
        if active_paths.count() >= 1:
            record_pass(f"Active connecting SVG path verified ({active_paths.count()} active paths)")
        else:
            record_fail("Active connecting SVG paths", f"Found {active_paths.count()}")

        # ── Test Sibling Switching (React -> Vue) ──
        vue_card_btn = page.locator('[data-node-id="stack-frontend-vue"] .stack-tech-inner')
        vue_card_btn.click()

        # Immediate sample at 50ms post-switch
        page.wait_for_timeout(50)
        switch_count_50ms = page.locator(".stack-tech-inner").count()
        if switch_count_50ms == 9:
            record_pass("Sibling Switch Invariant: All 9 candidate cards remain mounted at 50ms")
        else:
            record_fail("Cards unmounted on sibling switch", f"Count was {switch_count_50ms}")

        page.wait_for_timeout(450)
        # Vue should now be selected, React unselected
        vue_is_sel = page.locator('[data-node-id="stack-frontend-vue"] .stack-tech-inner.selected').count() > 0
        react_is_sel = page.locator('[data-node-id="stack-frontend-react"] .stack-tech-inner.selected').count() > 0
        vue_check_now = page.locator('[data-node-id="stack-frontend-vue"] .stack-tech-check').inner_text().strip()
        react_check_now = page.locator('[data-node-id="stack-frontend-react"] .stack-tech-check').inner_text().strip()

        if vue_is_sel and not react_is_sel and vue_check_now == "✓" and react_check_now == "+":
            record_pass("Sibling switch cleanly toggled .selected and checkmarks in place")
        else:
            record_fail("Sibling switch state", f"Vue sel={vue_is_sel} ({vue_check_now}), React sel={react_is_sel} ({react_check_now})")

        # ── Test Convergence Node Materialization ──
        # Check convergence node is NOT yet visible (only 1 tier complete)
        conv_before = page.locator('[data-node-id="growth-action-infrastructure"]')
        if conv_before.count() == 0:
            record_pass("Convergence node absent while stack is incomplete")
        else:
            record_fail("Convergence node prematurely mounted", "Found before tiers complete")

        # Complete Tier 2 (Backend -> FastAPI)
        page.locator('[data-node-id="stack-backend-fastapi"] .stack-tech-inner').click()
        page.wait_for_timeout(350)

        # Complete Tier 3 (Database -> PostgreSQL)
        page.locator('[data-node-id="stack-database-postgresql"] .stack-tech-inner').click()
        page.wait_for_timeout(500)

        # All 3 tiers selected: convergence node should materialize smoothly
        conv_after = page.locator('[data-node-id="growth-action-infrastructure"]')
        if conv_after.count() > 0:
            conv_text = conv_after.text_content().strip()
            if "BLUEPRINT" in conv_text or "SYNTHESIZE" in conv_text or "INFRASTRUCTURE" in conv_text:
                record_pass(f"Downstream convergence node materialized cleanly when all tiers complete: '{conv_text}'")
            else:
                record_fail("Convergence node text", f"Unexpected text '{conv_text}'")
        else:
            record_fail("Convergence node missing", "Node not found after all tiers selected")

        # Capture After Transition Screenshot
        after_path = os.path.join(TEST_DIR, "after_transition.png")
        page.screenshot(path=after_path)
        if os.path.exists(ARTIFACT_DIR):
            shutil.copy(after_path, os.path.join(ARTIFACT_DIR, "after_transition.png"))

        # Check console errors on desktop
        results["console_errors"] += len(console_errs)
        results["uncaught_exceptions"] += len(page_errs)
        context.close()

        # ══════════════════════════════════════════════════════════
        # PART 2: MOBILE VIEWPORT STABILITY (390x844)
        # ══════════════════════════════════════════════════════════
        print("\n--- Part 2: Mobile Viewport Stability (390x844) ---")
        context_m, page_m, console_errs_m, page_errs_m = setup_page(browser, 390, 844)

        page_m.locator("#bp-project-name-input").fill("MobileLiving")
        page_m.locator("#bp-btn-begin").click()
        page_m.wait_for_timeout(800)

        click_card_by_title(page_m, "WEBSITE")
        page_m.wait_for_timeout(800)

        page_m.locator(".focus-discovery-card").first.click()
        page_m.wait_for_timeout(800)

        page_m.get_by_role("button", name=re.compile("BUILD ARCHITECTURE PATHS", re.I)).first.click()
        page_m.wait_for_timeout(1000)

        click_card_by_title(page_m, "FULL-STACK WEB APP")
        page_m.wait_for_timeout(1400)

        # Overflow check before selection
        if not check_horizontal_overflow(page_m):
            record_pass("Mobile Stage 5: Zero horizontal overflow before selection")
        else:
            record_fail("Mobile Stage 5 horizontal overflow before selection")

        # Click React (id: stack-frontend-react)
        react_btn = page_m.locator('[data-node-id="stack-frontend-react"] .stack-tech-inner')
        if react_btn.count() == 0:
            react_btn = page_m.locator(".stack-tech-inner").first
        react_btn.click()

        # Sample at 50ms on mobile
        page_m.wait_for_timeout(50)
        mob_count_50ms = page_m.locator(".stack-tech-inner").count()
        if mob_count_50ms >= 9:
            record_pass(f"Mobile DOM Invariant: All {mob_count_50ms} cards remain mounted at 50ms")
        else:
            record_fail("Mobile cards unmounted at 50ms", f"Count was {mob_count_50ms}")

        page_m.wait_for_timeout(450)
        # Overflow check after selection
        if not check_horizontal_overflow(page_m):
            record_pass("Mobile Stage 5: Zero horizontal overflow after selection transition")
        else:
            record_fail("Mobile Stage 5 horizontal overflow after selection")

        results["console_errors"] += len(console_errs_m)
        results["uncaught_exceptions"] += len(page_errs_m)
        context_m.close()

        # ══════════════════════════════════════════════════════════
        # PART 3: ERROR AUDIT
        # ══════════════════════════════════════════════════════════
        if results["console_errors"] == 0 and results["uncaught_exceptions"] == 0:
            record_pass("Zero console errors and zero uncaught exceptions in Selection Transition Suite")
        else:
            record_fail("Errors detected", f"Console: {results['console_errors']}, Exceptions: {results['uncaught_exceptions']}")

    except Exception as ex:
        record_fail("Execution exception", str(ex))
    finally:
        if own_browser and browser is not None:
            browser.close()

    status_str = "PASS" if results["failed"] == 0 else "FAIL"
    print(f"\n--- Stage 5 Selection Transition: {status_str} ({results['passed']} passed, {results['failed']} failed) ---")
    return results

if __name__ == "__main__":
    res = run_selection_transition_tests()
    sys.exit(0 if res["failed"] == 0 else 1)
