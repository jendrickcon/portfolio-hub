/**
 * CYBER DEFENDER — Application Entry Point
 */

import { game } from "./game.js";
import { state } from "./state.js";
import "./cheats.js";
import "./studio.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[CyberDefender]: DOM Ready. Booting application...");
  game.init();
});

