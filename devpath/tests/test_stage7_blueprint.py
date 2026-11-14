"""
DevPath — Stage 7: Scalable Tree / Web Architecture Blueprint Verification.
Verifies:
1. Transition into Stage 7 (Final Project Blueprint).
2. Zero Invented Nodes Contract: DOM blueprint nodes exactly match projectGraph.nodes.
3. Non-Linear Tree / Web DAG Geometry: Sibling nodes have horizontal spatial displacement; not a linear vertical stack.
4. Floating Canvas HUD Controls: Zoom In (+), Zoom Out (-), Reset (1:1), and Fit Bounds (FIT).
5. Drag-to-Pan Canvas Navigation: Camera offsets update in response to pointer drag.
6. Interactive Node Inspector: Clicking a node displays the inspector modal with correct metadata; modal closes cleanly.
7. Dual Theme Rendering in Stage 7 (Blueprint CAD vs Root Biophilic).
8. Mobile Interactive Canvas Contract: Viewport 360x800 activates zoomable/pannable canvas mode with touch-action: none and floating HUD.
9. Step Back navigation: Retreats to Stage 6 with infrastructure choices preserved.
10. Zero console errors and uncaught exceptions.
"""
import re
import sys
from playwright.sync_api import sync_playwright
from test_utils import setup_page, get_stage_badge, click_card_by_title

def run_stage7_blueprint_tests(browser=None):
    results = {
        "suite": "Stage 7 Final Blueprint",
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
        context, page, console_errs, page_errs = setup_page(browser, 1440, 900)

        # ── Setup Project through Stage 6 ──
        page.locator("#bp-project-name-input").fill("NexusCore")
        page.locator("#bp-btn-begin").click()
        page.wait_for_timeout(800)

        click_card_by_title(page, "SOFTWARE")
        page.wait_for_timeout(800)

        # Select focus characteristic
        page.locator(".focus-discovery-card").first.click()
        page.wait_for_timeout(800)

        page.get_by_role("button", name=re.compile("BUILD ARCHITECTURE PATHS", re.I)).first.click()
        page.wait_for_timeout(1000)

        # Select architecture path
        page.locator(".path-card-inner").first.click()
        page.wait_for_timeout(1200)

        # Select one tech per tier in Stage 5
        tech_cards = page.locator(".stack-tech-inner")
        for i in [0, 3, 6]:
            if i < tech_cards.count():
                tech_cards.nth(i).click()
                page.wait_for_timeout(500)

        # Advance to Stage 6
        page.evaluate("() => window.DevPath.transitionToStage6()")
        page.wait_for_timeout(1000)

        # Select an infrastructure technology
        page.evaluate("() => window.DevPath.selectInfraTech('infra-monitoring', 'prometheus')")
        page.wait_for_timeout(600)

        # ── Transition to Stage 7 Blueprint ──
        page.evaluate("() => window.DevPath.transitionToStage7()")
        page.wait_for_timeout(1500)

        badge = get_stage_badge(page)
        if "STAGE 07" in badge and "PROJECT BLUEPRINT" in badge:
            record_pass("Reached Stage 07 (Final Project Blueprint)")
        else:
            record_fail("Stage 7 transition", f"Badge was '{badge}'")

        # ── Zero Invented Nodes Contract ──
        match_info = page.evaluate("""() => {
            const dp = window.DevPath;
            dp.syncProjectGraph();
            const graphNodes = dp.getProjectGraph().getNodes();
            const domNodes = Array.from(document.querySelectorAll('.blueprint-card-inner'));
            const domTitles = domNodes.map(el => {
                const t = el.querySelector('.bp-card-title');
                return t ? t.innerText.trim().toUpperCase() : '';
            });
            const graphTitles = graphNodes.map(n => (n.title || '').trim().toUpperCase());

            return {
                domCount: domNodes.length,
                graphCount: graphNodes.length,
                domTitles,
                graphTitles,
                unmatched: domTitles.filter(t => !graphTitles.includes(t))
            };
        }""")

        if match_info["domCount"] == match_info["graphCount"] and len(match_info["unmatched"]) == 0:
            record_pass(f"Zero Invented Nodes: exactly {match_info['domCount']} blueprint cards match underlying graph nodes with 0 phantom nodes")
        else:
            record_fail("Zero invented nodes contract", str(match_info))

        # ── Non-Linear Tree / Web DAG Geometry ──
        # Nodes must fan out horizontally across multiple branches rather than forming a single vertical line
        layout_metrics = page.evaluate("""() => {
            const nodes = Array.from(document.querySelectorAll('.graph-node[data-node-id]'));
            const positions = nodes.map(el => {
                const transform = el.getAttribute('transform') || '';
                const match = transform.match(/translate\\(([-\\d.]+),\\s*([-\\d.]+)\\)/);
                return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
            }).filter(Boolean);

            const xValues = positions.map(p => Math.round(p.x));
            const yValues = positions.map(p => Math.round(p.y));
            const uniqueX = Array.from(new Set(xValues));
            const uniqueY = Array.from(new Set(yValues));

            return {
                totalNodes: positions.length,
                uniqueXCount: uniqueX.length,
                uniqueYCount: uniqueY.length,
                minX: Math.min(...xValues),
                maxX: Math.max(...xValues),
                spanX: Math.max(...xValues) - Math.min(...xValues)
            };
        }""")

        # In a tree/web DAG, uniqueXCount must be > 1 and spanX must be significant
        if layout_metrics["uniqueXCount"] >= 2 and layout_metrics["spanX"] > 100:
            record_pass(f"Non-Linear Tree/Web DAG layout verified: {layout_metrics['totalNodes']} nodes span {layout_metrics['spanX']}px across {layout_metrics['uniqueXCount']} horizontal columns")
        else:
            record_fail("Tree/Web DAG geometry non-linear assertion", str(layout_metrics))

        # ── 26% Default Zoom Regression Test: Readable Initial Working View ──
        # DEFAULT framing must prioritize readability & context (zoom >= 0.70) rather than
        # crushing the entire diagram into a microscopic mathematical bounding fit.
        initial_default_state = page.evaluate("""() => {
            const camera = window.DevPath.camera;
            const rootEl = document.querySelector(".graph-node[data-node-id='root-project'], [data-node-id^='root']");
            const rootBox = rootEl ? rootEl.getBoundingClientRect() : null;
            const vp = document.getElementById("architecture-graph").getBoundingClientRect();

            const isRootVisible = rootBox && (
                rootBox.bottom >= vp.top &&
                rootBox.top <= vp.bottom &&
                rootBox.right >= vp.left &&
                rootBox.left <= vp.right
            );

            return {
                zoom: camera.zoom,
                isRootVisible: Boolean(isRootVisible),
                offsetX: camera.offsetX,
                offsetY: camera.offsetY,
                contentBounds: camera.contentBounds
            };
        }""")

        if initial_default_state["zoom"] >= 0.70 and initial_default_state["isRootVisible"]:
            record_pass(f"26% Regression Resolved: Initial default zoom is human-readable at {initial_default_state['zoom']:.2f} (root visible in initial working frame)")
        else:
            record_fail("26% Regression Test", f"Initial zoom was {initial_default_state['zoom']:.2f}, Root visible: {initial_default_state['isRootVisible']}")

        # ── Floating Canvas HUD Navigation Controls ──
        hud_exists = page.locator("#stage7-canvas-hud").is_visible()
        if hud_exists:
            record_pass("Floating Blueprint Canvas HUD toolbar mounted and visible")
        else:
            record_fail("Floating HUD visibility", "Element #stage7-canvas-hud not found")

        # Test Zoom In
        initial_zoom = page.evaluate("() => window.DevPath.camera.zoom")
        page.locator("#stage7-btn-zoom-in").click()
        page.wait_for_timeout(300)
        zoomed_in = page.evaluate("() => window.DevPath.camera.zoom")
        if zoomed_in > initial_zoom:
            record_pass(f"HUD [+] Zoom In verified: {initial_zoom:.2f} -> {zoomed_in:.2f}")
        else:
            record_fail("HUD [+] Zoom In", f"Initial: {initial_zoom}, After: {zoomed_in}")

        # Test Zoom Out
        page.locator("#stage7-btn-zoom-out").click()
        page.locator("#stage7-btn-zoom-out").click()
        page.wait_for_timeout(300)
        zoomed_out = page.evaluate("() => window.DevPath.camera.zoom")
        if zoomed_out < zoomed_in:
            record_pass(f"HUD [-] Zoom Out verified: {zoomed_in:.2f} -> {zoomed_out:.2f}")
        else:
            record_fail("HUD [-] Zoom Out", f"Zoomed in: {zoomed_in}, After out: {zoomed_out}")

        # Test FIT: Explicit macroscopic architecture overview
        page.locator("#stage7-btn-fit").click()
        page.wait_for_timeout(350)
        fit_zoom = page.evaluate("() => window.DevPath.camera.zoom")
        fit_offset = page.evaluate("() => ({ x: window.DevPath.camera.offsetX, y: window.DevPath.camera.offsetY })")
        if 0.25 <= fit_zoom <= 1.2:
            record_pass(f"Explicit [FIT] decoupled from default: macroscopic architecture framed at {fit_zoom:.2f} zoom")
        else:
            record_fail("Explicit [FIT] framing", f"Fit zoom was {fit_zoom}")

        # ── Level of Detail (LOD) Transitions ──
        page.evaluate("() => window.DevPath.camera.zoomAt(1.25, 500, 300, true)")
        page.wait_for_timeout(200)
        lod_detail_active = page.evaluate("() => document.getElementById('architecture-graph').classList.contains('lod-detail')")

        page.evaluate("() => window.DevPath.camera.zoomAt(0.50, 500, 300, true)")
        page.wait_for_timeout(200)
        lod_overview_active = page.evaluate("""() => {
            const svg = document.getElementById('architecture-graph');
            const hasClass = svg.classList.contains('lod-overview');
            const tagline = document.querySelector('.bp-card-tagline');
            const hidden = tagline ? window.getComputedStyle(tagline).display === 'none' : true;
            return hasClass && hidden;
        }""")

        page.evaluate("() => window.DevPath.camera.zoomAt(0.95, 500, 300, true)")
        page.wait_for_timeout(200)
        lod_medium_active = page.evaluate("() => document.getElementById('architecture-graph').classList.contains('lod-medium')")

        if lod_detail_active and lod_overview_active and lod_medium_active:
            record_pass("Level of Detail (LOD) verified: dynamic zoom classes (lod-overview, lod-medium, lod-detail) declutter macroscopic view")
        else:
            record_fail("Level of Detail (LOD)", f"detail: {lod_detail_active}, overview: {lod_overview_active}, medium: {lod_medium_active}")

        # Test RESET: Return to project root context
        page.locator("#stage7-btn-reset").click()
        page.wait_for_timeout(350)
        reset_state = page.evaluate("""() => {
            const rootEl = document.querySelector(".graph-node[data-node-id='root-project'], [data-node-id^='root']");
            const rootBox = rootEl ? rootEl.getBoundingClientRect() : null;
            const vp = document.getElementById("architecture-graph").getBoundingClientRect();
            const isVisible = rootBox && (
                rootBox.bottom >= vp.top &&
                rootBox.top <= vp.bottom &&
                rootBox.right >= vp.left &&
                rootBox.left <= vp.right
            );
            return { zoom: window.DevPath.camera.zoom, isRootVisible: Boolean(isVisible) };
        }""")
        if reset_state["zoom"] >= 0.70 and reset_state["isRootVisible"]:
            record_pass(f"HUD [1:1] RESET verified: camera returned to readable root context ({reset_state['zoom']:.2f} zoom)")
        else:
            record_fail("HUD [1:1] RESET", str(reset_state))

        # Test focusNode targeting
        distant_node_id = page.evaluate("""() => {
            const nodes = window.DevPath.getProjectGraph().getNodes();
            const deep = nodes.find(n => n.depth >= 3) || nodes[nodes.length - 1];
            return deep ? deep.id : null;
        }""")
        if distant_node_id:
            page.evaluate(f"() => window.DevPath.camera.focusNode('{distant_node_id}')")
            page.wait_for_timeout(400)
            focus_state = page.evaluate(f"""() => {{
                const targetEl = document.querySelector(`.graph-node[data-node-id='{distant_node_id}']`);
                const targetBox = targetEl ? targetEl.getBoundingClientRect() : null;
                const vp = document.getElementById("architecture-graph").getBoundingClientRect();
                const isVisible = targetBox && (
                    targetBox.bottom >= vp.top &&
                    targetBox.top <= vp.bottom &&
                    targetBox.right >= vp.left &&
                    targetBox.left <= vp.right
                );
                return {{ isVisible: Boolean(isVisible), zoom: window.DevPath.camera.zoom }};
            }}""")
            if focus_state["isVisible"]:
                record_pass(f"Node focus camera targeting verified: focused on '{distant_node_id}' at {focus_state['zoom']:.2f} zoom")
            else:
                record_fail("Node focus camera targeting", f"Node '{distant_node_id}' not visible: {focus_state}")

        # ── Drag-to-Pan Canvas Navigation ──
        pre_pan_offset = page.evaluate("() => ({ x: window.DevPath.camera.offsetX, y: window.DevPath.camera.offsetY })")
        vp_box = page.locator("#architecture-graph").bounding_box()
        if vp_box:
            start_x = vp_box["x"] + vp_box["width"] / 2
            start_y = vp_box["y"] + vp_box["height"] / 2
            page.mouse.move(start_x, start_y)
            page.mouse.down()
            page.mouse.move(start_x - 80, start_y - 60, steps=5)
            page.mouse.up()
            page.wait_for_timeout(400)

            post_pan_offset = page.evaluate("() => ({ x: window.DevPath.camera.offsetX, y: window.DevPath.camera.offsetY })")
            panned = abs(post_pan_offset["x"] - pre_pan_offset["x"]) > 10 or abs(post_pan_offset["y"] - pre_pan_offset["y"]) > 10
            if panned:
                record_pass("Drag-to-pan verified: camera offsets adjusted dynamically in response to cursor drag")
            else:
                record_fail("Drag-to-pan", f"Pre: {pre_pan_offset}, Post: {post_pan_offset}")

        # ── Interactive Node Inspector ──
        # Reset camera to root context so the root card is centered and visible
        page.locator("#stage7-btn-reset").click()
        page.wait_for_timeout(400)
        first_bp_card = page.locator(".blueprint-card-inner").first
        first_bp_card.click()
        page.wait_for_timeout(600)

        inspector_visible = page.evaluate("""() => {
            const modal = document.getElementById('bp-inspector-modal');
            return modal && modal.style.display !== 'none';
        }""")
        modal_title = page.locator(".bp-inspector-title").inner_text().strip() if inspector_visible else ""

        if inspector_visible and len(modal_title) > 0:
            record_pass(f"Node Inspector opened for '{modal_title}' with detailed specifications")
        else:
            record_fail("Node inspector visibility", f"Visible: {inspector_visible}, Title: {modal_title}")

        # Close inspector
        page.locator(".bp-inspector-close").click()
        page.wait_for_timeout(500)
        inspector_hidden = page.evaluate("""() => {
            const modal = document.getElementById('bp-inspector-modal');
            return !modal || modal.style.display === 'none';
        }""")
        if inspector_hidden:
            record_pass("Node Inspector closed cleanly")
        else:
            record_fail("Node inspector close", "Modal still visible after close click")

        # ── Dual Theme Rendering in Stage 7 ──
        page.locator('.theme-btn[data-theme="root"]').click()
        page.wait_for_timeout(600)
        theme_root = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
        if theme_root == "root":
            record_pass("Switched to Root Biophilic theme in Stage 7")
        else:
            record_fail("Theme switch to root in Stage 7", f"Theme: {theme_root}")

        page.locator('.theme-btn[data-theme="blueprint"]').click()
        page.wait_for_timeout(600)
        theme_bp = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
        if theme_bp == "blueprint":
            record_pass("Switched to Blueprint CAD theme in Stage 7")
        else:
            record_fail("Theme switch to blueprint in Stage 7", f"Theme: {theme_bp}")

        # ── Step Back Navigation: Stage 7 -> Stage 6 ──
        page.locator("#bp-btn-back").click()
        page.wait_for_timeout(1200)
        badge_back = get_stage_badge(page)
        infra_kept = page.evaluate("""() => {
            const infra = window.ProjectBlueprint.store.get().selectedInfra || {};
            return infra['infra-monitoring'] || null;
        }""")

        if "STAGE 06" in badge_back and "prometheus" in (infra_kept or []):
            record_pass("Step back from Stage 7 retreats to Stage 6 with infrastructure choices preserved")
        else:
            record_fail("Step back from Stage 7 to Stage 6", f"Badge: {badge_back}, Infra: {infra_kept}")

        # ══════════════════════════════════════════════════════════
        # PART 2: MOBILE INTERACTIVE CANVAS VERIFICATION (360x800)
        # ══════════════════════════════════════════════════════════
        page.set_viewport_size({"width": 360, "height": 800})
        page.wait_for_timeout(800)

        # Transition back into Stage 7 on mobile
        page.evaluate("() => window.DevPath.transitionToStage7()")
        page.wait_for_timeout(1400)

        mobile_canvas_state = page.evaluate("""() => {
            const workspace = document.querySelector('.workspace');
            const svg = document.getElementById('architecture-graph');
            const hud = document.getElementById('stage7-canvas-hud');
            const camera = window.DevPath.camera;

            return {
                isCanvasActive: workspace.classList.contains('stage7-canvas-active'),
                touchActionNone: window.getComputedStyle(workspace).touchAction.includes('none'),
                hudVisible: Boolean(hud && hud.offsetWidth > 0),
                zoom: camera.zoom,
                svgHeight100: svg.style.height === '100%' || window.getComputedStyle(svg).height.includes('px')
            };
        }""")

        if mobile_canvas_state["isCanvasActive"] and mobile_canvas_state["touchActionNone"] and mobile_canvas_state["hudVisible"]:
            record_pass(f"Mobile Stage 7 Interactive Canvas Contract: zoom={mobile_canvas_state['zoom']:.2f}, touch-action: none, HUD mounted (NOT a vertical card list fallback)")
        else:
            record_fail("Mobile Stage 7 interactive canvas contract", str(mobile_canvas_state))

        results["console_errors"] = len(console_errs)
        results["uncaught_exceptions"] = len(page_errs)
        if len(console_errs) == 0 and len(page_errs) == 0:
            record_pass("Zero console errors and zero uncaught exceptions in Stage 7 tests")
        else:
            record_fail("Console/Page errors", f"Console: {console_errs}, Page: {page_errs}")

        context.close()

    finally:
        if own_browser:
            browser.close()

    return results

if __name__ == "__main__":
    res = run_stage7_blueprint_tests()
    print(f"\n{res['passed']} passed, {res['failed']} failed")
    if res["failed"] > 0:
        sys.exit(1)
    sys.exit(0)
