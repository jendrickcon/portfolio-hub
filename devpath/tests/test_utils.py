"""
DevPath — Shared Playwright test utilities.
"""
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost/enuhri-hub/devpath/"

def setup_page(browser, width=1440, height=900, url=BASE_URL):
    """
    Creates a new context and page with console error tracking.
    """
    context = browser.new_context(viewport={"width": width, "height": height})
    page = context.new_page()
    console_errors = []
    page_errors = []

    page.on("pageerror", lambda e: page_errors.append(str(e)))
    page.on("console", lambda m: console_errors.append(f"[{m.type}] {m.text}") if m.type == "error" else None)

    page.goto(url)
    page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(600)

    return context, page, console_errors, page_errors

def get_stage_badge(page):
    """Returns the text inside #bp-stage-badge-text."""
    if page.locator("#bp-stage-badge-text").count() > 0:
        return page.locator("#bp-stage-badge-text").inner_text().strip()
    return ""

def click_card_by_title(page, title, role="button", timeout=1000):
    page.wait_for_timeout(200)
    btn = page.get_by_role(role, name=re.compile(re.escape(title), re.I)).first
    btn.click()
    page.wait_for_timeout(timeout)

def check_horizontal_overflow(page):
    """Returns True if page has horizontal overflow (scrollWidth > clientWidth + 1)."""
    return page.evaluate(
        "() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"
    )

def check_min_touch_targets(page, selector, min_size=44):
    """
    Checks all elements matching selector have bounding client rect height and width >= min_size (or height >= min_size).
    """
    results = page.evaluate(f"""() => {{
        const els = Array.from(document.querySelectorAll('{selector}'));
        return els.map(el => {{
            const rect = el.getBoundingClientRect();
            return {{ width: Math.round(rect.width), height: Math.round(rect.height) }};
        }});
    }}""")
    substandard = [r for r in results if r["height"] < min_size]
    return len(substandard) == 0, results, substandard

