# Enuhri Portfolio Hub

Jendrick / Enuhri's personal portfolio repository. It holds two related experiences for the same person and body of work:

- **[Professional](professional/index.html)** — the primary hiring-facing portfolio served at the canonical root `/`.
- **[Explore](explore/index.html)** — the retro CRT / old-computer experience served under `/explore/`, containing experiments, interactive prototypes, and app-like project presentations.

Both experiences are linked bidirectionally (with `/professional/` permanently redirecting to `/`). No mandatory entrance chooser sits in front of the Professional View.

This is a student portfolio built through iterative, AI-assisted development. It is published as a working portfolio, not as production software: some projects are functional, some are experiments, and some are presented through descriptions rather than runnable code.

## Status

| Area                               | Status                | Notes                                                      |
| ---------------------------------- | --------------------- | ---------------------------------------------------------- |
| Professional View                  | Implemented (Live)    | Primary hiring-facing portfolio, live on Vercel at [www.jendrick.dev](https://www.jendrick.dev) (`professional` root directory) |
| Public résumé viewing              | Implemented           | Same-page dialog with Fit page and zoom controls           |
| Résumé PDF download                | Implemented           | Direct same-origin download, no navigation away            |
| Light and Dark themes              | Implemented           | Synchronized Light/Dark themes across Professional View and project reconstructions |
| Profile and project-linked Toolkit | Implemented           | Compacted two-column project-linked Toolkit tied to project evidence |
| Featured project reconstructions   | Implemented           | Presented from shipped evidence and screenshots, including UDM-RADAR GWA trend chart |
| Supporting-media viewer            | Implemented           | Lightbox viewer for supporting project captures            |
| Capabilities cards & dialog        | Implemented           | Interactive animated SVG capability cards and shared evidence dialog |
| Explore (CRT Hub)                  | Implemented (`explore/`) | Preserved experimental experience at `/explore/` with URL hash state and return links to `/` |
| Vercel deployment (`professional`) | Implemented (Live)    | Custom domain `https://www.jendrick.dev` currently deploys from the `professional` root directory |
| Root routing configuration         | Implemented (`vercel.json`) | Maps `/` to Professional, `/explore/` to CRT Hub, `/professional/` -> `308 /`; pending Vercel Root Directory switch |
| App 06 / DevPath mapping           | Planned (Paused)      | App 06 is DevPath conceptually, with CRT catalog integration still pending |
| Explore refinement                 | Pending               | Catalog integration, `/portfolio/` retirement (PR D), and mobile/a11y polish (PR E) |

Pull requests #1–#15 are merged on `main`, and PR C adds root deployment alignment in [vercel.json](vercel.json). The **Professional View** is live on Vercel at `https://www.jendrick.dev` (currently deployed from the `professional` directory); `/explore/` and sub-app routes go live once PR C merges and the Vercel project Root Directory is switched to the repository root.

Status labels used here: **Implemented** — supported by code and runtime checks; **Partial / Experimental** — incomplete or not fully verified; **Planned** — agreed but not built; **Paused** — development intentionally stopped; **Deferred** — waiting on evidence or media; **Legacy** — retained older work.

## Professional View

The Professional View is a single page covering Intro, Profile with a formal portrait, a public one-page résumé, a compacted two-column project-linked Toolkit, featured projects, Light/Dark project reconstructions (including UDM-RADAR's interactive GWA trend chart), a supporting-media lightbox viewer, interactive Capability cards with a shared details dialog, Journey, and Contact. It supports Light and Dark themes and is currently served at the production root of `https://www.jendrick.dev` from the `professional` root directory on Vercel.

Résumé behaviour:

- **View résumé** opens a same-page dialog with an image preview of page 1.
- The dialog offers Fit page, zoom in and out, and Reset, with keyboard shortcuts.
- **Download PDF** saves the file directly without leaving the portfolio.
- **Open PDF in browser** is the only action that intentionally opens the browser's PDF viewer.

The public résumé PDF is available at [Jendrick_Coniconde_Resume.pdf](professional/assets/resume/Jendrick_Coniconde_Resume.pdf) and is phone-free.

The Toolkit describes capabilities with project references rather than a bare skills list, and the Quality & Direction shelf reflects work from a junior QA practical assessment.

## Explore

The [explore/](explore/index.html) route (`/explore/`) hosts the CRT Hub: a retro computer interface, boot sequence, URL-hash navigation (`#menu`, `#app=<id>`), a persistent `◂ Professional Portfolio` return link (`/`), and the application launcher. It is an experimental secondary surface rather than the primary hiring presentation.

## Projects

| Project                                   | Status                                  | Portfolio role                  | Notes                                                                                              |
| ----------------------------------------- | --------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------- |
| Professional Portfolio                    | Implemented (Live)                      | Primary hiring-facing portfolio | Live on Vercel at `https://www.jendrick.dev` (`professional` directory)                            |
| UDM-RADAR                                 | Functional capstone system              | Featured project                | Synthetic academic data; decision-tree-regressor projections are advisory and support human review |
| StudyQuest                                | Functional team project                 | Featured project                | Course, assessment, learning-path, and progress workflows                                          |
| Mini PCS                                  | Completed practical-assessment workflow | Featured project                | Airtable-backed implementation; public reconstruction uses fictional records                       |
| Audiary                                   | Supporting personal project             | Supporting project              | Real capture available                                                                             |
| LAYA                                      | Android prerelease                      | Supporting project              | AR garden and balance-puzzle prototype; device verification pending                                |
| Waffle's Nine Lives                       | Android MVP                             | Supporting project              | Top-down action roguelike with rooms, enemies and nine lives                                       |
| [Art Gallery](art-gallery/index.html)     | Experiment, work remains                | Explore application             | Interactive gallery with Firebase/Firestore features; Firestore rules still require console review; Cloud Firestore is used separately from Portfolio Hub hosting |
| [CyberDefender](cyberdefender/index.html) | Web reimagining                         | Explore application             | Web reimagining of the original Godot prototype                                                    |
| [Sandbox](sandbox/index.html)             | Experiment                              | Explore application             | Falling-sand and cellular-automata simulation; media and evidence pending                          |
| [DevPath](devpath/index.html)             | Development paused                      | App 06 (conceptually)           | Architecture and decision-graph prototype; broader domains are incomplete; CRT catalog integration pending |

UDM-RADAR and StudyQuest are represented here through descriptions and evidence. Their full runnable systems live in their own repositories, so this repository does not independently verify their internal implementation. These entries do not claim live institutional deployment or the use of real student records.

DevPath is paused, not abandoned. Its existing documentation and prototype are preserved for a later stage.

## Hosting history and current direction

These are separate facts and should not be combined into one claim.

**Hosting history.** Portfolio Hub was hosted on a Windows Azure VM using IIS. That is where the project was developed and served from during that period, and it is not a permanent hosting commitment.

**Current direction.** The **Professional View** is live on Vercel at `https://www.jendrick.dev`. A repository-root [vercel.json](vercel.json) configuration maps `/` to `professional/index.html`, `/professional/` to `/` (`308`), `/explore/` to `explore/index.html`, and all Explore sub-app routes (`/art-gallery/`, `/cyberdefender/`, `/sandbox/`, `/devpath/`, and temporarily compatible `/portfolio/`). Live multi-route availability activates after merging PR C and updating the Vercel dashboard Root Directory from `professional` to repository root.

**Firebase / Cloud Firestore.** Firebase Authentication and Cloud Firestore are associated with the Enuhri Art Gallery experiment. They are separate cloud services, not the hosting platform for Portfolio Hub, and they are not part of the Azure or IIS hosting history.

## Repository structure

```text
professional/      Professional View (served at / via vercel.json rewrites)
explore/           CRT Explore Hub (served at /explore/)
portfolio/         Legacy HCI portfolio application (temporary compatibility until PR D retirement)
art-gallery/       Enuhri Art Gallery (Firebase Authentication / Firestore)
cyberdefender/     CyberDefender web reimagining
sandbox/           Falling-sand simulation experiment
devpath/           DevPath decision-graph prototype (paused)
assets/            Shared sprites and previews for /explore/
vercel.json        Repository-root rewrites and /professional/ -> / redirect
docs/              Documentation and handoff notes
```

`professional/` remains self-contained (with its own HTML, CSS, JavaScript, fonts, résumé, and evidence assets), and `vercel.json` rewrites root asset requests cleanly to `professional/`.

## Local development

Serve files over HTTP — not `file://` — so that PDF download and dialog behaviour match a real host.

```text
cd professional
py -m http.server 8848 --bind 127.0.0.1
```

If `py` is unavailable, use `python -m http.server 8848 --bind 127.0.0.1`.

Then open `http://127.0.0.1:8848/index.html`.

Keep the terminal open while testing and press `Ctrl+C` to stop. This is a local development address, not a production URL. There is no build step and no dependency install for the static frontend.

To view the Explore hub locally, serve from the repository root (note that plain `http.server` serves `explore/` at `/explore/` without `vercel.json` root rewrites for `/`):

```text
py -m http.server 8080 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8080/explore/`.

DevPath keeps its own data and engine checks, which require Node.js:

```bash
node devpath/tests/validate_graph.mjs
node devpath/tests/test_graph_engine.mjs
```

## Privacy and evidence boundaries

Public repository content excludes phone number, home address, student ID, real student records, Airtable credentials, API secrets, private QA assessment instructions, private test recordings, private Drive links, the original full-resolution portrait, and employer assessment credentials.

Where relevant:

- public project reconstructions use fictional records;
- the résumé PDF is phone-free;
- screenshots, certificates, and galleries stay deferred while privacy or evidence review is incomplete.

Ignore patterns are not a security boundary. Firestore rules and cloud configuration require separate review; their absence from this repository does not establish that they are safe.

## Roadmap

1. Merge PR C and switch the Vercel project Root Directory from `professional` to repository root so `/`, `/explore/`, `/professional/`, and sub-apps match production expectations.
2. Integrate Sandbox, DevPath (`paused prototype`), and featured case-study links into the `/explore/` CRT catalog, and retire the temporary `portfolio/` directory (PR D).
3. Polish Explore mobile layout, keyboard focus, and reduced-motion behavior (PR E).
4. Complete final cross-browser, physical-device, accessibility, privacy, and production QA.

## Known limitations

- Firestore security rules for the Art Gallery cloud database are managed in Firebase Console and remain unverified in this repository.
- Explore sub-apps (`/explore/`, `/sandbox/`, `/devpath/`) are not yet publicly reachable on `https://www.jendrick.dev` until PR C merges and Vercel's Root Directory is switched from `professional` to repository root.
- CRT Hub sound remains intentionally removed until Web Audio cues are implemented in a later pass.
- Comprehensive mobile, cross-browser, and physical-device testing remains pending.

## Development context

Created by **Jendrick / Enuhri**, a BSIT student at Universidad de Manila. The work reflects continuing learning in UI/UX, front-end development, systems integration, and testing, using iterative prototyping and substantial AI assistance. Implemented work should be credited accurately without implying senior engineering expertise or wholly independent implementation.

Existing projects and assets remain preserved. For earlier audit and handoff material, see [docs/README_UPDATE_HANDOFF.md](docs/README_UPDATE_HANDOFF.md) and [docs/README_UPDATE_OUTPUT_REPORT.md](docs/README_UPDATE_OUTPUT_REPORT.md).

## License or usage note

No license file is currently included in this repository, and this README does not assign a license. For reuse questions or asset permissions, contact the owner.
