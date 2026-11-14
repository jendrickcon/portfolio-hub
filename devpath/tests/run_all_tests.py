"""
DevPath — Master Verification Orchestrator.
Runs all Playwright test suites across the matrix:
1. Stage 1-5 Regression
2. Recursive Graph Engine
3. Multi-Select & Shuffle Invariant
4. Stage 6 Infrastructure & Deployment
5. Stage 7 Final Project Blueprint
6. Desktop Viewports (1440x900, 1920x1080)
7. Mobile Responsive Matrix (360x800, 375x812, 390x844, 412x915, 430x932)

Collects console errors, uncaught exceptions, and generates the final markdown report table.
"""
import os
import sys
import time
from playwright.sync_api import sync_playwright

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

# Import individual suites
from test_regression_stages1_5 import run_regression_stages1_5
from test_recursive_graph import run_recursive_graph_tests
from test_multi_select_and_shuffle import run_multi_select_and_shuffle_tests
from test_stage6_infrastructure import run_stage6_infrastructure_tests
from test_stage7_blueprint import run_stage7_blueprint_tests
from test_desktop_viewports import run_desktop_viewports_tests
from test_mobile_responsive import run_mobile_responsive_tests
from test_large_graph_dag import run_large_graph_dag_tests
from test_selection_transition import run_selection_transition_tests
from test_smart_shuffle_and_pruning import run_smart_shuffle_and_pruning_tests
from test_centering_wrapping_and_root_theme import run_centering_wrapping_root_tests
from test_architecture_exploration_engine import run_architecture_exploration_tests
from test_feature_brainstorming_and_exploration import run_feature_brainstorming_tests
from test_canonical_vocabulary import run_canonical_vocabulary_tests

def main():
    print("=" * 70)
    print("  DEVPATH — MASTER VERIFICATION RUNNER")
    print("=" * 70)

    start_time = time.time()
    total_passed = 0
    total_failed = 0
    total_console_errors = 0
    total_uncaught_exceptions = 0
    suite_status = {}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)

        suites = [
            ("Stage 1-5 Regression", run_regression_stages1_5, "regression_1_5"),
            ("Recursive Graph Engine", run_recursive_graph_tests, "recursive_graph"),
            ("Multi-Select & Shuffle Invariant", run_multi_select_and_shuffle_tests, "multi_shuffle"),
            ("Stage 6 Infrastructure", run_stage6_infrastructure_tests, "stage_6"),
            ("Stage 7 Final Blueprint", run_stage7_blueprint_tests, "stage_7"),
            ("Desktop Viewports", run_desktop_viewports_tests, "desktop_viewports"),
            ("Mobile Responsive Matrix", run_mobile_responsive_tests, "mobile_responsive"),
            ("Large Graph DAG Matrix", run_large_graph_dag_tests, "large_graph_dag"),
            ("Stage 5 Selection Transition", run_selection_transition_tests, "selection_transition"),
            ("Smart Shuffle & Dependency Pruning", run_smart_shuffle_and_pruning_tests, "smart_shuffle_pruning"),
            ("Centering, Wrapping & Organic Root Theme", run_centering_wrapping_root_tests, "centering_wrapping_root"),
            ("Architecture Exploration Engine", run_architecture_exploration_tests, "architecture_exploration"),
            ("Feature Brainstorming & Architecture Exploration", run_feature_brainstorming_tests, "feature_brainstorming"),
            ("Canonical Vocabulary & Data Model", run_canonical_vocabulary_tests, "canonical_vocabulary")
        ]

        for suite_name, suite_fn, key in suites:
            print(f"\n>>> Running Suite: {suite_name}")
            try:
                res = suite_fn(browser)
                p = res.get("passed", 0)
                f = res.get("failed", 0)
                ce = res.get("console_errors", 0)
                ue = res.get("uncaught_exceptions", 0)

                total_passed += p
                total_failed += f
                total_console_errors += ce
                total_uncaught_exceptions += ue

                passed_cleanly = (f == 0 and ce == 0 and ue == 0)
                suite_status[key] = "PASS" if passed_cleanly else "FAIL"
                print(f"--- {suite_name}: {suite_status[key]} ({p} passed, {f} failed) ---")
            except Exception as e:
                print(f"!!! Error in suite {suite_name}: {e}")
                total_failed += 1
                total_uncaught_exceptions += 1
                suite_status[key] = "FAIL"

        browser.close()

    elapsed = time.time() - start_time
    overall_playwright = "PASS" if (total_failed == 0 and total_console_errors == 0 and total_uncaught_exceptions == 0) else "FAIL"

    print("\n" + "=" * 70)
    print("  DEVPATH VERIFICATION SUMMARY TABLE")
    print("=" * 70)
    print(f"| Metric / Test Target | Status |")
    print(f"| :--- | :--- |")
    print(f"| Playwright tests | {overall_playwright} |")
    print(f"| Stage 1–5 regression | {suite_status.get('regression_1_5', 'FAIL')} |")
    print(f"| Stage 5 selection transition | {suite_status.get('selection_transition', 'FAIL')} |")
    print(f"| Recursive graph | {suite_status.get('recursive_graph', 'FAIL')} |")
    print(f"| Stage 6 | {suite_status.get('stage_6', 'FAIL')} |")
    print(f"| Stage 7 | {suite_status.get('stage_7', 'FAIL')} |")
    print(f"| Desktop viewports (1440x900, 1920x1080) | {suite_status.get('desktop_viewports', 'FAIL')} |")
    print(f"| Mobile viewports (360x800, 375x812, 390x844, 412x915, 430x932) | {suite_status.get('mobile_responsive', 'FAIL')} |")
    print(f"| Smart shuffle & dependency pruning | {suite_status.get('smart_shuffle_pruning', 'FAIL')} |")
    print(f"| Architecture exploration engine | {suite_status.get('architecture_exploration', 'FAIL')} |")
    print(f"| Feature brainstorming & exploration | {suite_status.get('feature_brainstorming', 'FAIL')} |")
    print(f"| Canonical vocabulary & data model | {suite_status.get('canonical_vocabulary', 'FAIL')} |")
    print(f"| Console errors | {total_console_errors} |")
    print(f"| Uncaught exceptions | {total_uncaught_exceptions} |")
    print("=" * 70)
    print(f"Total assertions: {total_passed + total_failed} ({total_passed} passed, {total_failed} failed) in {elapsed:.1f}s\n")

    if overall_playwright != "PASS":
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()

