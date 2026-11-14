"""
DevPath — Phase 8: Large Graph Verification Matrix (15, 30, and 50+ Nodes).
Verifies:
1. 15-node Web Architecture DAG:
   - Root -> Type -> Focus -> Path -> Stack -> Infrastructure.
   - Non-overlapping cards on all depth levels.
   - Zero invented nodes contract (DOM cards count == graph nodes count).
2. 30-node Game Architecture Web / DAG:
   - Multi-branch coexistence: Engines, Languages, Physics, Save Systems, Platforms, Asset Pipelines.
   - Multi-parent convergence into shared persistence and release tooling.
   - Strict horizontal spacing and collision prevention.
3. 50+-node Enterprise Systems DAG:
   - Massive recursive architectural tree-root / web structure.
   - Camera framing contract: Default framing keeps root readable (zoom >= 0.70).
   - [FIT] zooms out for macroscopic architecture overview.
   - Dynamic Level of Detail (LOD) toggling without DOM card collisions.
4. Zero console errors and uncaught exceptions across all scenarios.
"""
import re
import sys
from playwright.sync_api import sync_playwright
from test_utils import setup_page, get_stage_badge

def run_large_graph_dag_tests(browser=None):
    results = {
        "suite": "Large Graph DAG Matrix",
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
        # PART 1: 15-NODE ARCHITECTURE DAG
        # ══════════════════════════════════════════════════════════
        print("\n--- Testing 15-Node Architecture DAG ---")
        page.locator("#bp-project-name-input").fill("ApexCloud")
        page.locator("#bp-btn-begin").click()
        page.wait_for_timeout(800)

        page.locator("[data-node-id='website'] .branch-card-inner").click()
        page.wait_for_timeout(800)

        # Add 3 focus items
        for _ in range(3):
            disc = page.locator(".focus-discovery-card")
            if disc.count() > 0:
                disc.first.click()
                page.wait_for_timeout(400)

        page.get_by_role("button", name=re.compile("BUILD ARCHITECTURE PATHS", re.I)).first.click()
        page.wait_for_timeout(1000)

        # Select Full-Stack Web App
        page.locator(".path-card-inner").first.click()
        page.wait_for_timeout(1200)

        # Select 3 stack technologies
        tech_cards = page.locator(".stack-tech-inner")
        for i in [0, 3, 6]:
            if i < tech_cards.count():
                tech_cards.nth(i).click()
                page.wait_for_timeout(300)

        # Advance to Stage 6
        page.evaluate("() => window.DevPath.transitionToStage6()")
        page.wait_for_timeout(800)

        # Select 3 infrastructure items
        page.evaluate("""() => {
            const dp = window.DevPath;
            dp.selectInfraTech('infra-web-hosting', 'vercel');
            dp.selectInfraTech('infra-web-ci', 'github-actions-web');
            dp.selectInfraTech('infra-monitoring', 'sentry');
        }""")
        page.wait_for_timeout(600)

        # Transition to Stage 7 Blueprint
        page.evaluate("() => window.DevPath.transitionToStage7()")
        page.wait_for_timeout(1800)

        # Verify Stage 7 reached
        badge = get_stage_badge(page)
        if "STAGE 07" in badge:
            record_pass("Reached Stage 07 Blueprint for 15-node baseline")
        else:
            record_fail("Stage 7 transition", f"Badge was '{badge}'")

        # Check nodes count and zero invented nodes
        info_15 = page.evaluate("""() => {
            const dp = window.DevPath;
            dp.syncProjectGraph();
            const pg = dp.getProjectGraph();
            const graphNodes = pg.getNodes();
            const domCards = Array.from(document.querySelectorAll('.blueprint-card-inner'));
            const graphNodesEls = Array.from(document.querySelectorAll('.graph-node[data-node-id]'));
            const cardBoxes = graphNodesEls.map(g => {
                const tr = g.getAttribute('transform') || '';
                const m = tr.match(/translate\\(([-\\d.]+),\\s*([-\\d.]+)\\)/);
                const rect = g.querySelector('.node-card-bg');
                const w = rect ? parseFloat(rect.getAttribute('width')) : 250;
                const h = rect ? parseFloat(rect.getAttribute('height')) : 80;
                return m ? { id: g.getAttribute('data-node-id'), x: parseFloat(m[1]), y: parseFloat(m[2]), width: w, height: h } : null;
            }).filter(Boolean);

            // Group by Y level and check for overlaps
            const levels = {};
            cardBoxes.forEach(b => {
                const yKey = Math.round(b.y);
                if (!levels[yKey]) levels[yKey] = [];
                levels[yKey].push(b);
            });

            let overlapCount = 0;
            Object.values(levels).forEach(levelBoxes => {
                levelBoxes.sort((a, b) => a.x - b.x);
                for (let i = 0; i < levelBoxes.length - 1; i++) {
                    const right = levelBoxes[i].x + levelBoxes[i].width;
                    if (right > levelBoxes[i + 1].x + 1) {
                        overlapCount++;
                    }
                }
            });

            return {
                nodeCount: graphNodes.length,
                domCount: domCards.length,
                overlapCount
            };
        }""")

        if info_15["nodeCount"] >= 10 and info_15["domCount"] == info_15["nodeCount"]:
            record_pass(f"15-Node DAG rendered: {info_15['domCount']} blueprint cards match {info_15['nodeCount']} graph nodes 1:1")
        else:
            record_fail("15-Node DAG node count mismatch", str(info_15))

        if info_15["overlapCount"] == 0:
            record_pass("15-Node DAG: Zero horizontal card collisions across all depth levels")
        else:
            record_fail("15-Node DAG card collisions detected", f"Overlaps: {info_15['overlapCount']}")

        # ══════════════════════════════════════════════════════════
        # PART 2: 30-NODE GAME ARCHITECTURE DAG (Multi-Branch & Multi-Parent)
        # ══════════════════════════════════════════════════════════
        print("\n--- Testing 30-Node Game Architecture Web / DAG ---")
        page.evaluate("""() => {
            const dp = window.DevPath;
            const pg = dp.getProjectGraph();
            pg.clear();

            // Root
            pg.addNode({ id: 'root-project', type: 'root', title: 'OmniRealm Engine', category: 'PROJECT ROOT', depth: 0 });

            // Type
            pg.addNode({ id: 'game', type: 'type', title: 'GAME', category: 'PROJECT TYPE', parentIds: ['root-project'], depth: 1 });

            // 3 Focus
            ['rpg-mechanics', 'open-world-sim', 'mod-support'].forEach((f, idx) => {
                pg.addNode({ id: `focus-${f}`, type: 'focus', title: f.toUpperCase(), category: 'FOCUS', parentIds: ['game'], depth: 2 });
            });

            // 2 Parallel Architecture Paths
            pg.addNode({ id: 'arch-2d', type: 'path', title: '2D ENGINE PIPELINE', category: 'ARCHITECTURE', parentIds: ['focus-rpg-mechanics', 'focus-open-world-sim'], depth: 3 });
            pg.addNode({ id: 'arch-tooling', type: 'path', title: 'DEVTOOL WORKBENCH', category: 'ARCHITECTURE', parentIds: ['focus-mod-support'], depth: 3 });

            // Branch A: Engines
            pg.addNode({ id: 'godot', type: 'choice', title: 'Godot Engine', category: 'ENGINE', parentIds: ['arch-2d'], depth: 4 });
            pg.addNode({ id: 'bevy', type: 'choice', title: 'Bevy Rust ECS', category: 'ENGINE', parentIds: ['arch-2d'], depth: 4 });

            // Branch B: Scripting Languages
            pg.addNode({ id: 'gdscript', type: 'choice', title: 'GDScript', category: 'LANGUAGE', parentIds: ['godot'], depth: 5 });
            pg.addNode({ id: 'csharp', type: 'choice', title: 'C# .NET', category: 'LANGUAGE', parentIds: ['godot'], depth: 5 });
            pg.addNode({ id: 'rust-bevy', type: 'choice', title: 'Rust Systems', category: 'LANGUAGE', parentIds: ['bevy'], depth: 5 });

            // Branch C: Physics
            pg.addNode({ id: 'rapier-2d', type: 'choice', title: 'Rapier2D SIMD', category: 'PHYSICS', parentIds: ['rust-bevy', 'csharp'], depth: 6 });
            pg.addNode({ id: 'box2d', type: 'choice', title: 'Box2D Joints', category: 'PHYSICS', parentIds: ['gdscript'], depth: 6 });

            // Branch D: Asset Authoring & Pipeline
            pg.addNode({ id: 'aseprite', type: 'choice', title: 'Aseprite Sprites', category: 'ASSETS', parentIds: ['arch-tooling'], depth: 4 });
            pg.addNode({ id: 'ldtk', type: 'choice', title: 'LDtk Tilemaps', category: 'ASSETS', parentIds: ['arch-tooling'], depth: 4 });
            pg.addNode({ id: 'spine-2d', type: 'choice', title: 'Spine Skeletal', category: 'ASSETS', parentIds: ['aseprite'], depth: 5 });

            // Branch E: Audio Systems
            pg.addNode({ id: 'fmod-studio', type: 'choice', title: 'FMOD Studio', category: 'AUDIO', parentIds: ['arch-2d'], depth: 4 });
            pg.addNode({ id: 'wwise', type: 'choice', title: 'Wwise Spatial', category: 'AUDIO', parentIds: ['arch-2d'], depth: 4 });

            // Multi-Parent Convergence 1: Persistence Save Engine
            pg.addNode({ id: 'sqlite-save', type: 'choice', title: 'SQLite Save DB', category: 'STORAGE', parentIds: ['rapier-2d', 'box2d', 'ldtk'], depth: 7 });
            pg.addNode({ id: 'cloud-save-sync', type: 'choice', title: 'Cloud Sync State', category: 'STORAGE', parentIds: ['sqlite-save'], depth: 8 });

            // Branch F: Platform Distribution & Deployment
            pg.addNode({ id: 'steam-distro', type: 'infra', title: 'Steamworks SDK', category: 'PLATFORM', parentIds: ['cloud-save-sync'], depth: 9 });
            pg.addNode({ id: 'itch-distro', type: 'infra', title: 'Itch.io Butler', category: 'PLATFORM', parentIds: ['cloud-save-sync'], depth: 9 });
            pg.addNode({ id: 'github-actions-game', type: 'infra', title: 'GitHub Actions Matrix', category: 'CI/CD', parentIds: ['steam-distro', 'itch-distro'], depth: 10 });
            pg.addNode({ id: 'sentry-telemetry', type: 'infra', title: 'Sentry Game Crashlytics', category: 'MONITORING', parentIds: ['github-actions-game'], depth: 11 });

            // Additional sub-branch utilities to reach 30
            pg.addNode({ id: 'mod-scripting', type: 'choice', title: 'Lua Mod Sandbox', category: 'MODDING', parentIds: ['arch-tooling'], depth: 4 });
            pg.addNode({ id: 'mod-manager', type: 'choice', title: 'Workshop Sync', category: 'MODDING', parentIds: ['mod-scripting', 'steam-distro'], depth: 10 });
            pg.addNode({ id: 'net-rollback', type: 'choice', title: 'GGRS Rollback Netcode', category: 'NETWORK', parentIds: ['rust-bevy'], depth: 6 });
            pg.addNode({ id: 'game-analytics', type: 'choice', title: 'Telemetry Metrics', category: 'ANALYTICS', parentIds: ['sentry-telemetry'], depth: 12 });
            pg.addNode({ id: 'asset-packer', type: 'choice', title: 'Texture Atlas Packer', category: 'PIPELINE', parentIds: ['spine-2d', 'ldtk'], depth: 6 });

            dp.renderStage7();
        }""")
        page.wait_for_timeout(2000)

        info_30 = page.evaluate("""() => {
            const dp = window.DevPath;
            const pg = dp.getProjectGraph();
            const nodes = pg.getNodes();
            const domCards = Array.from(document.querySelectorAll('.blueprint-card-inner'));
            const graphNodesEls = Array.from(document.querySelectorAll('.graph-node[data-node-id]'));
            const cardBoxes = graphNodesEls.map(g => {
                const tr = g.getAttribute('transform') || '';
                const m = tr.match(/translate\\(([-\\d.]+),\\s*([-\\d.]+)\\)/);
                const rect = g.querySelector('.node-card-bg');
                const w = rect ? parseFloat(rect.getAttribute('width')) : 250;
                const h = rect ? parseFloat(rect.getAttribute('height')) : 80;
                return m ? { id: g.getAttribute('data-node-id'), x: parseFloat(m[1]), y: parseFloat(m[2]), width: w, height: h } : null;
            }).filter(Boolean);

            const levels = {};
            cardBoxes.forEach(b => {
                const yKey = Math.round(b.y);
                if (!levels[yKey]) levels[yKey] = [];
                levels[yKey].push(b);
            });

            let overlapCount = 0;
            Object.values(levels).forEach(levelBoxes => {
                levelBoxes.sort((a, b) => a.x - b.x);
                for (let i = 0; i < levelBoxes.length - 1; i++) {
                    const right = levelBoxes[i].x + levelBoxes[i].width;
                    if (right > levelBoxes[i + 1].x + 1) {
                        overlapCount++;
                    }
                }
            });

            return {
                nodeCount: nodes.length,
                domCount: domCards.length,
                overlapCount,
                cameraZoom: dp.camera.zoom
            };
        }""")

        if info_30["nodeCount"] >= 28 and info_30["domCount"] == info_30["nodeCount"]:
            record_pass(f"30-Node Game DAG rendered: {info_30['domCount']} cards cleanly materialized (matches {info_30['nodeCount']} nodes 1:1)")
        else:
            record_fail("30-Node Game DAG card count", str(info_30))

        if info_30["overlapCount"] == 0:
            record_pass("30-Node Game DAG: Zero card collisions across complex multi-branch convergence")
        else:
            record_fail("30-Node Game DAG collision detected", f"Overlaps: {info_30['overlapCount']}")

        # ══════════════════════════════════════════════════════════
        # PART 3: 50+-NODE ENTERPRISE SYSTEM WEB / DAG
        # ══════════════════════════════════════════════════════════
        print("\n--- Testing 50+-Node Deep Enterprise Systems DAG ---")
        page.evaluate("""() => {
            const dp = window.DevPath;
            const pg = dp.getProjectGraph();
            pg.clear();

            pg.addNode({ id: 'root-project', type: 'root', title: 'HyperScale Nexus', category: 'ENTERPRISE ARCHITECTURE', depth: 0 });

            // 3 Subsystems (Domains)
            const domains = ['cloud-core', 'edge-network', 'data-pipeline'];
            domains.forEach(d => {
                pg.addNode({ id: `domain-${d}`, type: 'type', title: d.toUpperCase(), category: 'DOMAIN', parentIds: ['root-project'], depth: 1 });
            });

            // Each domain has 3 subsystems, each has 2 modules, each has 1 service component
            const leafNodes = [];
            domains.forEach(d => {
                for (let i = 1; i <= 3; i++) {
                    const subId = `sub-${d}-${i}`;
                    pg.addNode({ id: subId, type: 'path', title: `Subsystem ${d}-${i}`, category: 'SUBSYSTEM', parentIds: [`domain-${d}`], depth: 2 });

                    for (let j = 1; j <= 2; j++) {
                        const modId = `mod-${d}-${i}-${j}`;
                        pg.addNode({ id: modId, type: 'choice', title: `Module ${d}-${i}-${j}`, category: 'MODULE', parentIds: [subId], depth: 3 });

                        const compId = `comp-${d}-${i}-${j}`;
                        pg.addNode({ id: compId, type: 'tech', title: `Service ${d}-${i}-${j}`, category: 'SERVICE', parentIds: [modId], depth: 4 });
                        leafNodes.push(compId);
                    }
                }
            });

            // Converging Cross-Cutting Infrastructure (Shared Security, Logging, Telemetry, Gateway)
            pg.addNode({ id: 'gateway-mesh', type: 'infra', title: 'Global Envoy Mesh', category: 'GATEWAY', parentIds: leafNodes.slice(0, 6), depth: 5 });
            pg.addNode({ id: 'auth-zero-trust', type: 'infra', title: 'Zero Trust Auth', category: 'SECURITY', parentIds: leafNodes.slice(6, 12), depth: 5 });
            pg.addNode({ id: 'telemetry-stream', type: 'infra', title: 'Kafka Telemetry Bus', category: 'DATA BUS', parentIds: leafNodes.slice(12, 18), depth: 5 });

            // Converging Master Observability
            pg.addNode({ id: 'master-observability', type: 'infra', title: 'OpenTelemetry + Prometheus', category: 'OBSERVABILITY', parentIds: ['gateway-mesh', 'auth-zero-trust', 'telemetry-stream'], depth: 6 });
            pg.addNode({ id: 'global-deployment-fleet', type: 'infra', title: 'ArgoCD Multi-Cluster', category: 'DEPLOYMENT', parentIds: ['master-observability'], depth: 7 });

            dp.renderStage7();
        }""")
        page.wait_for_timeout(2500)

        info_50 = page.evaluate("""() => {
            const dp = window.DevPath;
            const pg = dp.getProjectGraph();
            const nodes = pg.getNodes();
            const domCards = Array.from(document.querySelectorAll('.blueprint-card-inner'));
            const graphNodesEls = Array.from(document.querySelectorAll('.graph-node[data-node-id]'));
            const cardBoxes = graphNodesEls.map(g => {
                const tr = g.getAttribute('transform') || '';
                const m = tr.match(/translate\\(([-\\d.]+),\\s*([-\\d.]+)\\)/);
                const rect = g.querySelector('.node-card-bg');
                const w = rect ? parseFloat(rect.getAttribute('width')) : 250;
                const h = rect ? parseFloat(rect.getAttribute('height')) : 80;
                return m ? { id: g.getAttribute('data-node-id'), x: parseFloat(m[1]), y: parseFloat(m[2]), width: w, height: h } : null;
            }).filter(Boolean);

            const levels = {};
            cardBoxes.forEach(b => {
                const yKey = Math.round(b.y);
                if (!levels[yKey]) levels[yKey] = [];
                levels[yKey].push(b);
            });

            let overlapCount = 0;
            Object.values(levels).forEach(levelBoxes => {
                levelBoxes.sort((a, b) => a.x - b.x);
                for (let i = 0; i < levelBoxes.length - 1; i++) {
                    const right = levelBoxes[i].x + levelBoxes[i].width;
                    if (right > levelBoxes[i + 1].x + 1) {
                        overlapCount++;
                    }
                }
            });

            return {
                nodeCount: nodes.length,
                domCount: domCards.length,
                overlapCount,
                defaultZoom: dp.camera.zoom
            };
        }""")

        if info_50["nodeCount"] >= 45 and info_50["domCount"] == info_50["nodeCount"]:
            record_pass(f"50+-Node Enterprise DAG rendered: {info_50['domCount']} cards match {info_50['nodeCount']} nodes 1:1")
        else:
            record_fail("50+-Node DAG node count", str(info_50))

        if info_50["overlapCount"] == 0:
            record_pass(f"50+-Node Enterprise DAG: Zero card collisions across massive DAG ({info_50['nodeCount']} nodes)")
        else:
            record_fail("50+-Node DAG collision detected", f"Overlaps: {info_50['overlapCount']}")

        # Camera contract on 50+-node graph:
        # 1. Default zoom is readable (>= 0.70)
        if info_50["defaultZoom"] >= 0.70:
            record_pass(f"50+-Node DAG Camera: Default camera preserves human readability (zoom = {info_50['defaultZoom']:.2f})")
        else:
            record_fail("50+-Node DAG Camera default zoom", f"Zoom was {info_50['defaultZoom']}")

        # 2. [FIT] button smoothly zooms out to macroscopic view
        page.locator("#stage7-btn-fit").click()
        page.wait_for_timeout(600)
        fit_zoom = page.evaluate("() => window.DevPath.camera.zoom")
        if fit_zoom < info_50["defaultZoom"]:
            record_pass(f"50+-Node DAG Camera: [FIT] successfully zooms out to macroscopic architecture overview (zoom = {fit_zoom:.2f})")
        else:
            record_fail("50+-Node DAG Camera FIT action", f"Fit zoom {fit_zoom} not smaller than default {info_50['defaultZoom']}")

        # 3. Dynamic LOD on macroscopic view: overview class active
        has_overview_lod = page.evaluate("() => document.getElementById('architecture-graph').classList.contains('lod-overview')")
        if has_overview_lod:
            record_pass("50+-Node DAG Camera: Dynamic LOD overview mode active during macroscopic overview")
        else:
            record_fail("50+-Node DAG Camera LOD mode", "Missing lod-overview class")

        # 4. [1:1] / [RESET] returns camera to root context
        page.locator("#stage7-btn-reset").click()
        page.wait_for_timeout(600)
        reset_zoom = page.evaluate("() => window.DevPath.camera.zoom")
        if reset_zoom >= 0.70:
            record_pass(f"50+-Node DAG Camera: [RESET] returns camera to root context at readable scale (zoom = {reset_zoom:.2f})")
        else:
            record_fail("50+-Node DAG Camera RESET action", f"Reset zoom {reset_zoom} < 0.70")

        # ══════════════════════════════════════════════════════════
        # PART 4: CONSOLE ERROR AUDIT
        # ══════════════════════════════════════════════════════════
        results["console_errors"] = len(console_errs)
        results["uncaught_exceptions"] = len(page_errs)

        if len(console_errs) == 0 and len(page_errs) == 0:
            record_pass("Zero console errors and zero uncaught exceptions in Large Graph DAG Matrix")
        else:
            record_fail("Errors detected", f"Console: {console_errs}, Exceptions: {page_errs}")

        context.close()

    except Exception as ex:
        record_fail("Execution exception", str(ex))
    finally:
        if own_browser and browser is not None:
            browser.close()

    status_str = "PASS" if results["failed"] == 0 else "FAIL"
    print(f"\n--- Large Graph DAG Matrix: {status_str} ({results['passed']} passed, {results['failed']} failed) ---")
    return results

if __name__ == "__main__":
    res = run_large_graph_dag_tests()
    sys.exit(0 if res["failed"] == 0 else 1)

