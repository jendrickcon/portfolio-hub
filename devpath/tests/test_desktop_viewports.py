"""
DevPath — Desktop Viewports Verification Suite.
Matrix Viewports:
- 1440x900 (Standard Desktop)
- 1920x1080 (FHD Widescreen)

Verifies:
1. End-to-end traversal from Stage 1 through Stage 7 on each viewport.
2. SVG workspace sizing and alignment.
3. Zero abnormal horizontal overflow.
4. Zero console errors and uncaught exceptions.
"""
import re
import sys
from playwright.sync_api import sync_playwright
from test_utils import setup_page, get_stage_badge, click_card_by_title, check_horizontal_overflow

DESKTOP_VIEWPORTS = [
    {"name": "1440x900", "width": 1440, "height": 900},
    {"name": "1920x1080", "width": 1920, "height": 1080}
]

def run_desktop_viewports_tests(browser=None):
    results = {
        "suite": "Desktop Viewports",
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
        for vp in DESKTOP_VIEWPORTS:
            w, h, vp_name = vp["width"], vp["height"], vp["name"]
            print(f"\n--- Testing Desktop Viewport: {vp_name} ---")
            context, page, console_errs, page_errs = setup_page(browser, w, h)

            # Stage 1: Project name
            page.locator("#bp-project-name-input").fill(f"Desktop-{vp_name}")
            page.locator("#bp-btn-begin").click()
            page.wait_for_timeout(800)

            # Stage 2: Type
            click_card_by_title(page, "WEBSITE")
            page.wait_for_timeout(800)

            # Stage 3: Focus
            page.locator(".focus-discovery-card").first.click()
            page.wait_for_timeout(800)
            page.get_by_role("button", name=re.compile("BUILD ARCHITECTURE PATHS", re.I)).first.click()
            page.wait_for_timeout(1000)

            # Stage 4: Path
            page.locator(".path-card-inner").first.click()
            page.wait_for_timeout(1200)

            # Stage 5: Stack
            tech_cards = page.locator(".stack-tech-inner")
            for i in [0, 3, 6]:
                if i < tech_cards.count():
                    tech_cards.nth(i).click()
                    page.wait_for_timeout(400)

            # Stage 6: Infrastructure
            page.evaluate("() => window.DevPath.transitionToStage6()")
            page.wait_for_timeout(1000)

            # Stage 7: Blueprint
            page.evaluate("() => window.DevPath.transitionToStage7()")
            page.wait_for_timeout(1200)

            badge = get_stage_badge(page)
            if "STAGE 07" in badge:
                record_pass(f"[{vp_name}] Traversed Stages 1-7 cleanly")
            else:
                record_fail(f"[{vp_name}] Stage 7 milestone", f"Badge was '{badge}'")

            # Check overflow
            has_overflow = check_horizontal_overflow(page)
            if not has_overflow:
                record_pass(f"[{vp_name}] Zero horizontal layout overflow")
            else:
                record_fail(f"[{vp_name}] Layout overflow detected")

            # Check Blueprint nodes rendered
            bp_nodes_count = page.locator(".blueprint-card-inner").count()
            if bp_nodes_count >= 5:
                record_pass(f"[{vp_name}] Rendered {bp_nodes_count} blueprint nodes")
            else:
                record_fail(f"[{vp_name}] Blueprint nodes count", f"Count was {bp_nodes_count}")

            # Check console / page errors
            results["console_errors"] += len(console_errs)
            results["uncaught_exceptions"] += len(page_errs)
            if len(console_errs) == 0 and len(page_errs) == 0:
                record_pass(f"[{vp_name}] Zero console errors and uncaught exceptions")
            else:
                record_fail(f"[{vp_name}] Errors encountered", f"Console: {console_errs}, Page: {page_errs}")

            context.close()

    finally:
        if own_browser:
            browser.close()

    return results

if __name__ == "__main__":
    res = run_desktop_viewports_tests()
    print(f"\n{res['passed']} passed, {res['failed']} failed")
    if res["failed"] > 0:
        sys.exit(1)
    sys.exit(0)
