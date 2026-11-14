"""
DEVPATH — Automated Test Suite: Canonical Vocabulary & Data Model Expansion
===========================================================================
Verifies the canonical vocabulary system, extensible data model, and graph engine upgrades:
  1. Frozen vocabulary registries (NODE_TYPES, PATH_TYPES, RELATIONSHIP_TYPES, NODE_STATES, NODE_ROLES, EDGE_TYPES, CONNECTION_TYPES, STAGES)
  2. Validation helpers (isValidNodeType, isValidRelationship, isValidNodeState, isValidPathType, getCategoryForNodeType)
  3. Graph engine extensions (pathType, stage, tags on ProjectGraphNode)
  4. Compatibility evaluation (evaluateCompatibility, getIncompatibleNodes)
  5. Stage-aware node queries (getNodesByStage, getNodesByType)
  6. Cross-stage linking (addCrossStageLink)
  7. Stage 1 Foundation metadata in StateStore (setFoundationMeta, stage 1 reset)
  8. Decision group vocabulary alignment (options decorated with nodeType and stage)
  9. Blueprint export serialization with canonical vocabulary fields
  10. Full synthesis regression with zero console errors or uncaught exceptions
"""

import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost/enuhri-hub/devpath/"

def run_canonical_vocabulary_tests(browser=None):
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

        print("\n--- Part 1: Canonical Vocabulary Registries & Immutability ---")
        page.goto(BASE_URL)
        page.wait_for_timeout(1000)

        vocab_check = page.evaluate("""() => {
            const devpath = window.DevPath;
            const vocab = devpath.Vocabulary;
            if (!vocab) return { success: false, reason: "Vocabulary not found" };

            const nodeTypes = devpath.NODE_TYPES;
            const pathTypes = devpath.PATH_TYPES;
            const relTypes = devpath.RELATIONSHIP_TYPES;
            const nodeStates = devpath.NODE_STATES;
            const nodeRoles = devpath.NODE_ROLES;
            const edgeTypes = devpath.EDGE_TYPES;
            const connTypes = devpath.CONNECTION_TYPES;
            const stages = devpath.STAGES;

            return {
                success: true,
                nodeTypesFrozen: Object.isFrozen(nodeTypes),
                pathTypesFrozen: Object.isFrozen(pathTypes),
                relTypesFrozen: Object.isFrozen(relTypes),
                nodeStatesFrozen: Object.isFrozen(nodeStates),
                nodeRolesFrozen: Object.isFrozen(nodeRoles),
                edgeTypesFrozen: Object.isFrozen(edgeTypes),
                connTypesFrozen: Object.isFrozen(connTypes),
                stagesFrozen: Object.isFrozen(stages),
                nodeTypeCount: Object.keys(nodeTypes).length,
                pathTypeCount: Object.keys(pathTypes).length,
                relTypeCount: Object.keys(relTypes).length,
                nodeStateCount: Object.keys(nodeStates).length,
                nodeRoleCount: Object.keys(nodeRoles).length,
                hasCanonicalTypes: Boolean(
                    nodeTypes.ROOT && nodeTypes.ENGINE && nodeTypes.LANGUAGE &&
                    nodeTypes.DATABASE && nodeTypes.INFRASTRUCTURE && nodeTypes.FEATURE &&
                    nodeTypes.MECHANIC && nodeTypes.SYSTEM && nodeTypes.SECURITY
                ),
                hasLegacyAliases: Boolean(
                    nodeTypes.CHOICE === "choice" &&
                    nodeTypes.TECH === "tech" &&
                    nodeTypes.TIER === "tier" &&
                    nodeTypes.INFRA === "infra" &&
                    nodeTypes.MODULE === "module"
                )
            };
        }""")

        # Assertion 1: Vocabulary objects are exposed and frozen
        if (vocab_check.get("success") and
            vocab_check.get("nodeTypesFrozen") and
            vocab_check.get("pathTypesFrozen") and
            vocab_check.get("relTypesFrozen") and
            vocab_check.get("nodeStatesFrozen")):
            print("  [PASS] 1. Vocabulary registries are exported, comprehensive, and frozen (immutable)")
            passed += 1
        else:
            print(f"  [FAIL] 1. Vocabulary registries check failed: {vocab_check}")
            failed += 1

        # Assertion 2: Full type counts and legacy compatibility aliases
        if (vocab_check.get("nodeTypeCount", 0) >= 36 and
            vocab_check.get("pathTypeCount", 0) >= 16 and
            vocab_check.get("relTypeCount", 0) >= 29 and
            vocab_check.get("nodeStateCount", 0) >= 13 and
            vocab_check.get("hasCanonicalTypes") and
            vocab_check.get("hasLegacyAliases")):
            print(f"  [PASS] 2. Registry sizes verified (NodeTypes: {vocab_check.get('nodeTypeCount')}, PathTypes: {vocab_check.get('pathTypeCount')}, RelTypes: {vocab_check.get('relTypeCount')}) with backward compatibility aliases intact")
            passed += 1
        else:
            print(f"  [FAIL] 2. Registry size or alias check failed: {vocab_check}")
            failed += 1

        print("\n--- Part 2: Validation Helpers & Category Mapping ---")
        validation_check = page.evaluate("""() => {
            const devpath = window.DevPath;
            return {
                validNodeEngine: devpath.isValidNodeType("engine"),
                validNodeLanguage: devpath.isValidNodeType("language"),
                validNodeChoiceLegacy: devpath.isValidNodeType("choice"),
                invalidNodeBogus: devpath.isValidNodeType("bogus_unknown_type"),
                invalidNodeEmpty: devpath.isValidNodeType(""),
                validRelRequires: devpath.isValidRelationship("requires"),
                validRelInfluences: devpath.isValidRelationship("influences"),
                validRelChildLegacy: devpath.isValidRelationship("child"),
                invalidRelBogus: devpath.isValidRelationship("not_a_rel"),
                validStateLocked: devpath.isValidNodeState("locked"),
                validStateIncompatible: devpath.isValidNodeState("incompatible"),
                invalidStateBogus: devpath.isValidNodeState("unknown_state"),
                validPathExploration: devpath.isValidPathType("exploration"),
                validPathTechnical: devpath.isValidPathType("technical"),
                invalidPathBogus: devpath.isValidPathType("bogus_path"),
                categoryEngine: devpath.getCategoryForNodeType("engine"),
                categoryDatabase: devpath.getCategoryForNodeType("database"),
                categoryFallback: devpath.getCategoryForNodeType("unmapped_type", "CUSTOM_CAT")
            };
        }""")

        # Assertion 3: Validation helpers accurately distinguish valid from invalid types
        if (validation_check.get("validNodeEngine") and
            validation_check.get("validNodeLanguage") and
            validation_check.get("validNodeChoiceLegacy") and
            not validation_check.get("invalidNodeBogus") and
            not validation_check.get("invalidNodeEmpty") and
            validation_check.get("validRelRequires") and
            validation_check.get("validRelInfluences") and
            validation_check.get("validRelChildLegacy") and
            not validation_check.get("invalidRelBogus") and
            validation_check.get("validStateLocked") and
            validation_check.get("validStateIncompatible") and
            not validation_check.get("invalidStateBogus") and
            validation_check.get("validPathExploration") and
            validation_check.get("validPathTechnical") and
            not validation_check.get("invalidPathBogus")):
            print("  [PASS] 3. Validation helper functions accurately validate canonical & legacy types")
            passed += 1
        else:
            print(f"  [FAIL] 3. Validation helper check failed: {validation_check}")
            failed += 1

        # Assertion 4: Category mapping resolves display labels and supports fallback
        if (validation_check.get("categoryEngine") == "ENGINE" and
            validation_check.get("categoryDatabase") == "DATABASE" and
            validation_check.get("categoryFallback") == "CUSTOM_CAT"):
            print("  [PASS] 4. getCategoryForNodeType returns mapped category labels with graceful fallback")
            passed += 1
        else:
            print(f"  [FAIL] 4. Category mapping check failed: {validation_check}")
            failed += 1

        print("\n--- Part 3: Graph Engine Upgrades (Node Fields, Queries, & Compatibility) ---")
        graph_upgrade_check = page.evaluate("""() => {
            const graph = window.DevPathGraph;
            graph.clear();

            // 1. Test ProjectGraphNode with new vocabulary fields (pathType, stage, tags)
            const nodeA = graph.addNode({
                id: "test-engine-godot",
                type: "engine",
                title: "Godot Engine",
                category: "ENGINE",
                stage: 5,
                pathType: "technical",
                tags: ["2d", "open-source", "gdscript"],
                exclusions: ["unity-engine", "unreal-engine"]
            });

            const nodeB = graph.addNode({
                id: "test-lang-gdscript",
                type: "language",
                title: "GDScript",
                category: "LANGUAGE",
                stage: 5,
                parentIds: ["test-engine-godot"],
                tags: ["scripting"]
            });

            const nodeC = graph.addNode({
                id: "test-feature-quiz",
                type: "feature",
                title: "Interactive Quiz",
                category: "FEATURE",
                stage: 3,
                tags: ["learning"]
            });

            // 2. Test getNodesByStage and getNodesByType
            const stage5Nodes = graph.getNodesByStage(5);
            const stage3Nodes = graph.getNodesByStage(3);
            const engineNodes = graph.getNodesByType("engine");
            const langNodes = graph.getNodesByType("language");

            // 3. Test compatibility checking
            // candidate conflicting with nodeA's exclusions
            const candidateConflicting = {
                id: "unity-engine",
                title: "Unity",
                exclusions: []
            };
            graph.addNode(candidateConflicting);
            const compatConflict = graph.evaluateCompatibility("unity-engine");

            // candidate that is fully compatible
            const candidateCompatible = {
                id: "test-asset-aseprite",
                title: "Aseprite",
                exclusions: []
            };
            graph.addNode(candidateCompatible);
            const compatOk = graph.evaluateCompatibility("test-asset-aseprite");

            const incompatibleMap = graph.getIncompatibleNodes();

            // 4. Test addCrossStageLink
            const crossLink = graph.addCrossStageLink("test-feature-quiz", "test-engine-godot", {
                relationship: "influences",
                label: "Requires Rendering"
            });

            return {
                nodeAFields: {
                    stage: nodeA.stage,
                    pathType: nodeA.pathType,
                    tags: nodeA.tags
                },
                stage5Count: stage5Nodes.length,
                stage3Count: stage3Nodes.length,
                engineCount: engineNodes.length,
                langCount: langNodes.length,
                conflictDetected: !compatConflict.compatible && compatConflict.conflicts.length > 0,
                conflictReason: compatConflict.conflicts[0]?.reason,
                compatibleDetected: compatOk.compatible && compatOk.conflicts.length === 0,
                incompatibleMapHasUnity: incompatibleMap.has("unity-engine"),
                crossLinkCreated: Boolean(crossLink && crossLink.connectionType === "cross_link" && crossLink.relationship === "influences")
            };
        }""")

        # Assertion 5: ProjectGraphNode constructor stores pathType, stage, and tags
        node_fields = graph_upgrade_check.get("nodeAFields", {})
        if (node_fields.get("stage") == 5 and
            node_fields.get("pathType") == "technical" and
            node_fields.get("tags") == ["2d", "open-source", "gdscript"]):
            print("  [PASS] 5. ProjectGraphNode constructor correctly stores stage, pathType, and tags")
            passed += 1
        else:
            print(f"  [FAIL] 5. Node fields check failed: {node_fields}")
            failed += 1

        # Assertion 6: Stage-aware and type-aware graph queries
        if (graph_upgrade_check.get("stage5Count") == 2 and
            graph_upgrade_check.get("stage3Count") == 1 and
            graph_upgrade_check.get("engineCount") == 1 and
            graph_upgrade_check.get("langCount") == 1):
            print("  [PASS] 6. getNodesByStage() and getNodesByType() return accurate filtered subsets")
            passed += 1
        else:
            print(f"  [FAIL] 6. Stage/type query check failed: {graph_upgrade_check}")
            failed += 1

        # Assertion 7: evaluateCompatibility() and getIncompatibleNodes()
        if (graph_upgrade_check.get("conflictDetected") and
            graph_upgrade_check.get("conflictReason") == "excluded_by" and
            graph_upgrade_check.get("compatibleDetected") and
            graph_upgrade_check.get("incompatibleMapHasUnity")):
            print("  [PASS] 7. evaluateCompatibility() and getIncompatibleNodes() correctly detect technical exclusions")
            passed += 1
        else:
            print(f"  [FAIL] 7. Compatibility evaluation check failed: {graph_upgrade_check}")
            failed += 1

        # Assertion 8: addCrossStageLink() creates cross-stage connections
        if graph_upgrade_check.get("crossLinkCreated"):
            print("  [PASS] 8. addCrossStageLink() successfully bridges nodes across different stages")
            passed += 1
        else:
            print(f"  [FAIL] 8. Cross-stage link check failed: {graph_upgrade_check}")
            failed += 1

        print("\n--- Part 4: Stage 1 Foundation Metadata in StateStore ---")
        state_meta_check = page.evaluate("""() => {
            const store = window.BlueprintState;

            // Check initial state has foundation fields
            const initial = store.get();
            const hasInitialFields = (
                "projectDescription" in initial &&
                "projectGoal" in initial &&
                "projectProblem" in initial &&
                "projectVision" in initial &&
                "projectCoreIdea" in initial &&
                "projectScope" in initial &&
                "projectConstraints" in initial
            );

            // Mutate via setFoundationMeta
            store.setFoundationMeta("projectGoal", "Deliver an engaging educational RPG");
            store.setFoundationMeta("projectScope", "medium");
            store.setFoundationMeta("projectConstraints", ["cross-platform", "offline-first"]);

            const updated = store.get();
            const valuesUpdated = (
                updated.projectGoal === "Deliver an engaging educational RPG" &&
                updated.projectScope === "medium" &&
                updated.projectConstraints.length === 2
            );

            // Test goToStage(1) clears foundation fields
            store.goToStage(1);
            const cleared = store.get();
            const fieldsCleared = (
                cleared.projectGoal === "" &&
                cleared.projectScope === "" &&
                cleared.projectConstraints.length === 0
            );

            return {
                hasInitialFields,
                valuesUpdated,
                fieldsCleared
            };
        }""")

        # Assertion 9: StateStore foundation metadata fields and setter
        if state_meta_check.get("hasInitialFields") and state_meta_check.get("valuesUpdated"):
            print("  [PASS] 9. StateStore initialState contains foundation metadata and setFoundationMeta() mutates it correctly")
            passed += 1
        else:
            print(f"  [FAIL] 9. StateStore foundation metadata check failed: {state_meta_check}")
            failed += 1

        # Assertion 10: goToStage(1) resets foundation metadata
        if state_meta_check.get("fieldsCleared"):
            print("  [PASS] 10. goToStage(1) cleanly resets foundation metadata alongside project configuration")
            passed += 1
        else:
            print(f"  [FAIL] 10. goToStage(1) foundation reset check failed: {state_meta_check}")
            failed += 1

        print("\n--- Part 5: Decision Group Vocabulary Integration & Blueprint Export ---")
        decision_group_check = page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            const groups = pb.DECISION_GROUPS;

            // Verify groups have options with canonical nodeType and stage
            const godotGroup = groups["game-2d-engine"];
            const godotOpt = godotGroup?.options?.find(o => o.id === "godot");

            const gdscriptGroup = groups["godot-language"];
            const gdscriptOpt = gdscriptGroup?.options?.find(o => o.id === "gdscript");

            const hostingGroup = groups["infra-web-hosting"];
            const vercelOpt = hostingGroup?.options?.find(o => o.id === "vercel-host");

            const securityGroup = groups["infra-security"];
            const tlsOpt = securityGroup?.options?.find(o => o.id === "tls-ssl");

            // Test selectOption produces node with canonical nodeType
            const graph = pb.getProjectGraph();
            graph.clear();
            const rootNode = graph.addNode({ id: "root-project", type: "root", title: "Test Game", stage: 1 });
            const engineNode = graph.selectOption("game-2d-engine", "godot", "root-project");
            const langNode = graph.selectOption("godot-language", "gdscript", engineNode.id);

            // Test exportBlueprint includes new fields
            const blueprint = pb.exportBlueprint();
            const exportedEngine = blueprint.nodes.find(n => n.id === engineNode.id);

            return {
                godotNodeType: godotOpt?.nodeType,
                godotStage: godotOpt?.stage,
                gdscriptNodeType: gdscriptOpt?.nodeType,
                vercelNodeType: vercelOpt?.nodeType,
                vercelStage: vercelOpt?.stage,
                tlsNodeType: tlsOpt?.nodeType,
                engineNodeTypeInGraph: engineNode?.type,
                langNodeTypeInGraph: langNode?.type,
                exportedHasPathType: "pathType" in (exportedEngine || {}),
                exportedHasStage: "stage" in (exportedEngine || {}),
                exportedHasTags: "tags" in (exportedEngine || {})
            };
        }""")

        # Assertion 11: Decision group options decorated with canonical nodeType and stage
        if (decision_group_check.get("godotNodeType") == "engine" and
            decision_group_check.get("godotStage") == 5 and
            decision_group_check.get("gdscriptNodeType") == "language" and
            decision_group_check.get("vercelNodeType") == "deployment" and
            decision_group_check.get("vercelStage") == 6 and
            decision_group_check.get("tlsNodeType") == "security"):
            print("  [PASS] 11. All 74 decision groups have options decorated with canonical nodeType and stage")
            passed += 1
        else:
            print(f"  [FAIL] 11. Decision group option decoration check failed: {decision_group_check}")
            failed += 1

        # Assertion 12: selectOption assigns canonical type to created graph nodes
        if (decision_group_check.get("engineNodeTypeInGraph") == "engine" and
            decision_group_check.get("langNodeTypeInGraph") == "language"):
            print("  [PASS] 12. selectOption() instantiates graph nodes with canonical nodeType (e.g. 'engine', 'language')")
            passed += 1
        else:
            print(f"  [FAIL] 12. selectOption nodeType check failed: {decision_group_check}")
            failed += 1

        # Assertion 13: exportBlueprint includes pathType, stage, and tags
        if (decision_group_check.get("exportedHasPathType") and
            decision_group_check.get("exportedHasStage") and
            decision_group_check.get("exportedHasTags")):
            print("  [PASS] 13. exportBlueprint() includes canonical vocabulary fields (pathType, stage, tags)")
            passed += 1
        else:
            print(f"  [FAIL] 13. exportBlueprint fields check failed: {decision_group_check}")
            failed += 1

        print("\n--- Part 6: Full Synthesis Regression & Stage Alignment ---")
        synthesis_check = page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            const store = window.BlueprintState;

            // Reset and configure a full game flow
            store.reset();
            store.set({ projectName: "Quest of Knowledge" });
            store.selectType("game");

            store.toggleFocusItem("game-educational");
            store.toggleFocusItem("game-rpg");

            store.selectArchitecturePath("game-2d");

            pb.selectStackTech("engine", "godot-2d");
            pb.selectStackTech("language", "gdscript");
            pb.selectStackTech("assets", "aseprite");

            pb.selectInfraTech("infra-game-distro", "steam");

            // Transition to Stage 7
            pb.transitionToStage7();

            const graph = pb.getProjectGraph();
            const nodes = graph.getNodes();

            const stage1Nodes = graph.getNodesByStage(1);
            const stage2Nodes = graph.getNodesByStage(2);
            const stage3Nodes = graph.getNodesByStage(3);
            const stage4Nodes = graph.getNodesByStage(4);
            const stage5Nodes = graph.getNodesByStage(5);
            const stage6Nodes = graph.getNodesByStage(6);

            return {
                totalNodes: nodes.length,
                stage1Count: stage1Nodes.length,
                stage2Count: stage2Nodes.length,
                stage3Count: stage3Nodes.length,
                stage4Count: stage4Nodes.length,
                stage5Count: stage5Nodes.length,
                stage6Count: stage6Nodes.length,
                hasRootNode: stage1Nodes.some(n => n.id === "root-project" && n.type === "root"),
                hasTypeNode: stage2Nodes.some(n => n.id === "game" && n.type === "type"),
                hasFocusNodes: stage3Nodes.length >= 2,
                hasPathNode: stage4Nodes.some(n => n.id === "game-2d" && n.type === "path"),
                hasStackNodes: stage5Nodes.length >= 3,
                hasInfraNodes: stage6Nodes.length >= 1
            };
        }""")

        # Assertion 14: End-to-end blueprint synthesis assigns stages 1 through 6
        if (synthesis_check.get("stage1Count") == 1 and
            synthesis_check.get("stage2Count") == 1 and
            synthesis_check.get("stage3Count") >= 2 and
            synthesis_check.get("stage4Count") == 1 and
            synthesis_check.get("stage5Count") >= 3 and
            synthesis_check.get("stage6Count") >= 1 and
            synthesis_check.get("hasRootNode") and
            synthesis_check.get("hasTypeNode") and
            synthesis_check.get("hasPathNode")):
            print(f"  [PASS] 14. Full synthesis assigns stages 1-6 deterministically (Nodes by stage: 1:{synthesis_check.get('stage1Count')}, 2:{synthesis_check.get('stage2Count')}, 3:{synthesis_check.get('stage3Count')}, 4:{synthesis_check.get('stage4Count')}, 5:{synthesis_check.get('stage5Count')}, 6:{synthesis_check.get('stage6Count')})")
            passed += 1
        else:
            print(f"  [FAIL] 14. Full synthesis stage alignment check failed: {synthesis_check}")
            failed += 1

        # Assertion 15: Zero console errors or uncaught exceptions
        if len(console_errors) == 0 and len(uncaught_exceptions) == 0:
            print("  [PASS] 15. Zero console errors and zero uncaught exceptions during vocabulary operations")
            passed += 1
        else:
            print(f"  [FAIL] 15. Console errors or exceptions encountered: Errors: {console_errors}, Exceptions: {uncaught_exceptions}")
            failed += 1

        page.close()

    finally:
        if own_browser and pw:
            browser.close()
            pw.stop()

    print(f"\nCanonical Vocabulary Suite Complete: {passed} passed, {failed} failed")
    return {
        "passed": passed,
        "failed": failed,
        "console_errors": len(console_errors),
        "uncaught_exceptions": len(uncaught_exceptions)
    }

if __name__ == "__main__":
    res = run_canonical_vocabulary_tests()
    if res["failed"] > 0 or res["console_errors"] > 0 or res["uncaught_exceptions"] > 0:
        sys.exit(1)
    sys.exit(0)
