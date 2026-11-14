"""
DEVPATH — Capture Feature Brainstorming and Architecture Exploration Artifacts
=============================================================================
Captures high-resolution visual evidence of:
  1. Stage 7 Blueprint with dynamically expanded feature exploration nodes & cross-cutting flow links
  2. Node Inspector modal displaying "WHY CONSIDER THIS?" rationale & "CONNECTED IDEAS & DATA FLOWS"
  3. Living Root theme representation of the interconnected feature graph
"""

import os
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\enuhri\.gemini\antigravity\brain\0317273b-5754-46d5-b922-f992b7079734"
BASE_URL = "http://localhost/enuhri-hub/devpath/"

def capture_feature_artifacts():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # 1. Setup Educational Game Blueprint
        page.goto(BASE_URL)
        page.wait_for_timeout(1000)
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
        page.wait_for_timeout(1000)

        # 2. Expand feature exploration nodes from educational focus node
        page.evaluate("""() => {
            window.ProjectBlueprint.exploreNodeFeatures('focus-sel-game-educational');
        }""")
        page.wait_for_timeout(1500)

        # Reset camera to frame nodes nicely
        page.evaluate("""() => {
            const pb = window.ProjectBlueprint;
            pb.camera.resetView();
        }""")
        page.wait_for_timeout(500)

        # Artifact 1: Blueprint Theme with Feature Exploration & Cross-links
        path1 = os.path.join(ARTIFACT_DIR, "feature_exploration_blueprint.png")
        page.screenshot(path=path1, full_page=False)
        print(f"[Captured] {path1}")

        # Artifact 2: Node Inspector with "Why Consider This?" & Flow Links
        page.evaluate("""() => {
            window.ProjectBlueprint.openNodeInspector('feat-quiz');
        }""")
        page.wait_for_timeout(600)
        path2 = os.path.join(ARTIFACT_DIR, "feature_exploration_inspector.png")
        page.screenshot(path=path2, full_page=False)
        print(f"[Captured] {path2}")

        # Close Inspector
        page.click(".bp-inspector-close")
        page.wait_for_timeout(400)

        # Artifact 3: Switch to Living Root Theme
        page.evaluate("""() => {
            window.ProjectBlueprint.switchTheme('root');
        }""")
        page.wait_for_timeout(1000)
        path3 = os.path.join(ARTIFACT_DIR, "feature_exploration_root_theme.png")
        page.screenshot(path=path3, full_page=False)
        print(f"[Captured] {path3}")

        browser.close()

if __name__ == "__main__":
    capture_feature_artifacts()

