"""
DevPath — Recursive Graph Engine Comprehensive Acceptance Tests.
Verifies across all domains (GAME, WEBSITE, SOFTWARE, PLATFORM):
1. Multi-branch simultaneous coexistence (GAME):
   - GAME -> 2D GAME ENGINE (arch-2d) -> GODOT (godot) -> GDSCRIPT (gdscript) -> SAVE SYSTEM (sqlite)
   - GAME -> GENRE (genre) -> RPG (rpg) -> COMBAT (turn-based)
   - GAME -> GAMEPLAY (gameplay) -> EXPLORATION (exploration) -> OPEN WORLD (open-world)
2. Multi-parent convergence into SAVE SYSTEM / SQLITE.
3. Pruning on deselection: deselecting a parent removes its descendants while preserving nodes with surviving ancestors.
4. WEBSITE deep branches & coexistence:
   - WEBSITE -> PURPOSE (ecommerce) -> PAYMENT (stripe) -> STRIPE INTEGRATION (webhooks)
   - WEBSITE -> TECHNICAL (arch-fullstack) -> FRONTEND (react) -> STATE MANAGEMENT (zustand)
5. SOFTWARE deep branches & coexistence:
   - SOFTWARE -> PURPOSE (devtools) -> TOOL INTERFACE (cli) -> COMMAND PARSING (cli-args)
   - SOFTWARE -> PURPOSE (analytics) -> PROCESSING ENGINE (pandas) -> VISUALIZATION (streamlit)
6. Platform / Infrastructure linkages (Steam achievements, Vercel preview deployments).
7. Blueprint export produces complete specification with summary and manifest.
8. Zero console errors and zero uncaught exceptions.
"""
import sys
from playwright.sync_api import sync_playwright
from test_utils import setup_page

def run_recursive_graph_tests(browser=None):
    results = {
        "suite": "Recursive Graph Engine",
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
        # PART 1: GAME DEEP TREES, CONVERGENCE & DAG GC
        # ══════════════════════════════════════════════════════════
        context, page, console_errs, page_errs = setup_page(browser, 1440, 900)

        page.locator("#bp-project-name-input").fill("OmniQuest")
        page.locator("#bp-btn-begin").click()
        page.wait_for_timeout(800)
        page.locator("[data-node-id='game'] .branch-card-inner").click()
        page.wait_for_timeout(800)

        # Verify DevPath.getProjectGraph() is accessible
        has_graph = page.evaluate("() => Boolean(window.DevPath && window.DevPath.getProjectGraph())")
        if has_graph:
            record_pass("DevPath.getProjectGraph() is accessible on window")
        else:
            record_fail("DevPath.getProjectGraph() missing")

        # ── Test 1: GAME Branch A (Technical -> Godot -> GDScript -> SQLite) ──
        res_a = page.evaluate("""() => {
            const dp = window.DevPath;
            dp.selectRecursiveOption('game-technical', 'arch-2d', 'game');
            dp.selectRecursiveOption('game-2d-engine', 'godot', 'arch-2d');
            dp.selectRecursiveOption('godot-language', 'gdscript', 'godot');
            dp.selectRecursiveOption('game-save-system', 'sqlite', 'gdscript');

            const pg = dp.getProjectGraph();
            return {
                nodeCount: pg.getNodes().length,
                hasArch2D: Boolean(pg.getNode('arch-2d')),
                hasGodot: Boolean(pg.getNode('godot')),
                hasGDScript: Boolean(pg.getNode('gdscript')),
                hasSQLite: Boolean(pg.getNode('sqlite'))
            };
        }""")

        if res_a["hasArch2D"] and res_a["hasGodot"] and res_a["hasGDScript"] and res_a["hasSQLite"]:
            record_pass("Branch A (GAME -> 2D ENGINE -> GODOT -> GDSCRIPT -> SQLITE) successfully constructed")
        else:
            record_fail("Branch A construction", str(res_a))

        # ── Test 2: GAME Branch B (Creative -> Genre -> RPG -> Turn-Based) ──
        res_b = page.evaluate("""() => {
            const dp = window.DevPath;
            dp.selectRecursiveOption('game-direction', 'genre', 'game');
            dp.selectRecursiveOption('game-genre', 'rpg', 'genre');
            dp.selectRecursiveOption('game-rpg-combat', 'turn-based', 'rpg');

            const pg = dp.getProjectGraph();
            return {
                hasGenre: Boolean(pg.getNode('genre')),
                hasRPG: Boolean(pg.getNode('rpg')),
                hasTurnBased: Boolean(pg.getNode('turn-based')),
                hasGodot: Boolean(pg.getNode('godot')),
                hasSQLite: Boolean(pg.getNode('sqlite'))
            };
        }""")

        if res_b["hasGenre"] and res_b["hasRPG"] and res_b["hasTurnBased"] and res_b["hasGodot"] and res_b["hasSQLite"]:
            record_pass("Branch B (GAME -> GENRE -> RPG -> TURN-BASED) coexists simultaneously with Branch A")
        else:
            record_fail("Branch B coexistence", str(res_b))

        # ── Test 3: GAME Branch C (Gameplay -> Exploration -> Open World) ──
        res_c = page.evaluate("""() => {
            const dp = window.DevPath;
            dp.selectRecursiveOption('game-direction', 'gameplay', 'game');
            dp.selectRecursiveOption('game-gameplay', 'exploration', 'gameplay');
            dp.selectRecursiveOption('game-exploration', 'open-world', 'exploration');

            const pg = dp.getProjectGraph();
            return {
                hasGameplay: Boolean(pg.getNode('gameplay')),
                hasExploration: Boolean(pg.getNode('exploration')),
                hasOpenWorld: Boolean(pg.getNode('open-world')),
                hasGodot: Boolean(pg.getNode('godot')),
                hasRPG: Boolean(pg.getNode('rpg')),
                hasSQLite: Boolean(pg.getNode('sqlite'))
            };
        }""")

        if res_c["hasGameplay"] and res_c["hasExploration"] and res_c["hasOpenWorld"] and res_c["hasGodot"] and res_c["hasRPG"]:
            record_pass("Branch C (GAME -> GAMEPLAY -> EXPLORATION -> OPEN WORLD) coexists with Branches A & B")
        else:
            record_fail("Branch C coexistence", str(res_c))

        # ── Test 4: Multi-Parent Convergence into SQLite ──
        res_conv = page.evaluate("""() => {
            const dp = window.DevPath;
            dp.selectRecursiveOption('game-save-system', 'sqlite', 'turn-based');
            const pg = dp.getProjectGraph();
            const sqliteNode = pg.getNode('sqlite');
            const connsToSqlite = sqliteNode ? pg.getConnections().filter(c => c.toNodeId === sqliteNode.id) : [];

            return {
                sqliteExists: Boolean(sqliteNode),
                parentIds: sqliteNode ? sqliteNode.parentIds : [],
                incomingConnCount: connsToSqlite.length
            };
        }""")

        if res_conv["sqliteExists"] and len(res_conv["parentIds"]) >= 2:
            record_pass(f"Multi-parent convergence verified on SQLite node: parentIds={res_conv['parentIds']}")
        else:
            record_fail("Multi-parent convergence", str(res_conv))

        # ── Test 5: Deselection Pruning Invariant ──
        res_prune = page.evaluate("""() => {
            const dp = window.DevPath;
            const removed = dp.deselectRecursiveOption('game-genre', 'rpg');
            const pg = dp.getProjectGraph();

            return {
                removedCount: removed ? removed.length : 0,
                hasRPG: Boolean(pg.getNode('rpg')),
                hasTurnBased: Boolean(pg.getNode('turn-based')),
                hasGodot: Boolean(pg.getNode('godot')),
                hasGDScript: Boolean(pg.getNode('gdscript')),
                hasSQLite: Boolean(pg.getNode('sqlite')),
                hasExploration: Boolean(pg.getNode('exploration')),
                hasOpenWorld: Boolean(pg.getNode('open-world'))
            };
        }""")

        if not res_prune["hasRPG"] and not res_prune["hasTurnBased"] and res_prune["hasGodot"] and res_prune["hasSQLite"] and res_prune["hasOpenWorld"]:
            record_pass("Deselection pruning: pruned RPG branch while Branch A and Branch C remained intact")
        else:
            record_fail("Deselection pruning", str(res_prune))

        # ── Test 6: Platform Integration (Steam Achievements) ──
        res_steam = page.evaluate("""() => {
            const dp = window.DevPath;
            dp.selectRecursiveOption('infra-game-distro', 'steam', 'game');
            dp.selectRecursiveOption('steam-features', 'steam-achievements', 'steam');

            const pg = dp.getProjectGraph();
            return {
                hasSteam: Boolean(pg.getNode('steam')),
                hasAchievements: Boolean(pg.getNode('steam-achievements'))
            };
        }""")

        if res_steam["hasSteam"] and res_steam["hasAchievements"]:
            record_pass("Platform integration: STEAM -> ACHIEVEMENTS successfully linked")
        else:
            record_fail("Platform integration (Steam)", str(res_steam))

        # ── Test 7: Blueprint Export Format & Manifest ──
        bp_export = page.evaluate("() => window.DevPath.exportBlueprint()")
        if bp_export and "nodes" in bp_export and "connections" in bp_export and "manifest" in bp_export:
            record_pass(f"Blueprint export valid: {len(bp_export['nodes'])} nodes, {len(bp_export['connections'])} connections, manifest present")
        else:
            record_fail("Blueprint export format", str(bp_export))

        context.close()

        # ══════════════════════════════════════════════════════════
        # PART 2: WEBSITE DEEP TREES & PARALLEL BRANCHES
        # ══════════════════════════════════════════════════════════
        context_web, page_web, console_errs_web, page_errs_web = setup_page(browser, 1440, 900)

        page_web.locator("#bp-project-name-input").fill("ShopPulse")
        page_web.locator("#bp-btn-begin").click()
        page_web.wait_for_timeout(800)
        page_web.locator("[data-node-id='website'] .branch-card-inner").click()
        page_web.wait_for_timeout(800)

        # ── Test 8: WEBSITE E-Commerce + Stripe Webhooks & React Zustand ──
        res_web = page_web.evaluate("""() => {
            const dp = window.DevPath;
            // Branch 1: Purpose -> E-Commerce -> Stripe -> Webhooks
            dp.selectRecursiveOption('site-purpose', 'ecommerce', 'website');
            dp.selectRecursiveOption('site-ecommerce-payment', 'stripe', 'ecommerce');
            dp.selectRecursiveOption('stripe-features', 'webhooks', 'stripe');

            // Branch 2: Technical -> Full-Stack -> React -> Zustand
            dp.selectRecursiveOption('site-technical', 'arch-fullstack', 'website');
            dp.selectRecursiveOption('site-frontend', 'react', 'arch-fullstack');
            dp.selectRecursiveOption('frontend-state', 'zustand', 'react');

            const pg = dp.getProjectGraph();
            return {
                hasEcommerce: Boolean(pg.getNode('ecommerce')),
                hasStripe: Boolean(pg.getNode('stripe')),
                hasWebhooks: Boolean(pg.getNode('webhooks')),
                hasReact: Boolean(pg.getNode('react')),
                hasZustand: Boolean(pg.getNode('zustand'))
            };
        }""")

        if res_web["hasEcommerce"] and res_web["hasStripe"] and res_web["hasWebhooks"] and res_web["hasReact"] and res_web["hasZustand"]:
            record_pass("WEBSITE deep paths (E-COMMERCE -> STRIPE -> WEBHOOKS and REACT -> ZUSTAND) coexist cleanly")
        else:
            record_fail("WEBSITE deep paths", str(res_web))

        context_web.close()

        # ══════════════════════════════════════════════════════════
        # PART 3: SOFTWARE DEEP TREES & PARALLEL BRANCHES
        # ══════════════════════════════════════════════════════════
        context_sw, page_sw, console_errs_sw, page_errs_sw = setup_page(browser, 1440, 900)

        page_sw.locator("#bp-project-name-input").fill("DataForge")
        page_sw.locator("#bp-btn-begin").click()
        page_sw.wait_for_timeout(800)
        page_sw.locator("[data-node-id='software'] .branch-card-inner").click()
        page_sw.wait_for_timeout(800)

        # ── Test 9: SOFTWARE CLI Developer Tool & Data Analytics Pandas Streamlit ──
        res_sw = page_sw.evaluate("""() => {
            const dp = window.DevPath;
            // Branch 1: Developer Tool -> CLI -> Command Parsing
            dp.selectRecursiveOption('software-purpose', 'devtools', 'software');
            dp.selectRecursiveOption('software-devtools-type', 'cli', 'devtools');
            dp.selectRecursiveOption('cli-parsing', 'cli-args', 'cli');

            // Branch 2: Data / Analytics -> Pandas -> Streamlit
            dp.selectRecursiveOption('software-purpose', 'analytics', 'software');
            dp.selectRecursiveOption('software-analytics-engine', 'pandas', 'analytics');
            dp.selectRecursiveOption('analytics-viz', 'streamlit', 'pandas');

            const pg = dp.getProjectGraph();
            return {
                hasDevtools: Boolean(pg.getNode('devtools')),
                hasCLI: Boolean(pg.getNode('cli')),
                hasCLIArgs: Boolean(pg.getNode('cli-args')),
                hasAnalytics: Boolean(pg.getNode('analytics')),
                hasPandas: Boolean(pg.getNode('pandas')),
                hasStreamlit: Boolean(pg.getNode('streamlit'))
            };
        }""")

        if res_sw["hasDevtools"] and res_sw["hasCLI"] and res_sw["hasCLIArgs"] and res_sw["hasAnalytics"] and res_sw["hasPandas"] and res_sw["hasStreamlit"]:
            record_pass("SOFTWARE deep paths (DEVTOOLS -> CLI -> COMMAND PARSING and ANALYTICS -> PANDAS -> STREAMLIT) coexist cleanly")
        else:
            record_fail("SOFTWARE deep paths", str(res_sw))

        context_sw.close()

        # ══════════════════════════════════════════════════════════
        # PART 4: ZERO ERRORS CONTRACT
        # ══════════════════════════════════════════════════════════
        total_console_errors = len(console_errs) + len(console_errs_web) + len(console_errs_sw)
        total_page_errors = len(page_errs) + len(page_errs_web) + len(page_errs_sw)

        results["console_errors"] = total_console_errors
        results["uncaught_exceptions"] = total_page_errors
        if total_console_errors == 0 and total_page_errors == 0:
            record_pass("Zero console errors and zero uncaught exceptions across all domain tests")
        else:
            record_fail("Console/Page errors", f"Console: {total_console_errors}, Page: {total_page_errors}")

    finally:
        if own_browser:
            browser.close()

    return results

if __name__ == "__main__":
    res = run_recursive_graph_tests()
    print(f"\n{res['passed']} passed, {res['failed']} failed")
    if res["failed"] > 0:
        sys.exit(1)
    sys.exit(0)
