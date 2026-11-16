# Enuhri Portfolio Hub

Jendrick / Enuhri's personal portfolio repository. It holds two related experiences for the same person and body of work:

- **[Professional](professional/index.html)** — the primary hiring-facing portfolio under `professional/`.
- **Explore** — the retro CRT / old-computer experience at the repository root, containing legacy work, experiments, and app-like project presentations.

A root Professional/Explore chooser does not exist yet. Visitors reach Professional by its direct path.

This is a student portfolio built through iterative, AI-assisted development. It is published as a working portfolio, not as production software: some projects are functional, some are experiments, and some are presented through descriptions rather than runnable code.

## Status

| Area                               | Status                | Notes                                                      |
| ---------------------------------- | --------------------- | ---------------------------------------------------------- |
| Professional View                  | Implemented           | Primary hiring-facing portfolio; public deployment pending |
| Public résumé viewing              | Implemented           | Same-page dialog with Fit page and zoom controls           |
| Résumé PDF download                | Implemented           | Direct same-origin download, no navigation away            |
| Light and Dark themes              | Implemented           | Both themes across the Professional View                   |
| Profile and project-linked Toolkit | Implemented           | Capabilities tied to project evidence                      |
| Featured project reconstructions   | Implemented           | Presented from shipped evidence and screenshots            |
| Explore (CRT Hub)                  | Implemented / partial | Preserved legacy and experimental experience               |
| Static hosting migration           | Planned               | Vercel is the likely provider for the Professional View    |
| Custom domain and Name.com DNS     | Pending               | Not yet connected                                          |
| Screenshot galleries               | Deferred              | Waiting on safe media                                      |
| Achievements and Credentials       | Deferred              | Waiting on verified evidence                               |
| Explore refinement                 | Pending               | One application at a time                                  |

Pull requests #3 (theme and profile system) and #4 (public résumé viewer and download) are merged. Deployment is **not** complete — this repository should not be described as live until it is independently verified.

Status labels used here: **Implemented** — supported by code and runtime checks; **Partial / Experimental** — incomplete or not fully verified; **Planned** — agreed but not built; **Paused** — development intentionally stopped; **Deferred** — waiting on evidence or media; **Legacy** — retained older work.

## Professional View

The Professional View is a single page covering Intro, Profile with a formal portrait, a public one-page résumé, a project-linked Toolkit, featured projects, project reconstructions, Capabilities, Journey, and Contact. It supports Light and Dark themes.

Résumé behaviour:

- **View résumé** opens a same-page dialog with an image preview of page 1.
- The dialog offers Fit page, zoom in and out, and Reset, with keyboard shortcuts.
- **Download PDF** saves the file directly without leaving the portfolio.
- **Open PDF in browser** is the only action that intentionally opens the browser's PDF viewer.

The public résumé PDF is available at [Jendrick_Coniconde_Resume.pdf](professional/assets/resume/Jendrick_Coniconde_Resume.pdf) and is phone-free.

The Toolkit describes capabilities with project references rather than a bare skills list, and the Quality & Direction shelf reflects work from a junior QA practical assessment.

## Explore

The root of the repository is the CRT Hub: a retro computer interface, boot sequence, and application menu that launches the projects below. It is preserved as a legacy HCI project and an experimental surface, and it is not the primary professional presentation.

## Projects

| Project                                   | Status                                  | Portfolio role                  | Notes                                                                                              |
| ----------------------------------------- | --------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------- |
| Professional Portfolio                    | Implemented                             | Primary hiring-facing portfolio | Public deployment pending                                                                          |
| UDM-RADAR                                 | Functional capstone system              | Featured project                | Synthetic academic data; decision-tree-regressor projections are advisory and support human review |
| StudyQuest                                | Functional team project                 | Featured project                | Course, assessment, learning-path, and progress workflows                                          |
| Mini PCS                                  | Completed practical-assessment workflow | Featured project                | Airtable-backed implementation; public reconstruction uses fictional records                       |
| Audiary                                   | Supporting personal project             | Supporting project              | Real capture available                                                                             |
| LAYA                                      | Android prerelease                      | Supporting project              | AR garden and balance-puzzle prototype; device verification pending                                |
| Waffle's Nine Lives                       | Android MVP                             | Supporting project              | Top-down action roguelike with rooms, enemies and nine lives                                       |
| [Art Gallery](art-gallery/index.html)     | Experiment, work remains                | Explore application             | Interactive gallery with Firebase/Firestore features; security and rendering work remains; Cloud Firestore is used separately from Portfolio Hub hosting |
| [CyberDefender](cyberdefender/index.html) | Web reimagining                         | Explore application             | Web reimagining of the original Godot prototype                                                    |
| [Sandbox](sandbox/index.html)             | Experiment                              | Explore application             | Falling-sand and cellular-automata simulation; media and evidence pending                          |
| [DevPath](devpath/index.html)             | Development paused                      | App 06                          | Architecture and decision-graph prototype; broader domains are incomplete                          |

UDM-RADAR and StudyQuest are represented here through descriptions and evidence. Their full runnable systems live in their own repositories, so this repository does not independently verify their internal implementation. These entries do not claim live institutional deployment or the use of real student records.

DevPath is paused, not abandoned. Its existing documentation and prototype are preserved for a later stage.

## Hosting history and current direction

These are separate facts and should not be combined into one claim.

**Hosting history.** Portfolio Hub was hosted on a Windows Azure VM using IIS. That is where the project was developed and served from during that period, and it is not a permanent hosting commitment.

**Current direction.** The move is toward static hosting, with Vercel the likely provider for the Professional View. A custom domain and Name.com DNS setup remain pending. Deployment is not complete unless verified.

**Firebase / Cloud Firestore.** Firebase Authentication and Cloud Firestore are associated with the Enuhri Art Gallery experiment. They are separate cloud services, not the hosting platform for Portfolio Hub, and they are not part of the Azure or IIS hosting history.

## Repository structure

```text
professional/      Professional View (primary hiring-facing portfolio)
portfolio/         Legacy HCI portfolio application
art-gallery/       Enuhri Art Gallery (Firebase Authentication / Firestore)
cyberdefender/     CyberDefender web reimagining
sandbox/           Falling-sand simulation experiment
devpath/           DevPath decision-graph prototype (paused)
assets/            Shared assets for the Explore root
docs/              Documentation and handoff notes
```

The Explore root also carries the CRT Hub entry page and shared assets. `professional/` is self-contained, with its own HTML, CSS, JavaScript, and assets.

## Local development

Serve files over HTTP — not `file://` — so that PDF download and dialog behaviour match a real host.

```text
cd professional
py -m http.server 8848 --bind 127.0.0.1
```

If `py` is unavailable, use `python -m http.server 8848 --bind 127.0.0.1`.

Then open `http://127.0.0.1:8848/index.html`.

Keep the terminal open while testing and press `Ctrl+C` to stop. This is a local development address, not a production URL. There is no build step and no dependency install for the static frontend.

To view the Explore root instead, serve from the repository root:

```text
py -m http.server 8080 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8080/index.html`.

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

1. Deploy the Professional View to Vercel and connect the Name.com domain.
2. Add the Professional/Explore chooser.
3. Refine Explore applications one at a time.
4. Add project screenshot galleries when safe media is available.
5. Add Achievements and Credentials when verified evidence is ready.
6. Replace remaining "No capture yet" entries with genuine media.
7. Complete final cross-browser, physical-device, accessibility, privacy, and production QA.

## Known limitations

- Explore applications carry documented defects that have not been fixed, including unsafe HTML rendering paths in the Art Gallery and unverified Firestore rules.
- The legacy `portfolio/` application has a contact form without a sending handler.
- The CRT Hub has placeholder controls that are not fully wired.
- Comprehensive mobile, cross-browser, and physical-device testing remains pending.

## Development context

Created by **Jendrick / Enuhri**, a BSIT student at University of Makati. The work reflects continuing learning in UI/UX, front-end development, systems integration, and testing, using iterative prototyping and substantial AI assistance. Implemented work should be credited accurately without implying senior engineering expertise or wholly independent implementation.

Existing projects and assets remain preserved. For earlier audit and handoff material, see [docs/README_UPDATE_HANDOFF.md](docs/README_UPDATE_HANDOFF.md) and [docs/README_UPDATE_OUTPUT_REPORT.md](docs/README_UPDATE_OUTPUT_REPORT.md).

## License or usage note

No license file is currently included in this repository, and this README does not assign a license. For reuse questions or asset permissions, contact the owner.
