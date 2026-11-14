# Portfolio Hub

**Enuhri Portfolio Hub** is Jendrick / Enuhri’s personal portfolio: a retro computer and CRT-inspired environment for exploring projects, applications, and experiments. It combines working browser applications with standalone prototypes and project case studies.

This is an evolving student portfolio built through iterative, AI-assisted development. The current implementation has an identity and working features, alongside unfinished integrations and known issues.

## What This Repository Is

The root [Portfolio Hub](index.html) is the central portfolio experience and launcher. Its collection includes a legacy HCI portfolio, an interactive art gallery, a web game, a falling-sand simulation, and a project-planning graph. UDM-RADAR and StudyQuest appear as project representations; their full runnable systems are not included here.

The core applications use HTML, CSS, and JavaScript in the browser. They do not require an application backend to serve their static files. The Art Gallery connects separately to Firebase Authentication and Cloud Firestore.

## Current Status

- The repository is active; this README is aligned with the implementation and audit reviewed on **15 November 2026** at application revision `ebf3ecc`.
- The CRT Hub is an **implemented, partial / experimental foundation** for the portfolio’s exploratory experience.
- The next major focus is discovery and planning for a new professional portfolio. That experience has **not been implemented**.
- **DevPath development is paused** while portfolio improvement takes priority. Its unfinished direction is preserved for later.
- Static-hosting migration is **planned, not completed**. Azure VM availability is not a permanent hosting commitment.

Here, **Implemented** means supported by code or scoped runtime evidence; **Partial / Experimental** means incomplete or not fully verified; **Planned** means not implemented; **Paused** means development has intentionally stopped; **Legacy** means retained older work; and **Known Issue** means an unresolved defect, risk, or verification gap. **Reimagined** identifies a newer implementation based on an earlier prototype. These labels do not imply production readiness.

## Two Future Ways to Explore

The planned direction is two connected interfaces for the same person and body of work. **The two-view experience and entry-choice popup do not exist yet.**

### Professional View — Planned

A focused presentation for recruiters, hiring managers, internship coordinators, professional contacts, professors, and collaborators. Planned content includes About Me, résumé/CV information, selected projects, contributions, achievements, skills and capabilities, a technical and creative journey, and contact information.

The intended design is one cohesive page with purposeful, dynamic movement and navigation beyond a conventional vertical layout. Its content, information architecture, and visual direction still need discovery and design work.

### Explore View — Planned Evolution

The existing CRT Hub is the early foundation for a more playful way to discover applications, experiments, personality, and creative work. A future entry choice will let visitors choose **Professional View** or **Explore View**. The legacy HCI portfolio remains part of the collection.

## Portfolio Hub vs Portfolio / Resume App

**Portfolio Hub** refers to this repository and its central CRT experience: the owner’s current overall portfolio and collection of projects.

**Portfolio / Resume** is the launcher label for the older [HCI portfolio application](portfolio/index.html). It contains personal, social, and project-preview content. It is preserved legacy work, not a completed modern professional portfolio, résumé-management system, terminal personnel dossier, or credential-download service. The planned Professional View will become the primary professional presentation without requiring deletion of this older project.

## Current Launcher

The launcher’s actual catalog is defined in [script.js](script.js). It currently has **six entries**:

| Visible entry | Current behavior | Actual status |
| --- | --- | --- |
| Portfolio / Resume | Opens `portfolio/` | Legacy HCI application; integrated |
| UDM Radar | Opens a project description | Case-study representation; no runnable system here |
| StudyQuest | Opens a project description | Case-study representation; no runnable system here |
| Enuhri Art Gallery | Opens `art-gallery/` | Implemented / Experimental; integrated |
| CyberDefender | Opens a project description with a web-demo launch link | Reimagined web application; integrated |
| App 06 | Still displays the existing “COMING SOON” slot | **Intended for DevPath**; launcher integration remains planned |

**App 06 = DevPath** is the owner’s decided mapping. The existing UI has not yet been updated to implement it. DevPath and Sandbox can be opened directly from their directories but are not integrated into the main launcher.

## Project Catalog

### Portfolio Hub — CRT Launcher

**Purpose:** bring the portfolio’s projects together through a retro computer interface.

**Status:** Implemented / Partial / Experimental. The hub includes a landing screen, boot sequence, six-entry application menu, project descriptions, and scanline and reduced-motion controls. It launches the applications listed above.

This is an OS-inspired presentation, not a complete desktop operating system. Complete draggable window management is absent. The hub’s sound toggle changes a flag and label but has no connected audio playback; some controls and integration remain unfinished.

### Portfolio / Resume

**Purpose:** preserve the original HCI portfolio and its personal, social, and project-preview content.

**Status:** Legacy / HCI project, integrated through [portfolio/](portfolio/index.html).

The page does not contain the previously documented technical skills matrix, credential downloads, or terminal dossier functionality. Its contact form has no working sending handler. Its CyberDefender description still uses the older Godot/mobile identity while linking to the current web reimagining. These limitations remain unresolved.

### Enuhri Art Gallery

**Purpose:** explore a museum-like environment, inspect artwork, and use an in-browser drawing studio.

**Status:** Implemented / Experimental, integrated through [art-gallery/](art-gallery/index.html). Navigation, artwork inspection, drawing and image-upload controls, and Firebase integration exist. The audit observed shared Firestore artwork loading independently of Azure.

The browser connects directly to Firebase Authentication and Firestore. Shared artwork loading uses a one-time `getDocs` fetch; likes and comments use `onSnapshot` realtime listeners. Submission code exists, but full cloud-write behavior was not comprehensively verified.

**Known security and reliability concerns:** submitted artwork titles and artist names are inserted through unsafe HTML-rendering paths. Some comment display names have similar unsafe insertion paths; escaping comment text alone does not protect those fields. This creates a stored script-injection risk. Firestore rules are not present in this repository and were not verified, so protection against unauthorized reads, writes, or deletion must not be assumed.

Duplicate Main Hub links include one pointing to a missing location. Authentication failure handling calls `reject` outside its promise scope, and offline/fallback behavior needs testing and correction. Built-in procedural artwork and a fetch-error catch exist, but a complete offline experience is not established, including when Firebase SDK imports fail. None of these issues was fixed by this documentation update.

### CyberDefender

**Purpose:** a cybersecurity-themed browser adventure with turn-based combat and exploration.

**Status:** Reimagined HTML/CSS/JavaScript web implementation, integrated through [cyberdefender/](cyberdefender/index.html).

The original project was a Godot prototype associated with the earlier mobile/game implementation. This repository contains a web reimagining, not the original Godot application executing unchanged in a browser.

The source includes exploration, combat commands, enemy and boss definitions, progression, procedural Web Audio, and local save handling. The audit confirmed successful boot and reached registration; it did not exhaustively verify gameplay, balance, progression, sound, or persistence. Specific older mechanic and enemy claims should be checked against the current definitions before being advertised as complete.

### Sandbox

**Purpose:** an experimental falling-sand simulation with material discovery and autonomous pixel actors.

**Status:** Experimental standalone application at [sandbox/](sandbox/index.html); **not integrated into the launcher**.

The 15 November 2026 audit counted **88 material definitions, 197 reaction entries, and 12 presets** in [materials.js](sandbox/js/materials.js), [reactions.js](sandbox/js/reactions.js), and [presets.js](sandbox/js/presets.js). These are code-declaration counts, not a claim that every interaction works or has been manually tested. Reaction entries are not necessarily distinct material-pair recipes.

The implementation includes a canvas simulation, reaction priorities, discovery tracking, inspection, presets, and humans, fish, birds, angels, devils, and black holes. Browser verification covered startup; comprehensive material combinations, actor interactions, and long-duration preset behavior remain unverified.

### DevPath

**Purpose:** interactive project-architecture and decision-graph exploration where choices grow a project path.

**Status:** Paused standalone development at [devpath/](devpath/index.html). **App 06 is reserved for DevPath’s intended integration**, but the launcher does not yet expose it as a working DevPath entry. Portfolio improvement now takes priority over further DevPath development.

The active [boot.js](devpath/js/boot.js) loads the newer graph-first interface. Growing graphs, user choices, branching, undo, and navigation have implementation support. Graph validation reports **283 reachable nodes**, with no errors or warnings, and the engine checks report **24 passed, 0 failed**.

The active [knowledge registry](devpath/js/knowledge.js) registers only game-related seeds. Website and Software selections currently receive game genres too. The separate [software data file](devpath/js/data/softwareSeeds.js) is incomplete and fails JavaScript syntax validation; it is not imported by the active registry. Broader project domains remain unfinished. Legacy stage-based code and Python tests remain in the repository; those tests target the older interface and do not fully verify the active graph experience.

**Preserved future direction, paused:** users should construct paths through interests, features, mechanics, required systems, architecture, technologies, and decisions. Future coverage may include game dimensions such as roguelike, dungeons, rooms, monsters, player systems, multiplayer, survival, and gun/combat systems; and application dimensions such as OCR, file systems, AI prediction, portals, cash applications, and cash management. Some game concepts already have data, but these examples do not establish complete active-domain coverage. No expansion is authorized by this README.

### UDM-RADAR

**Purpose:** represent an external academic analytics and decision-support project for Universidad de Manila.

**Status:** External project / case-study representation. Hub descriptions and preview assets discuss academic records, projected GWA, risk detection, and intervention workflows. The full runnable implementation is not contained here, so its PHP/Python/database stack and detailed capabilities cannot be independently verified from this repository.

### StudyQuest

**Purpose:** represent an external AI-assisted, gamified learning project.

**Status:** External project / case-study representation. Hub descriptions and preview assets discuss uploaded learning materials, course generation, assessments, and progression. The full runnable implementation is not contained here; model names, framework versions, and detailed feature claims need verification in the owning project before stronger public claims are made.

## Architecture

```text
Web host serves static HTML, CSS, JavaScript, and assets
    -> Browser executes Portfolio Hub and standalone applications
        -> Art Gallery connects directly to Firebase Authentication / Firestore

Historical frontend hosting:
    Azure Windows VM -> IIS -> Portfolio Hub static frontend

Firebase Authentication / Firestore are separate cloud services.
They are not hosted inside, or routed through, the Azure VM.
```

The runnable frontend directories are `portfolio/`, `art-gallery/`, `cyberdefender/`, `sandbox/`, and `devpath/`. Shared assets are under `assets/`. The root [web.config](web.config) controls IIS development caching; [CyberDefender’s web.config](cyberdefender/web.config) supplies IIS MIME mappings. These are hosting settings, not an application backend.

Firebase client configuration is present in the gallery source. Its presence does not establish database security. Authentication, authorized domains, configuration, and live security rules require separate review.

## Hosting History and Migration

The project was developed and historically served through a Windows VM funded by an **Azure Student subscription**, using **IIS** under `C:\inetpub\wwwroot\enuhri-hub\`. This repository originated from that deployed application environment.

When the migration direction was established, the owner reported less than approximately **USD 20** of student credit remaining. This is historical context, not a live balance check. The VM may frequently remain offline and should not be treated as permanent production infrastructure.

Migration to a free or sustainable static host is planned. Candidate platforms include GitHub Pages, Cloudflare Pages, Netlify, and Firebase Hosting; no platform has been selected or deployed by this work. Local static-server checks support feasibility, but migration still depends on testing each application’s relative paths, modules, browser APIs, and cloud dependencies.

An offline Azure VM prevents visitors from fetching frontend files from that VM; it does not itself stop Firebase/Firestore. The gallery still needs an accessible frontend host and valid Firebase configuration, authorized domains, authentication, and security rules. Configuration or domain settings may need updates after migration.

## Verification and Audit Status

Evidence below applies to application revision `ebf3ecc`, reviewed on **15 November 2026**. The earlier browser audit and the read-only checks repeated for this documentation package are distinguished explicitly.

| Check | Result | Evidence scope |
| --- | --- | --- |
| Static entry-page responses | Hub root plus five application entry pages returned successfully under `/portfolio-hub/` | Earlier local audit; HTTP success only |
| Browser checks | Hub launcher, legacy portfolio, gallery navigation and artwork inspection, Sandbox startup, CyberDefender boot, DevPath choices | Earlier local audit; scoped checks, not complete workflows |
| Gallery cloud loading | Shared Firestore artwork loaded from a locally hosted frontend without Azure | Earlier local audit; does not establish write permissions or rule safety |
| DevPath graph validation | 283 reachable nodes; 0 errors, 0 warnings | Repeated with `node devpath/tests/validate_graph.mjs` |
| DevPath engine checks | 24 passed; 0 failed | Repeated with `node devpath/tests/test_graph_engine.mjs` |
| JavaScript file syntax | 68 files passed; `devpath/js/data/softwareSeeds.js` failed with unexpected end of input | Repeated across 69 `.js` / `.mjs` files; parsing only |
| Sandbox declarations | 88 materials; 197 reaction entries; 12 presets | Recounted from exported definitions |

**Verification limits:** live Firestore rules and full Firebase write behavior were not verified; CyberDefender gameplay was not exhaustively tested; all Sandbox interactions were not manually verified; comprehensive mobile and cross-browser behavior remains pending. The legacy DevPath Python runner contains 14 suites, uses an IIS-specific URL, and targets the older interface. It was not rerun for this documentation package. Passing graph checks and successful entry-page responses do not establish complete application correctness or production readiness.

## Known Issues and Planned Patches

The following issues remain open. Documenting them has not fixed them.

| Area | Current issue | Risk | Planned action | Status |
| --- | --- | --- | --- | --- |
| Gallery rendering | Unsafe HTML insertion for artwork metadata and some display names | High: stored script injection | Render untrusted fields safely and test malicious input | Known Issue; not fixed |
| Gallery access control | Live Firestore rules absent from repository and unaudited | Security posture unverified | Inspect live rules, define access expectations, and test them | Known Issue; pending review |
| Gallery reliability | Authentication error-scope bug, incomplete fallback assurance, duplicate and broken hub link | Failed recovery or navigation | Correct error handling and links; test unavailable services | Known Issue; not fixed |
| Legacy portfolio | Contact form has no sending handler; CyberDefender wording is stale | Failed contact and misleading description | Decide contact behavior and correct legacy copy | Known Issue; not fixed |
| Hub controls | Sound is a placeholder; some controls remain unfinished | Visitor confusion | Verify control behavior before further interface work | Partial / Experimental |
| DevPath domains | Software data has a syntax error; active domains are game-only | Incorrect or unavailable project paths | Complete and register domains only when development is resumed by the owner | Known Issue; Paused |
| DevPath testing | Legacy tests target an inactive interface and fixed IIS URL | Coverage gap | Plan tests for the active graph interface | Known Issue; Paused |
| Launcher integration | App 06 mapping not implemented; Sandbox absent | Existing apps are difficult to discover | Integrate DevPath and expose Sandbox in a later package | Planned |
| Hosting and devices | Migration and comprehensive compatibility testing unfinished | Deployment or usability failures | Test paths, cloud setup, devices, and browsers before migration | Planned |

## Future Direction

1. Discover and plan the Professional View: content inventory, information architecture, contributions, and design direction; then build it in a separately authorized package.
2. Implement the planned Professional / Explore entry choice.
3. Improve the exploratory CRT Hub while preserving its identity and legacy projects.
4. Correct gallery rendering and authentication issues and verify Firebase security before broader publication.
5. Integrate DevPath as App 06 later, and expose Sandbox appropriately.
6. Resume DevPath expansion only after portfolio priorities and explicit owner instruction.
7. Complete static-hosting compatibility work and migration, then expand mobile and cross-browser testing.

This list records planned work; it does not mean those features exist today. The documentation-only update did not start these development phases.

## Running Locally

Use a local HTTP server from the repository root. No compilation or package installation is required to serve the existing frontend files.

```bash
python -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/). VS Code Live Server is an alternative. Opening files directly through `file://` may break ES module loading or browser features, so HTTP is preferred. The gallery’s cloud features also need network access and valid Firebase service configuration.

Direct application paths are `/portfolio/`, `/art-gallery/`, `/cyberdefender/`, `/sandbox/`, and `/devpath/` beneath the chosen hosting base. Serving the existing files does not remove their documented application defects.

For the current DevPath data/engine checks, with Node.js available:

```bash
node devpath/tests/validate_graph.mjs
node devpath/tests/test_graph_engine.mjs
```

## Development Context

Created by **Jendrick / Enuhri**, a BSIT student at Universidad de Manila. The work reflects continuing learning in UI/UX, front-end development, systems integration, and testing, using iterative prototyping and substantial AI assistance. The implemented work should be credited accurately without implying senior engineering expertise or wholly independent implementation.

The project’s inspirations include retro computing, cybersecurity games, neoclassical museum environments, and discovery-oriented interactive simulations such as Neal.fun. Existing projects and assets remain preserved.

For detailed evidence and continuation guidance, see the [README update handoff](docs/README_UPDATE_HANDOFF.md) and the separate [owner-facing output report](docs/README_UPDATE_OUTPUT_REPORT.md). The repository’s [.gitignore](.gitignore) excludes development archives, caches, scratch files, and specified private directories; ignore patterns alone are not proof that credentials or cloud services are secure.

## License or Usage Note

No license file is currently included in this repository, and this README does not assign a license. For reuse questions or asset permissions, contact the owner. Project authorship and the development context above are retained from the existing documentation.
