import { knowledgeGraph, assembleKnowledge } from "../js/knowledge.js";
import { Frontier } from "../js/frontier.js";
import { GAME_ENTRY_IDS } from "../js/data/gameSeeds.js";

assembleKnowledge();
const f = new Frontier(knowledgeGraph);
knowledgeGraph.register({ id: "__root__", kind: "start", title: "Start", unlocks: GAME_ENTRY_IDS });
f.commit("__root__", null);

const path = ["genre-roguelike", "rl-dungeon", "rl-rooms", "rl-room-gen", "rl-gen-random",
    "rl-gen-algorithm", "gen-bsp", "rl-monsters", "monster-ai", "ai-behavior-tree"];
path.forEach(id => f.commit(id));

f.rollbackTo("rl-monsters");

console.log("committed:", f.committed.map(n => n.seedId).join(" > "));
console.log("\noffered:", f.offered.map(s => s.id).join(", "));

console.log("\n--- parent attribution of committed nodes ---");
f.committed.forEach(n => console.log(`  ${n.seedId}  parent=${n.parentId}`));

console.log("\n--- rl-rooms children + their modes ---");
knowledgeGraph.getChildrenOf("rl-rooms").forEach(c => console.log(`  ${c.id}  mode=${c.mode}`));

console.log("\n--- rl-room-gen children + modes ---");
knowledgeGraph.getChildrenOf("rl-room-gen").forEach(c => console.log(`  ${c.id}  mode=${c.mode}`));

console.log("\n--- rl-gen-random children + modes ---");
knowledgeGraph.getChildrenOf("rl-gen-random").forEach(c => console.log(`  ${c.id}  mode=${c.mode}`));