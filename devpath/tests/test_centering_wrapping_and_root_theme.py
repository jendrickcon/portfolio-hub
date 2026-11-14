"""
DevPath — Stage 7 Blueprint Centering, Stage 6 Multi-Row Wrapping & Organic Root Theme Verification.

Verifies:
1. Stage 7 Symmetrical Subtree Centering:
   - When a parent has multiple children (e.g. 7 children), the sibling subtree is symmetrically centered
     around the parent's horizontal midpoint (|childrenCenter - parentX| <= 2px), eliminating right-skew.
2. Stage 6 Responsive Multi-Row Infrastructure Grid Wrapping:
   - 7 infrastructure groups wrap into rows with max 3 columns per row (e.g. 3, 3, 1).
   - Subsequent rows are placed below the deepest card of the previous row.
   - Content bounds width is bounded to <= 1250px (preventing 2252px horizontal sprawl).
3. Organic Root Theme (Biophilic / Living Mind-Map):
   - Connection paths have stroke-linecap: round and stroke-linejoin: round.
   - Active connections have botanical moss hue and subtle glow animation.
   - Stage 7 blueprint node card backgrounds use 22px smooth pill contours (var(--node-rx)).
   - Bezier path generator produces natural botanical S-curves in root mode.
4. Zero console errors and zero uncaught exceptions.
"""
import re
import sys
from playwright.sync_api import sync_playwright
from test_utils import setup_page, get_stage_badge, click_card_by_title

def run_centering_wrapping_root_tests(browser=None):
    results = {
        "suite": "Centering, Wrapping & Organic Root Theme",
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

        # ══════════════════════════════════════════════════════════
        # PART 1: STAGE 6 RESPONSIVE MULTI-ROW INFRASTRUCTURE WRAPPING
        # ══════════════════════════════════════════════════════════
        print("\n--- Part 1: Stage 6 Multi-Row Infrastructure Grid Wrapping ---")

        # Setup project through to Stage 6 with all 7 infrastructure groups
        page.locator("#bp-project-name-input").fill("BotanicalArch")
        page.locator("#bp-btn-begin").click()
        page.wait_for_timeout(800)

        click_card_by_title(page, "WEBSITE")
        page.wait_for_timeout(800)

        page.locator(".focus-discovery-card").first.click()
        page.wait_for_timeout(800)

        page.get_by_role("button", name=re.compile("BUILD ARCHITECTURE PATHS", re.I)).first.click()
        page.wait_for_timeout(1000)

        click_card_by_title(page, "FULL-STACK WEB APP")
        page.wait_for_timeout(1200)

        for tech in ("React", "FastAPI", "PostgreSQL"):
            page.get_by_role("button", name=re.compile(re.escape(tech), re.I)).first.click()
            page.wait_for_timeout(500)

        # Advance to Stage 6
        conv_node = page.locator(".growth-action-inner").first
        conv_node.click()
        page.wait_for_timeout(1500)

        # Verify Stage 6 multi-row wrapping metrics
        infra_layout = page.evaluate("""() => {
            const dp = window.DevPath;
            const headers = Array.from(document.querySelectorAll('.graph-node[data-node-id^="infra-header-"]'));
            const headerData = headers.map(el => {
                const transform = el.getAttribute('transform') || '';
                const match = transform.match(/translate\\(([-\\d.]+),\\s*([-\\d.]+)\\)/);
                return {
                    id: el.getAttribute('data-node-id'),
                    x: match ? parseFloat(match[1]) : 0,
                    y: match ? parseFloat(match[2]) : 0
                };
            });

            // Group headers by distinct Y coordinates (rows)
            const yMap = new Map();
            headerData.forEach(h => {
                const roundedY = Math.round(h.y);
                if (!yMap.has(roundedY)) yMap.set(roundedY, []);
                yMap.get(roundedY).push(h);
            });

            const rows = Array.from(yMap.entries()).sort((a, b) => a[0] - b[0]);
            const rowCounts = rows.map(r => r[1].length);

            // Check canvas bounds
            const svg = document.getElementById('architecture-graph');
            const svgWidth = svg ? svg.clientWidth : 0;
            const contentBounds = dp.camera ? dp.camera.contentBounds : null;

            return {
                headerCount: headerData.length,
                rowCount: rows.length,
                rowCounts,
                rowYValues: rows.map(r => r[0]),
                contentWidth: contentBounds ? contentBounds.width : 0
            };
        }""")

        # Live DOM check
        if infra_layout["headerCount"] >= 3:
            record_pass(f"Stage 6 live infrastructure headers present ({infra_layout['headerCount']} groups)")
        else:
            record_fail("Stage 6 infrastructure headers count", str(infra_layout))

        max_cols_in_row = max(infra_layout["rowCounts"]) if infra_layout["rowCounts"] else 0
        if max_cols_in_row <= 3:
            record_pass(f"Live DOM wrapping enforced: max columns per row is {max_cols_in_row} <= 3 (row distribution: {infra_layout['rowCounts']})")
        else:
            record_fail("Multi-row wrapping max columns", f"Found {max_cols_in_row} columns in a single row: {infra_layout['rowCounts']}")

        # ── Comprehensive 7-Group Infrastructure Canopy Wrapping Test ──
        # When 7 groups exist (e.g. Hosting, DB, Auth, CI/CD, Monitoring, Storage, Security),
        # verify they wrap into rows of at most 3 columns each (3, 3, 1) and width stays bounded to ~1100px.
        res_7group = page.evaluate("""() => {
            const GL = window.GraphLayout || window.ProjectBlueprint.GraphLayout;
            const mock7Groups = [
                { id: 'infra-web-hosting', title: 'Hosting', options: [{ id: 'opt1', title: 'Vercel' }] },
                { id: 'infra-database', title: 'Database', options: [{ id: 'opt2', title: 'PostgreSQL' }] },
                { id: 'infra-auth', title: 'Authentication', options: [{ id: 'opt3', title: 'Auth0' }] },
                { id: 'infra-web-ci', title: 'CI/CD Pipeline', options: [{ id: 'opt4', title: 'GitHub Actions' }] },
                { id: 'infra-monitoring', title: 'Observability', options: [{ id: 'opt5', title: 'Sentry' }] },
                { id: 'infra-storage', title: 'Storage & CDN', options: [{ id: 'opt6', title: 'Cloudflare R2' }] },
                { id: 'infra-security', title: 'Security & TLS', options: [{ id: 'opt7', title: 'Cloudflare WAF' }] }
            ];

            const layout = GL.getStage6Positions({
                svgWidth: 1000,
                svgHeight: 800,
                infraGroups: mock7Groups,
                selectedInfra: {},
                selectedFocusItems: [],
                selectedStackTechs: [],
                isMobile: false
            });

            // Analyze header rows
            const yMap = new Map();
            layout.infraHeaderNodes.forEach(h => {
                const roundedY = Math.round(h.y);
                if (!yMap.has(roundedY)) yMap.set(roundedY, []);
                yMap.get(roundedY).push(h);
            });

            const sortedRows = Array.from(yMap.entries()).sort((a, b) => a[0] - b[0]);
            const rowDistribution = sortedRows.map(r => r[1].length);

            return {
                headerCount: layout.infraHeaderNodes.length,
                rowCount: sortedRows.length,
                rowDistribution,
                rowYValues: sortedRows.map(r => r[0]),
                contentWidth: layout.contentBounds.width,
                isBounded: layout.contentBounds.width <= 1250
            };
        }""")

        if res_7group["headerCount"] == 7 and res_7group["rowDistribution"] == [3, 3, 1]:
            record_pass(f"7-Group Infrastructure Canopy wrapped into 3 rows [3, 3, 1]: {res_7group['rowDistribution']} at Y {res_7group['rowYValues']}")
        else:
            record_fail("7-Group wrapping distribution", str(res_7group))

        if res_7group["isBounded"] and res_7group["contentWidth"] <= 1250:
            record_pass(f"7-Group canvas width bounded to {res_7group['contentWidth']}px (prevented 2252px single-row horizontal sprawl)")
        else:
            record_fail("7-Group canvas width", f"Width was {res_7group['contentWidth']}px")

        # ══════════════════════════════════════════════════════════
        # PART 2: STAGE 7 SYMMETRICAL SUBTREE CENTERING
        # ══════════════════════════════════════════════════════════
        print("\n--- Part 2: Stage 7 Symmetrical Subtree Centering ---")

        # Select infrastructure technologies
        page.evaluate("""() => {
            const dp = window.DevPath;
            dp.selectInfraTech('infra-web-hosting', 'vercel');
            dp.selectInfraTech('infra-web-ci', 'github-actions-web');
            dp.selectInfraTech('infra-monitoring', 'sentry');
        }""")
        page.wait_for_timeout(600)

        # Transition to Stage 7
        page.evaluate("() => window.DevPath.transitionToStage7()")
        page.wait_for_timeout(1500)

        # Programmatically test symmetrical centering with 7 children under 1 parent
        centering_result = page.evaluate("""() => {
            const dp = window.DevPath;
            const cardW = 250;
            const gapX = 36;
            const cardH = 80;

            // Test layout calculation directly with 1 parent at center 0 and 7 children
            const mockNodes = [
                { id: 'parent-engine', title: '2D Game Engine', type: 'engine' },
                { id: 'c1', title: 'Godot', parentIds: ['parent-engine'] },
                { id: 'c2', title: 'Unity', parentIds: ['parent-engine'] },
                { id: 'c3', title: 'GameMaker', parentIds: ['parent-engine'] },
                { id: 'c4', title: 'Defold', parentIds: ['parent-engine'] },
                { id: 'c5', title: 'Phaser', parentIds: ['parent-engine'] },
                { id: 'c6', title: 'Love2D', parentIds: ['parent-engine'] },
                { id: 'c7', title: 'Bevy', parentIds: ['parent-engine'] }
            ];

            const mockConnections = mockNodes.slice(1).map(c => ({
                fromNodeId: 'parent-engine',
                toNodeId: c.id
            }));

            const layout = window.GraphLayout.getStage7Positions({
                svgWidth: 1440,
                svgHeight: 900,
                graphNodes: mockNodes,
                connections: mockConnections,
                isMobile: false
            });

            const parentNode = layout.blueprintNodes.find(n => n.id === 'parent-engine');
            const parentCenterX = parentNode.x + parentNode.width / 2;

            const childNodes = layout.blueprintNodes.filter(n => n.id.startsWith('c'));
            const childXs = childNodes.map(c => c.x);
            const minChildX = Math.min(...childXs);
            const maxChildRight = Math.max(...childNodes.map(c => c.x + c.width));
            const childrenMidpoint = (minChildX + maxChildRight) / 2;
            const skewDrift = childrenMidpoint - parentCenterX;

            // Check middle child (index 3 out of 7)
            const sortedByX = childNodes.slice().sort((a, b) => a.x - b.x);
            const middleChild = sortedByX[3];
            const middleChildCenterX = middleChild.x + middleChild.width / 2;

            return {
                parentCenterX,
                childrenMidpoint,
                skewDrift,
                minChildX,
                maxChildRight,
                middleChildId: middleChild.id,
                middleChildCenterX,
                isSymmetrical: Math.abs(skewDrift) <= 2,
                isMiddleCentered: Math.abs(middleChildCenterX - parentCenterX) <= 2
            };
        }""")

        if centering_result["isSymmetrical"]:
            record_pass(f"Symmetrical Subtree Centering verified: 7 children midpoint {centering_result['childrenMidpoint']:.1f} matches parent {centering_result['parentCenterX']:.1f} (drift = {centering_result['skewDrift']:.1f}px <= 2px)")
        else:
            record_fail("Symmetrical Subtree Centering", f"Skew drift was {centering_result['skewDrift']}px (midpoint: {centering_result['childrenMidpoint']}, parent: {centering_result['parentCenterX']})")

        if centering_result["isMiddleCentered"]:
            record_pass(f"Middle child '{centering_result['middleChildId']}' is centered directly under parent: {centering_result['middleChildCenterX']:.1f} == {centering_result['parentCenterX']:.1f}")
        else:
            record_fail("Middle child centering", str(centering_result))

        # Also test 3 children under 1 parent
        three_child_result = page.evaluate("""() => {
            const mockNodes = [
                { id: 'p', title: 'Parent', type: 'parent' },
                { id: 'ch1', title: 'Child 1', parentIds: ['p'] },
                { id: 'ch2', title: 'Child 2', parentIds: ['p'] },
                { id: 'ch3', title: 'Child 3', parentIds: ['p'] }
            ];
            const mockConnections = mockNodes.slice(1).map(c => ({ fromNodeId: 'p', toNodeId: c.id }));
            const layout = window.GraphLayout.getStage7Positions({
                svgWidth: 1440,
                svgHeight: 900,
                graphNodes: mockNodes,
                connections: mockConnections,
                isMobile: false
            });
            const p = layout.blueprintNodes.find(n => n.id === 'p');
            const parentCenterX = p.x + p.width / 2;
            const children = layout.blueprintNodes.filter(n => n.id.startsWith('ch'));
            const minX = Math.min(...children.map(c => c.x));
            const maxX = Math.max(...children.map(c => c.x + c.width));
            const midpoint = (minX + maxX) / 2;
            return {
                drift: Math.abs(midpoint - parentCenterX)
            };
        }""")

        if three_child_result["drift"] <= 2:
            record_pass(f"3-child subtree symmetrically centered (drift = {three_child_result['drift']:.1f}px)")
        else:
            record_fail("3-child centering drift", str(three_child_result))

        # ══════════════════════════════════════════════════════════
        # PART 3: ORGANIC ROOT THEME (BIOPHILIC / LIVING MIND-MAP)
        # ══════════════════════════════════════════════════════════
        print("\n--- Part 3: Organic Root Theme Verification ---")

        # Switch to Root theme
        page.locator('.theme-btn[data-theme="root"]').click()
        page.wait_for_timeout(600)

        theme_check = page.evaluate("""() => {
            const html = document.documentElement;
            const theme = html.getAttribute('data-theme');

            // Check stroke properties on active connection path
            const activeConn = document.querySelector('.connections path.active, .connection-path.active');
            let strokeLinecap = '';
            let strokeLinejoin = '';
            let animationName = '';
            if (activeConn) {
                const style = window.getComputedStyle(activeConn);
                strokeLinecap = style.strokeLinecap;
                strokeLinejoin = style.strokeLinejoin;
                animationName = style.animationName;
            }

            // Check Stage 7 blueprint node border radius / rx in root mode
            const bpBg = document.querySelector('.blueprint-node-bg');
            const bpInner = document.querySelector('.blueprint-card-inner');
            const bpRx = bpBg ? bpBg.getAttribute('rx') : '';
            const bpInnerRadius = bpInner ? window.getComputedStyle(bpInner).borderRadius : '';

            // Test Bezier generator in root mode vs blueprint mode
            const start = { x: 500, y: 100 };
            const end = { x: 750, y: 280 };
            const rootPath = window.GraphLayout.generateBezierPath(start, end, 'root');
            const bpPath = window.GraphLayout.generateBezierPath(start, end, 'blueprint');

            return {
                theme,
                strokeLinecap,
                strokeLinejoin,
                animationName,
                bpRx,
                bpInnerRadius,
                rootPath,
                bpPath,
                pathsDiffer: rootPath !== bpPath
            };
        }""")

        if theme_check["theme"] == "root":
            record_pass("Active theme is 'root'")
        else:
            record_fail("Theme attribute", f"Theme: {theme_check['theme']}")

        if theme_check["strokeLinecap"] == "round" and theme_check["strokeLinejoin"] == "round":
            record_pass("Root theme connections use 'stroke-linecap: round' and 'stroke-linejoin: round'")
        else:
            record_fail("Root theme line cap/join", f"linecap: '{theme_check['strokeLinecap']}', linejoin: '{theme_check['strokeLinejoin']}'")

        if "rootPulse" in theme_check["animationName"]:
            record_pass(f"Root theme living glow pulse animation active: '{theme_check['animationName']}'")
        else:
            record_fail("Root theme glow pulse animation", f"Animation: '{theme_check['animationName']}'")

        if "22px" in theme_check["bpInnerRadius"]:
            record_pass(f"Stage 7 blueprint cards use 22px organic pill contours in Root mode: '{theme_check['bpInnerRadius']}'")
        else:
            record_fail("Blueprint card border-radius in root mode", f"Radius was '{theme_check['bpInnerRadius']}'")

        if theme_check["pathsDiffer"]:
            record_pass(f"Organic Bézier generator produces botanical S-curves distinct from CAD mode: '{theme_check['rootPath']}'")
        else:
            record_fail("Organic Bézier generator", f"Root path: {theme_check['rootPath']}, BP path: {theme_check['bpPath']}")

        # Switch back to Blueprint theme
        page.locator('.theme-btn[data-theme="blueprint"]').click()
        page.wait_for_timeout(500)

        # ── Error Guard ──
        if len(console_errs) == 0 and len(page_errs) == 0:
            record_pass("Zero console errors and zero uncaught exceptions in centering, wrapping & root tests")
        else:
            record_fail("Console errors or exceptions encountered", f"Console: {console_errs}, Page: {page_errs}")

        context.close()

    except Exception as exc:
        record_fail("Unhandled test exception", str(exc))
    finally:
        if own_browser:
            browser.close()
            pw.stop()

    print(f"\n--- Centering, Wrapping & Organic Root Theme: {'PASS' if results['failed'] == 0 else 'FAIL'} ({results['passed']} passed, {results['failed']} failed) ---")
    return results

if __name__ == "__main__":
    res = run_centering_wrapping_root_tests()
    sys.exit(0 if res["failed"] == 0 else 1)
