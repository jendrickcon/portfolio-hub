"""
DevPath — Regression Test: Stages 1 through 5 Baseline.
Verifies Stage 1 -> 5 full walkthrough, breadcrumb tracking, theme switching,
and step-back navigation across all stages with 0 console errors and 0 uncaught exceptions.
"""
import re
import sys
from playwright.sync_api import sync_playwright

from test_utils import setup_page, get_stage_badge, click_card_by_title, check_horizontal_overflow

def run_regression_stages1_5(browser=None):
    results = {
        "suite": "Stage 1-5 Regression",
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

        # ── Stage 1: Project Name ──
        badge = get_stage_badge(page)
        if "STAGE 01" in badge and "PROJECT NAME" in badge:
            record_pass("Stage 1 initialized with Stage 01 badge")
        else:
            record_fail("Stage 1 badge check", f"Badge was '{badge}'")

        # Empty submission rejected with validation error message
        btn_begin = page.locator("#bp-btn-begin")
        btn_begin.click()
        page.wait_for_timeout(300)
        err_msg = page.locator("#bp-input-error").inner_text().strip()
        badge_stay = get_stage_badge(page)
        if len(err_msg) > 0 and "STAGE 01" in badge_stay:
            record_pass(f"Stage 1 validation: empty submission rejected with '{err_msg}'")
        else:
            record_fail("Stage 1 validation", f"Error: '{err_msg}', Badge: '{badge_stay}'")

        # Type project name
        page.locator("#bp-project-name-input").fill("Cram-Omni")
        page.wait_for_timeout(300)
        btn_begin.click()
        page.wait_for_timeout(1000)

        # ── Stage 2: Project Type ──
        badge = get_stage_badge(page)
        if "STAGE 02" in badge:
            record_pass("Transitioned to Stage 2 (Project Type)")
        else:
            record_fail("Stage 2 transition", f"Badge was '{badge}'")

        # 3 types present: WEBSITE, GAME, SOFTWARE
        types = page.locator(".branch-card-inner")
        if types.count() >= 3:
            record_pass("Three project type cards rendered")
        else:
            record_fail("Three project types", f"Count was {types.count()}")

        # Select WEBSITE
        click_card_by_title(page, "WEBSITE")
        page.wait_for_timeout(1200)

        # ── Stage 3: Focus Discovery Pool ──
        badge = get_stage_badge(page)
        if "STAGE 03" in badge:
            record_pass("Transitioned to Stage 3 (Project Focus)")
        else:
            record_fail("Stage 3 transition", f"Badge was '{badge}'")

        # Add two focus characteristics (Interactive & Informational)
        for focus in ("Interactive", "Informational"):
            page.get_by_role("button", name=re.compile(r"\+ ADD " + re.escape(focus), re.I)).first.click()
            page.wait_for_timeout(900)

        sel_count = page.locator(".focus-selected-card").count()
        if sel_count == 2:
            record_pass("Two focus sibling cards locked permanent")
        else:
            record_fail("Two focus cards selected", f"Count was {sel_count}")

        # ── Stage 4: Architecture Paths ──
        page.get_by_role("button", name=re.compile("BUILD ARCHITECTURE PATHS", re.I)).first.click()
        page.wait_for_timeout(1400)
        badge = get_stage_badge(page)
        if "STAGE 04" in badge:
            record_pass("Transitioned to Stage 4 (Architecture Paths)")
        else:
            record_fail("Stage 4 transition", f"Badge was '{badge}'")

        path_count = page.locator(".path-card-inner").count()
        if path_count == 3:
            record_pass("Three architecture paths rendered fanned out")
        else:
            record_fail("Three architecture paths", f"Count was {path_count}")

        # Select FULL-STACK WEB APP
        click_card_by_title(page, "FULL-STACK WEB APP")
        page.wait_for_timeout(1800)

        # ── Stage 5: Technology Stack ──
        badge = get_stage_badge(page)
        if "STAGE 05" in badge:
            record_pass("Transitioned to Stage 5 (Technology Stack)")
        else:
            record_fail("Stage 5 transition", f"Badge was '{badge}'")

        # 3 Tier headers
        tier_count = page.locator(".tier-header-title").count()
        if tier_count == 3:
            record_pass("Three technology tier headers rendered")
        else:
            record_fail("Three tier headers", f"Count was {tier_count}")

        # 9 candidate tech cards
        tech_count = page.locator(".stack-tech-title").count()
        if tech_count == 9:
            record_pass("Nine tech cards rendered across tiers")
        else:
            record_fail("Nine tech cards", f"Count was {tech_count}")

        # Select 1 per tier: React, FastAPI, PostgreSQL
        for tech in ("React", "FastAPI", "PostgreSQL"):
            page.get_by_role("button", name=re.compile(re.escape(tech), re.I)).first.click()
            page.wait_for_timeout(800)

        selected_tech = page.locator(".stack-tech-inner.selected").count()
        if selected_tech == 3:
            record_pass("Three stack technologies locked selected")
        else:
            record_fail("Three technologies selected", f"Count was {selected_tech}")

        # Convergence node appears
        conv = page.locator(".growth-action-title")
        conv_text = conv.first.inner_text().strip() if conv.count() > 0 else ""
        if "BLUEPRINT" in conv_text:
            record_pass(f"Convergence node appears: '{conv_text}'")
        else:
            record_fail("Convergence node", f"Node text was '{conv_text}'")

        # Breadcrumb contains selections
        bc_text = page.locator("#bp-breadcrumb").inner_text().upper()
        if "CRAM-OMNI" in bc_text and "REACT" in bc_text and "POSTGRESQL" in bc_text:
            record_pass("Breadcrumb reflects project name, framework, and database")
        else:
            record_fail("Breadcrumb check", f"Breadcrumb text: {bc_text}")

        # ── Theme Switching ──
        page.locator('.theme-btn[data-theme="root"]').click()
        page.wait_for_timeout(600)
        theme = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
        if theme == "root":
            record_pass("Switched to Root Biophilic theme")
        else:
            record_fail("Theme switch to root", f"Theme was {theme}")

        page.locator('.theme-btn[data-theme="blueprint"]').click()
        page.wait_for_timeout(600)
        theme = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
        if theme == "blueprint":
            record_pass("Switched back to Blueprint CAD theme")
        else:
            record_fail("Theme switch to blueprint", f"Theme was {theme}")

        # ── Step Back Navigation: 5 -> 4 -> 3 -> 2 -> 1 ──
        # Step back 1: Clears Stage 5 stack selections, stays in Stage 5
        page.locator("#bp-btn-back").click()
        page.wait_for_timeout(1000)
        rem_sel = page.locator(".stack-tech-inner.selected").count()
        badge = get_stage_badge(page)
        if rem_sel == 0 and "STAGE 05" in badge:
            record_pass("Step back clears stack selections while staying in Stage 5")
        else:
            record_fail("Step back stack clear", f"Selected: {rem_sel}, Badge: {badge}")

        # Step back 2: From Stage 5 to Stage 4 (3 paths restored)
        page.locator("#bp-btn-back").click()
        page.wait_for_timeout(1400)
        badge = get_stage_badge(page)
        paths_restored = page.locator(".path-card-inner").count()
        if "STAGE 04" in badge and paths_restored == 3:
            record_pass("Step back to Stage 4 restores all 3 architecture paths")
        else:
            record_fail("Step back to Stage 4", f"Paths: {paths_restored}, Badge: {badge}")

        # Step back 3: From Stage 4 to Stage 3 (focus discovery restored)
        page.locator("#bp-btn-back").click()
        page.wait_for_timeout(1400)
        badge = get_stage_badge(page)
        if "STAGE 03" in badge:
            record_pass("Step back to Stage 3 restores focus milestone")
        else:
            record_fail("Step back to Stage 3", f"Badge: {badge}")

        # Step back 4: From Stage 3 to Stage 2 (types restored)
        page.locator("#bp-btn-back").click()
        page.wait_for_timeout(1400)
        badge = get_stage_badge(page)
        types_restored = page.locator(".branch-card-inner").count()
        if "STAGE 02" in badge and types_restored == 3:
            record_pass("Step back to Stage 2 restores all 3 project types")
        else:
            record_fail("Step back to Stage 2", f"Types: {types_restored}, Badge: {badge}")

        # Step back 5: From Stage 2 to Stage 1 (name input restored)
        page.locator("#bp-btn-back").click()
        page.wait_for_timeout(1200)
        badge = get_stage_badge(page)
        input_visible = page.locator("#bp-project-name-input").is_visible()
        if "STAGE 01" in badge and input_visible:
            record_pass("Step back to Stage 1 restores project name input")
        else:
            record_fail("Step back to Stage 1", f"Input visible: {input_visible}, Badge: {badge}")

        results["console_errors"] = len(console_errs)
        results["uncaught_exceptions"] = len(page_errs)
        if len(console_errs) == 0 and len(page_errs) == 0:
            record_pass("Zero console errors and zero uncaught exceptions in Stage 1-5")
        else:
            record_fail("Console/Page errors", f"Console: {console_errs}, Page: {page_errs}")

        context.close()

    finally:
        if own_browser:
            browser.close()

    return results

if __name__ == "__main__":
    res = run_regression_stages1_5()
    print(f"\n{res['passed']} passed, {res['failed']} failed")
    if res["failed"] > 0:
        sys.exit(1)
    sys.exit(0)
