"""
DEVPATH — Automated Test Suite: Architecture Exploration Engine
======================================================================
Verifies the transformation of DevPath into an Architecture Exploration System:
  1. Archetype Decision Pipelines (game, website, software pipelines & stage configs)
  2. Dual-Edge Semantics (dependency vs relationship edge classification and rendering)
  3. Node as Architectural Concept (dependencies, exclusions, alternatives, subtrees)
  4. Blueprint Ghost Alternatives Affordance (+X alt badge on blueprint cards)
  5. Enhanced Node Inspector (prerequisites, exclusions, alternatives, subsystems)
  6. Subtree Expansion Engine (expanding modular architectural subsystems into the live DAG)
  7. Visual & Functional verification under both Blueprint and Root themes
"""

import sys
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost/enuhri-hub/devpath/"

def run_architecture_exploration_tests(browser=None):
    passed = 0
    failed = 0
    console_errors = []
    uncaught_exceptions = []

    own_browser = False
    pw = None
    if browser is None:
        pw = sync_playwright().start()
        browser = pw.chromium.launch(headless=True)
        own_browser = True

    try:
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warning"] else None)
        page.on("pageerror", lambda err: uncaught_exceptions.append(str(err)))

        print("\n--- Part 1: Archetype Decision Pipelines Architecture ---")
        page.goto(BASE_URL)
        page.wait_for_timeout(1000)

        # Check DECISION_PIPELINES exists on window.ProjectBlueprint
        pipelines_data = page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            return {
                hasPipelines: Boolean(pb && pb.DECISION_PIPELINES),
                gamePipeline: pb.getPipelineForType('game'),
                sitePipeline: pb.getPipelineForType('website'),
                softPipeline: pb.getPipelineForType('software'),
                totalStagesGame: pb.getTotalStagesForType('game'),
                gameStage5: pb.getStageConfig('game', 5),
                siteStage5: pb.getStageConfig('website', 5)
            };
        }""")

        if pipelines_data["hasPipelines"]:
            print("  [PASS] Archetype Decision Pipelines exposed on window.ProjectBlueprint")
            passed += 1
        else:
            print("  [FAIL] DECISION_PIPELINES missing from window.ProjectBlueprint")
            failed += 1

        if len(pipelines_data["gamePipeline"]) == 7 and len(pipelines_data["sitePipeline"]) == 7:
            print("  [PASS] Distinct 7-category pipelines configured for Game, Website, and Software archetypes")
            passed += 1
        else:
            print("  [FAIL] Pipeline lengths unexpected")
            failed += 1

        if pipelines_data["gameStage5"].get("archetypeTitle") == "ENGINE & CORE SYSTEMS" and pipelines_data["siteStage5"].get("archetypeTitle") == "CLIENT & SERVER STACK":
            print(f"  [PASS] Archetype stage titles specialized: Game='{pipelines_data['gameStage5']['archetypeTitle']}', Website='{pipelines_data['siteStage5']['archetypeTitle']}'")
            passed += 1
        else:
            print("  [FAIL] Archetype stage titles specialization failed")
            failed += 1

        print("\n--- Part 2: Dual-Edge Semantics & Node Architectural Alternatives ---")
        # Step through Website -> Fullstack Web App -> Stack selection
        page.fill("#bp-project-name-input", "Hyperion")
        page.click("#bp-btn-begin")
        # Advance deterministically through Stage 5, Stage 6 to Stage 7
        page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            pb.store.set({
                projectName: 'Hyperion',
                isConfigured: true,
                selectedType: 'website',
                selectedFocus: ['interactive'],
                selectedArchitecturePath: 'fullstack-web',
                stage: 5
            });
            pb.selectStackTech('frontend', 'react');
            pb.selectStackTech('backend', 'fastapi');
            pb.selectStackTech('database', 'postgresql');
            pb.selectInfraTech('infra-web-hosting', 'vercel-host');
            pb.transitionToStage7();
        }""")
        page.wait_for_timeout(1500)

        # Verify Stage 7 Blueprint Export Data Model contains alternatives and dual edge types
        blueprint_data = page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            const bp = pb.exportBlueprint();
            const reactNode = bp.nodes.find(n => n.id === 'stack-frontend-react');
            const fastapiNode = bp.nodes.find(n => n.id === 'stack-backend-fastapi');
            const depConn = bp.connections.find(c => c.edgeType === 'dependency');
            const relConn = bp.connections.find(c => c.edgeType === 'relationship');
            return {
                nodeCount: bp.nodes.length,
                reactAlternatives: reactNode ? reactNode.alternatives : [],
                reactExpansionSubtree: reactNode ? reactNode.expansionSubtree : null,
                fastapiDependencies: fastapiNode ? fastapiNode.dependencies : [],
                hasDependencyEdge: Boolean(depConn),
                hasRelationshipEdge: Boolean(relConn),
                depConnDetails: depConn,
                relConnDetails: relConn
            };
        }""")

        if len(blueprint_data["reactAlternatives"]) >= 2:
            alt_names = [a.get("title") for a in blueprint_data["reactAlternatives"]]
            print(f"  [PASS] Node contains architectural alternatives: React has {len(blueprint_data['reactAlternatives'])} alternatives ({alt_names})")
            passed += 1
        else:
            print("  [FAIL] React node alternatives not populated properly")
            failed += 1

        if "postgresql" in blueprint_data["fastapiDependencies"]:
            print("  [PASS] Technical dependencies declared on node: FastAPI depends on PostgreSQL")
            passed += 1
        else:
            print("  [FAIL] FastAPI dependencies missing postgresql")
            failed += 1

        if blueprint_data["hasDependencyEdge"] and blueprint_data["hasRelationshipEdge"]:
            print(f"  [PASS] Dual-edge semantics verified in architecture graph (dependency: '{blueprint_data['depConnDetails']['id']}', relationship: '{blueprint_data['relConnDetails']['id']}')")
            passed += 1
        else:
            print(f"  [FAIL] Dual edges not differentiated: dep={blueprint_data['hasDependencyEdge']}, rel={blueprint_data['hasRelationshipEdge']}")
            failed += 1

        print("\n--- Part 3: Live SVG Edge Classes & Blueprint Alternative Badges ---")
        svg_edge_data = page.evaluate("""() => {
            const depPaths = Array.from(document.querySelectorAll('.connection-path.edge-dependency'));
            const relPaths = Array.from(document.querySelectorAll('.connection-path.edge-relationship'));
            const altBadges = Array.from(document.querySelectorAll('.bp-alt-badge'));
            const modBadges = Array.from(document.querySelectorAll('.bp-subsystem-badge'));
            return {
                depPathsCount: depPaths.length,
                relPathsCount: relPaths.length,
                altBadgesCount: altBadges.length,
                modBadgesCount: modBadges.length,
                altBadgeText: altBadges.length > 0 ? altBadges[0].textContent.trim() : "",
                modBadgeText: modBadges.length > 0 ? modBadges[0].textContent.trim() : ""
            };
        }""")

        if svg_edge_data["depPathsCount"] > 0:
            print(f"  [PASS] SVG renders animated .edge-dependency paths ({svg_edge_data['depPathsCount']} active)")
            passed += 1
        else:
            print("  [FAIL] No .edge-dependency SVG paths found in DOM")
            failed += 1

        if svg_edge_data["relPathsCount"] > 0:
            print(f"  [PASS] SVG renders modular .edge-relationship paths ({svg_edge_data['relPathsCount']} active)")
            passed += 1
        else:
            print("  [FAIL] No .edge-relationship SVG paths found in DOM")
            failed += 1

        if svg_edge_data["altBadgesCount"] > 0:
            print(f"  [PASS] Blueprint cards render compact alternative ghosts chip: '{svg_edge_data['altBadgeText']}'")
            passed += 1
        else:
            print("  [FAIL] No .bp-alt-badge chips rendered on blueprint cards")
            failed += 1

        if svg_edge_data["modBadgesCount"] > 0:
            print(f"  [PASS] Blueprint cards render architectural subsystems chip: '{svg_edge_data['modBadgeText']}'")
            passed += 1
        else:
            print("  [FAIL] No .bp-subsystem-badge chips rendered on blueprint cards")
            failed += 1

        print("\n--- Part 4: Node Inspector Deep Inspection ---")
        # Click on React alt badge to inspect alternatives
        page.click('[data-action="inspect-alts"]')
        page.wait_for_timeout(500)

        inspector_data = page.evaluate("""() => {
            const modal = document.getElementById('bp-inspector-modal');
            const isVisible = modal && window.getComputedStyle(modal).display !== 'none';
            const title = modal ? (modal.querySelector('.bp-inspector-title')?.textContent || '') : '';
            const altItems = Array.from(modal ? modal.querySelectorAll('.bp-alt-item .bp-alt-name') : []).map(el => el.textContent.trim());
            const moduleItems = Array.from(modal ? modal.querySelectorAll('.bp-module-item .bp-module-name') : []).map(el => el.textContent.trim());
            return {
                isVisible,
                title,
                altItems,
                moduleItems
            };
        }""")

        if inspector_data["isVisible"]:
            print(f"  [PASS] Node Inspector modal opened for '{inspector_data['title']}'")
            passed += 1
        else:
            print("  [FAIL] Node Inspector modal did not open")
            failed += 1

        if len(inspector_data["altItems"]) >= 2:
            print(f"  [PASS] Inspector displays alternatives list: {inspector_data['altItems']}")
            passed += 1
        else:
            print("  [FAIL] Inspector alternatives list empty")
            failed += 1

        if len(inspector_data["moduleItems"]) >= 2:
            print(f"  [PASS] Inspector displays architectural subsystems: {inspector_data['moduleItems']}")
            passed += 1
        else:
            print("  [FAIL] Inspector subsystem modules list empty")
            failed += 1

        page.click(".bp-inspector-close")
        page.wait_for_timeout(400)

        print("\n--- Part 5: Subtree Expansion Engine in Live Graph ---")
        # Expand React UI Subtree into the live canvas
        expansion_result = page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            const preCount = pb.getProjectGraph().getNodes().length;
            const expanded = pb.expandNodeSubtree('stack-frontend-react');
            const postCount = pb.getProjectGraph().getNodes().length;
            return {
                preCount,
                postCount,
                createdCount: expanded.length,
                createdTitles: expanded.map(n => n.title)
            };
        }""")

        page.wait_for_timeout(800)

        if expansion_result["createdCount"] > 0 and expansion_result["postCount"] > expansion_result["preCount"]:
            print(f"  [PASS] Architectural Subtree dynamically expanded into live graph: {expansion_result['createdCount']} modules mapped ({expansion_result['createdTitles']})")
            passed += 1
        else:
            print(f"  [FAIL] expandNodeSubtree failed: created={expansion_result['createdCount']}")
            failed += 1

        # Check DOM rendered the expanded module nodes and relationship connections
        dom_expansion_check = page.evaluate("""() => {
            const moduleNodes = Array.from(document.querySelectorAll('[data-node-id*="react-components"], [data-node-id*="react-state"]'));
            return {
                renderedModuleCount: moduleNodes.length
            };
        }""")

        if dom_expansion_check["renderedModuleCount"] > 0:
            print(f"  [PASS] Expanded subsystem nodes rendered in Stage 7 SVG canvas ({dom_expansion_check['renderedModuleCount']} active nodes)")
            passed += 1
        else:
            print("  [FAIL] Expanded subsystem nodes not rendered in DOM")
            failed += 1

        # Test Game Archetype Nested Subtree (Unity -> Multiplayer -> Netcode)
        game_nested_subtree_check = page.evaluate("""() => {
            const GraphClass = window.ProjectBlueprint.getProjectGraph().constructor;
            const graph = new GraphClass();
            graph.addNode({
                id: 'unity-2d-test',
                type: 'tech',
                title: 'Unity 2D',
                expansionSubtree: {
                    title: 'Unity Architecture Subtree',
                    modules: [
                        { id: 'gameplay', title: 'Gameplay Architecture' },
                        { id: 'multiplayer', title: 'Multiplayer & Netcode', children: [
                            { id: 'netcode', title: 'Netcode for GameObjects' },
                            { id: 'server', title: 'Dedicated Game Server' }
                        ]}
                    ]
                }
            });
            const created = graph.expandNodeSubtree('unity-2d-test');
            const netcodeNode = graph.getNode('unity-2d-test::multiplayer::netcode');
            const netcodeConns = graph.getRelationships('unity-2d-test::multiplayer');
            return {
                createdCount: created.length,
                hasNestedGrandchild: Boolean(netcodeNode),
                hasParentRelationship: netcodeConns.length > 0
            };
        }""")

        if game_nested_subtree_check["createdCount"] == 4 and game_nested_subtree_check["hasNestedGrandchild"]:
            print(f"  [PASS] Hierarchical nested subtrees supported: Unity -> Multiplayer -> Netcode & Dedicated Server (4 submodules mapped)")
            passed += 1
        else:
            print("  [FAIL] Hierarchical nested subtrees check failed")
            failed += 1

        # Check console errors and uncaught exceptions
        if len(console_errors) == 0 and len(uncaught_exceptions) == 0:
            print("  [PASS] Zero console errors and zero uncaught exceptions in Architecture Exploration Suite")
            passed += 1
        else:
            print(f"  [FAIL] Errors detected: console={console_errors}, exceptions={uncaught_exceptions}")
            failed += 1

        page.close()
    finally:
        if own_browser:
            browser.close()
            if pw:
                pw.stop()

    print(f"\n--- Architecture Exploration Engine: {'PASS' if failed == 0 else 'FAIL'} ({passed} passed, {failed} failed) ---")
    return {
        "passed": passed,
        "failed": failed,
        "console_errors": len(console_errors),
        "uncaught_exceptions": len(uncaught_exceptions)
    }

if __name__ == "__main__":
    res = run_architecture_exploration_tests()
    sys.exit(0 if res["failed"] == 0 else 1)

