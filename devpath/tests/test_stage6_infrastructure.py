"""
DevPath — Stage 6: Infrastructure & Deployment Architecture Verification.
Verifies:
1. Transition to Stage 6 from Stage 5 or API.
2. Progressively revealed infrastructure groups & options (e.g. Hosting, CI/CD, Monitoring).
3. Single-select vs multi-select behaviors in infrastructure cards.
4. Breadcrumb updates with infrastructure selections (#bc-infra-names).
5. Stage 6 convergence node ("SYNTHESIZE PROJECT BLUEPRINT →") appears.
6. Step-back navigation clears infra selections and retreats to Stage 5 with stack intact.
7. Zero console errors and uncaught exceptions.
"""
import re
import sys
from playwright.sync_api import sync_playwright
from test_utils import setup_page, get_stage_badge, click_card_by_title

def run_stage6_infrastructure_tests(browser=None):
    results = {
        "suite": "Stage 6 Infrastructure",
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

        # ── Setup Project: Website -> Interactive -> Fullstack Web -> React + FastAPI + Postgres -> Stage 6 ──
        page.locator("#bp-project-name-input").fill("CloudArch")
        page.locator("#bp-btn-begin").click()
        page.wait_for_timeout(900)

        click_card_by_title(page, "WEBSITE")
        page.wait_for_timeout(900)

        page.locator(".focus-discovery-card").first.click()
        page.wait_for_timeout(900)

        page.get_by_role("button", name=re.compile("BUILD ARCHITECTURE PATHS", re.I)).first.click()
        page.wait_for_timeout(1200)

        click_card_by_title(page, "FULL-STACK WEB APP")
        page.wait_for_timeout(1400)

        for tech in ("React", "FastAPI", "PostgreSQL"):
            page.get_by_role("button", name=re.compile(re.escape(tech), re.I)).first.click()
            page.wait_for_timeout(600)

        # ── Advance to Stage 6 via Convergence Node ──
        conv_node = page.locator(".growth-action-inner").first
        conv_node.click()
        page.wait_for_timeout(1500)

        badge = get_stage_badge(page)
        if "STAGE 06" in badge and "INFRASTRUCTURE" in badge:
            record_pass("Reached Stage 06 (Infrastructure & Deployment)")
        else:
            record_fail("Stage 6 transition", f"Badge was '{badge}'")

        # ── Check Infrastructure Groups Rendered ──
        infra_headers = page.locator(".infra-header-title")
        header_count = infra_headers.count()
        if header_count >= 2:
            record_pass(f"Infrastructure headers rendered ({header_count} groups)")
        else:
            record_fail("Infrastructure headers count", f"Count was {header_count}")

        # Check candidate cards exist
        infra_cards = page.locator(".infra-card-title")
        card_count = infra_cards.count()
        if card_count >= 4:
            record_pass(f"Infrastructure option cards rendered ({card_count} options)")
        else:
            record_fail("Infrastructure card count", f"Count was {card_count}")

        # ── Select Infrastructure Options ──
        # Single-select Hosting: e.g. Vercel / Netlify or AWS / Cloudflare
        # Multi-select Monitoring: e.g. Sentry, Datadog
        res_select = page.evaluate("""() => {
            const dp = window.DevPath;
            // Select web hosting: vercel
            dp.selectInfraTech('infra-web-hosting', 'vercel');
            // Select web CI: github-actions-web
            dp.selectInfraTech('infra-web-ci', 'github-actions-web');
            // Select monitoring: sentry
            dp.selectInfraTech('infra-monitoring', 'sentry');

            const state = window.ProjectBlueprint.store.get();
            return {
                hosting: state.selectedInfra['infra-web-hosting'],
                ci: state.selectedInfra['infra-web-ci'],
                monitoring: state.selectedInfra['infra-monitoring']
            };
        }""")

        if res_select["hosting"] == "vercel" and res_select["ci"] == "github-actions-web" and "sentry" in (res_select["monitoring"] or []):
            record_pass("Selected infrastructure technologies across hosting, CI/CD, and monitoring")
        else:
            record_fail("Infrastructure selection state", str(res_select))

        # ── Verify Breadcrumb Updated ──
        bc_infra = page.locator("#bc-infra-names").inner_text().strip()
        if len(bc_infra) > 0:
            record_pass(f"Breadcrumb updated with infrastructure: '{bc_infra}'")
        else:
            record_fail("Breadcrumb infrastructure update", "Empty #bc-infra-names")

        # ── Convergence to Stage 7 Blueprint ──
        # When infra choices are made, the Stage 7 Blueprint convergence button appears
        page.wait_for_timeout(600)
        blueprint_conv = page.locator("#growth-action-blueprint, .growth-action-inner")
        has_blueprint_btn = False
        for i in range(blueprint_conv.count()):
            text = blueprint_conv.nth(i).inner_text().strip()
            if "BLUEPRINT" in text:
                has_blueprint_btn = True
                record_pass(f"Blueprint convergence affordance rendered: '{text.replace(chr(10), ' ')}'")
                break

        if not has_blueprint_btn:
            record_fail("Stage 7 Blueprint convergence button missing")

        # ── Step Back Navigation in Stage 6 ──
        # Step back 1: Clears infra choices, stays in Stage 6
        page.locator("#bp-btn-back").click()
        page.wait_for_timeout(1000)
        badge = get_stage_badge(page)
        infra_after_step = page.evaluate("() => Object.keys(window.ProjectBlueprint.store.get().selectedInfra || {}).length")
        if "STAGE 06" in badge and infra_after_step == 0:
            record_pass("Step back clears infrastructure choices while remaining in Stage 6")
        else:
            record_fail("Step back within Stage 6", f"Badge: {badge}, Infra keys: {infra_after_step}")

        # Step back 2: From empty Stage 6 back to Stage 5 (Technology Stack)
        page.locator("#bp-btn-back").click()
        page.wait_for_timeout(1200)
        badge = get_stage_badge(page)
        stack_preserved = page.evaluate("() => Object.values(window.ProjectBlueprint.store.get().selectedStack || {}).filter(Boolean).length")
        if "STAGE 05" in badge and stack_preserved == 3:
            record_pass("Step back from Stage 6 returns to Stage 5 with technology stack intact")
        else:
            record_fail("Step back to Stage 5", f"Badge: {badge}, Stack count: {stack_preserved}")

        results["console_errors"] = len(console_errs)
        results["uncaught_exceptions"] = len(page_errs)
        if len(console_errs) == 0 and len(page_errs) == 0:
            record_pass("Zero console errors and zero uncaught exceptions in Stage 6 tests")
        else:
            record_fail("Console/Page errors", f"Console: {console_errs}, Page: {page_errs}")

        context.close()

    finally:
        if own_browser:
            browser.close()

    return results

if __name__ == "__main__":
    res = run_stage6_infrastructure_tests()
    print(f"\n{res['passed']} passed, {res['failed']} failed")
    if res["failed"] > 0:
        sys.exit(1)
    sys.exit(0)

