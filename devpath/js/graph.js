/**
 * DEVPATH // Living SVG Graph Engine
 * Renders real-time interactive architecture nodes, animated Bézier growth lines,
 * parallel sibling focus branches, and branch retractions.
 * Supports dual-theme models: Blueprint CAD (precise) and Root (living biophilic).
 */

import { GraphLayout } from "./layout.js";
import { THEME_CONFIGS, PROJECT_TYPES } from "./data/projectTypes.js";
import { PROJECT_FOCUS } from "./data/projectFocus.js";
import { getPathIcon, getFocusIcon } from "./icons.js";
import { escapeHtml } from "./safeHtml.js";

export class SvgGraphEngine {
  constructor(svgElement, options = {}) {
    this.svg = svgElement;
    this.options = options;

    this.connectionsGroup = null;
    this.nodesGroup = null;
    this.bgRect = null;

    this.nodes = new Map();
    this.connections = [];

    this.activeTheme = options.theme || "blueprint";
    this.onNodeAction = options.onNodeAction || (() => {});
    this.onInputChange = options.onInputChange || (() => {});
  }

  init() {
    if (!this.svg) return;

    this.ensureSvgDefs();

    this.connectionsGroup = this.svg.querySelector(".connections");
    if (!this.connectionsGroup) {
      this.connectionsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.connectionsGroup.setAttribute("class", "connections");
      this.svg.appendChild(this.connectionsGroup);
    }

    this.nodesGroup = this.svg.querySelector(".nodes");
    if (!this.nodesGroup) {
      this.nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.nodesGroup.setAttribute("class", "nodes");
      this.svg.appendChild(this.nodesGroup);
    }
  }

  ensureSvgDefs() {
    let defs = this.svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      this.svg.prepend(defs);
    }

    defs.innerHTML = `
      <!-- THEME 1: Blueprint Technical CAD Grid -->
      <pattern id="grid-pattern-small" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(15, 25, 38, 0.5)" stroke-width="0.75" />
      </pattern>
      <pattern id="grid-pattern-large" width="64" height="64" patternUnits="userSpaceOnUse">
        <rect width="64" height="64" fill="url(#grid-pattern-small)" />
        <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(0, 240, 255, 0.08)" stroke-width="1.2" />
        <circle cx="64" cy="64" r="1.5" fill="rgba(0, 240, 255, 0.2)" />
        <circle cx="0" cy="0" r="1.5" fill="rgba(0, 240, 255, 0.2)" />
      </pattern>

      <!-- THEME 2: Root Organic Soil Strata / Living Fibers -->
      <pattern id="root-organic-pattern" width="120" height="120" patternUnits="userSpaceOnUse">
        <path d="M 0 30 Q 30 15, 60 30 T 120 30" fill="none" stroke="rgba(74, 222, 128, 0.06)" stroke-width="1.2" />
        <path d="M 0 70 Q 40 85, 80 70 T 120 70" fill="none" stroke="rgba(217, 119, 6, 0.05)" stroke-width="1.4" stroke-dasharray="4 4" />
        <path d="M 0 110 Q 35 95, 70 110 T 120 110" fill="none" stroke="rgba(74, 222, 128, 0.05)" stroke-width="1" />
        <path d="M 20 0 Q 35 45, 15 90 T 40 120" fill="none" stroke="rgba(180, 83, 9, 0.04)" stroke-width="1.6" />
        <path d="M 90 0 Q 80 50, 105 85 T 85 120" fill="none" stroke="rgba(52, 211, 153, 0.04)" stroke-width="1.2" />
        <circle cx="60" cy="30" r="1.5" fill="rgba(52, 211, 153, 0.16)" />
        <circle cx="80" cy="70" r="1.8" fill="rgba(217, 119, 6, 0.18)" />
      </pattern>
    `;

    this.bgRect = this.svg.querySelector(".canvas-grid-bg");
    if (!this.bgRect) {
      this.bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      this.bgRect.setAttribute("class", "canvas-grid-bg");
      this.bgRect.setAttribute("width", "10000");
      this.bgRect.setAttribute("height", "10000");
      this.bgRect.setAttribute("x", "-5000");
      this.bgRect.setAttribute("y", "-5000");
      this.svg.insertBefore(this.bgRect, this.svg.firstChild);
    }

    this.updateBackgroundPattern();
  }

  setTheme(theme) {
    this.activeTheme = theme;
    this.updateBackgroundPattern();
    this.refreshNodesForTheme();
    this.updateConnections();
  }

  updateBackgroundPattern() {
    if (!this.bgRect) return;
    const patternId = this.activeTheme === "root" ? "root-organic-pattern" : "grid-pattern-large";
    this.bgRect.setAttribute("fill", `url(#${patternId})`);
  }

  refreshNodesForTheme() {
    const themeConfig = THEME_CONFIGS[this.activeTheme] || THEME_CONFIGS.blueprint;

    this.nodes.forEach(node => {
      const nodeGroup = this.nodesGroup.querySelector(`[data-node-id="${node.id}"]`);
      if (!nodeGroup) return;

      if (node.type === "root") {
        const tagEl = nodeGroup.querySelector(".node-tag");
        const iconEl = nodeGroup.querySelector(".node-icon-symbol");
        const titleEl = nodeGroup.querySelector(".node-title");
        const subtitleEl = nodeGroup.querySelector(".node-subtitle");
        const inputEl = nodeGroup.querySelector("#bp-project-name-input");
        const submitBtn = nodeGroup.querySelector("#bp-btn-begin span");

        if (tagEl) tagEl.textContent = themeConfig.category;
        if (iconEl) iconEl.innerHTML = themeConfig.iconSvg;
        if (titleEl) titleEl.textContent = themeConfig.title;
        if (subtitleEl) subtitleEl.textContent = themeConfig.subtitle;
        if (inputEl) inputEl.setAttribute("placeholder", themeConfig.inputPlaceholder);
        if (submitBtn) {
          const isLocked = inputEl && inputEl.hasAttribute("disabled");
          submitBtn.textContent = isLocked ? "LOCKED ✓" : (themeConfig.buttonText || themeConfig.buttonLabel || "BUILD ARCHITECTURE");
        }
      } else if (node.type === "branch") {
        const iconEl = nodeGroup.querySelector(".branch-icon-symbol");
        const arrowEl = nodeGroup.querySelector(".branch-status-arrow");
        const themeIcon = this.activeTheme === "root" ? node.rootIconSvg : node.blueprintIconSvg;
        if (iconEl && themeIcon) iconEl.innerHTML = themeIcon;
        if (arrowEl) arrowEl.textContent = this.activeTheme === "root" ? "↗" : "▸";
      } else if (node.type === "focus-selected" || node.type === "focus-discovery") {
        const iconEl = nodeGroup.querySelector(".focus-node-icon");
        if (iconEl && node.data?.iconId) {
          iconEl.innerHTML = getFocusIcon(node.data.iconId, this.activeTheme);
        }
      } else if (node.type === "path") {
        const iconEl = nodeGroup.querySelector(".branch-icon-symbol");
        const arrowEl = nodeGroup.querySelector(".branch-status-arrow");
        if (iconEl) iconEl.innerHTML = getPathIcon(node.id, this.activeTheme);
        if (arrowEl) arrowEl.textContent = this.activeTheme === "root" ? "↗" : "▸";
      }
    });
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Creates an SVG node group and renders its foreignObject content.
   */
  createNode(nodeConfig) {
    const { id, type, x, y, width, height } = nodeConfig;
    this.nodes.set(id, { ...nodeConfig });

    let nodeGroup = this.nodesGroup.querySelector(`[data-node-id="${id}"]`);
    if (!nodeGroup) {
      nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeGroup.setAttribute("class", `graph-node graph-node--${type}`);
      nodeGroup.setAttribute("data-node-id", id);
      this.nodesGroup.appendChild(nodeGroup);
    }

    nodeGroup.setAttribute("transform", `translate(${x}, ${y})`);
    nodeGroup.style.opacity = "1";
    nodeGroup.style.pointerEvents = "auto";

    switch (type) {
      case "root":
        this.renderRootNodeContent(nodeGroup, nodeConfig);
        break;
      case "branch":
        this.renderBranchNodeContent(nodeGroup, nodeConfig);
        break;
      case "focus-selected":
        this.renderSelectedFocusNodeContent(nodeGroup, nodeConfig);
        break;
      case "focus-discovery":
        this.renderDiscoveryFocusNodeContent(nodeGroup, nodeConfig);
        break;
      case "growth-action":
        this.renderGrowthActionNodeContent(nodeGroup, nodeConfig);
        break;
      case "shuffle":
        this.renderShuffleNodeContent(nodeGroup, nodeConfig);
        break;
      case "path":
        this.renderPathNodeContent(nodeGroup, nodeConfig);
        break;
      case "tier-header":
        this.renderTierHeaderContent(nodeGroup, nodeConfig);
        break;
      case "stack-tech":
        this.renderStackTechContent(nodeGroup, nodeConfig);
        break;
      case "stack-ancestor":
        this.renderStackAncestorContent(nodeGroup, nodeConfig);
        break;
      case "infra-header":
        this.renderInfraHeaderContent(nodeGroup, nodeConfig);
        break;
      case "infra-card":
        this.renderInfraCardContent(nodeGroup, nodeConfig);
        break;
      case "blueprint-node":
        this.renderBlueprintNodeContent(nodeGroup, nodeConfig);
        break;
      case "choice":
        this.renderChoiceNodeContent(nodeGroup, nodeConfig);
        break;
      default:
        break;
    }

    // Trigger reveal materialization
    nodeGroup.classList.add("node-materialize");
    return nodeGroup;
  }

  updateNodePosition(nodeId, x, y) {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    node.x = x;
    node.y = y;

    const nodeGroup = this.nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeGroup) {
      nodeGroup.setAttribute("transform", `translate(${x}, ${y})`);
    }
  }

  setNodeVisibility(nodeId, visible) {
    const nodeGroup = this.nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeGroup) {
      nodeGroup.style.display = visible ? "" : "none";
      nodeGroup.style.opacity = visible ? "1" : "0";
      nodeGroup.style.pointerEvents = visible ? "auto" : "none";
    }
  }

  removeNode(nodeId, animate = true) {
    const nodeGroup = this.nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
    if (!nodeGroup) {
      this.nodes.delete(nodeId);
      return;
    }

    if (animate) {
      nodeGroup.style.transition = "opacity 0.28s ease";
      nodeGroup.style.opacity = "0";
      setTimeout(() => {
        if (nodeGroup.parentNode) nodeGroup.parentNode.removeChild(nodeGroup);
        this.nodes.delete(nodeId);
      }, 300);
    } else {
      if (nodeGroup.parentNode) nodeGroup.parentNode.removeChild(nodeGroup);
      this.nodes.delete(nodeId);
    }

    // Remove associated connections
    this.removeConnectionsForNode(nodeId);
  }

  /**
   * Root Node Content (Stage 1 project name input / locked state)
   */
  renderRootNodeContent(nodeGroup, node) {
    const themeConfig = THEME_CONFIGS[this.activeTheme] || THEME_CONFIGS.blueprint;
    const iconSvg = themeConfig.iconSvg;

    nodeGroup.innerHTML = `
      <rect class="node-card-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <path class="node-corner-mark" d="M 0 12 L 0 0 L 12 0"></path>
      <path class="node-corner-mark" d="M ${node.width - 12} 0 L ${node.width} 0 L ${node.width} 12"></path>
      <path class="node-corner-mark" d="M 0 ${node.height - 12} L 0 ${node.height} L 12 ${node.height}"></path>
      <path class="node-corner-mark" d="M ${node.width - 12} ${node.height} L ${node.width} ${node.height} L ${node.width} ${node.height - 12}"></path>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="node-card-inner root-node-inner" xmlns="http://www.w3.org/1999/xhtml">
          <div class="node-header">
            <div class="node-header-meta">
              <span class="node-tag">${themeConfig.category}</span>
              <span class="node-icon-symbol">${iconSvg}</span>
            </div>
            <h2 class="node-title">${themeConfig.title}</h2>
            <p class="node-subtitle">${themeConfig.subtitle}</p>
          </div>

          <form class="node-form" onsubmit="return false;">
            <div class="node-field-label">
              <span>PROJECT NAME</span>
              <span id="bp-char-counter" class="node-field-counter">0 / 40</span>
            </div>
            <div class="bp-input-wrap">
              <input type="text"
                     id="bp-project-name-input"
                     class="bp-input"
                     placeholder="${themeConfig.inputPlaceholder}"
                     maxlength="40"
                     autocomplete="off"
                     spellcheck="false" />
              <button type="submit" id="bp-btn-begin" class="bp-btn bp-btn--primary">
                <span>${themeConfig.buttonText || themeConfig.buttonLabel || "BUILD ARCHITECTURE"}</span>
              </button>
            </div>
            <div id="bp-input-error" class="bp-input-error-msg" aria-live="polite"></div>
          </form>
        </div>
      </foreignObject>
    `;

    const input = nodeGroup.querySelector("#bp-project-name-input");
    const counter = nodeGroup.querySelector("#bp-char-counter");
    const form = nodeGroup.querySelector(".node-form");

    if (input) {
      input.addEventListener("input", (e) => {
        const val = e.target.value;
        if (counter) counter.textContent = `${val.length} / 40`;
        this.onInputChange(val);
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = input ? input.value : "";
        this.onNodeAction("submit-project-name", node, val);
      });
    }
  }

  /**
   * Branch Node Content (Project Types: Website, Game, Software)
   */
  renderBranchNodeContent(nodeGroup, node) {
    const iconSvg = this.activeTheme === "root" ? node.rootIconSvg : node.blueprintIconSvg;
    const arrowSymbol = this.activeTheme === "root" ? "↗" : "▸";

    nodeGroup.innerHTML = `
      <rect class="node-card-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <path class="node-corner-mark" d="M 0 10 L 0 0 L 10 0"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} 0 L ${node.width} 0 L ${node.width} 10"></path>
      <path class="node-corner-mark" d="M 0 ${node.height - 10} L 0 ${node.height} L 10 ${node.height}"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} ${node.height} L ${node.width} ${node.height} L ${node.width} ${node.height - 10}"></path>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="branch-card-inner" xmlns="http://www.w3.org/1999/xhtml" tabindex="0" role="button" aria-pressed="false">
          <div class="branch-header">
            <span class="node-tag">${node.category}</span>
            <span class="branch-icon-symbol">${iconSvg || ""}</span>
          </div>
          <div class="branch-body">
            <h3 class="branch-node-title">${node.title}</h3>
            <p class="branch-tagline">${node.tagline}</p>
            <p class="branch-desc">${node.description}</p>
          </div>
          <div class="branch-footer">
            <span class="branch-status-label">SELECT TYPE</span>
            <span class="branch-status-arrow">${arrowSymbol}</span>
          </div>
        </div>
      </foreignObject>
    `;

    const card = nodeGroup.querySelector(".branch-card-inner");
    if (card) {
      card.addEventListener("click", () => {
        this.onNodeAction("select-branch", node);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onNodeAction("select-branch", node);
        }
      });
    }
  }

  /**
   * Parallel Selected Focus Node (Permanent Sibling Node)
   */
  renderSelectedFocusNodeContent(nodeGroup, node) {
    const iconSvg = getFocusIcon(node.iconId || node.data?.iconId, this.activeTheme);
    const isCompact = node.isCompact || node.width < 170;

    nodeGroup.innerHTML = `
      <rect class="node-card-bg focus-selected-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="focus-selected-card ${isCompact ? "compact" : ""}" xmlns="http://www.w3.org/1999/xhtml" tabindex="0" role="button" title="${node.title} (tap to deselect)">
          <div class="focus-node-icon">${iconSvg}</div>
          <div class="focus-node-info">
            ${isCompact ? "" : `<span class="focus-node-tag">FOCUS CHARACTERISTIC</span>`}
            <h4 class="focus-node-title">${node.title}</h4>
          </div>
          ${isCompact
            ? `<span class="focus-node-check" aria-hidden="true">✓</span>`
            : `<button type="button" class="focus-remove-btn" title="Remove ${node.title}">✕</button>
               <span class="focus-node-check">✓</span>`}
        </div>
      </foreignObject>
    `;

    const removeBtn = nodeGroup.querySelector(".focus-remove-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onNodeAction("remove-focus-item", node);
      });
    }

    const card = nodeGroup.querySelector(".focus-selected-card");
    if (card) {
      card.addEventListener("click", () => {
        this.onNodeAction("remove-focus-item", node);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onNodeAction("remove-focus-item", node);
        }
      });
    }
  }

  /**
   * Available Discovery Focus Branch Node (5 options sprouting below)
   */
  renderDiscoveryFocusNodeContent(nodeGroup, node) {
    const iconSvg = getFocusIcon(node.iconId || node.data?.iconId, this.activeTheme);
    const isCompact = node.isCompact;

    nodeGroup.innerHTML = `
      <rect class="node-card-bg focus-discovery-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="focus-discovery-card ${isCompact ? "compact" : ""}" xmlns="http://www.w3.org/1999/xhtml" tabindex="0" role="button" title="${node.title} — ${node.tagline || ""}">
          <div class="focus-disc-header">
            <span class="focus-disc-icon">${iconSvg}</span>
            <span class="focus-disc-action">+ ADD</span>
          </div>
          <h4 class="focus-disc-title">${node.title}</h4>
          ${isCompact ? "" : `<p class="focus-disc-tagline">${node.tagline || ""}</p>`}
        </div>
      </foreignObject>
    `;

    const card = nodeGroup.querySelector(".focus-discovery-card");
    if (card) {
      card.addEventListener("click", () => {
        this.onNodeAction("add-focus-item", node);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onNodeAction("add-focus-item", node);
        }
      });
    }
  }

  /**
   * Growth Action Node: Integrated affordance to transition into Architecture Paths
   */
  renderGrowthActionNodeContent(nodeGroup, node) {
    nodeGroup.innerHTML = `
      <rect class="node-card-bg growth-action-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="growth-action-inner" xmlns="http://www.w3.org/1999/xhtml" tabindex="0" role="button">
          <div class="growth-action-text">
            <span class="growth-action-title">${node.title}</span>
            <span class="growth-action-sub">${node.subtitle || ""}</span>
          </div>
          <span class="growth-action-arrow">▸</span>
        </div>
      </foreignObject>
    `;

    const card = nodeGroup.querySelector(".growth-action-inner");
    if (card) {
      const handleAction = () => {
        let action = "advance-to-architecture";
        if (node.action) {
          action = node.action;
        } else if (node.id === "growth-action-blueprint") {
          action = "advance-to-stage7";
        } else if (node.id === "growth-action-infrastructure") {
          action = "advance-to-stage6";
        }
        this.onNodeAction(action, node);
      };

      card.addEventListener("click", handleAction);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAction();
        }
      });
    }
  }

  /**
   * Shuffle Control Node: Replaces discovery branches with fresh candidates
   */
  renderShuffleNodeContent(nodeGroup, node) {
    nodeGroup.innerHTML = `
      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <button type="button" class="focus-shuffle-control" xmlns="http://www.w3.org/1999/xhtml">
          <span>${node.title}</span>
        </button>
      </foreignObject>
    `;

    const btn = nodeGroup.querySelector(".focus-shuffle-control");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        btn.classList.add("spinning");
        setTimeout(() => btn.classList.remove("spinning"), 400);
        this.onNodeAction("shuffle-focus-branches", node);
      });
    }
  }

  /**
   * Architecture Path Node Content
   */
  renderPathNodeContent(nodeGroup, node) {
    const iconSvg = getPathIcon(node.id, this.activeTheme);
    const arrowSymbol = this.activeTheme === "root" ? "↗" : "▸";
    const isSelected = node.isSelected;

    nodeGroup.innerHTML = `
      <rect class="node-card-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <path class="node-corner-mark" d="M 0 10 L 0 0 L 10 0"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} 0 L ${node.width} 0 L ${node.width} 10"></path>
      <path class="node-corner-mark" d="M 0 ${node.height - 10} L 0 ${node.height} L 10 ${node.height}"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} ${node.height} L ${node.width} ${node.height} L ${node.width} ${node.height - 10}"></path>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="branch-card-inner path-card-inner ${isSelected ? 'selected' : ''}" xmlns="http://www.w3.org/1999/xhtml" tabindex="0" role="button">
          <div class="branch-header">
            <span class="node-tag">${node.category || "ARCHITECTURE PATH"}</span>
            <span class="branch-icon-symbol">${iconSvg}</span>
          </div>
          <div class="branch-body">
            <h3 class="branch-node-title">${node.title}</h3>
            <p class="branch-tagline">${node.tagline || ""}</p>
            <p class="branch-desc">${node.description || ""}</p>
          </div>
          <div class="branch-footer">
            <span class="branch-status-label">${isSelected ? "SELECTED ARCHITECTURE ✓" : "SELECT PATH"}</span>
            <span class="branch-status-arrow">${arrowSymbol}</span>
          </div>
        </div>
      </foreignObject>
    `;

    const card = nodeGroup.querySelector(".path-card-inner");
    if (card) {
      card.addEventListener("click", () => {
        this.onNodeAction("select-path", node);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onNodeAction("select-path", node);
        }
      });
    }
  }

  /**
   * Stage 5: Tier Header Node (configuration stage badge + status).
   */
  renderTierHeaderContent(nodeGroup, node) {
    const isComplete = node.isComplete;
    // Status pill = completion state only (position is already in the TIER 0n/0m kicker).
    const status = isComplete ? "✓ SET" : "PICK 1";

    nodeGroup.innerHTML = `
      <rect class="node-card-bg tier-header-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <path class="node-corner-mark" d="M 0 10 L 0 0 L 10 0"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} 0 L ${node.width} 0 L ${node.width} 10"></path>
      <path class="node-corner-mark" d="M 0 ${node.height - 10} L 0 ${node.height} L 10 ${node.height}"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} ${node.height} L ${node.width} ${node.height} L ${node.width} ${node.height - 10}"></path>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="tier-header-inner ${isComplete ? "complete" : ""}" xmlns="http://www.w3.org/1999/xhtml">
          <div class="tier-header-text">
            <span class="tier-header-kicker">TIER ${String(node.index).padStart(2, "0")} / ${String(node.total).padStart(2, "0")}</span>
            <h3 class="tier-header-title">${node.title}</h3>
            <span class="tier-header-sub">${node.subtitle || ""}</span>
          </div>
          <span class="tier-header-status">${status}</span>
        </div>
      </foreignObject>
    `;
  }

  /**
   * Stage 5: Technology Candidate Card (sibling choice within a tier).
   */
  renderStackTechContent(nodeGroup, node) {
    const iconSvg = getFocusIcon(node.iconId, this.activeTheme);
    const isSelected = node.isSelected;

    nodeGroup.innerHTML = `
      <rect class="node-card-bg stack-tech-bg ${isSelected ? "selected" : ""}" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="stack-tech-inner ${isSelected ? "selected" : ""}" xmlns="http://www.w3.org/1999/xhtml" tabindex="0" role="button" title="${node.title} — ${node.tagline || ""}">
          <div class="stack-tech-icon">${iconSvg}</div>
          <div class="stack-tech-text">
            <span class="stack-tech-category">${node.category || ""}${node.isRecommended ? `<span class="stack-rec-badge">RECOMMENDED</span>` : ""}</span>
            <h4 class="stack-tech-title">${node.title}</h4>
            <span class="stack-tech-tagline">${node.tagline || ""}</span>
          </div>
          <span class="stack-tech-check">${isSelected ? "✓" : "+"}</span>
        </div>
      </foreignObject>
    `;

    const card = nodeGroup.querySelector(".stack-tech-inner");
    if (card) {
      card.addEventListener("click", () => {
        this.onNodeAction("select-stack-tech", node);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onNodeAction("select-stack-tech", node);
        }
      });
    }
  }

  /**
   * Stage 6: Stack Ancestor Node (condensed locked technology stack from Stage 5).
   */
  renderStackAncestorContent(nodeGroup, node) {
    const lockIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

    nodeGroup.innerHTML = `
      <rect class="node-card-bg stack-ancestor-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="stack-ancestor-inner" xmlns="http://www.w3.org/1999/xhtml">
          <div class="stack-ancestor-icon">${lockIcon}</div>
          <div class="stack-ancestor-text">
            <span class="stack-ancestor-kicker">STAGE 05 // LOCKED TECHNOLOGY STACK</span>
            <h4 class="stack-ancestor-title">${node.subtitle || node.title}</h4>
          </div>
          <span class="stack-ancestor-badge">LOCKED ✓</span>
        </div>
      </foreignObject>
    `;
  }

  /**
   * Connects two nodes with an animated SVG cubic Bézier path.
   * Path length is measured and drawn via stroke-dashoffset transition.
   */
  connectNodesAnimated(fromId, toId, options = {}) {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (!fromNode || !toNode) return null;

    const fromPort = GraphLayout.getPortCoordinate(fromNode, options.fromSide || "bottom");
    const toPort = GraphLayout.getPortCoordinate(toNode, options.toSide || "top");
    const d = GraphLayout.generateBezierPath(fromPort, toPort, this.activeTheme);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const isTentative = options.status === "tentative";
    const isCrossLink = options.connectionType === "cross_link";
    const edgeType = options.edgeType || "relationship";
    const classes = [
      "connection-path",
      isTentative ? "tentative" : "active",
      `edge-${edgeType}`,
      isCrossLink ? "cross-link" : ""
    ].filter(Boolean).join(" ");

    path.setAttribute("class", classes);
    path.setAttribute("d", d);
    path.setAttribute("data-from", fromId);
    path.setAttribute("data-to", toId);
    path.setAttribute("data-edge-type", edgeType);
    if (isCrossLink) {
      path.setAttribute("data-connection-type", "cross_link");
    }

    this.connectionsGroup.appendChild(path);

    const conn = {
      id: options.id || `conn-${fromId}-${toId}`,
      from: fromId,
      to: toId,
      element: path,
      fromSide: options.fromSide || (isCrossLink ? "right" : "bottom"),
      toSide: options.toSide || (isCrossLink ? "left" : "top"),
      status: options.status || "active",
      edgeType: edgeType,
      connectionType: options.connectionType || "hierarchy",
      label: options.label || ""
    };

    this.connections.push(conn);

    try {
      const length = path.getTotalLength() || 260;
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      requestAnimationFrame(() => {
        path.style.transition = "stroke-dashoffset 0.65s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.35s ease, filter 0.35s ease";
        path.style.strokeDashoffset = "0";
      });
    } catch {
      // headless fallback
    }

    return conn;
  }

  connectNodes(fromId, toId, options = {}) {
    return this.connectNodesAnimated(fromId, toId, options);
  }

  /**
   * Updates all connection Bézier paths according to current node coordinates.
   */
  updateConnections() {
    this.connections.forEach(conn => {
      const fromNode = this.nodes.get(conn.from);
      const toNode = this.nodes.get(conn.to);
      if (!fromNode || !toNode || !conn.element) return;

      const fromPort = GraphLayout.getPortCoordinate(fromNode, conn.fromSide || "bottom");
      const toPort = GraphLayout.getPortCoordinate(toNode, conn.toSide || "top");
      const d = GraphLayout.generateBezierPath(fromPort, toPort, this.activeTheme);
      conn.element.setAttribute("d", d);
    });
  }

  removeConnectionsForNode(nodeId) {
    this.connections = this.connections.filter(conn => {
      if (conn.from === nodeId || conn.to === nodeId) {
        if (conn.element && conn.element.parentNode) {
          conn.element.parentNode.removeChild(conn.element);
        }
        return false;
      }
      return true;
    });
  }

  removeConnection(fromId, toId) {
    this.connections = this.connections.filter(conn => {
      if (conn.from === fromId && conn.to === toId) {
        if (conn.element && conn.element.parentNode) {
          conn.element.parentNode.removeChild(conn.element);
        }
        return false;
      }
      return true;
    });
  }

  clearConnections() {
    this.connections.forEach(conn => {
      if (conn.element && conn.element.parentNode) {
        conn.element.parentNode.removeChild(conn.element);
      }
    });
    this.connections = [];
  }

  highlightBranch(nodeId) {
    this.nodes.forEach((node, id) => {
      const nodeGroup = this.nodesGroup.querySelector(`[data-node-id="${id}"]`);
      if (!nodeGroup) return;
      if (id === nodeId) {
        nodeGroup.classList.add("selected");
        nodeGroup.classList.remove("dimmed");
      } else if (node.type === "branch") {
        nodeGroup.classList.remove("selected");
        nodeGroup.classList.add("dimmed");
      }
    });

    this.connections.forEach(conn => {
      if (!conn.element) return;
      if (conn.to === nodeId) {
        conn.element.classList.add("active");
        conn.element.classList.remove("unselected");
      } else {
        conn.element.classList.remove("active");
        conn.element.classList.add("unselected");
      }
    });
  }

  highlightPath(nodeId) {
    this.highlightBranch(nodeId);
  }

  /**
   * Stage 6: Infrastructure Layer Header Node
   */
  renderInfraHeaderContent(nodeGroup, node) {
    const isMulti = node.selectionMode === "multiple";
    const hasShuffle = Boolean(node.hasShuffle);

    nodeGroup.innerHTML = `
      <rect class="node-card-bg infra-header-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <path class="node-corner-mark" d="M 0 10 L 0 0 L 10 0"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} 0 L ${node.width} 0 L ${node.width} 10"></path>
      <path class="node-corner-mark" d="M 0 ${node.height - 10} L 0 ${node.height} L 10 ${node.height}"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} ${node.height} L ${node.width} ${node.height} L ${node.width} ${node.height - 10}"></path>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="infra-header-inner" xmlns="http://www.w3.org/1999/xhtml">
          <div class="infra-header-text">
            <span class="infra-header-kicker">INFRASTRUCTURE LAYER</span>
            <h3 class="infra-header-title">${node.title}</h3>
            <span class="infra-header-sub">${node.subtitle || ""}</span>
          </div>
          <div class="infra-header-actions">
            ${hasShuffle ? `<button type="button" class="infra-header-shuffle-btn" title="Shuffle alternative options">⟳ SHUFFLE</button>` : ""}
            <span class="infra-header-badge">${isMulti ? "MULTI" : "SINGLE"}</span>
          </div>
        </div>
      </foreignObject>
    `;

    const shuffleBtn = nodeGroup.querySelector(".infra-header-shuffle-btn");
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onNodeAction("shuffle-infra-group", node);
      });
    }
  }

  /**
   * Stage 6: Infrastructure Option Card
   */
  renderInfraCardContent(nodeGroup, node) {
    const iconSvg = getFocusIcon(node.iconId || "cloud", this.activeTheme);
    const isSelected = node.isSelected;
    const isMulti = node.selectionMode === "multiple";

    nodeGroup.innerHTML = `
      <rect class="node-card-bg infra-card-bg ${isSelected ? "selected" : ""}" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="infra-card-inner ${isSelected ? "selected" : ""}" xmlns="http://www.w3.org/1999/xhtml" tabindex="0" role="button" title="${node.title} — ${node.tagline || ""}">
          <div class="infra-card-icon">${iconSvg}</div>
          <div class="infra-card-text">
            <span class="infra-card-category">${node.category || "INFRASTRUCTURE"}${node.isRecommended ? `<span class="infra-rec-badge">RECOMMENDED</span>` : ""}</span>
            <h4 class="infra-card-title">${node.title}</h4>
            <span class="infra-card-tagline">${node.tagline || ""}</span>
          </div>
          <span class="infra-card-check ${isSelected ? "checked" : ""}" aria-label="${isSelected ? "Selected" : "Select"}">${isSelected ? "✓" : (isMulti ? "+" : "○")}</span>
        </div>
      </foreignObject>
    `;

    const card = nodeGroup.querySelector(".infra-card-inner");
    if (card) {
      const handleSelect = () => {
        this.onNodeAction("select-infra-tech", node);
      };
      card.addEventListener("click", handleSelect);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      });
    }
  }

  /**
   * Graph-first Choice Node: an offered seed the user can add to their
   * roadmap. Kind drives the accent colour so a genre, a mechanic and a
   * technology are visually distinct without needing stage context.
   */
  renderChoiceNodeContent(nodeGroup, node) {
    const iconSvg = getFocusIcon(node.iconId || "system", this.activeTheme);
    const kindClass = `choice-kind--${String(node.kind || "concept").replace(/[^a-z0-9-]/gi, "")}`;
    const techBadge = node.technical
      ? `<span class="choice-tech-badge" title="Implementation choice">IMPL</span>`
      : "";

    nodeGroup.innerHTML = `
      <rect class="node-card-bg choice-card-bg ${kindClass}" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <path class="node-corner-mark" d="M 0 10 L 0 0 L 10 0"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} 0 L ${node.width} 0 L ${node.width} 10"></path>
      <path class="node-corner-mark" d="M 0 ${node.height - 10} L 0 ${node.height} L 10 ${node.height}"></path>
      <path class="node-corner-mark" d="M ${node.width - 10} ${node.height} L ${node.width} ${node.height} L ${node.width} ${node.height - 10}"></path>
      <circle class="node-port node-port--top" cx="${node.width / 2}" cy="0"></circle>
      <circle class="node-port node-port--bottom" cx="${node.width / 2}" cy="${node.height}"></circle>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="choice-card-inner ${kindClass}" xmlns="http://www.w3.org/1999/xhtml" tabindex="0" role="button"
             title="Add &quot;${escapeHtml(node.title)}&quot; to your roadmap">
          <div class="choice-card-header">
            <span class="choice-card-icon">${iconSvg}</span>
            <span class="choice-card-kind">${escapeHtml(node.category || "")}</span>
            ${techBadge}
          </div>
          <h4 class="choice-card-title">${escapeHtml(node.title)}</h4>
          <p class="choice-card-tagline">${escapeHtml(node.tagline || "")}</p>
          <div class="choice-card-footer">
            <span class="choice-card-add">+ ADD TO PATH</span>
          </div>
        </div>
      </foreignObject>
    `;

    const card = nodeGroup.querySelector(".choice-card-inner");
    if (card) {
      const choose = () => this.onNodeAction("select-choice", node);
      card.addEventListener("click", choose);
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          choose();
        }
      });
    }
  }

  /**
   * Stage 7: Architectural Blueprint Node Content
   */
  renderBlueprintNodeContent(nodeGroup, node) {
    const iconSvg = getFocusIcon(node.iconId || "system", this.activeTheme);
    const depthStr = typeof node.depth === "number" ? `D:${node.depth}` : "";

    const hasAlts = Array.isArray(node.alternatives) && node.alternatives.length > 0;
    const altsCount = hasAlts ? node.alternatives.length : 0;
    const altsBadgeHtml = hasAlts
      ? `<span class="bp-alt-badge" data-action="inspect-alts" title="${altsCount} alternatives: ${node.alternatives.map(a => a.title || a.id).join(', ')}">+${altsCount} alt</span>`
      : "";

    const hasSubtree = node.expansionSubtree && Array.isArray(node.expansionSubtree.modules) && node.expansionSubtree.modules.length > 0;
    const subtreeCount = hasSubtree ? node.expansionSubtree.modules.length : 0;
    const subtreeBadgeHtml = hasSubtree
      ? `<span class="bp-subsystem-badge" data-action="expand-subtree" title="${node.expansionSubtree.title || 'Subsystem modules'}: ${node.expansionSubtree.modules.map(m => m.title || m.name || m.id).join(', ')}">+${subtreeCount} modules</span>`
      : "";

    const role = (node.nodeRole || "decision").toLowerCase();
    const roleBadgeHtml = (role && role !== "decision")
      ? `<span class="bp-role-badge role-${role}" title="Semantic Role: ${role.toUpperCase()}">${role.toUpperCase()}</span>`
      : "";

    const hasExploreAffordance = Boolean(
      node.type === "focus" ||
      node.category === "PROJECT FOCUS" ||
      node.metadata?.hasFeatures ||
      node.type === "feature" ||
      node.nodeRole === "explore"
    );
    const exploreBadgeHtml = hasExploreAffordance && (node.type === "focus" || node.category === "PROJECT FOCUS")
      ? `<span class="bp-explore-badge" data-action="explore-features" title="Brainstorm &amp; explore feature concepts for ${node.title}">+ Explore</span>`
      : "";

    nodeGroup.innerHTML = `
      <rect class="node-card-bg blueprint-node-bg" x="0" y="0" width="${node.width}" height="${node.height}"></rect>
      <path class="node-corner-mark" d="M 0 8 L 0 0 L 8 0"></path>
      <path class="node-corner-mark" d="M ${node.width - 8} 0 L ${node.width} 0 L ${node.width} 8"></path>
      <path class="node-corner-mark" d="M 0 ${node.height - 8} L 0 ${node.height} L 8 ${node.height}"></path>
      <path class="node-corner-mark" d="M ${node.width - 8} ${node.height} L ${node.width} ${node.height} L ${node.width} ${node.height - 8}"></path>

      <foreignObject class="node-foreign" x="0" y="0" width="${node.width}" height="${node.height}">
        <div class="blueprint-card-inner" xmlns="http://www.w3.org/1999/xhtml" tabindex="0" role="button" title="Click to inspect: ${node.title}">
          <div class="bp-card-top">
            <span class="bp-card-category">${node.category || "SPECIFICATION"}</span>
            <div class="bp-card-top-right">
              ${roleBadgeHtml}
              ${exploreBadgeHtml}
              ${altsBadgeHtml}
              ${subtreeBadgeHtml}
              <span class="bp-card-depth">${depthStr}</span>
            </div>
          </div>
          <div class="bp-card-body">
            <span class="bp-card-icon">${iconSvg}</span>
            <div class="bp-card-info">
              <h4 class="bp-card-title">${node.title}</h4>
              <span class="bp-card-tagline">${node.tagline || node.description || ""}</span>
            </div>
          </div>
        </div>
      </foreignObject>
    `;

    const card = nodeGroup.querySelector(".blueprint-card-inner");
    if (card) {
      const handleInspect = () => {
        this.onNodeAction("inspect-blueprint-node", node);
      };
      card.addEventListener("click", handleInspect);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleInspect();
        }
      });
    }

    const altBadge = nodeGroup.querySelector('[data-action="inspect-alts"]');
    if (altBadge) {
      altBadge.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onNodeAction("inspect-blueprint-node", node);
      });
    }

    const subtreeBadge = nodeGroup.querySelector('[data-action="expand-subtree"]');
    if (subtreeBadge) {
      subtreeBadge.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onNodeAction("expand-node-subtree", node);
      });
    }

    const exploreBadge = nodeGroup.querySelector('[data-action="explore-features"]');
    if (exploreBadge) {
      exploreBadge.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onNodeAction("explore-node-features", node);
      });
    }
  }
}
