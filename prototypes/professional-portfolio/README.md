# Professional Portfolio — Static Visual Prototype (Concept v1)

> **Document Status**: Prototype Preservation Only  
> **Source Concept**: Codex visualization (`professional-portfolio-concept.html`)  
> **Preserved File**: [`concept-v1.html`](./concept-v1.html)

---

## 1. Purpose & Scope

This directory preserves an exploratory static visual concept generated during design prototyping.

- **Static Visual Concept**: This is an unmerged design prototype preserved strictly for design auditing, aesthetic comparison, and layout evaluation.
- **Not Production**: This is **not** the production Professional View or a live deployment.
- **Provisional Content**: All copy, biographical details, imagery, project claims, credentials, links, typography, and branding in this prototype are provisional and remain subject to owner review and factual verification.
- **Do Not Treat as Verified Public Content**: Descriptions and metrics within the prototype must not be cited as verified portfolio accomplishments.
- **Live Portfolio Hub Unchanged**: The repository's primary Portfolio Hub ([`index.html`](../../index.html)), CRT shell, and existing applications remain completely unchanged.
- **Mobile & Accessibility Requirements**: Mobile-responsive layouts and `prefers-reduced-motion` alternatives remain required for any future production implementation.

---

## 2. Visual Architecture of Concept v1

Concept v1 demonstrates an editorial, print-inspired design language characterized by:
- **Palette**: Warm off-white paper background (`#f4f0e7`), deep charcoal ink (`#202621`), muted pine green accents (`#285344`), and pale sage structural borders (`#c7cdc0`).
- **Typography**: Editorial serif headings (`Palatino Linotype`, `Georgia`), clean sans-serif body text (`Trebuchet MS`), and monospace technical kickers (`Consolas`).
- **Section-Local Progress**: Sticky top navigation (`About`, `Work`, `Capabilities`, `Journey`, `Contact`) with integrated scroll-percentage indicators on active tabs.
- **Sticky Evidence Viewport**: A two-column desktop work layout featuring a sticky evidence card alongside scrolling narrative project stories.
- **Featured Projects**: Initial story treatments for `UDM-RADAR`, `StudyQuest`, and `Mini PCS`.
- **Contact Layout**: High-contrast dark-green contact footer with direct communication channels.

---

## 3. Future Concept Exploration & Owner Direction

> [!NOTE]  
> The following notes represent an exploratory design direction and future research questions from the project owner. **They are not approved production specifications and are not implemented in this prototype package.**

### A. All-Project Overview
Following the introductory **About** section, the future Professional Portfolio may introduce a unified overview showing all projects together before diving into individual deep dives.

### B. Project Tiers & Scope
1. **Primary Featured Projects** (Full case studies with problem framing, architectural decisions, and verifiable evidence):
   - **UDM-RADAR** (Academic risk analytics & decision-support system)
   - **StudyQuest** (AI-assisted gamified syllabus learning platform)
   - **Mini PCS** (Production-control review prototype)
2. **Additional Projects for Later Consideration** (Compact summary cards rather than equal-length long-form panels):
   - **Audiary**
   - **LAYA**
   - **Waffle’s Nine Lives**

### C. Bounded Horizontal Narrative Research
- Following the project overview, a bounded **Work** section may translate standard vertical wheel/touch scrolling into a smooth horizontal progression across project stages.
- **Proposed Sequence**: `UDM-RADAR` → `StudyQuest` → `Mini PCS` → Compact Secondary Stories.
- **Navigation Ruler**: The sticky header's Work tab may feature a local progress ruler with discrete step markers for each project.
- **Responsive & Accessible Fallback**: On mobile devices or when `prefers-reduced-motion` is enabled, this behavior must gracefully fall back to a structured vertical stack.

---

## 4. Local Preview

To preview this prototype locally using any standard static HTTP server:

```bash
# From the repository root:
python -m http.server 8000
```

Then navigate in your browser to:
```text
http://localhost:8000/prototypes/professional-portfolio/concept-v1.html
```

*This prototype is completely self-contained (vanilla HTML, embedded CSS, vanilla JS) and requires no build tools, Node.js runtime, or external host wrappers.*
