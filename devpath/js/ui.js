/**
 * DEVPATH // UI Controller & DOM Orchestrator
 * Manages live architecture breadcrumbs, theme switcher, step-back navigation,
 * and toast feedback. Confirmation drawers are eliminated; the graph is the UI.
 */

export class UiController {
  constructor() {
    this.themeButtons = [];
    this.toastContainer = null;
    this.btnBack = null;
    this.stageBadgeText = null;
    this.breadcrumb = null;
    this.onThemeSelect = null;
    this.backClickHandler = null;
  }

  init(options = {}) {
    this.onThemeSelect = options.onThemeSelect || (() => {});
    this.onReset = options.onReset || null;
    this.themeButtons = Array.from(document.querySelectorAll(".theme-btn"));
    this.toastContainer = document.getElementById("bp-toast-container");
    this.btnBack = document.getElementById("bp-btn-back");
    this.stageBadgeText = document.getElementById("bp-stage-badge-text");
    this.breadcrumb = document.getElementById("bp-breadcrumb");

    // Bind theme switcher clicks
    this.themeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTheme = btn.getAttribute("data-theme");
        if (targetTheme) {
          this.onThemeSelect(targetTheme);
        }
      });
    });

    // Bind back button click
    if (this.btnBack) {
      this.btnBack.addEventListener("click", () => {
        if (typeof this.backClickHandler === "function") {
          this.backClickHandler();
        }
      });
    }

    this.bindRoadmapControls();
  }

  /**
   * Wires the graph-first navigation controls: prev/next branch arrows,
   * spine stepping, and reset. These drive camera movement rather than
   * page navigation, so the roadmap is never shrunk to fit.
   */
  bindRoadmapControls() {
    const wire = (id, handler) => {
      const el = document.getElementById(id);
      if (el && typeof handler === "function") {
        el.addEventListener("click", e => {
          e.preventDefault();
          handler();
        });
      }
    };

    const app = () => window.DevPath;
    wire("nav-prev-branch", () => app()?.prevBranch?.());
    wire("nav-next-branch", () => app()?.nextBranch?.());
    wire("nav-prev-step", () => app()?.app?.navigateSpine?.(-1));
    wire("nav-next-step", () => app()?.app?.navigateSpine?.(1));
    wire("nav-fit", () => app()?.app?.camera?.fitBounds?.(app()?.app?.layout?.getBounds?.(), 60));
    wire("nav-reset", () => (this.onReset ? this.onReset() : app()?.reset?.()));
  }

  /** Compact roadmap badge: choice count + remaining frontier. */
  setStageBadge(label, detail) {
    if (!this.stageBadgeText) return;
    this.stageBadgeText.innerHTML =
      `<span class="badge-stage">${label}</span><span class="badge-sep"> — </span><span class="badge-label">${detail}</span>`;
  }

  /** Shows which project type the roadmap is rooted in. */
  setProjectType(title) {
    const el = document.getElementById("bc-type-name");
    const sep = document.getElementById("bc-sep-type");
    if (!el || !sep) return;
    if (title) {
      sep.style.display = "inline";
      el.style.display = "inline";
      el.textContent = title.toUpperCase();
    } else {
      sep.style.display = "none";
      el.style.display = "none";
    }
  }

  /**
   * Renders the committed path as the breadcrumb, so the user can see
   * the roadmap they've built without hunting for it on the canvas.
   */
  updatePathBreadcrumb(spine = []) {
    const el = document.getElementById("bc-focus-names");
    const sep = document.getElementById("bc-sep-focus");
    if (!el || !sep) return;
    if (spine.length === 0) {
      sep.style.display = "none";
      el.style.display = "none";
      el.textContent = "";
      return;
    }
    sep.style.display = "inline";
    el.style.display = "inline";
    el.textContent = spine.map(n => n.title).join(" \u25b8 ").toUpperCase();
  }

  updateThemeSwitcher(activeTheme) {
    this.themeButtons.forEach(btn => {
      const isCurrent = btn.getAttribute("data-theme") === activeTheme;
      btn.classList.toggle("active", isCurrent);
      btn.setAttribute("aria-checked", isCurrent ? "true" : "false");
    });
  }

  showBackButton(label = "← STEP BACK", onClick = null) {
    if (!this.btnBack) return;
    this.btnBack.style.display = "inline-flex";
    const span = this.btnBack.querySelector("span");
    if (span) span.textContent = label;
    this.backClickHandler = onClick;
  }

  hideBackButton() {
    if (!this.btnBack) return;
    this.btnBack.style.display = "none";
    this.backClickHandler = null;
  }

  updateStageBadge(stageNumber, totalStages = 7, stageLabel = "PROJECT NAME", derivedIndicator = null) {
    if (!this.stageBadgeText) return;
    const stageStr = String(stageNumber).padStart(2, "0");
    const totalStr = String(totalStages).padStart(2, "0");
    const derivedHtml = derivedIndicator ? `<span class="badge-sep"> · </span><span class="badge-derived">${derivedIndicator}</span>` : "";
    this.stageBadgeText.innerHTML = `<span class="badge-stage">STAGE ${stageStr} / ${totalStr}</span><span class="badge-sep"> — </span><span class="badge-label">${stageLabel}</span>${derivedHtml}`;
  }

  /**
   * Updates the live architectural breadcrumb in the topbar:
   * BUILDING: cram.io ▸ WEBSITE ▸ INTERACTIVE · EDUCATIONAL ▸ FULL-STACK WEB APP ▸ CLOUD
   */
  updateBreadcrumb(data = {}) {
    const projEl = document.getElementById("bc-project-name");
    const sepType = document.getElementById("bc-sep-type");
    const typeEl = document.getElementById("bc-type-name");
    const sepFocus = document.getElementById("bc-sep-focus");
    const focusEl = document.getElementById("bc-focus-names");
    const sepArch = document.getElementById("bc-sep-arch");
    const archEl = document.getElementById("bc-arch-name");
    const sepStack = document.getElementById("bc-sep-stack");
    const stackEl = document.getElementById("bc-stack-names");
    const sepInfra = document.getElementById("bc-sep-infra");
    const infraEl = document.getElementById("bc-infra-names");

    if (projEl) {
      projEl.textContent = data.projectName || "PROJECT";
    }

    if (sepType && typeEl) {
      if (data.type) {
        sepType.style.display = "inline";
        typeEl.style.display = "inline";
        typeEl.textContent = data.type.toUpperCase();
      } else {
        sepType.style.display = "none";
        typeEl.style.display = "none";
      }
    }

    if (sepFocus && focusEl) {
      if (data.focusTitles && data.focusTitles.length > 0) {
        sepFocus.style.display = "inline";
        focusEl.style.display = "inline";
        focusEl.textContent = data.focusTitles.join(" · ").toUpperCase();
      } else {
        sepFocus.style.display = "none";
        focusEl.style.display = "none";
      }
    }

    if (sepArch && archEl) {
      if (data.architecturePath) {
        sepArch.style.display = "inline";
        archEl.style.display = "inline";
        archEl.textContent = data.architecturePath.toUpperCase();
      } else {
        sepArch.style.display = "none";
        archEl.style.display = "none";
      }
    }

    if (sepStack && stackEl) {
      if (data.stackTitles && data.stackTitles.length > 0) {
        sepStack.style.display = "inline";
        stackEl.style.display = "inline";
        stackEl.textContent = data.stackTitles.join(" · ").toUpperCase();
      } else {
        sepStack.style.display = "none";
        stackEl.style.display = "none";
      }
    }

    if (sepInfra && infraEl) {
      if (data.infraTitles && data.infraTitles.length > 0) {
        sepInfra.style.display = "inline";
        infraEl.style.display = "inline";
        infraEl.textContent = data.infraTitles.join(" · ").toUpperCase();
      } else {
        sepInfra.style.display = "none";
        infraEl.style.display = "none";
      }
    }
  }

  showNodeInspector(node, onClose = null) {
    let modal = document.getElementById("bp-inspector-modal");
    if (!modal) return;

    let depsHtml = "";
    if (Array.isArray(node.dependencies) && node.dependencies.length > 0) {
      depsHtml = `
        <div class="bp-inspector-section">
          <h4 class="bp-section-title">TECHNICAL PREREQUISITES &amp; DEPENDENCIES</h4>
          <div class="bp-pill-list">
            ${node.dependencies.map(d => `<span class="bp-dep-pill">${d}</span>`).join("")}
          </div>
        </div>
      `;
    }

    let exclusionsHtml = "";
    if (Array.isArray(node.exclusions) && node.exclusions.length > 0) {
      exclusionsHtml = `
        <div class="bp-inspector-section">
          <h4 class="bp-section-title">EXCLUSIONS / INCOMPATIBLE</h4>
          <div class="bp-pill-list">
            ${node.exclusions.map(ex => `<span class="bp-excl-pill">${ex}</span>`).join("")}
          </div>
        </div>
      `;
    }

    let altsHtml = "";
    if (Array.isArray(node.alternatives) && node.alternatives.length > 0) {
      altsHtml = `
        <div class="bp-inspector-section">
          <h4 class="bp-section-title">ALTERNATIVES CONSIDERED (${node.alternatives.length})</h4>
          <div class="bp-alt-list">
            ${node.alternatives.map(a => `
              <div class="bp-alt-item">
                <span class="bp-alt-name">${a.title || a.name || a.id}</span>
                <span class="bp-alt-desc">${a.tagline || a.category || ""}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    let modulesHtml = "";
    if (node.expansionSubtree && Array.isArray(node.expansionSubtree.modules) && node.expansionSubtree.modules.length > 0) {
      modulesHtml = `
        <div class="bp-inspector-section">
          <h4 class="bp-section-title">${node.expansionSubtree.title || "ARCHITECTURAL SUBSYSTEMS"}</h4>
          <div class="bp-module-list">
            ${node.expansionSubtree.modules.map(m => `
              <div class="bp-module-item">
                <span class="bp-module-name">${m.title || m.name || m.id}</span>
                <span class="bp-module-cat">${m.category || "MODULE"}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    let whyHtml = "";
    if (node.whyConsider) {
      whyHtml = `
        <div class="bp-inspector-section bp-inspector-why">
          <h4 class="bp-section-title">WHY CONSIDER THIS?</h4>
          <p class="bp-why-text">${node.whyConsider}</p>
        </div>
      `;
    }

    let crossLinksHtml = "";
    if (Array.isArray(node.crossLinks) && node.crossLinks.length > 0) {
      crossLinksHtml = `
        <div class="bp-inspector-section">
          <h4 class="bp-section-title">CONNECTED IDEAS &amp; DATA FLOWS</h4>
          <div class="bp-cross-link-list">
            ${node.crossLinks.map(cl => `
              <div class="bp-cross-item">
                <span class="bp-cross-rel">${cl.relationship.toUpperCase()}</span>
                <span class="bp-cross-target">${cl.toNodeId}</span>
                <span class="bp-cross-label">${cl.label || ""}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="bp-inspector-card">
        <div class="bp-inspector-header">
          <div class="bp-inspector-meta">
            <div class="bp-inspector-badges">
              <span class="bp-inspector-category">${node.category || "NODE SPECIFICATION"}</span>
              ${node.nodeRole ? `<span class="bp-role-badge role-${node.nodeRole}">${node.nodeRole.toUpperCase()}</span>` : ""}
            </div>
            <h3 class="bp-inspector-title">${node.title}</h3>
          </div>
          <button type="button" class="bp-inspector-close" aria-label="Close Inspector">✕</button>
        </div>
        <div class="bp-inspector-body">
          <p class="bp-inspector-tagline">${node.tagline || ""}</p>
          <p class="bp-inspector-desc">${node.description || "Architectural decision locked into manifest."}</p>
          <div class="bp-inspector-details">
            <div class="bp-detail-item"><span class="bp-detail-key">NODE ID:</span> <span class="bp-detail-val">${node.id}</span></div>
            <div class="bp-detail-item"><span class="bp-detail-key">TYPE:</span> <span class="bp-detail-val">${node.type || "choice"}</span></div>
            <div class="bp-detail-item"><span class="bp-detail-key">ROLE:</span> <span class="bp-detail-val">${(node.nodeRole || "decision").toUpperCase()}</span></div>
            <div class="bp-detail-item"><span class="bp-detail-key">STATUS:</span> <span class="bp-detail-val">${node.status || "locked"}</span></div>
          </div>
          ${whyHtml}
          ${depsHtml}
          ${exclusionsHtml}
          ${altsHtml}
          ${modulesHtml}
          ${crossLinksHtml}
        </div>
      </div>
    `;

    modal.style.display = "flex";

    const closeBtn = modal.querySelector(".bp-inspector-close");
    const handleClose = () => {
      this.hideNodeInspector();
      if (typeof onClose === "function") onClose();
    };

    if (closeBtn) {
      closeBtn.addEventListener("click", handleClose);
    }

    modal.onclick = (e) => {
      if (e.target === modal) handleClose();
    };
  }

  hideNodeInspector() {
    const modal = document.getElementById("bp-inspector-modal");
    if (modal) {
      modal.style.display = "none";
      modal.innerHTML = "";
    }
  }

  showInputError(msg) {
    const errorEl = document.getElementById("bp-input-error");
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add("active");
    }
  }

  clearInputError() {
    const errorEl = document.getElementById("bp-input-error");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("active");
    }
  }

  setProjectConfigured(name, theme = "blueprint") {
    this.clearInputError();
    const input = document.getElementById("bp-project-name-input");
    const beginBtn = document.getElementById("bp-btn-begin");

    if (input) {
      input.setAttribute("disabled", "true");
      input.value = name;
    }

    if (beginBtn) {
      beginBtn.setAttribute("disabled", "true");
      const span = beginBtn.querySelector("span");
      if (span) {
        span.textContent = "LOCKED ✓";
      }
    }

    this.updateBreadcrumb({ projectName: name });
    const toastMsg = `DevPath: Project initialized "${name}"`;
    this.notify(toastMsg, "success");
  }

  notify(message, type = "info") {
    if (!this.toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `bp-toast bp-toast--${type}`;
    toast.setAttribute("role", "alert");
    toast.textContent = message;

    this.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("active");
    });

    setTimeout(() => {
      toast.classList.remove("active");
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Backward compatibility stubs for old wizard callers
  showSelectionPanel() {}
  hideSelectionPanel() {}
}

export const ui = new UiController();
