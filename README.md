# Enuhri Portfolio Hub

Jendrick / Enuhri's personal portfolio repository. It holds two related experiences for the same person and body of work:

- **[Professional](professional/index.html)** — the primary hiring-facing portfolio served at the canonical root `/`.
- **[Explore](explore/index.html)** — the retro CRT / old-computer experience served under `/explore/`, containing experiments, interactive prototypes, and app-like project presentations.

Both experiences are linked bidirectionally (with `/professional/` and the retired `/portfolio/` routes permanently redirecting via `308` to `/`). On a fresh session at `/`, an optional recruiter-first experience selector lets visitors continue directly to the **Professional Portfolio** or launch the **Explore Workstation**; direct section links (such as `/#work`), repeat same-session visits, and the embedded CRT preview inside `/explore/` bypass the selector automatically.

This is a student portfolio built through iterative, AI-assisted development. It is published as a working portfolio, not as production software: some projects are functional, some are experiments, and some are presented through descriptions rather than runnable code.

## Status

| Area                               | Status                | Notes                                                      |
| ---------------------------------- | --------------------- | ---------------------------------------------------------- |
| Professional View                  | Implemented (Live)    | Canonical hiring-facing portfolio served at `/` on [www.jendrick.dev](https://www.jendrick.dev) |
| Public résumé viewing              | Implemented           | Same-page dialog with Fit page and zoom controls           |
| Résumé PDF download                | Implemented           | Direct same-origin download, no navigation away            |
| Light and Dark themes              | Implemented           | Synchronized Light/Dark themes across Professional View and project reconstructions |
| Profile and project-linked Toolkit | Implemented           | Compacted two-column project-linked Toolkit tied to project evidence |
| Featured project reconstructions   | Implemented           | Presented from shipped evidence and screenshots, including UDM-RADAR GWA trend chart |
| Supporting-media viewer            | Implemented           | Lightbox viewer for supporting project captures            |
| Capabilities cards & dialog        | Implemented           | Interactive animated SVG capability cards and shared evidence dialog |
| Portfolio experience entry screen  | Implemented (`/`)     | Session-scoped dialog at `/` with primary Professional default, Explore Workstation option, focus trap, and automatic hash/iframe bypass |
| Explore workstation (3D & Pixel 2D)| Implemented (`explore/`) | Dual-mode procedural 3D WebGL (Three.js r170) + fixed-aspect 4:3 Pixel 2D CRT workstation with shared semantic screen, 6-slot catalog, inline project dossiers, and URL hash state |
| Professional-in-CRT embed          | Implemented (`explore/`) | Selecting `01 Professional Portfolio` inside `/explore/` loads the live same-origin `/` portfolio inside the CRT iframe with desktop panning on large fine-pointer displays and a native-scale Profile and section selector in compact apertures. When the screen is too small, the CRT offers Full Site and Return to Catalog |
| DevPath entry in Explore           | Paused Prototype      | Occupies Slot `06` (`PAUSED PROTOTYPE`, `#app=devpath`) inside the six-slot Explore workstation catalog |
| Hidden Sandbox floppy bay          | Implemented (`explore/`) | Centered physical 3.5" floppy bay (`SANDBOX.SYS`) below the CRT screen opens to launch `/sandbox/` |
| Root deployment (`vercel.json`)    | Implemented (Live)    | Deploys from repository root: `/` to Professional, `/explore/` to CRT Workstation, `/professional/` & `/portfolio/` -> `308 /` |
| Legacy HCI portfolio (`portfolio/`) | Retired (Archived)    | Externally archived and removed from active repository; `/portfolio/` redirects (`308`) to `/` |

The integrated production baseline includes [Explore integration (#19)](https://github.com/jendrickcon/portfolio-hub/pull/19), [startup recovery (#20)](https://github.com/jendrickcon/portfolio-hub/pull/20), [mobile dossier framing and detail controls (#21)](https://github.com/jendrickcon/portfolio-hub/pull/21), and [Professional CRT Compact (#22)](https://github.com/jendrickcon/portfolio-hub/pull/22). Repository-root deployment uses [vercel.json](vercel.json) at [www.jendrick.dev](https://www.jendrick.dev/).

Status labels used here: **Implemented** — supported by code and runtime checks; **Partial / Experimental** — incomplete or not fully verified; **Planned** — agreed but not built; **Paused** — development intentionally stopped; **Deferred** — waiting on evidence or media; **Legacy** — retired or retained older work.

## Professional View

The Professional View is a single page covering Intro, Profile with a formal portrait, a public one-page résumé, a compacted two-column project-linked Toolkit, featured projects, Light/Dark project reconstructions (including UDM-RADAR's interactive GWA trend chart), a supporting-media lightbox viewer, interactive Capability cards with a shared details dialog, Journey, and Contact. It supports Light and Dark themes and is served at the production root of `https://www.jendrick.dev` via [vercel.json](vercel.json).

Résumé behaviour:

- **View résumé** opens a same-page dialog with an image preview of page 1.
- The dialog offers Fit page, zoom in and out, and Reset, with keyboard shortcuts.
- **Download PDF** saves the file directly without leaving the portfolio.
- **Open PDF in browser** is the only action that intentionally opens the browser's PDF viewer.

The public résumé PDF is available at [Jendrick_Coniconde_Resume.pdf](professional/assets/resume/Jendrick_Coniconde_Resume.pdf) and is phone-free.

The Toolkit links capabilities to project evidence. Close an expanded Toolkit detail from its heading or with Escape. The Capability dialog has its own header close button and returns focus to the card. Other Projects includes Gallery and Sandbox captures in the supporting-media lightbox. The Gallery card uses a 1280×635 WebP from the recorded exhibition and links to the live Gallery for interaction.

## Explore

The [explore/](explore/index.html) route (`/explore/`) hosts the dual-mode **Explore Workstation**: a procedural Three.js r170 **3D** desk workstation paired with an intentionally authored fixed-aspect **Pixel 2D** workstation mode, both sharing one projected semantic CRT interface and a deterministic `320×180` animated cityscape window (`pixel-env.js`). It features a Standby/Boot flow, a persistent `◂ Professional Portfolio` return control (`/`), URL-hash navigation (`#menu`, `#app=<id>`), a six-slot application catalog (`01 Professional Portfolio` [live same-origin CRT embed], `02 UDM-RADAR`, `03 StudyQuest`, `04 Enuhri Art Gallery`, `05 CyberDefender`, and `06 DevPath` [`PAUSED PROTOTYPE`]), a centered physical 3.5" `SANDBOX.SYS` floppy bay launching `/sandbox/`, and a working physical CRT Power button. It remains an experimental secondary surface alongside the canonical hiring presentation.

- **Startup and recovery.** The Professional entry chooser bypasses automatically if its controller cannot initialize. Explore holds the scene until the CRT and interaction targets align. If its controller cannot start, the loading surface offers Reload and Return to Portfolio. Slow or unavailable WebGL can fall back to Pixel 2D.
- **Dossiers and previews.** On phones, ordinary dossiers and interactive previews move closer to the screen while keeping the 3D or Pixel 2D overlay and visible hardware targets aligned. UDM-RADAR and StudyQuest open on a poster. An explicit Play action loads the same-origin interactive reconstruction on demand. Close Preview returns to the poster and returning to Catalog disposes of the preview. The action bar provides the applicable case study, source, or launch actions. External launches use the CRT transition where configured. GitHub source links use the GitHub mark and have accessible names.
- **Professional Embed.** The same Professional page adapts within the iframe. Compact opens with Profile and a native section selector. Large fine-pointer apertures retain desktop panning. An undersized aperture offers Catalog and Full Site. A failed iframe offers Retry. Ordinary 3D/2D switching reuses the loaded document.
- **Gallery and Sandbox.** Gallery launches as its own route. Its built-in exhibits and drawing studio work while online artwork, likes, comments, and submissions are unavailable. An inline notice explains the limited state and offers reload guidance. The physical Sandbox floppy opens the simulation, and the Professional portfolio includes a separate Sandbox screenshot and link.

## Projects

| Project                                   | Status                                  | Portfolio role                  | Notes                                                                                              |
| ----------------------------------------- | --------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------- |
| Professional Portfolio                    | Implemented (Live)                      | Primary hiring-facing portfolio | Canonical root experience live on `https://www.jendrick.dev/`                                      |
| UDM-RADAR                                 | Functional capstone system              | Featured project                | Synthetic academic data; decision-tree-regressor projections are advisory and support human review |
| StudyQuest                                | Functional team project                 | Featured project                | Course, assessment, learning-path, and progress workflows using Gemini API with Pydantic validation |
| Mini PCS                                  | Completed practical-assessment workflow | Featured project                | Airtable-backed implementation; public reconstruction uses fictional records                       |
| Audiary                                   | Supporting personal project             | Supporting project              | Real capture available                                                                             |
| LAYA                                      | Android prerelease                      | Supporting project              | AR garden and balance-puzzle prototype; device verification pending                                |
| Waffle's Nine Lives                       | Android MVP                             | Supporting project              | Top-down action roguelike with rooms, enemies and nine lives                                       |
| [Art Gallery](art-gallery/index.html)     | Experiment, work remains                | Explore application             | Interactive gallery with Firebase/Firestore features; Firestore rules still require console review; Cloud Firestore is used separately from Portfolio Hub hosting |
| [CyberDefender](cyberdefender/index.html) | Educational game with browser adaptation | Explore application            | Original Android-focused educational cybersecurity game built in Godot 4 with GDScript. The portfolio adaptation exposes selected gameplay in the browser. |
| [Sandbox](sandbox/index.html)             | Experiment                              | Hidden floppy bay (`SANDBOX.SYS`) | Falling-sand and cellular-automata simulation launched from the CRT floppy bay with return link to `/explore/#menu` |
| [DevPath](devpath/index.html)             | Development paused                      | Slot 06 catalog entry           | Architecture and decision-graph prototype (`PAUSED PROTOTYPE`, `#app=devpath`); Game Architecture is available while broader domains remain incomplete |

UDM-RADAR and StudyQuest are represented here through descriptions and evidence. Their full runnable systems live in their own repositories, so this repository does not independently verify their internal implementation. These entries do not claim live institutional deployment or the use of real student records.

DevPath is paused, not abandoned. Its existing documentation and prototype are preserved for a later stage.

## Hosting history and current direction

These are separate facts and should not be combined into one claim.

**Hosting history.** Portfolio Hub was hosted on a Windows Azure VM using IIS. That is where the project was developed and served from during that period, and it is not a permanent hosting commitment.

**Current direction.** The **Professional View** is live on Vercel at `https://www.jendrick.dev` via repository-root [vercel.json](vercel.json), which maps `/` to `professional/index.html`, `/explore/` to `explore/index.html`, `/art-gallery/`, `/cyberdefender/`, `/sandbox/`, and `/devpath/`, and permanently redirects (`308`) `/professional/` and `/portfolio/` to `/`. The legacy standalone HCI `portfolio/` directory has been archived externally and retired from the active repository.

**Firebase / Cloud Firestore.** Firebase Authentication and Cloud Firestore are associated with the Enuhri Art Gallery experiment. They are separate cloud services, not the hosting platform for Portfolio Hub, and they are not part of the Azure or IIS hosting history.

## Repository structure

```text
professional/      Professional View + session-scoped experience entry selector (served at / via vercel.json rewrites)
explore/           Dual-mode 3D & Pixel 2D Explore workstation (`main.js`, `crt-scene.js`, `pixel-env.js`, local fonts, vendored Three.js)
art-gallery/       Enuhri Art Gallery (Firebase Authentication / Firestore)
cyberdefender/     Browser adaptation of selected CyberDefender gameplay
sandbox/           Falling-sand simulation experiment
devpath/           DevPath decision-graph prototype (paused)
assets/projects/   Active project dossier preview screenshots for /explore/ (retired PNG shell sprites removed)
vercel.json        Repository-root rewrites and 308 redirects (/professional/, /portfolio/ -> /)
docs/              Documentation and handoff notes
```

`professional/` remains self-contained (with its own HTML, CSS, JavaScript, fonts, résumé, and evidence assets), and `vercel.json` rewrites root asset requests cleanly to `professional/`.

## Local development

Run the [Vercel CLI](https://vercel.com/docs/cli/dev) from the repository root with access to the existing Portfolio Hub Vercel project. Select that project if the CLI prompts you to link the directory.

```sh
vercel dev --listen 8848
```

Open `http://localhost:8848/`. For a routing smoke test, visit each of these paths on the same server:

| Route | Expected behavior |
| --- | --- |
| `/`, `/#profile`, `/#other-projects` | Professional, with direct hashes bypassing the entry chooser |
| `/explore/`, `/explore/#menu`, `/explore/#app=professional`, `/explore/#app=udm-radar` | Standby, Catalog, Professional Embed, and project dossier |
| `/professional/`, `/portfolio/` | HTTP 308 redirect to `/` |
| `/art-gallery/`, `/cyberdefender/`, `/sandbox/`, `/devpath/` | Standalone project routes |
| `/style.css`, `/script.js`, `/assets/evidence/supporting/art-gallery-exhibition.webp` | Root rewrites to Professional assets |

A plain static file server can open individual files for isolated checks. The integrated flow requires the redirects and rewrites in `vercel.json`. Testing Gallery locally can reach the configured Firebase project. Use intercepted requests or an authorized disposable project for cloud-write tests.

### DevPath verification boundary

DevPath remains a paused prototype. The active registry imports `gameSeeds.js` and registers ten Game Architecture roots under the synthetic `__root__`: Roguelike, Survival, FPS, RPG, Platformer, Puzzle, Strategy, Horror, Sandbox, and Simulation. Run these Node.js commands from the repository root:

```sh
node devpath/tests/validate_graph.mjs
node devpath/tests/test_graph_engine.mjs
```

The active validation checks 283 declared and reachable nodes and reports zero validation errors. The graph engine suite runs 24 assertions. Software & Systems and Website & Web App are incomplete. The inactive `devpath/js/data/softwareSeeds.js` is unregistered and contains unfinished syntax. The legacy Python browser runner targets older behavior. The two Node commands above define the current verification boundary.

## Privacy and evidence boundaries

Public repository content excludes phone number, home address, student ID, real student records, Airtable credentials, API secrets, private QA assessment instructions, private test recordings, private Drive links, the original full-resolution portrait, and employer assessment credentials.

Where relevant:

- public project reconstructions use fictional records;
- the résumé PDF is phone-free;
- screenshots, certificates, and galleries stay deferred while privacy or evidence review is incomplete.

Ignore patterns are not a security boundary. Firestore rules and cloud configuration require separate review; their absence from this repository does not establish that they are safe.

## Roadmap

1. Complete final physical-device verification and post-preview production monitoring across desktop, tablet, and phone targets.

## Known limitations

- Firestore security rules for the Art Gallery cloud database are managed in Firebase Console and remain unverified in this repository.
- CRT Hub sound remains intentionally removed until Web Audio cues are implemented in a later pass.
- Comprehensive mobile, cross-browser, and physical-device testing remains pending.

## Development context

Created by **Jendrick / Enuhri**, a BSIT student at Universidad de Manila. The work reflects continuing learning in UI/UX, front-end development, systems integration, and testing, using iterative prototyping and substantial AI assistance. Implemented work should be credited accurately without implying senior engineering expertise or wholly independent implementation.

For historical README audit and handoff material, see [docs/README_UPDATE_HANDOFF.md](docs/README_UPDATE_HANDOFF.md) and [docs/README_UPDATE_OUTPUT_REPORT.md](docs/README_UPDATE_OUTPUT_REPORT.md).

## License or usage note

No license file is currently included in this repository, and this README does not assign a license. For reuse questions or asset permissions, contact the owner.
