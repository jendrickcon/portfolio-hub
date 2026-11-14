/**
 * Drives the graph-first roadmap end to end in a real browser.
 *
 * IMPORTANT: Playwright's page.evaluate runs in an ISOLATED WORLD, so
 * globals the page sets (window.DevPath) are NOT visible here. This test
 * therefore drives and asserts entirely through the DOM, which IS shared
 * between worlds. Anything that needs app state is read from the DOM the
 * app renders — which also means the test verifies what the user sees,
 * not an internal object.
 *
 * Covers: name entry → project type → deep roguelike path → exclusivity
 * → branch navigation → rollback.
 */
export default async function run(page, ui) {
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

  const steps = [];

  // ── DOM readers (shared across worlds) ──
  const offered = () => page.evaluate(() =>
    Array.from(document.querySelectorAll(".graph-node"))
      .map(el => el.getAttribute("data-node-id") || "")
      .filter(id => id.startsWith("offer::"))
      .map(id => id.replace("offer::", ""))
  );

  const committed = () => page.evaluate(() =>
    Array.from(document.querySelectorAll(".graph-node"))
      .map(el => el.getAttribute("data-node-id") || "")
      .filter(id => id.startsWith("node::"))
      .map(id => id.replace("node::", ""))
  );

  const badge = () => page.evaluate(() =>
    document.querySelector("#bp-stage-badge-text")?.textContent?.trim() || ""
  );

  const breadcrumb = () => page.evaluate(() =>
    document.querySelector("#bc-focus-names")?.textContent?.trim() || ""
  );

  const clickOffer = async seedId => {
    const ok = await page.evaluate(id => {
      const card = document.querySelector(`[data-node-id='offer::${id}'] .choice-card-inner`);
      if (!card) return false;
      card.click();
      return true;
    }, seedId);
    await page.waitForTimeout(450);
    return ok;
  };

  // ── 1. Project name ──
  const snap = await ui.snapshot();
  const inputRef = snap.match(/@(e\d+) textbox/)?.[1];
  if (!inputRef) return { error: "no project name textbox", snapshot: snap };

  await ui.fill(inputRef, "Roguelike Prototype");
  await page.evaluate(() => document.querySelector("#bp-btn-begin")?.click());
  await page.waitForTimeout(800);

  steps.push({
    step: "name submitted",
    typeCards: await page.evaluate(() =>
      document.querySelectorAll("[data-node-id^='type-offer::']").length)
  });

  // ── 2. Choose GAME ──
  await page.evaluate(() =>
    document.querySelector("[data-node-id='type-offer::game'] .branch-card-inner")?.click());
  await page.waitForTimeout(900);

  const genreOffers = await offered();
  steps.push({ step: "GAME chosen", offeredGenres: genreOffers });

  // ── 3. Walk the roguelike path by clicking real cards ──
  const path = [
    "genre-roguelike", "rl-dungeon", "rl-rooms", "rl-room-gen",
    "rl-gen-random", "rl-gen-algorithm", "gen-bsp", "rl-monsters",
    "monster-ai", "ai-behavior-tree"
  ];

  for (const seedId of path) {
    const clicked = await clickOffer(seedId);
    steps.push({
      step: seedId,
      ok: clicked,
      committed: (await committed()).length,
      offered: (await offered()).length
    });
    if (!clicked) break;
  }

  // ── 4. Exclusivity: choosing gen-bsp must hide the sibling algorithms ──
  const offeredNow = await offered();
  const exclusivityHeld = !offeredNow.includes("gen-cellular")
    && !offeredNow.includes("gen-wfc")
    && !offeredNow.includes("gen-graph");
  const independentSurvived = offeredNow.includes("rl-room-types")
    && offeredNow.includes("rl-connections");

  // ── 5. Branch navigation moves the focused node ──
  const focusBefore = await page.evaluate(() =>
    document.querySelector(".graph-node.nav-focused")?.getAttribute("data-node-id") || null);
  await page.click("#nav-next-branch");
  await page.waitForTimeout(300);
  const focusAfter = await page.evaluate(() =>
    document.querySelector(".graph-node.nav-focused")?.getAttribute("data-node-id") || null);

  // ── 6. Step back through the path ──
  const committedBefore = (await committed()).length;
  await page.click("#bp-btn-back");
  await page.waitForTimeout(700);
  const committedAfter = (await committed()).length;

  return {
    steps,
    finalCommitted: await committed(),
    offeredAtEnd: offeredNow,
    exclusivityHeld,
    independentTopicsSurvived: independentSurvived,
    navigation: {
      before: focusBefore,
      after: focusAfter,
      moved: focusBefore !== focusAfter
    },
    stepBack: { before: committedBefore, after: committedAfter, worked: committedAfter < committedBefore },
    badge: await badge(),
    breadcrumb: await breadcrumb(),
    pageErrors: errors
  };
}