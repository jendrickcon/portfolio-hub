# Portfolio Hub README Update Handoff

## 1. Work Package Identity

- **Package:** Portfolio Hub README Audit Correction, Documentation Alignment, and Continuity Handoff.
- **Date:** 15 November 2026, Asia/Manila.
- **Repository:** `C:\Users\Jendrick\PORTFOLIO`.
- **Remote:** `https://github.com/jendrickcon/portfolio-hub.git`.
- **Branch:** `main`.
- **Starting HEAD:** `ebf3ecc2569c6f1817bfbada8437bea04322cd9d`.
- **Base cached origin/main:** `ebf3ecc2569c6f1817bfbada8437bea04322cd9d`. No fetch or claim about subsequent remote changes was required for this package.
- **Ending HEAD:** unchanged; no commit was authorized or created.
- **Primary output:** [root README](../README.md).
- **Owner-facing report:** [README_UPDATE_OUTPUT_REPORT.md](README_UPDATE_OUTPUT_REPORT.md).

## 2. Scope

This was a README/documentation-only package. Only the root README and these two Markdown reports were authorized for editing. Application HTML, CSS, JavaScript, Python, configuration, Firebase rules, and assets were excluded from edits. No defects were repaired, no deployment or hosting migration occurred, and no Git history was rewritten.

DevPath development remains paused. Professional portfolio discovery/design and the two-view implementation were not started. Read-only application inspection, graph/engine checks, syntax validation, and declaration counts were used to verify public wording.

The starting working tree had no modified tracked files, staged files, or untracked files. The root README existed. No applicable ancestor/repository `AGENTS.md`, contribution guide, existing handoff/audit report, or established reports directory was found. The only existing Markdown files were the README and `sandbox/EXPANSION_PROMPT.md`; the requested `docs/` paths were therefore used.

## 3. Decisions Now Treated as Source of Truth

- The CRT Portfolio Hub is the current overall portfolio and collection of projects. The nested `portfolio/` app is legacy HCI work, not the future professional portfolio.
- **App 06 = DevPath** is the owner's intended mapping. The UI still displays App 06 / COMING SOON; the mapping has not been implemented in the launcher.
- DevPath exists standalone, is incomplete, and is **paused** while portfolio improvement takes priority. Broader application domains and its later vision are preserved, not abandoned.
- Sandbox exists standalone and is not integrated into the launcher. DevPath is also not integrated as a working launcher entry.
- The Professional View and entry chooser are **planned**. The existing CRT experience is the foundation for the future Explore View. They are two interfaces for the same person and work.
- UDM-RADAR and StudyQuest are external-project/case-study representations here; their full runnable systems are absent.
- Azure Windows VM/IIS is development and historical hosting context, not a permanent production-hosting commitment.
- Firebase Authentication and Firestore are independent of the VM. The frontend still needs an accessible host and valid cloud configuration and access controls.
- Static-hosting migration is planned and uncompleted. No provider selection or deployment was made.
- Immediate next work: Professional Portfolio discovery, information architecture, content inventory, and design direction. This package did not authorize that work or DevPath continuation.

## 4. README Claims Corrected

| Area | Correction | Current supporting source |
| --- | --- | --- |
| Main identity | Root CRT Hub is the overall portfolio; nested Portfolio / Resume is legacy HCI work | Owner correction; [root entry](../index.html), [legacy entry](../portfolio/index.html) |
| Launcher | Six actual entries; three application destinations, two case-study descriptions, one existing App 06 slot | `APPS`, `selectApp`, `renderProjectView` in [script.js](../script.js) |
| App 06 | Decided mapping to DevPath, with integration explicitly still planned | Owner decision; existing App 06 source remains unchanged |
| Legacy portfolio | Personal/social/previews; no dossier, skills matrix, downloads, or modern professional experience verified | [portfolio/index.html](../portfolio/index.html), [portfolio/script.js](../portfolio/script.js) |
| Gallery synchronization | Artwork list uses `getDocs`; likes/comments use `onSnapshot` | [art-gallery/index.html](../art-gallery/index.html) |
| Gallery safety | Unsafe metadata/display-name rendering, unavailable live-rule evidence, and recovery/navigation defects remain open | Same gallery source; no rules file found |
| CyberDefender | Web reimagining based on original Godot prototype; boot evidence separated from complete gameplay claims | [web entry](../cyberdefender/index.html), [main.js](../cyberdefender/js/main.js), owner history |
| Sandbox counts | 88 materials, 197 reaction entries, 12 presets; declarations do not prove exhaustive behavior | [materials](../sandbox/js/materials.js), [reactions](../sandbox/js/reactions.js), [presets](../sandbox/js/presets.js) |
| DevPath entry/domain | Active `boot.js` loads graph-first app; registry loads game data only; software file is incomplete and inactive | [boot](../devpath/js/boot.js), [registry](../devpath/js/knowledge.js), [software data](../devpath/js/data/softwareSeeds.js) |
| Tests | 283 reachable graph nodes; 24 engine assertions pass; old Python runner has 14 legacy suites | [graph validator](../devpath/tests/validate_graph.mjs), [engine tests](../devpath/tests/test_graph_engine.mjs), [Python runner](../devpath/tests/run_all_tests.py) |
| Hosting | Local static feasibility is scoped evidence; migration and Firebase configuration review remain pending | Owner history, supplied runtime audit, existing IIS configurations |

## 5. Claims Removed

- Complete desktop/OS and window-management implications; the root shell lacks draggable window management.
- Legacy portfolio dossier, technical skills matrix, credential downloads, and completed professional-profile claims.
- App 06 as an unidentified future application; it now has the decided DevPath mapping while the actual UI state is still disclosed.
- Active DevPath development, comprehensive non-game domains, and the older “21 test suites” claim.
- Outdated Sandbox counts of 43 materials and eight presets, the stale preset list, and the vague “over 80 distinct reactions” count.
- Unsupported Sandbox Web Audio attribution and guarantees that all actor/reaction behavior was verified.
- Guaranteed realtime synchronization of the gallery's entire artwork list, seamless authentication, and complete graceful-offline behavior.
- Claims that live Firestore rules already prevent unauthorized operations or that ignore patterns guarantee secret exclusion.
- “100% compatible” static-hosting guarantees and wording implying Azure downtime has no conditional effects on the frontend's cloud-backed features.
- Unverified external-project framework/model version lists and unconditional CyberDefender mechanic completeness. External project summaries remain appropriately bounded.

## 6. Newly Documented Information

The README now records the planned Professional / Explore views and entry choice; the distinction between the root portfolio and legacy HCI app; App 06's intended mapping; paused DevPath development; actual launcher behavior; corrected Sandbox declarations; active DevPath validation results and domain gaps; gallery rendering/security concerns; testing limits; and conditional static-hosting migration.

It preserves the owner's Enuhri identity, Azure Student VM/IIS work, browser-to-Firebase separation, creative inspirations, iterative student development, and AI-assisted implementation. No new software license was invented. The existing repository had no license file.

## 7. Remaining Unverified Claims

These are bounded claims and questions, not confirmed security failures or claims of completed features.

| Exact claim or question | Project | Why unverified | Best future verification | Effect on public wording |
| --- | --- | --- | --- | --- |
| “Live Firestore rules prevent unauthorized reads, writes, and deletion.” | Gallery | No rules export in repository; live rules were not inspected | Owner-authorized live-rule inspection, access matrix, and emulator/rules tests | Removed as a guarantee; review gap visible |
| “All artwork submissions, likes, notes, edits, and failure paths work end to end.” | Gallery | Source paths and scoped read/inspection evidence only; no comprehensive cloud-write testing | Use an authorized test environment and verify anonymous user permissions, limits, and recovery | Described as implemented code with incomplete workflow verification |
| “Authentication and offline fallback always recover correctly.” | Gallery | Failure-scope bug exists; SDK/network failures not comprehensively exercised | Test auth denial, unavailable CDN/Firestore, disconnected browser, and rejected writes after code fixes | No seamless or complete offline guarantee |
| “The full tactical game, difficulty modes, progression, sound, and saves work correctly.” | CyberDefender | Earlier audit reached boot/registration, not exhaustive gameplay | Play through encounters and bosses; verify audio, saves, reload, progression, and device support | Source-supported systems listed; complete mechanic claims withheld |
| “All 88 materials, 197 reaction entries, actors, and 12 presets behave correctly.” | Sandbox | Counts are definitions; no exhaustive interaction or endurance matrix | Targeted behavior and reaction tests plus long-running presets and actor checks | Counts explicitly bounded to declarations |
| “All DevPath domains and large graphs work in the active UI.” | DevPath | Only game roots are registered; software file is incomplete; Node tests have narrow engine scope | After owner-directed resumption, complete domains and test active UI, rollback, reachability, readability, and navigation | Paused/incomplete status and domain limitation explicit |
| “The legacy Python suites verify the active graph interface.” | DevPath | They target `window.ProjectBlueprint`, older stages, and a fixed IIS URL | Replace/adapt tests for `window.DevPath` in a future authorized package | Legacy tests are not claimed as current coverage |
| “UDM-RADAR and StudyQuest have all of the described features and exact stacks/model versions.” | External projects | Their full runnable sources are not included here | Inspect each owning repository, implementation, and runtime evidence | Case-study purpose only; unsupported version/completeness details omitted |
| “Every app works on the chosen static host and all mobile/browser targets.” | Hub ecosystem | Earlier localhost subpath checks are not a deployment or device certification | Host-specific path/module/cloud checks; responsive and cross-browser matrix | Migration remains planned; no complete compatibility guarantee |
| “Azure credit is currently below USD 20 and the VM has a particular live state.” | Hosting | Owner's balance/availability report is historical; no Azure account inspection | Owner confirms current balance and hosting state if needed | Credit figure explicitly historical, not a live balance claim |
| “All assets have documented reuse permissions.” | Repository | No repository license/asset-permission audit was supplied | Owner reviews asset provenance and selects appropriate usage/licensing terms | No license invented; reuse questions directed to owner |

## 8. Known Product Issues Not Fixed

| Issue | Source / evidence | Scope boundary |
| --- | --- | --- |
| Unsafe artwork title/artist HTML insertion | `plaque.innerHTML` in gallery source | Documented; rendering code untouched |
| Unsafe comment display-name insertion | Feedback templates interpolate `note.displayName`; comment text escaping does not cover it | Documented; no cloud records changed |
| Unverified Firestore security rules | No rules file in repository | No live configuration/rule changes made |
| Authentication failure calls out-of-scope `reject` | Gallery `authReady` construction and separate `signInAnonymously(...).catch(...)` | Failure fix deferred |
| Duplicate Main Hub links, one broken | Gallery links to `./enuhri-hub` and `..`; former has no target here | Links untouched |
| Legacy contact form cannot send; game wording stale | Legacy HTML form lacks a sending handler; Godot/mobile description links web remake | Legacy source preserved |
| Hub sound placeholder and unfinished controls | Sound flag/label only; top POWER control lacks a wired handler | No control patch or CRT redesign |
| DevPath non-game choices show game roots | Active registry registers only game seeds and shared root; runtime audit confirmed Software receives genres | No domain integration or resumption |
| Software data fails syntax | File ends mid-definition; `node --check` reports unexpected end of input | File left unchanged, not imported into app |
| Old Python tests miss active interface | `ProjectBlueprint` and fixed `http://localhost/enuhri-hub/devpath/` | Test code not edited or executed |
| App 06 / DevPath and Sandbox launcher gaps | Current catalog has six entries and no working launch for these apps | Integration deferred |

The broader future portfolio, mode selector, comprehensive game/device validation, and hosting migration are planned work or verification gaps, not defects repaired by documentation.

## 9. Files Changed

| File | Purpose |
| --- | --- |
| [README.md](../README.md) | Replace unsupported claims with current application status, scoped evidence, known issues, history, and future direction |
| [docs/README_UPDATE_HANDOFF.md](README_UPDATE_HANDOFF.md) | Persistent evidence, decisions, guardrails, unresolved claims, and continuation instructions |
| [docs/README_UPDATE_OUTPUT_REPORT.md](README_UPDATE_OUTPUT_REPORT.md) | Concise owner review and Git/publication report |

No application or configuration file was edited. No unrelated local work existed at the start or was included.

## 10. Validation Performed

- Initial path, branch, HEAD, cached `origin/main`, tracked/staged/untracked status, and instruction/report inventory checked before edits.
- Application evidence inspected in root catalog/handlers, legacy portfolio HTML/JS, gallery fetch/listener/rendering/auth paths, DevPath active boot/registry and legacy test runner, Sandbox exports, CyberDefender entry/source, and IIS configuration.
- `node devpath/tests/validate_graph.mjs`: **PASS**; 283 declared and reachable nodes, zero errors/warnings.
- `node devpath/tests/test_graph_engine.mjs`: **24 passed, 0 failed**; graph choice, suppression, gating, rollback, manifest, and layout assertions.
- `node --check` over 69 existing `.js` / `.mjs` files: **68 passed, 1 known failure** in `devpath/js/data/softwareSeeds.js` (`Unexpected end of input`). This is an existing product issue, not a documentation blocker.
- Export-based counts: Sandbox **88 / 197 / 12**; registered DevPath entry roots **game 10, website 0, software 0**.
- Earlier runtime audit at the same application revision supplied the six entry-page successes, browser checks, and Azure-independent gallery cloud read. Those browser/cloud checks were not rerun in this documentation package.
- Markdown parsing, heading hierarchy, table shape, fences, local file/anchor links, required content, prohibited stale claims, duplicate content, rendered structure, and documentation-only scope checked after authoring. No Mermaid diagrams or image references remain, so those syntax/reference checks are not applicable.
- `git diff --check`, diff statistics, staged-file inspection, final status, and an application-file integrity comparison complete the package. Detailed final counts are in the separate output report.

No large dependencies were installed. Markdown rendering uses the already bundled `marked` package. Temporary validation/preview artifacts, if used, live outside the repository. The professional portfolio was not designed during rendering review.

## 11. Git State

- Branch remains `main`; HEAD and cached `origin/main` remain `ebf3ecc2569c6f1817bfbada8437bea04322cd9d`.
- One tracked file is modified (`README.md`); two new reports exist under `docs/` and remain untracked until explicitly staged.
- All three documentation files are unstaged and uncommitted. No commit or push was authorized; neither occurred. No merge, deployment, or history rewrite occurred.
- Diff scope is exactly the three files listed in Section 9. The tracked diff plus additions for the two untracked reports is itemized in the [owner-facing report](README_UPDATE_OUTPUT_REPORT.md#git-diff-summary).
- Unrelated changes preserved: none were present. Original tracked application files remain unchanged.
- GitHub still requires owner review and explicit Git instructions for publishing these local changes. The remote was not fetched in this package, so later remote changes are not asserted.

## 12. Recommended Next Work Package

**Professional Portfolio discovery, information architecture, content inventory, and design direction.**

Collect verified background, selected work, owner contributions, achievements, résumé/contact content, audience needs, and navigation/design references before implementing the Professional View. Do not begin that work without the next owner instruction. It is not DevPath continuation.

## 13. Continuation Guardrails

- Do not resume DevPath without owner instruction, including “small” patches that restart its expansion.
- Do not claim the two-view portfolio, Professional View, or entry chooser is implemented.
- Do not hide known gallery rendering risks or claim live Firestore rules are verified.
- Do not remove the Azure/IIS history or treat Azure as required for Firestore.
- Do not modify legacy projects solely to make old README claims true.
- Preserve App 06's intended DevPath identity while distinguishing the unchanged launcher UI.
- Treat successful HTTP/syntax/graph checks as scoped evidence, not proof of production readiness.
- Keep the known software-data syntax failure visible; documentation does not fix it.
- Ask for separate Git authorization before committing or pushing; preserve any new owner changes when work resumes.

## 14. Completion Status

COMPLETION STATUS: README UPDATE COMPLETE — AWAITING OWNER CONFIRMATION FOR GIT ACTION
