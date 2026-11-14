"""
DevPath — Mobile Responsive Verification Suite.
Matrix Viewports:
- 360x800 (Compact Android)
- 375x812 (iPhone Mini / SE / X)
- 390x844 (iPhone 12 / 13 / 14)
- 412x915 (Pixel / Samsung Galaxy)
- 430x932 (iPhone Pro Max / Plus)

Verifies across all mobile viewports:
1. Zero horizontal overflow (scrollWidth <= clientWidth + 1) in Stages 1 through 7.
2. Touch targets >= 44px for primary interactive affordances.
3. Mobile layout readability & theme resilience.
4. Zero console errors and zero uncaught exceptions.
"""
import re
import sys
from playwright.sync_api import sync_playwright
from test_utils import setup_page, get_stage_badge, click_card_by_title, check_horizontal_overflow, check_min_touch_targets

MOBILE_VIEWPORTS = [
    {"name": "360x800", "width": 360, "height": 800},
    {"name": "375x812", "width": 375, "height": 812},
    {"name": "390x844", "width": 390, "height": 844},
    {"name": "412x915", "width": 412, "height": 915},
    {"name": "430x932", "width": 430, "height": 932}
]

def run_mobile_responsive_tests(browser=None):
    results = {
        "suite": "Mobile Responsive Matrix",
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
        for vp in MOBILE_VIEWPORTS:
            w, h, vp_name = vp["width"], vp["height"], vp["name"]
            print(f"\n--- Testing Mobile Viewport: {vp_name} ---")
            context, page, console_errs, page_errs = setup_page(browser, w, h)

            # ── Stage 1: Name ──
            page.locator("#bp-project-name-input").fill(f"Mob-{vp_name}")
            page.locator("#bp-btn-begin").click()
            page.wait_for_timeout(800)

            # Overflow Stage 2
            if not check_horizontal_overflow(page):
                record_pass(f"[{vp_name}] Stage 2: Zero horizontal overflow")
            else:
                record_fail(f"[{vp_name}] Stage 2 horizontal overflow")

            # ── Stage 2: Type ──
            click_card_by_title(page, "WEBSITE")
            page.wait_for_timeout(900)

            # Touch targets for branch cards
            valid_targets, _, bad = check_min_touch_targets(page, ".focus-discovery-card", 44)
            if valid_targets:
                record_pass(f"[{vp_name}] Stage 3: Discovery cards meet >=44px touch target height")
            else:
                record_fail(f"[{vp_name}] Touch target substandard", str(bad[:2]))

            # ── Stage 3: Focus ──
            # Click 3 focus cards to verify responsive 2+1 layout and text wrapping
            for _ in range(3):
                disc_cards = page.locator(".focus-discovery-card")
                if disc_cards.count() > 0:
                    disc_cards.first.click()
                    page.wait_for_timeout(450)

            page.wait_for_timeout(600)

            # Validate 2+1 layout for 3 selected cards
            sel_cards = page.locator(".focus-selected-card")
            if sel_cards.count() == 3:
                card_boxes = [sel_cards.nth(i).bounding_box() for i in range(3)]
                row1_same_y = abs(card_boxes[0]["y"] - card_boxes[1]["y"]) <= 4
                row2_below = card_boxes[2]["y"] >= card_boxes[0]["y"] + card_boxes[0]["height"] - 2
                if row1_same_y and row2_below:
                    record_pass(f"[{vp_name}] Stage 3: 3 focus siblings in 2+1 parallel arrangement")
                else:
                    record_fail(f"[{vp_name}] Stage 3 2+1 layout geometry", f"row1_same_y: {row1_same_y}, row2_below: {row2_below}")

                # Ensure card titles are completely contained within their card bounds
                overflow_found = False
                titles = page.locator(".focus-selected-card .focus-node-title")
                for i in range(titles.count()):
                    t_box = titles.nth(i).bounding_box()
                    c_box = card_boxes[i]
                    if t_box and c_box:
                        if t_box["x"] < c_box["x"] - 2 or (t_box["x"] + t_box["width"]) > (c_box["x"] + c_box["width"] + 2):
                            overflow_found = True
                if not overflow_found:
                    record_pass(f"[{vp_name}] Stage 3: Focus card text fully contained without horizontal overflow")
                else:
                    record_fail(f"[{vp_name}] Stage 3: Focus card title text overflowed card bounds")

                # Verify dynamic CTA position (no phantom space)
                cta = page.locator("#growth-action-architecture, [data-node-id='growth-action-architecture']").first
                if cta.count() > 0:
                    cta_box = cta.bounding_box()
                    card2_box = card_boxes[2]
                    if cta_box and card2_box:
                        gap = cta_box["y"] - (card2_box["y"] + card2_box["height"])
                        if 10 <= gap <= 40:
                            record_pass(f"[{vp_name}] Stage 3: Next CTA dynamic proximity verified (gap = {gap:.1f}px, no phantom space)")
                        else:
                            record_fail(f"[{vp_name}] Stage 3 CTA gap", f"Gap was {gap:.1f}px (expected 10-40px)")

            if not check_horizontal_overflow(page):
                record_pass(f"[{vp_name}] Stage 3: Zero horizontal overflow")
            else:
                record_fail(f"[{vp_name}] Stage 3 horizontal overflow")

            # Advance to Stage 4
            page.get_by_role("button", name=re.compile("BUILD ARCHITECTURE PATHS", re.I)).first.click()
            page.wait_for_timeout(1000)

            if not check_horizontal_overflow(page):
                record_pass(f"[{vp_name}] Stage 4: Zero horizontal overflow")
            else:
                record_fail(f"[{vp_name}] Stage 4 horizontal overflow")

            # ── Stage 4: Path ──
            page.locator(".path-card-inner").first.click()
            page.wait_for_timeout(1200)

            if not check_horizontal_overflow(page):
                record_pass(f"[{vp_name}] Stage 5: Zero horizontal overflow")
            else:
                record_fail(f"[{vp_name}] Stage 5 horizontal overflow")

            # Touch targets for stack tech cards
            valid_stack, _, bad_stack = check_min_touch_targets(page, ".stack-tech-inner", 44)
            if valid_stack:
                record_pass(f"[{vp_name}] Stage 5: Stack tech cards meet >=44px touch target height")
            else:
                record_fail(f"[{vp_name}] Stack tech touch targets substandard", str(bad_stack[:2]))

            # Select stack technologies
            tech_cards = page.locator(".stack-tech-inner")
            for i in [0, 3, 6]:
                if i < tech_cards.count():
                    tech_cards.nth(i).click()
                    page.wait_for_timeout(400)

            # ── Stage 6: Infrastructure ──
            page.evaluate("() => window.DevPath.transitionToStage6()")
            page.wait_for_timeout(1000)

            # Clean Stage 6 lifecycle: Stage 5 candidate tech cards are cleanly removed (zero card overlap)
            stage5_techs = page.locator(".stack-tech-inner").count()
            stage5_tiers = page.locator(".tier-header-inner").count()
            if stage5_techs == 0 and stage5_tiers == 0:
                record_pass(f"[{vp_name}] Stage 6: Stage 5 candidate tech cards cleanly cleared (zero card overlap)")
            else:
                record_fail(f"[{vp_name}] Stage 6 overlap", f"Found {stage5_techs} stack techs, {stage5_tiers} tier headers still in DOM")

            # Stage 5 locked stack ancestor node cleanly precedes infrastructure headers
            stack_ancestor = page.locator(".stack-ancestor-inner")
            infra_header_first = page.locator(".infra-header-inner").first
            if stack_ancestor.count() == 1 and infra_header_first.count() > 0:
                sa_box = stack_ancestor.first.bounding_box()
                ih_box = infra_header_first.bounding_box()
                if sa_box and ih_box and (sa_box["y"] + sa_box["height"]) < ih_box["y"]:
                    record_pass(f"[{vp_name}] Stage 6: Locked stack ancestor cleanly precedes infrastructure headers")
                else:
                    record_fail(f"[{vp_name}] Stage 6 hierarchy", f"stack_ancestor: {sa_box}, infra_header: {ih_box}")

            if not check_horizontal_overflow(page):
                record_pass(f"[{vp_name}] Stage 6: Zero horizontal overflow")
            else:
                record_fail(f"[{vp_name}] Stage 6 horizontal overflow")

            valid_infra, _, bad_infra = check_min_touch_targets(page, ".infra-card-inner", 44)
            if valid_infra:
                record_pass(f"[{vp_name}] Stage 6: Infrastructure cards meet >=44px touch target height")
            else:
                record_fail(f"[{vp_name}] Infra card touch targets substandard", str(bad_infra[:2]))

            # ── Stage 7: Blueprint ──
            page.evaluate("() => window.DevPath.transitionToStage7()")
            page.wait_for_timeout(1200)

            badge = get_stage_badge(page)
            if "STAGE 07" in badge:
                record_pass(f"[{vp_name}] Stage 7 milestone reached")
            else:
                record_fail(f"[{vp_name}] Stage 7 badge", badge)

            if not check_horizontal_overflow(page):
                record_pass(f"[{vp_name}] Stage 7: Zero horizontal overflow")
            else:
                record_fail(f"[{vp_name}] Stage 7 horizontal overflow")

            results["console_errors"] += len(console_errs)
            results["uncaught_exceptions"] += len(page_errs)
            if len(console_errs) == 0 and len(page_errs) == 0:
                record_pass(f"[{vp_name}] Zero console errors and zero uncaught exceptions")
            else:
                record_fail(f"[{vp_name}] Errors encountered", f"Console: {console_errs}, Page: {page_errs}")

            context.close()

        # ── Dedicated Long Titles Test on Software Path at 360x800 ──
        print("\n--- Testing Software Long Titles on Mobile: 360x800 ---")
        context_soft, page_soft, c_errs, p_errs = setup_page(browser, 360, 800)
        page_soft.locator("#bp-project-name-input").fill("OmniSoft")
        page_soft.locator("#bp-btn-begin").click()
        page_soft.wait_for_timeout(800)

        # Select Software
        click_card_by_title(page_soft, "SOFTWARE")
        page_soft.wait_for_timeout(800)

        # Select the 3 specific long titles: Data / Analytics, System / Heavy-Duty, Project Management
        res_long = page_soft.evaluate("""() => {
            const store = window.ProjectBlueprint.store;
            store.toggleFocusItem('soft-analytics');
            store.toggleFocusItem('soft-system');
            store.toggleFocusItem('soft-project-mgmt');
            window.ProjectBlueprint.app.transitionToStage3();
            return store.get().selectedFocus;
        }""")
        page_soft.wait_for_timeout(800)

        sel_titles = page_soft.locator(".focus-selected-card .focus-node-title")
        title_texts = [sel_titles.nth(i).inner_text().strip() for i in range(sel_titles.count())]
        expected_canonical = ["DATA / ANALYTICS", "SYSTEM / HEAVY-DUTY", "PROJECT MANAGEMENT"]
        has_all_canonical = all(exp in [t.upper() for t in title_texts] for exp in expected_canonical)

        if has_all_canonical:
            record_pass("Software Stage 3: All 3 long canonical titles preserved without abbreviation")
        else:
            record_fail("Software Stage 3 canonical titles", f"Got: {title_texts}")

        # Check for zero horizontal overflow with these long titles
        if not check_horizontal_overflow(page_soft):
            record_pass("Software Stage 3: Zero horizontal overflow with long focus titles")
        else:
            record_fail("Software Stage 3: Horizontal overflow with long focus titles")

        # Verify touch targets >= 44px
        valid_long_targets, _, _ = check_min_touch_targets(page_soft, ".focus-selected-card", 44)
        if valid_long_targets:
            record_pass("Software Stage 3: All 3 cards meet >=44px touch target height")
        else:
            record_fail("Software Stage 3: Card touch targets substandard")

        # Verify CTA connector line terminates at CTA
        cta_connected = page_soft.evaluate("""() => {
            const conns = window.ProjectBlueprint.graph.connections || [];
            return conns.some(c => c.to === 'growth-action-architecture');
        }""")
        if cta_connected:
            record_pass("Software Stage 3: Connector line terminates at CTA 'BUILD ARCHITECTURE PATHS →'")
        else:
            record_fail("Software Stage 3: Connector line to CTA missing")

        # Take verification screenshot
        page_soft.screenshot(path="tests/screenshot_stage3_mobile_360.png", full_page=True)

        # Advance to Stage 6 and take Stage 6 screenshot
        page_soft.locator("#growth-action-architecture, [data-node-id='growth-action-architecture']").first.click()
        page_soft.wait_for_timeout(800)
        page_soft.locator(".path-card-inner").first.click()
        page_soft.wait_for_timeout(1000)
        # Select stack
        t_cards = page_soft.locator(".stack-tech-inner")
        for i in [0, 3, 6]:
            if i < t_cards.count():
                t_cards.nth(i).click()
                page_soft.wait_for_timeout(300)
        page_soft.evaluate("() => window.DevPath.transitionToStage6()")
        page_soft.wait_for_timeout(1200)

        # Capture Stage 6 screenshot
        page_soft.screenshot(path="tests/screenshot_stage6_mobile_360.png", full_page=True)

        results["console_errors"] += len(c_errs)
        results["uncaught_exceptions"] += len(p_errs)
        if len(c_errs) == 0 and len(p_errs) == 0:
            record_pass("Software Stage 3 & 6: Zero console errors and uncaught exceptions")

        context_soft.close()

    finally:
        if own_browser:
            browser.close()

    return results

if __name__ == "__main__":
    res = run_mobile_responsive_tests()
    print(f"\n{res['passed']} passed, {res['failed']} failed")
    if res["failed"] > 0:
        sys.exit(1)
    sys.exit(0)

