"""
DEVPATH — Automated Test Suite: Feature Brainstorming and Architecture Exploration
==================================================================================
Verifies the expansion of DevPath from pure tech stack selection into an interconnected
ideation, feature exploration, and architectural system:
  1. Canonical Feature Pools (PROJECT_FEATURES for game, website, software)
  2. Semantic Node Roles (DECISION, EXPLORE, CONSIDER, DEPENDENCY, CONNECTION)
  3. Feature-to-Feature Cross-Connections (e.g. Quiz -> Score -> Analytics -> Dashboard)
  4. "Why consider this?" Rationales in Node Inspector
  5. Interactive Exploration & Dynamic DAG Expansion (+ Explore badges & Subtrees)
  6. Edge rendering for cross-cutting flow links (.connection-path.cross-link)
"""

import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost/enuhri-hub/devpath/"

def run_feature_brainstorming_tests(browser=None):
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

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error"] else None)
        page.on("pageerror", lambda err: uncaught_exceptions.append(str(err)))

        print("\n--- Part 1: Canonical Feature Pools & Archetype Exploration Paths ---")
        page.goto(BASE_URL)
        page.wait_for_timeout(1000)

        # Check PROJECT_FEATURES and helper functions on window.ProjectBlueprint
        feature_check = page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            const features = pb.PROJECT_FEATURES;
            const hasFeatures = Boolean(features && features.game && features.website && features.software);
            
            const gamePaths = pb.getExplorationPathsForContext('game', ['educational']);
            const sitePaths = pb.getExplorationPathsForContext('website', ['dashboard']);
            const softPaths = pb.getExplorationPathsForContext('software', ['cli']);

            const quizFeature = pb.findFeatureById('feat-quiz');
            const ocrFeature = pb.findFeatureById('feat-ocr-engine');

            return {
                hasFeatures,
                gamePathCount: gamePaths.length,
                sitePathCount: sitePaths.length,
                softPathCount: softPaths.length,
                quizFound: Boolean(quizFeature && quizFeature.whyConsider && quizFeature.crossLinks),
                quizRole: quizFeature ? quizFeature.nodeRole : null,
                quizCrossLinks: quizFeature ? quizFeature.crossLinks : [],
                ocrFound: Boolean(ocrFeature && ocrFeature.whyConsider)
            };
        }""")

        if feature_check["hasFeatures"]:
            print("  [PASS] Canonical Feature Pools (PROJECT_FEATURES) exposed for Game, Website, and Software")
            passed += 1
        else:
            print("  [FAIL] PROJECT_FEATURES missing or incomplete on window.ProjectBlueprint")
            failed += 1

        if feature_check["gamePathCount"] > 0 and feature_check["sitePathCount"] > 0:
            print(f"  [PASS] Context-sensitive exploration paths resolved (Game: {feature_check['gamePathCount']}, Site: {feature_check['sitePathCount']})")
            passed += 1
        else:
            print("  [FAIL] Context-sensitive exploration paths failed to resolve")
            failed += 1

        if feature_check["quizFound"] and feature_check["quizRole"] == "explore":
            print("  [PASS] Feature nodes declare semantic role ('explore') and 'whyConsider' rationale")
            passed += 1
        else:
            print(f"  [FAIL] Feature feat-quiz missing rationale or role: {feature_check}")
            failed += 1

        # Check quiz crossLinks (e.g. feat-quiz -> feat-scoring, feat-xp)
        cross_targets = [cl.get("toNodeId") or cl.get("targetId") for cl in feature_check["quizCrossLinks"]]
        if "feat-scoring" in cross_targets and "feat-xp" in cross_targets:
            print(f"  [PASS] Feature crossLinks defined: {cross_targets}")
            passed += 1
        else:
            print(f"  [FAIL] Feature crossLinks unexpected: {cross_targets}")
            failed += 1

        print("\n--- Part 2: Blueprint Transition & Semantic Exploration Affordance ---")
        # Step through an educational game setup
        page.fill("#bp-project-name-input", "MathQuest")
        page.click("#bp-btn-begin")
        page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            pb.store.set({
                projectName: 'MathQuest',
                isConfigured: true,
                selectedType: 'game',
                selectedFocus: ['game-educational', 'game-rpg'],
                selectedArchitecturePath: 'game-2d',
                stage: 5
            });
            pb.selectStackTech('engine', 'godot-2d');
            pb.selectStackTech('language', 'gdscript');
            pb.selectStackTech('assets', 'aseprite');
            pb.selectInfraTech('infra-vcs', 'git-github');
            pb.transitionToStage7();
        }""")
        page.wait_for_timeout(1500)

        # Verify Stage 7 rendered blueprint nodes and explore affordances
        blueprint_affordances = page.evaluate("""() => {
            const exploreChips = Array.from(document.querySelectorAll('.bp-explore-badge'));
            const cards = Array.from(document.querySelectorAll('.blueprint-card-inner'));
            return {
                cardCount: cards.length,
                exploreChipsCount: exploreChips.length
            };
        }""")

        if blueprint_affordances["cardCount"] >= 5:
            print(f"  [PASS] Blueprint synthesized with core committed nodes ({blueprint_affordances['cardCount']} cards)")
            passed += 1
        else:
            print(f"  [FAIL] Blueprint cards insufficient: {blueprint_affordances}")
            failed += 1

        if blueprint_affordances["exploreChipsCount"] >= 2:
            print(f"  [PASS] Focus cards render '+ Explore' affordance chip ({blueprint_affordances['exploreChipsCount']} chips)")
            passed += 1
        else:
            print(f"  [FAIL] Focus cards missing '+ Explore' affordance chips: {blueprint_affordances}")
            failed += 1

        print("\n--- Part 3: Interactive Exploration & Dynamic DAG Expansion ---")
        # Trigger exploration on educational focus node
        exp_result = page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            return pb.exploreNodeFeatures('focus-sel-game-educational');
        }""")
        page.wait_for_timeout(1200)

        # Verify new feature nodes, semantic role badges, and connections were added to the DAG
        post_exp_graph = page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            const nodes = pb.projectGraph.getNodes();
            const connections = pb.projectGraph.getConnections();
            
            const featureNodes = nodes.filter(n => n.nodeRole === 'explore' || n.nodeRole === 'consider');
            const crossLinks = connections.filter(c => c.connectionType === 'cross_link');
            const crossPathElements = Array.from(document.querySelectorAll('.connection-path.cross-link'));
            const roleBadges = Array.from(document.querySelectorAll('.bp-role-badge')).map(el => el.textContent.trim());

            return {
                totalNodes: nodes.length,
                featureNodeCount: featureNodes.length,
                featureNodeLabels: featureNodes.map(n => n.title),
                crossLinksCount: crossLinks.length,
                crossLinkLabels: crossLinks.map(c => c.label),
                crossPathElementsCount: crossPathElements.length,
                roleBadgesCount: roleBadges.length,
                hasExploreRole: roleBadges.includes('EXPLORE'),
                hasConsiderRole: roleBadges.includes('CONSIDER')
            };
        }""")

        if post_exp_graph["featureNodeCount"] > 0:
            print(f"  [PASS] Dynamically expanded {post_exp_graph['featureNodeCount']} feature exploration nodes: {post_exp_graph['featureNodeLabels'][:3]}")
            passed += 1
        else:
            print(f"  [FAIL] Feature nodes failed to expand: {post_exp_graph}")
            failed += 1

        if post_exp_graph["hasExploreRole"] and post_exp_graph["roleBadgesCount"] > 0:
            print(f"  [PASS] Feature cards render semantic role badges ({post_exp_graph['roleBadgesCount']} badges rendered)")
            passed += 1
        else:
            print(f"  [FAIL] Role badges not rendered on feature cards: {post_exp_graph}")
            failed += 1

        if post_exp_graph["crossLinksCount"] > 0:
            print(f"  [PASS] Feature-to-feature cross-connections materialized in DAG: {post_exp_graph['crossLinkLabels']}")
            passed += 1
        else:
            print(f"  [FAIL] Cross-links not registered in DAG connections: {post_exp_graph}")
            failed += 1

        if post_exp_graph["crossPathElementsCount"] > 0:
            print(f"  [PASS] Cross-cutting connections rendered with SVG .cross-link styling ({post_exp_graph['crossPathElementsCount']} paths)")
            passed += 1
        else:
            print(f"  [FAIL] Cross-link SVG path elements not found in DOM: {post_exp_graph}")
            failed += 1

        print("\n--- Part 4: Node Inspector 'Why Consider This?' & Flow Links ---")
        # Open inspector on feature node feat-quiz
        page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            pb.openNodeInspector('feat-quiz');
        }""")
        page.wait_for_timeout(600)

        inspector_data = page.evaluate("""() => {
            const whyBox = document.querySelector('.bp-inspector-why');
            const whyText = document.querySelector('.bp-why-text');
            const roleBadge = document.querySelector('.bp-inspector-header .bp-role-badge');
            const crossList = document.querySelector('.bp-cross-link-list');
            const crossItems = Array.from(document.querySelectorAll('.bp-cross-item'));

            return {
                hasWhyBox: Boolean(whyBox),
                whyContent: whyText ? whyText.textContent.trim() : null,
                roleText: roleBadge ? roleBadge.textContent.trim() : null,
                hasCrossList: Boolean(crossList),
                crossItemCount: crossItems.length,
                crossItemTexts: crossItems.map(item => item.textContent.trim())
            };
        }""")

        if inspector_data["hasWhyBox"] and inspector_data["whyContent"]:
            print(f"  [PASS] Node Inspector renders 'WHY CONSIDER THIS?' section: \"{inspector_data['whyContent'][:60]}...\"")
            passed += 1
        else:
            print(f"  [FAIL] Inspector 'Why Consider This?' section missing: {inspector_data}")
            failed += 1

        if inspector_data["roleText"] in ["EXPLORE", "CONSIDER"]:
            print(f"  [PASS] Node Inspector header renders semantic role badge: {inspector_data['roleText']}")
            passed += 1
        else:
            print(f"  [FAIL] Inspector role badge missing or unexpected: {inspector_data['roleText']}")
            failed += 1

        if inspector_data["hasCrossList"] and inspector_data["crossItemCount"] > 0:
            print(f"  [PASS] Node Inspector renders 'CONNECTED IDEAS & DATA FLOWS' list ({inspector_data['crossItemCount']} connections)")
            passed += 1
        else:
            print(f"  [FAIL] Inspector cross-links list missing: {inspector_data}")
            failed += 1

        # Close inspector
        page.click(".bp-inspector-close")
        page.wait_for_timeout(300)

        # Check console errors and uncaught exceptions
        if len(console_errors) == 0:
            print("  [PASS] Zero console errors logged")
            passed += 1
        else:
            print(f"  [FAIL] Console errors detected: {console_errors}")
            failed += 1

        if len(uncaught_exceptions) == 0:
            print("  [PASS] Zero uncaught exceptions")
            passed += 1
        else:
            print(f"  [FAIL] Uncaught exceptions detected: {uncaught_exceptions}")
            failed += 1

        page.close()

    finally:
        if own_browser and browser:
            browser.close()
        if own_browser and pw:
            pw.stop()

    print(f"\nFeature Brainstorming Suite Complete: {passed} passed, {failed} failed")
    return {
        "passed": passed,
        "failed": failed,
        "console_errors": len(console_errors),
        "uncaught_exceptions": len(uncaught_exceptions)
    }

if __name__ == "__main__":
    res = run_feature_brainstorming_tests()
    if res["failed"] > 0 or res["console_errors"] > 0 or res["uncaught_exceptions"] > 0:
        sys.exit(1)
    sys.exit(0)
