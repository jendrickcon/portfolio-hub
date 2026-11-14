/**
 * DEVPATH // Living Graph Layout & Coordinate Engine
 * Hierarchical coordinate generator supporting multi-tier parallel branching:
 * - Depth 0: Project Root
 * - Depth 1: Project Type (branches fan out -> selected type locks)
 * - Depth 2: Project Focus (parallel sibling branches + discovery branches + shuffle)
 * - Depth 3: Architecture Path (branches fan out -> selected path locks)
 * Supports desktop horizontal spread and mobile vertical flowing tree.
 */

import { BRANCH_NODE_DIMENSIONS } from "./data/projectTypes.js";

export class GraphLayout {
  /**
   * Centers the root node inside the provided SVG viewport dimensions (Stage 1).
   */
  static getRootPosition(svgWidth, svgHeight, nodeWidth, nodeHeight) {
    const x = Math.round((svgWidth - nodeWidth) / 2);
    const y = Math.round((svgHeight - nodeHeight) / 2);
    return { x: Math.max(16, x), y: Math.max(16, y) };
  }

  /**
   * Helper to layout mobile selected focus cards in a responsive multi-row parallel arrangement:
   * - 1 item: 1 centered card (width ~ 240px, height = 80px)
   * - 2 items: 2 side-by-side cards in 1 row (width ~ 155-165px, height = 80px)
   * - 3 items: 2 + 1 compact parallel layout:
   *     Row 1: Cards 0 & 1 side-by-side (width ~ 155-165px, height = 80px)
   *     Row 2: Card 2 centered (width ~ 240px, height = 80px)
   * Guarantees >= 44px touch targets, zero horizontal overflow, and no text clipping.
   * Returns { selectedNodes, nextY }
   */
  static computeMobileFocusLayout(selectedFocusItems = [], svgWidth, startY) {
    const selCount = selectedFocusItems.length;
    const selectedNodes = [];
    if (selCount === 0) {
      return { selectedNodes, nextY: startY };
    }

    const cardH = 80;
    const gap = 10;
    let currentY = startY;

    if (selCount === 1) {
      const cardW = Math.min(260, Math.max(200, svgWidth - 48));
      const cardX = Math.round((svgWidth - cardW) / 2);
      selectedNodes.push({
        ...selectedFocusItems[0],
        x: cardX,
        y: currentY,
        width: cardW,
        height: cardH,
        isSelected: true,
        isCompact: true
      });
      currentY += cardH + 32;
    } else if (selCount === 2) {
      const availW = Math.min(svgWidth - 24, 380);
      const cardW = Math.floor((availW - gap) / 2);
      const totalW = 2 * cardW + gap;
      const startX = Math.round((svgWidth - totalW) / 2);
      selectedFocusItems.forEach((item, i) => {
        selectedNodes.push({
          ...item,
          x: startX + i * (cardW + gap),
          y: currentY,
          width: cardW,
          height: cardH,
          isSelected: true,
          isCompact: true
        });
      });
      currentY += cardH + 32;
    } else {
      // 3 items: 2 + 1 compact parallel layout
      const availW = Math.min(svgWidth - 24, 380);
      const cardW = Math.floor((availW - gap) / 2);
      const totalW = 2 * cardW + gap;
      const startX = Math.round((svgWidth - totalW) / 2);

      // Row 1: Cards 0 and 1 side-by-side
      selectedNodes.push({
        ...selectedFocusItems[0],
        x: startX,
        y: currentY,
        width: cardW,
        height: cardH,
        isSelected: true,
        isCompact: true
      });
      selectedNodes.push({
        ...selectedFocusItems[1],
        x: startX + cardW + gap,
        y: currentY,
        width: cardW,
        height: cardH,
        isSelected: true,
        isCompact: true
      });

      // Row 2: Card 2 centered below
      const card3W = Math.min(availW, Math.max(cardW, 240));
      const card3X = Math.round((svgWidth - card3W) / 2);
      const card3Y = currentY + cardH + gap;

      selectedNodes.push({
        ...selectedFocusItems[2],
        x: card3X,
        y: card3Y,
        width: card3W,
        height: cardH,
        isSelected: true,
        isCompact: true
      });

      currentY = card3Y + cardH + 32;
    }

    return { selectedNodes, nextY: currentY };
  }

  /**
   * Computes Stage 2 coordinates: Root + 3 Project Type branch choices.
   */
  static getStage2Positions(svgWidth, svgHeight, rootConfig, branchTypes, isMobile = false) {
    if (!isMobile) {
      const dim = BRANCH_NODE_DIMENSIONS.desktop;
      const rootW = 350;
      const rootH = 165;

      const totalBranchWidth = branchTypes.length * dim.width + (branchTypes.length - 1) * dim.gap;
      const requiredWidth = Math.max(svgWidth, totalBranchWidth + 80);

      const rootX = Math.round((requiredWidth - rootW) / 2);
      const rootY = 36;

      const branchY = rootY + rootH + 60;
      const startX = Math.round((requiredWidth - totalBranchWidth) / 2);

      const branches = branchTypes.map((b, i) => ({
        ...b,
        x: startX + i * (dim.width + dim.gap),
        y: branchY,
        width: dim.width,
        height: dim.height
      }));

      return {
        root: { x: rootX, y: rootY, width: rootW, height: rootH },
        branches,
        contentBounds: {
          x: 0,
          y: 0,
          width: requiredWidth,
          height: branchY + dim.height + 70
        }
      };
    } else {
      const rootW = Math.min(340, Math.max(280, svgWidth - 32));
      const rootH = 165;
      const rootX = Math.round((svgWidth - rootW) / 2);
      const rootY = 32;

      const branchW = Math.min(340, Math.max(280, svgWidth - 32));
      const branchH = 160;
      const gap = 24;
      const startY = rootY + rootH + 36;

      const branches = branchTypes.map((b, i) => ({
        ...b,
        x: Math.round((svgWidth - branchW) / 2),
        y: startY + i * (branchH + gap),
        width: branchW,
        height: branchH
      }));

      const totalHeight = startY + branchTypes.length * (branchH + gap) + 40;

      return {
        root: { x: rootX, y: rootY, width: rootW, height: rootH },
        branches,
        contentBounds: {
          x: 0,
          y: 0,
          width: svgWidth,
          height: totalHeight
        }
      };
    }
  }

  /**
   * Computes Stage 3 coordinates:
   * Root -> Selected Type -> Parallel Selected Focus Siblings + Available Discovery Branches
   */
  static getStage3Positions(svgWidth, svgHeight, rootConfig, activeTypeConfig, selectedFocusItems = [], discoveryFocusItems = [], pathTypes = [], isMobile = false) {
    if (!isMobile) {
      const rootW = 350;
      const rootH = 165;
      const typeW = 280;
      const typeH = 180;

      const rootX = Math.round((svgWidth - rootW) / 2);
      const rootY = 30;

      const typeX = Math.round((svgWidth - typeW) / 2);
      const typeY = rootY + rootH + 40;

      // Parallel Selected Focus Nodes (1 to 3 siblings side-by-side)
      const selectedNodes = [];
      let currentY = typeY + typeH + 44;

      const selCount = selectedFocusItems.length;
      if (selCount > 0) {
        const cardW = 200;
        const cardH = 70;
        const gap = 20;
        const totalW = selCount * cardW + (selCount - 1) * gap;
        const startX = Math.round((svgWidth - totalW) / 2);

        selectedFocusItems.forEach((item, i) => {
          selectedNodes.push({
            ...item,
            x: startX + i * (cardW + gap),
            y: currentY,
            width: cardW,
            height: cardH,
            isSelected: true
          });
        });

        currentY += cardH + 40;
      }

      // Discovery Branches & Shuffle — only active if < 3 focus characteristics selected!
      // Once 3 focus characteristics are locked, discovery is complete.
      const hasDiscoveryPool = discoveryFocusItems.length > 0 && selCount < 3;
      const discNodes = [];
      const requiredW = Math.max(svgWidth, Math.max(discoveryFocusItems.length * 196 + 60, 3 * 300 + 80));
      let lastVisibleBottom = selectedNodes.length > 0
        ? Math.max(...selectedNodes.map(n => n.y + n.height))
        : currentY;

      if (hasDiscoveryPool) {
        const discCount = discoveryFocusItems.length;
        const discCardW = 180;
        const discCardH = 105;
        const discGap = 16;
        const totalDiscW = discCount * discCardW + (discCount - 1) * discGap;
        const startDiscX = Math.round((requiredW - totalDiscW) / 2);

        discoveryFocusItems.forEach((item, i) => {
          discNodes.push({
            ...item,
            x: startDiscX + i * (discCardW + discGap),
            y: currentY,
            width: discCardW,
            height: discCardH,
            isSelected: false,
            isDiscovery: true
          });
        });
        currentY += discCardH + 20;
        lastVisibleBottom = currentY;
      }

      // Shuffle Node — only present when discovery pool is active
      const shuffleNode = hasDiscoveryPool
        ? {
            id: "focus-shuffle-btn",
            type: "shuffle",
            title: "↻ SHUFFLE DISCOVERY",
            x: Math.round((requiredW - 200) / 2),
            y: currentY,
            width: 200,
            height: 38
          }
        : null;

      if (shuffleNode) {
        lastVisibleBottom = shuffleNode.y + shuffleNode.height;
      }

      // Commit affordance: once >= 1 focus is selected, a growth node lets the user
      // declare focus done and grow the architecture paths. Placed LAST (below
      // discovery + shuffle) so it never competes with the focus choices.
      let growthActionNode = null;
      if (selCount >= 1) {
        growthActionNode = {
          id: "growth-action-architecture",
          type: "growth-action",
          title: "BUILD ARCHITECTURE PATHS →",
          subtitle: `${selCount} of 3 focus characteristics locked`,
          x: Math.round((requiredW - 300) / 2),
          y: lastVisibleBottom + 24,
          width: 300,
          height: 52
        };
      }

      const finalHeight = growthActionNode
        ? growthActionNode.y + growthActionNode.height + 60
        : lastVisibleBottom + 60;

      return {
        root: { x: Math.round((requiredW - rootW) / 2), y: rootY, width: rootW, height: rootH },
        activeType: { x: Math.round((requiredW - typeW) / 2), y: typeY, width: typeW, height: typeH },
        selectedFocusNodes: selectedNodes,
        growthActionNode,
        pathNodes: [],
        discoveryNodes: discNodes,
        shuffleNode,
        contentBounds: {
          x: 0,
          y: 0,
          width: requiredW,
          height: finalHeight
        }
      };
    } else {
      // Mobile Guided Vertical Growth Stack
      const rootW = Math.min(340, Math.max(280, svgWidth - 32));
      const rootH = 165;
      const rootX = Math.round((svgWidth - rootW) / 2);
      const rootY = 32;

      const typeW = Math.min(340, Math.max(280, svgWidth - 32));
      const typeH = 160;
      const typeX = Math.round((svgWidth - typeW) / 2);
      const typeY = rootY + rootH + 32;

      let currentY = typeY + typeH + 36;

      // 1. Mobile Selected Focus Siblings (2 + 1 responsive parallel arrangement)
      const selCount = selectedFocusItems.length;
      const { selectedNodes, nextY } = GraphLayout.computeMobileFocusLayout(selectedFocusItems, svgWidth, currentY);
      currentY = nextY;

      // 2. Discovery Branches on mobile — only active when pool has items AND < 3 items selected!
      const hasDiscoveryPool = discoveryFocusItems.length > 0 && selCount < 3;
      const discNodes = [];
      let lastVisibleBottom = selectedNodes.length > 0
        ? Math.max(...selectedNodes.map(n => n.y + n.height))
        : currentY;

      if (hasDiscoveryPool) {
        const discCols = svgWidth < 360 ? 1 : 2;
        const discGapX = 10;
        const discGapY = 10;
        const discGridW = Math.min(svgWidth - 24, 372);
        const discCardW = Math.floor((discGridW - (discCols - 1) * discGapX) / discCols);
        const discH = 84;
        const discStartX = Math.round((svgWidth - discGridW) / 2);
        discoveryFocusItems.forEach((item, i) => {
          const col = i % discCols;
          const row = Math.floor(i / discCols);
          discNodes.push({
            ...item,
            x: discStartX + col * (discCardW + discGapX),
            y: currentY + row * (discH + discGapY),
            width: discCardW,
            height: discH,
            isCompact: discCols > 1,
            isSelected: false,
            isDiscovery: true
          });
        });
        const rows = Math.ceil(discoveryFocusItems.length / discCols);
        currentY += rows * discH + (rows - 1) * discGapY + 12;
        lastVisibleBottom = currentY;
      }

      // Shuffle Node — only present when discovery pool is active
      const shuffleNode = hasDiscoveryPool
        ? {
            id: "focus-shuffle-btn",
            type: "shuffle",
            title: "↻ SHUFFLE DISCOVERY",
            x: Math.round((svgWidth - 200) / 2),
            y: currentY + 8,
            width: 200,
            height: 42
          }
        : null;

      if (shuffleNode) {
        lastVisibleBottom = shuffleNode.y + shuffleNode.height;
      }

      // Commit affordance: once >= 1 focus is selected, a growth node lets the user
      // declare focus done and grow the architecture paths (placed LAST, on mobile too).
      // Its Y position follows directly from lastVisibleBottom + 24 (dynamic, no gaps!)
      let growthActionNode = null;
      if (selCount >= 1) {
        const gwW = Math.min(300, Math.max(260, svgWidth - 48));
        growthActionNode = {
          id: "growth-action-architecture",
          type: "growth-action",
          title: "BUILD ARCHITECTURE PATHS →",
          subtitle: `${selCount} of 3 focus characteristics locked`,
          x: Math.round((svgWidth - gwW) / 2),
          y: lastVisibleBottom + 24,
          width: gwW,
          height: 56
        };
      }

      const finalHeight = growthActionNode
        ? growthActionNode.y + growthActionNode.height + 60
        : lastVisibleBottom + 60;

      return {
        root: { x: rootX, y: rootY, width: rootW, height: rootH },
        activeType: { x: typeX, y: typeY, width: typeW, height: typeH },
        selectedFocusNodes: selectedNodes,
        growthActionNode,
        pathNodes: [],
        discoveryNodes: discNodes,
        shuffleNode,
        contentBounds: {
          x: 0,
          y: 0,
          width: svgWidth,
          height: finalHeight
        }
      };
    }
  }

  /**
   * Computes Stage 4 coordinates:
   * Root -> Type -> Parallel Focus Siblings -> 3 Architecture Paths (or Selected Architecture Path)
   */
  static getStage4Positions(svgWidth, svgHeight, rootConfig, activeTypeConfig, selectedFocusItems, pathTypes, chosenPathId = null, isMobile = false) {
    if (!isMobile) {
      const rootW = 350;
      const rootH = 165;
      const typeW = 280;
      const typeH = 180;

      const rootX = Math.round((svgWidth - rootW) / 2);
      const rootY = 30;

      const typeX = Math.round((svgWidth - typeW) / 2);
      const typeY = rootY + rootH + 40;

      // Parallel Selected Focus Nodes
      const selectedFocusNodes = [];
      let currentY = typeY + typeH + 48;

      const selCount = selectedFocusItems.length;
      const cardW = 200;
      const cardH = 70;
      const gap = 20;
      const totalW = Math.max(1, selCount) * cardW + (Math.max(1, selCount) - 1) * gap;
      const startX = Math.round((svgWidth - totalW) / 2);

      selectedFocusItems.forEach((item, i) => {
        selectedFocusNodes.push({
          ...item,
          x: startX + i * (cardW + gap),
          y: currentY,
          width: cardW,
          height: cardH,
          isSelected: true
        });
      });

      currentY += cardH + 54;

      // Architecture Paths
      const pathDim = BRANCH_NODE_DIMENSIONS.desktop;
      let pathNodes = [];

      if (!chosenPathId) {
        // 3 available paths fanned out
        const totalPathWidth = pathTypes.length * pathDim.width + (pathTypes.length - 1) * pathDim.gap;
        const requiredW = Math.max(svgWidth, totalPathWidth + 80);
        const startPathX = Math.round((requiredW - totalPathWidth) / 2);

        pathNodes = pathTypes.map((p, i) => ({
          ...p,
          x: startPathX + i * (pathDim.width + pathDim.gap),
          y: currentY,
          width: pathDim.width,
          height: pathDim.height,
          isSelected: false
        }));

        const finalHeight = currentY + pathDim.height + 70;
        return {
          root: { x: Math.round((requiredW - rootW) / 2), y: rootY, width: rootW, height: rootH },
          activeType: { x: Math.round((requiredW - typeW) / 2), y: typeY, width: typeW, height: typeH },
          selectedFocusNodes,
          pathNodes,
          contentBounds: { x: 0, y: 0, width: requiredW, height: finalHeight }
        };
      } else {
        // Chosen path locks in center
        const chosen = pathTypes.find(p => p.id === chosenPathId);
        const singleW = 320;
        const singleH = 160;
        pathNodes = [{
          ...(chosen || pathTypes[0]),
          x: Math.round((svgWidth - singleW) / 2),
          y: currentY,
          width: singleW,
          height: singleH,
          isSelected: true
        }];

        const finalHeight = currentY + singleH + 80;
        return {
          root: { x: rootX, y: rootY, width: rootW, height: rootH },
          activeType: { x: typeX, y: typeY, width: typeW, height: typeH },
          selectedFocusNodes,
          pathNodes,
          contentBounds: { x: 0, y: 0, width: svgWidth, height: finalHeight }
        };
      }
    } else {
      // Mobile Vertical Guided Growth Stack
      const rootW = Math.min(340, Math.max(280, svgWidth - 32));
      const rootH = 165;
      const rootX = Math.round((svgWidth - rootW) / 2);
      const rootY = 32;

      const typeW = Math.min(340, Math.max(280, svgWidth - 32));
      const typeH = 165;
      const typeX = Math.round((svgWidth - typeW) / 2);
      const typeY = rootY + rootH + 36;

      let currentY = typeY + typeH + 36;

      // Selected Focus nodes (parallel compact siblings via 2+1 responsive arrangement)
      const { selectedNodes: selectedFocusNodes, nextY } = GraphLayout.computeMobileFocusLayout(selectedFocusItems, svgWidth, currentY);
      currentY = nextY;

      // Architecture Path nodes
      const pathW = Math.min(340, Math.max(280, svgWidth - 32));
      const pathH = 160;
      const gap = 20;
      let pathNodes = [];

      if (!chosenPathId) {
        pathNodes = pathTypes.map((p, i) => ({
          ...p,
          x: Math.round((svgWidth - pathW) / 2),
          y: currentY + i * (pathH + gap),
          width: pathW,
          height: pathH,
          isSelected: false
        }));
        const finalHeight = currentY + pathTypes.length * (pathH + gap) + 40;
        return {
          root: { x: rootX, y: rootY, width: rootW, height: rootH },
          activeType: { x: typeX, y: typeY, width: typeW, height: typeH },
          selectedFocusNodes,
          pathNodes,
          contentBounds: { x: 0, y: 0, width: svgWidth, height: finalHeight }
        };
      } else {
        const chosen = pathTypes.find(p => p.id === chosenPathId);
        pathNodes = [{
          ...(chosen || pathTypes[0]),
          x: Math.round((svgWidth - pathW) / 2),
          y: currentY,
          width: pathW,
          height: pathH,
          isSelected: true
        }];
        const finalHeight = currentY + pathH + 60;
        return {
          root: { x: rootX, y: rootY, width: rootW, height: rootH },
          activeType: { x: typeX, y: typeY, width: typeW, height: typeH },
          selectedFocusNodes,
          pathNodes,
          contentBounds: { x: 0, y: 0, width: svgWidth, height: finalHeight }
        };
      }
    }
  }

  /**
   * Computes Stage 5 coordinates:
   * Ancestor spine (Root -> Type -> Focus Siblings -> Locked Architecture Path)
   * then 3 technology tiers fanned out beneath the locked architecture path.
   *
   * Desktop: 3-column canopy; each tier header sits above its 3 candidate cards.
   * Mobile:  dedicated single-column vertical flow (tier -> options -> tier -> ...).
   *
   * @param {object} opts
   * @param {number} opts.svgWidth
   * @param {number} opts.svgHeight
   * @param {object} opts.activeTypeConfig
   * @param {Array}  opts.selectedFocusItems
   * @param {object} opts.chosenPath        The locked architecture path node/definition
   * @param {Array}  opts.tiers             [{ id, title, subtitle, options: [...] }]
   * @param {object} opts.selectedStack     { [tierId]: techId | null }
   * @param {boolean} opts.isMobile
   */
  static getStage5Positions({
    svgWidth,
    svgHeight,
    activeTypeConfig,
    selectedFocusItems = [],
    chosenPath,
    tiers = [],
    selectedStack = {},
    isMobile = false
  } = {}) {
    const tierCount = tiers.length;
    const complete = tierCount > 0 && tiers.every(t => Boolean(selectedStack[t.id]));

    if (!isMobile) {
      const rootW = 350;
      const rootH = 165;
      const typeW = 280;
      const typeH = 180;
      const focusW = 200;
      const focusH = 70;
      const focusGap = 20;
      const pathW = 320;
      const pathH = 160;
      const tierW = 260;
      const tierH = 64;
      const tierGap = 32;
      const techW = 236;
      const techH = 74;
      const techGap = 12;

      const totalTierW = tierCount * tierW + Math.max(0, tierCount - 1) * tierGap;
      const requiredW = Math.max(svgWidth, totalTierW + 100, 3 * 300 + 100);

      const rootX = Math.round((requiredW - rootW) / 2);
      const rootY = 30;
      const typeX = Math.round((requiredW - typeW) / 2);
      const typeY = rootY + rootH + 36;

      // Focus siblings (parallel, centered)
      const focusCount = selectedFocusItems.length;
      const focusTotalW = Math.max(1, focusCount) * focusW + Math.max(0, focusCount - 1) * focusGap;
      const focusStartX = Math.round((requiredW - focusTotalW) / 2);
      const focusY = typeY + typeH + 40;
      const selectedFocusNodes = selectedFocusItems.map((item, i) => ({
        ...item,
        x: focusStartX + i * (focusW + focusGap),
        y: focusY,
        width: focusW,
        height: focusH,
        isSelected: true,
        isCompact: false
      }));

      // Locked architecture path (centered)
      const pathNode = {
        ...(chosenPath || {}),
        x: Math.round((requiredW - pathW) / 2),
        y: focusY + (focusCount > 0 ? focusH + 44 : 8),
        width: pathW,
        height: pathH,
        isSelected: true
      };

      // Tier headers canopy
      const tierStartX = Math.round((requiredW - totalTierW) / 2);
      const tierY = pathNode.y + pathH + 56;
      const tierHeaderNodes = tiers.map((tier, i) => {
        const chosen = selectedStack[tier.id];
        return {
          id: `tier-${tier.id}`,
          type: "tier-header",
          tierId: tier.id,
          title: tier.title,
          subtitle: tier.subtitle,
          index: i + 1,
          total: tierCount,
          isComplete: Boolean(chosen),
          x: tierStartX + i * (tierW + tierGap),
          y: tierY,
          width: tierW,
          height: tierH
        };
      });

      // Candidate tech cards under each tier
      const techNodes = [];
      tiers.forEach((tier, i) => {
        const colX = tierStartX + i * (tierW + tierGap);
        const cardX = colX + Math.round((tierW - techW) / 2);
        const startY = tierY + tierH + 24;
        tier.options.forEach((opt, j) => {
          techNodes.push({
            id: `stack-${tier.id}-${opt.id}`,
            type: "stack-tech",
            tierId: tier.id,
            title: opt.title,
            category: opt.category,
            tagline: opt.tagline,
            description: opt.description,
            iconId: opt.iconId,
            techId: opt.id,
            isSelected: selectedStack[tier.id] === opt.id,
            isRecommended: Boolean(opt.isRecommended),
            x: cardX,
            y: startY + j * (techH + techGap),
            width: techW,
            height: techH
          });
        });
      });
      const maxOptions = Math.max(1, ...tiers.map(t => (t.options ? t.options.length : 0)));
      const tierColumnBottom = tierY + tierH + 24 + maxOptions * techH + Math.max(0, maxOptions - 1) * techGap;

      // Stage 6 convergence node when every tier is chosen
      let convergenceNode = null;
      if (complete) {
        convergenceNode = {
          id: "growth-action-infrastructure",
          type: "growth-action",
          title: "SYNTHESIZE BLUEPRINT →",
          subtitle: "All technology tiers locked",
          x: Math.round((requiredW - 320) / 2),
          y: tierColumnBottom + 56,
          width: 320,
          height: 56
        };
      }

      const finalHeight = convergenceNode
        ? convergenceNode.y + convergenceNode.height + 80
        : tierColumnBottom + 80;

      return {
        root: { x: rootX, y: rootY, width: rootW, height: rootH },
        activeType: { x: typeX, y: typeY, width: typeW, height: typeH },
        selectedFocusNodes,
        pathNode,
        tierHeaderNodes,
        techNodes,
        convergenceNode,
        contentBounds: { x: 0, y: 0, width: requiredW, height: finalHeight }
      };
    }

    // ── Mobile: dedicated single-column vertical flow ──
    const colW = Math.min(340, Math.max(280, svgWidth - 32));
    const rootW = colW;
    const rootH = 165;
    const typeW = colW;
    const typeH = 160;
    const focusW = 100;
    const focusH = 92;
    const focusGap = 10;
    const pathW = colW;
    const pathH = 140;
    const tierW = colW;
    const tierH = 60;
    const techW = colW;
    const techH = 68;
    const techGap = 10;

    const rootX = Math.round((svgWidth - rootW) / 2);
    const rootY = 32;
    const typeX = Math.round((svgWidth - typeW) / 2);
    const typeY = rootY + rootH + 32;
    let currentY = typeY + typeH + 36;

    // Focus siblings (parallel compact siblings via 2+1 responsive arrangement)
    const { selectedNodes: selectedFocusNodes, nextY } = GraphLayout.computeMobileFocusLayout(selectedFocusItems, svgWidth, currentY);
    currentY = nextY;

    // Locked architecture path
    const pathNode = {
      ...(chosenPath || {}),
      x: Math.round((svgWidth - pathW) / 2),
      y: currentY,
      width: pathW,
      height: pathH,
      isSelected: true
    };
    currentY += pathH + 48;

    // Sequential tiers, each with its sibling option cards
    const tierHeaderNodes = [];
    const techNodes = [];
    tiers.forEach((tier, i) => {
      const chosen = selectedStack[tier.id];
      tierHeaderNodes.push({
        id: `tier-${tier.id}`,
        type: "tier-header",
        tierId: tier.id,
        title: tier.title,
        subtitle: tier.subtitle,
        index: i + 1,
        total: tierCount,
        isComplete: Boolean(chosen),
        x: Math.round((svgWidth - tierW) / 2),
        y: currentY,
        width: tierW,
        height: tierH
      });
      currentY += tierH + 16;

      tier.options.forEach((opt) => {
        techNodes.push({
          id: `stack-${tier.id}-${opt.id}`,
          type: "stack-tech",
          tierId: tier.id,
          title: opt.title,
          category: opt.category,
          tagline: opt.tagline,
          description: opt.description,
          iconId: opt.iconId,
          techId: opt.id,
          isSelected: selectedStack[tier.id] === opt.id,
          isRecommended: Boolean(opt.isRecommended),
          x: Math.round((svgWidth - techW) / 2),
          y: currentY,
          width: techW,
          height: techH
        });
        currentY += techH + techGap;
      });

      currentY += 24; // gap before next tier
    });

    // Stage 6 convergence node
    let convergenceNode = null;
    if (complete) {
      const gwW = Math.min(320, Math.max(260, svgWidth - 48));
      convergenceNode = {
        id: "growth-action-infrastructure",
        type: "growth-action",
        title: "INFRASTRUCTURE & BLUEPRINT →",
        subtitle: "All technology tiers locked — Proceed to Stage 6",
        x: Math.round((svgWidth - gwW) / 2),
        y: currentY + 8,
        width: gwW,
        height: 56
      };
    }

    const finalHeight = convergenceNode
      ? convergenceNode.y + convergenceNode.height + 60
      : currentY + 40;

    return {
      root: { x: rootX, y: rootY, width: rootW, height: rootH },
      activeType: { x: typeX, y: typeY, width: typeW, height: typeH },
      selectedFocusNodes,
      pathNode,
      tierHeaderNodes,
      techNodes,
      convergenceNode,
      contentBounds: { x: 0, y: 0, width: svgWidth, height: finalHeight }
    };
  }

  /**
   * Computes Stage 6 coordinates:
   * Ancestor spine (Root -> Type -> Focus -> Path -> Stack)
   * fanned out above 3 Infrastructure decision groups (Distribution/Hosting, CI/CD, Monitoring/Security).
   *
   * Desktop: 3-column canopy with group headers above option cards.
   * Mobile:  dedicated single-column vertical flow with zero horizontal overflow.
   */
  static getStage6Positions({
    svgWidth,
    svgHeight,
    activeTypeConfig,
    selectedFocusItems = [],
    chosenPath,
    selectedStackTechs = [],
    infraGroups = [],
    selectedInfra = {},
    isMobile = false
  } = {}) {
    const groupCount = infraGroups.length;

    if (!isMobile) {
      const rootW = 350;
      const rootH = 165;
      const typeW = 280;
      const typeH = 180;
      const focusW = 200;
      const focusH = 70;
      const focusGap = 20;
      const pathW = 320;
      const pathH = 160;
      const stackW = 180;
      const stackH = 60;
      const stackGap = 16;
      const groupW = 280;
      const groupH = 64;
      const groupGap = 32;
      const optW = 260;
      const optH = 74;
      const optGap = 12;

      // Responsive multi-row wrapping (max 3 columns per row)
      const maxCols = 3;
      const maxColsInAnyRow = Math.min(maxCols, Math.max(1, groupCount));
      const maxRowW = maxColsInAnyRow * groupW + Math.max(0, maxColsInAnyRow - 1) * groupGap;
      const requiredW = Math.max(svgWidth, maxRowW + 120, 1100);

      const rootX = Math.round((requiredW - rootW) / 2);
      const rootY = 30;
      const typeX = Math.round((requiredW - typeW) / 2);
      const typeY = rootY + rootH + 36;

      // Focus siblings
      const focusCount = selectedFocusItems.length;
      const focusTotalW = Math.max(1, focusCount) * focusW + Math.max(0, focusCount - 1) * focusGap;
      const focusStartX = Math.round((requiredW - focusTotalW) / 2);
      const focusY = typeY + typeH + 40;
      const selectedFocusNodes = selectedFocusItems.map((item, i) => ({
        ...item,
        x: focusStartX + i * (focusW + focusGap),
        y: focusY,
        width: focusW,
        height: focusH,
        isSelected: true
      }));

      // Path
      const pathX = Math.round((requiredW - pathW) / 2);
      const pathY = focusY + focusH + 46;
      const pathNode = {
        ...(chosenPath || {}),
        x: pathX,
        y: pathY,
        width: pathW,
        height: pathH,
        isSelected: true
      };

      // Stack summary row
      const stackCount = selectedStackTechs.length;
      // Stage 5 locked stack ancestor node
      const stackSummaryText = selectedStackTechs.map(t => t.title).join(" • ");
      const stackAncestorW = Math.min(requiredW - 40, 360);
      const stackAncestorH = 64;
      const stackAncestorY = pathY + pathH + 40;
      const stackAncestorNode = {
        id: "stage5-stack-ancestor",
        type: "stack-ancestor",
        title: "TECHNOLOGY STACK LOCKED",
        subtitle: stackSummaryText || "Core Stack Configured",
        techs: selectedStackTechs,
        x: Math.round((requiredW - stackAncestorW) / 2),
        y: stackAncestorY,
        width: stackAncestorW,
        height: stackAncestorH,
        isSelected: true
      };

      // Infra groups canopy: partitioned into rows of at most maxCols (3)
      const infraRows = [];
      for (let i = 0; i < groupCount; i += maxCols) {
        infraRows.push(infraGroups.slice(i, i + maxCols));
      }

      const infraHeaderNodes = [];
      const infraOptionNodes = [];
      let currentInfraY = stackAncestorY + stackAncestorH + 44;
      let maxColumnBottom = currentInfraY;

      infraRows.forEach((rowGroups) => {
        const rowCols = rowGroups.length;
        const rowW = rowCols * groupW + Math.max(0, rowCols - 1) * groupGap;
        const rowStartX = Math.round((requiredW - rowW) / 2);
        let rowMaxBottom = currentInfraY + groupH;

        rowGroups.forEach((group, c) => {
          const colX = rowStartX + c * (groupW + groupGap);
          infraHeaderNodes.push({
            id: `infra-header-${group.id}`,
            type: "infra-header",
            groupId: group.id,
            title: group.title,
            subtitle: group.subtitle,
            selectionMode: group.selectionMode,
            hasShuffle: Boolean(group.hasShuffle),
            x: colX,
            y: currentInfraY,
            width: groupW,
            height: groupH
          });

          const startOptY = currentInfraY + groupH + 20;
          const cardX = colX + Math.round((groupW - optW) / 2);

          (group.options || []).forEach((opt, j) => {
            const currentVal = selectedInfra[group.id];
            const isSelected = Array.isArray(currentVal) ? currentVal.includes(opt.id) : currentVal === opt.id;
            const cardY = startOptY + j * (optH + optGap);
            infraOptionNodes.push({
              id: `infra-opt-${group.id}-${opt.id}`,
              type: "infra-card",
              groupId: group.id,
              optionId: opt.id,
              title: opt.title,
              category: opt.category || group.title,
              tagline: opt.tagline,
              description: opt.description,
              iconId: opt.iconId,
              isSelected,
              isRecommended: Boolean(opt.isRecommended),
              selectionMode: group.selectionMode,
              x: cardX,
              y: cardY,
              width: optW,
              height: optH
            });
            const optBottom = cardY + optH;
            if (optBottom > rowMaxBottom) rowMaxBottom = optBottom;
          });
        });

        // Set starting Y for next row below this row's lowest card
        currentInfraY = rowMaxBottom + 44;
        if (rowMaxBottom > maxColumnBottom) maxColumnBottom = rowMaxBottom;
      });

      // Convergence node to Stage 7 Blueprint
      const gwW = 360;
      const convergenceNode = {
        id: "growth-action-blueprint",
        type: "growth-action",
        title: "SYNTHESIZE PROJECT BLUEPRINT →",
        subtitle: "Generate architectural blueprint from actual graph",
        x: Math.round((requiredW - gwW) / 2),
        y: currentInfraY + 16,
        width: gwW,
        height: 56
      };

      const finalHeight = convergenceNode.y + convergenceNode.height + 80;

      return {
        root: { x: rootX, y: rootY, width: rootW, height: rootH },
        activeType: { x: typeX, y: typeY, width: typeW, height: typeH },
        selectedFocusNodes,
        pathNode,
        stackAncestorNode,
        stackNodes: selectedStackTechs,
        infraHeaderNodes,
        infraOptionNodes,
        convergenceNode,
        contentBounds: { x: 0, y: 0, width: requiredW, height: finalHeight }
      };
    }

    // ── Mobile layout: single-column vertical flow ──
    const colW = Math.min(340, Math.max(280, svgWidth - 32));
    const rootW = colW;
    const rootH = 165;
    const typeW = colW;
    const typeH = 160;
    const pathW = colW;
    const pathH = 140;
    const groupW = colW;
    const groupH = 56;
    const optW = colW;
    const optH = 68;
    const optGap = 10;

    const rootX = Math.round((svgWidth - rootW) / 2);
    const rootY = 32;
    const typeX = Math.round((svgWidth - typeW) / 2);
    const typeY = rootY + rootH + 32;
    let currentY = typeY + typeH + 36;

    // Focus siblings (2+1 responsive arrangement)
    const { selectedNodes: selectedFocusNodes, nextY } = GraphLayout.computeMobileFocusLayout(selectedFocusItems, svgWidth, currentY);
    currentY = nextY;

    // Path
    const pathNode = {
      ...(chosenPath || {}),
      x: Math.round((svgWidth - pathW) / 2),
      y: currentY,
      width: pathW,
      height: pathH,
      isSelected: true
    };
    currentY += pathH + 36;

    // Stage 5 locked stack ancestor node
    const stackSummaryText = selectedStackTechs.map(t => t.title).join(" • ");
    const stackAncestorW = colW;
    const stackAncestorH = 64;
    const stackAncestorNode = {
      id: "stage5-stack-ancestor",
      type: "stack-ancestor",
      title: "TECHNOLOGY STACK LOCKED",
      subtitle: stackSummaryText || "Core Stack Configured",
      techs: selectedStackTechs,
      x: Math.round((svgWidth - stackAncestorW) / 2),
      y: currentY,
      width: stackAncestorW,
      height: stackAncestorH,
      isSelected: true
    };
    currentY += stackAncestorH + 32;

    // Infra Groups
    const infraHeaderNodes = [];
    const infraOptionNodes = [];

    infraGroups.forEach(group => {
      infraHeaderNodes.push({
        id: `infra-header-${group.id}`,
        type: "infra-header",
        groupId: group.id,
        title: group.title,
        subtitle: group.subtitle,
        selectionMode: group.selectionMode,
        hasShuffle: Boolean(group.hasShuffle),
        x: Math.round((svgWidth - groupW) / 2),
        y: currentY,
        width: groupW,
        height: groupH
      });
      currentY += groupH + 12;

      (group.options || []).forEach(opt => {
        const currentVal = selectedInfra[group.id];
        const isSelected = Array.isArray(currentVal) ? currentVal.includes(opt.id) : currentVal === opt.id;
        infraOptionNodes.push({
          id: `infra-opt-${group.id}-${opt.id}`,
          type: "infra-card",
          groupId: group.id,
          optionId: opt.id,
          title: opt.title,
          category: opt.category || group.title,
          tagline: opt.tagline,
          description: opt.description,
          iconId: opt.iconId,
          isSelected,
          isRecommended: Boolean(opt.isRecommended),
          selectionMode: group.selectionMode,
          x: Math.round((svgWidth - optW) / 2),
          y: currentY,
          width: optW,
          height: optH
        });
        currentY += optH + optGap;
      });

      currentY += 20;
    });

    const gwW = Math.min(320, Math.max(260, svgWidth - 48));
    const convergenceNode = {
      id: "growth-action-blueprint",
      type: "growth-action",
      title: "SYNTHESIZE PROJECT BLUEPRINT →",
      subtitle: "Generate architectural blueprint",
      x: Math.round((svgWidth - gwW) / 2),
      y: currentY + 12,
      width: gwW,
      height: 56
    };

    const finalHeight = convergenceNode.y + convergenceNode.height + 60;

    return {
      root: { x: rootX, y: rootY, width: rootW, height: rootH },
      activeType: { x: typeX, y: typeY, width: typeW, height: typeH },
      selectedFocusNodes,
      pathNode,
      stackAncestorNode,
      stackNodes: selectedStackTechs,
      infraHeaderNodes,
      infraOptionNodes,
      convergenceNode,
      contentBounds: { x: 0, y: 0, width: svgWidth, height: finalHeight }
    };
  }

  /**
   * Computes Stage 7 coordinates: PROJECT BLUEPRINT
   * Directly maps actual projectGraph nodes and connections into a scalable,
   * non-linear tree-root / web-like architectural DAG diagram.
   * Zero invented nodes. Fully responsive across desktop and mobile canvases.
   */
  static getStage7Positions({
    svgWidth = 1200,
    svgHeight = 800,
    graphNodes = [],
    connections = [],
    isMobile = false
  } = {}) {
    if (!graphNodes || graphNodes.length === 0) {
      return {
        positionedLayers: [],
        blueprintNodes: [],
        contentBounds: { x: 0, y: 0, width: svgWidth, height: svgHeight },
        connections: []
      };
    }

    const nodeMap = new Map();
    graphNodes.forEach(n => nodeMap.set(n.id, n));

    // Build directed adjacency: parent -> children and child -> parents
    const childrenMap = new Map();
    const parentsMap = new Map();
    graphNodes.forEach(n => {
      childrenMap.set(n.id, []);
      parentsMap.set(n.id, []);
    });

    const addEdge = (fromId, toId) => {
      if (nodeMap.has(fromId) && nodeMap.has(toId) && fromId !== toId) {
        if (!childrenMap.get(fromId).includes(toId)) {
          childrenMap.get(fromId).push(toId);
        }
        if (!parentsMap.get(toId).includes(fromId)) {
          parentsMap.get(toId).push(fromId);
        }
      }
    };

    // 1. From connections
    if (Array.isArray(connections)) {
      connections.forEach(c => {
        if (c && c.fromNodeId && c.toNodeId) {
          addEdge(c.fromNodeId, c.toNodeId);
        }
      });
    }

    // 2. From node.parentIds
    graphNodes.forEach(n => {
      if (Array.isArray(n.parentIds)) {
        n.parentIds.forEach(pid => addEdge(pid, n.id));
      }
    });

    // Find roots (nodes with 0 incoming edges, or type === 'root', or 'root-project')
    let roots = graphNodes.filter(n => parentsMap.get(n.id).length === 0 || n.type === "root" || n.id === "root-project");
    if (roots.length === 0 && graphNodes.length > 0) {
      roots = [graphNodes[0]];
    }

    // Topological depth computation (longest directed path from any root in DAG)
    const depthMap = new Map();
    const getDepth = (nodeId, visited = new Set()) => {
      if (depthMap.has(nodeId)) return depthMap.get(nodeId);
      if (visited.has(nodeId)) return 0; // cycle guard
      visited.add(nodeId);

      const pids = parentsMap.get(nodeId) || [];
      if (pids.length === 0) {
        depthMap.set(nodeId, 0);
        return 0;
      }

      let maxP = 0;
      for (const pid of pids) {
        maxP = Math.max(maxP, getDepth(pid, new Set(visited)) + 1);
      }
      depthMap.set(nodeId, maxP);
      return maxP;
    };

    graphNodes.forEach(n => getDepth(n.id));

    // Group nodes by topological depth
    const maxDepth = Math.max(0, ...Array.from(depthMap.values()));
    const depthLevels = [];
    for (let d = 0; d <= maxDepth; d++) {
      depthLevels[d] = [];
    }
    graphNodes.forEach(n => {
      const d = depthMap.get(n.id) || 0;
      depthLevels[d].push(n);
    });

    // Scalable node sizing & spacing
    const cardW = isMobile ? 220 : 250;
    const cardH = isMobile ? 74 : 80;
    const gapX = isMobile ? 24 : 36;
    const levelGapY = isMobile ? 76 : 92;

    const positions = new Map();

    // ── Level 0: Roots ──
    const rootLevel = depthLevels[0];
    const totalRootW = rootLevel.length * cardW + (rootLevel.length - 1) * gapX;
    const rootStartX = -Math.round(totalRootW / 2);
    rootLevel.forEach((r, i) => {
      positions.set(r.id, {
        x: rootStartX + i * (cardW + gapX),
        y: 40,
        width: cardW,
        height: cardH
      });
    });

    // ── Subsequent Levels: Tree Fanning & Convergence Centering ──
    for (let d = 1; d <= maxDepth; d++) {
      const levelNodes = depthLevels[d];
      if (levelNodes.length === 0) continue;

      const levelY = 40 + d * (cardH + levelGapY);

      // Preferred X center based on placed parents
      const nodeLayoutData = levelNodes.map(n => {
        const pids = parentsMap.get(n.id) || [];
        const placedParents = pids.filter(pid => positions.has(pid)).map(pid => positions.get(pid));

        let prefCenterX = 0;
        if (placedParents.length > 0) {
          const sumCenterX = placedParents.reduce((acc, p) => acc + (p.x + p.width / 2), 0);
          prefCenterX = sumCenterX / placedParents.length;
        }

        return {
          node: n,
          parents: placedParents,
          parentIds: pids.filter(pid => positions.has(pid)),
          prefCenterX,
          isConvergent: placedParents.length > 1
        };
      });

      // ── Symmetrical Subtree Centering ──
      // Group sibling nodes sharing the same parent anchor so subtrees fan out symmetrically
      // around their parent's center instead of skewing to the right.
      const clusterMap = new Map();
      nodeLayoutData.forEach(item => {
        const clusterKey = item.parentIds.length > 0 ? item.parentIds.slice().sort().join("|") : `orphan-${item.node.id}`;
        if (!clusterMap.has(clusterKey)) {
          clusterMap.set(clusterKey, []);
        }
        clusterMap.get(clusterKey).push(item);
      });

      // Position each sibling cluster symmetrically around its preferred center
      const placed = [];
      clusterMap.forEach((clusterItems) => {
        // Sort siblings within the cluster alphabetically or by title for stable ordering
        clusterItems.sort((a, b) => (a.node.title || a.node.id).localeCompare(b.node.title || b.node.id));

        const k = clusterItems.length;
        const clusterSpan = k * cardW + (k - 1) * gapX;
        const clusterPrefCenter = clusterItems.reduce((acc, it) => acc + it.prefCenterX, 0) / k;
        const clusterStartX = Math.round(clusterPrefCenter - clusterSpan / 2);

        clusterItems.forEach((item, idx) => {
          placed.push({
            ...item,
            x: clusterStartX + idx * (cardW + gapX),
            width: cardW,
            height: cardH
          });
        });
      });

      // Sort placed nodes horizontally by X coordinate
      placed.sort((a, b) => a.x - b.x);

      // Left-to-right collision resolution between adjacent clusters/nodes
      for (let i = 1; i < placed.length; i++) {
        const prev = placed[i - 1];
        const curr = placed[i];
        const minX = prev.x + prev.width + gapX;
        if (curr.x < minX) {
          curr.x = minX;
        }
      }

      // Re-center whole level if collisions pushed nodes asymmetrically
      if (placed.length > 0) {
        const avgParentCenter = nodeLayoutData.reduce((acc, item) => acc + item.prefCenterX, 0) / nodeLayoutData.length;
        const levelCurrentCenter = (placed[0].x + placed[placed.length - 1].x + cardW) / 2;
        const drift = avgParentCenter - levelCurrentCenter;
        if (Math.abs(drift) > 1) {
          placed.forEach(item => {
            item.x = Math.round(item.x + drift);
          });
        }
      }

      // Save level positions
      placed.forEach(item => {
        positions.set(item.node.id, {
          x: item.x,
          y: levelY,
          width: cardW,
          height: cardH
        });
      });
    }

    // ── Multi-Parent Convergence Alignment Pass ──
    // Nodes with >= 2 parents (e.g. SQLite connected from GDScript & RPG Combat)
    // are centered under the span of their parents if no horizontal collision occurs.
    for (let d = 1; d <= maxDepth; d++) {
      const levelNodes = depthLevels[d];
      levelNodes.forEach(n => {
        const pids = parentsMap.get(n.id) || [];
        if (pids.length > 1) {
          const placedParents = pids.filter(pid => positions.has(pid)).map(pid => positions.get(pid));
          if (placedParents.length > 1) {
            const minParentX = Math.min(...placedParents.map(p => p.x + p.width / 2));
            const maxParentX = Math.max(...placedParents.map(p => p.x + p.width / 2));
            const targetCenterX = (minParentX + maxParentX) / 2;
            const targetX = Math.round(targetCenterX - cardW / 2);

            const currPos = positions.get(n.id);
            const otherNodesAtLevel = levelNodes.filter(other => other.id !== n.id);
            const wouldCollide = otherNodesAtLevel.some(other => {
              const oPos = positions.get(other.id);
              return Math.abs(oPos.x - targetX) < (cardW + gapX);
            });

            if (!wouldCollide) {
              currPos.x = targetX;
            }
          }
        }
      });
    }

    // Compute bounding extent
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    positions.forEach(pos => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + pos.width);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y + pos.height);
    });

    if (minX === Infinity) {
      minX = 0; maxX = svgWidth; minY = 0; maxY = svgHeight;
    }

    // Normalize coordinates with comfortable margins
    const marginX = isMobile ? 32 : 60;
    const marginY = 48;
    const shiftX = marginX - minX;
    const shiftY = marginY - minY;

    positions.forEach(pos => {
      pos.x += shiftX;
      pos.y += shiftY;
    });

    const totalContentW = (maxX - minX) + marginX * 2;
    const totalContentH = (maxY - minY) + marginY * 2 + 50;

    // Center horizontally if content fits within svgWidth
    if (totalContentW < svgWidth) {
      const extraCenteringX = Math.round((svgWidth - totalContentW) / 2);
      positions.forEach(pos => {
        pos.x += extraCenteringX;
      });
    }

    // Construct blueprintNodes (exact 1:1 match with graphNodes)
    const blueprintNodes = graphNodes.map(n => {
      const pos = positions.get(n.id) || { x: 40, y: 40, width: cardW, height: cardH };
      return {
        ...n,
        type: "blueprint-node",
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        depth: depthMap.get(n.id) || 0,
        isCompact: isMobile
      };
    });

    const contentBounds = {
      x: 0,
      y: 0,
      width: Math.max(svgWidth, totalContentW),
      height: Math.max(svgHeight, totalContentH)
    };

    return {
      positionedLayers: [],
      blueprintNodes,
      contentBounds,
      connections: connections || []
    };
  }

  /**
   * Retrieves specific port coordinate on a node.
   */
  static getPortCoordinate(node, side = "bottom") {
    const x = node.x || 0;
    const y = node.y || 0;
    const w = node.width || 0;
    const h = node.height || 0;

    switch (side) {
      case "top":
        return { x: x + Math.round(w / 2), y };
      case "bottom":
        return { x: x + Math.round(w / 2), y: y + h };
      case "left":
        return { x, y: y + Math.round(h / 2) };
      case "right":
        return { x: x + w, y: y + Math.round(h / 2) };
      default:
        return { x: x + Math.round(w / 2), y: y + h };
    }
  }

  /**
   * Generates cubic Bézier path data between two points.
   * Blueprint mode: Crisp CAD vertical curves.
   * Root mode: Organic S-curves mimicking natural botanical branching.
   */
  static generateBezierPath(start, end, theme = "blueprint") {
    const deltaY = end.y - start.y;
    const deltaX = end.x - start.x;

    if (theme === "root") {
      // Natural organic botanical growth curves mimicking living root systems & tree limbs
      const vertDist = Math.max(32, Math.abs(deltaY) * 0.52);
      const lateralSway = deltaX === 0
        ? Math.sin(start.y * 0.04) * 6
        : (deltaX > 0 ? 1 : -1) * Math.min(16, Math.abs(deltaX) * 0.08);

      const cp1x = Math.round(start.x + lateralSway);
      const cp1y = Math.round(start.y + vertDist);
      const cp2x = Math.round(end.x - lateralSway * 0.5);
      const cp2y = Math.round(end.y - vertDist);
      return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
    } else {
      const controlDistY = Math.max(24, Math.abs(deltaY) * 0.5);
      const cp1x = start.x;
      const cp1y = start.y + controlDistY;
      const cp2x = end.x;
      const cp2y = end.y - controlDistY;
      return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
    }
  }
}
