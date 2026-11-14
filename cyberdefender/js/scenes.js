/**
 * CYBER DEFENDER — Scene Management
 * Smoothly transitions between UI views while preserving underlying state.
 */

import { events } from "./state.js";

export const SCENES = {
  BOOT: "scene-boot",
  MENU: "scene-menu",
  DEPLOYMENT: "scene-deployment",
  OVERWORLD: "scene-overworld",
  BATTLE: "scene-battle",
  PROFILE: "scene-profile",
  SETTINGS: "scene-settings"
};

class SceneManager {
  constructor() {
    this.currentScene = null;
    this.previousScene = null;
    this.sceneElements = new Map();
    this.lifecycleHooks = new Map();
  }

  init() {
    Object.entries(SCENES).forEach(([key, elementId]) => {
      const el = document.getElementById(elementId);
      if (el) {
        this.sceneElements.set(key, el);
      } else {
        console.warn(`[SceneManager]: Container element #${elementId} not found in DOM`);
      }
    });
  }

  registerHooks(sceneKey, hooks = {}) {
    this.lifecycleHooks.set(sceneKey, hooks);
  }

  change(sceneKey, params = {}) {
    if (!this.sceneElements.has(sceneKey)) {
      console.error(`[SceneManager]: Unknown scene key "${sceneKey}"`);
      return;
    }

    const previousKey = this.currentScene;
    if (previousKey) {
      const prevEl = this.sceneElements.get(previousKey);
      if (prevEl) prevEl.classList.remove("scene-active");

      const prevHooks = this.lifecycleHooks.get(previousKey);
      if (prevHooks && typeof prevHooks.onExit === "function") {
        prevHooks.onExit();
      }
    }

    this.previousScene = previousKey;
    this.currentScene = sceneKey;

    const currentEl = this.sceneElements.get(sceneKey);
    if (currentEl) {
      currentEl.classList.add("scene-active");
    }

    const currentHooks = this.lifecycleHooks.get(sceneKey);
    if (currentHooks && typeof currentHooks.onEnter === "function") {
      currentHooks.onEnter(params);
    }

    events.emit("sceneChanged", {
      current: sceneKey,
      previous: previousKey,
      params
    });
  }

  back() {
    if (this.previousScene) {
      this.change(this.previousScene);
    } else {
      this.change("MENU");
    }
  }
}

export const scenes = new SceneManager();

if (typeof window !== "undefined") {
  window.CyberScenes = { scenes, SCENES };
}

