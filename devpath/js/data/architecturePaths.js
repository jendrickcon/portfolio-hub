/**
 * PROJECT BLUEPRINT // Architecture Paths Canonical Technical Data
 * Strictly canonical technical data model.
 * Presentation layer (icons, SVG rendering, theme curves) is decoupled into the renderer.
 */

export const ARCHITECTURE_PATHS = {
  website: [
    {
      id: "static-jamstack",
      title: "STATIC / JAMSTACK",
      category: "ARCHITECTURE PATH",
      tagline: "Fast, Content-Driven & Edge-Delivered",
      description: "Pre-rendered static HTML/CSS/JS, headless CMS, minimal server overhead, and instantaneous CDN edge caching.",
      confirmation: "Your web architecture is classified as a Static / JAMstack site."
    },
    {
      id: "fullstack-web",
      title: "FULL-STACK WEB APP",
      category: "ARCHITECTURE PATH",
      tagline: "Client, Server & Database Integration",
      description: "Dynamic user sessions, relational/NoSQL database persistence, server-side APIs, and real-time state management.",
      confirmation: "Your web architecture is classified as a Full-Stack Web Application."
    },
    {
      id: "interactive-spa",
      title: "INTERACTIVE CANVAS / SPA",
      category: "ARCHITECTURE PATH",
      tagline: "Rich Visuals, State & Real-Time Tooling",
      description: "Single-page web applications with real-time state, WebSockets, interactive canvas/WebGL graphics, or creative dashboards.",
      confirmation: "Your web architecture is classified as an Interactive Canvas / Single-Page Application."
    }
  ],

  game: [
    {
      id: "game-2d",
      title: "2D GAME ENGINE",
      category: "ARCHITECTURE PATH",
      tagline: "Sprites, Tilemaps & Physics",
      description: "2D viewport rendering, collision detection, sprite sheet animations, tilemaps, and platformer/RPG gameplay loops.",
      confirmation: "Your game architecture is classified with a 2D Game Engine."
    },
    {
      id: "game-3d",
      title: "3D GAME ENGINE",
      category: "ARCHITECTURE PATH",
      tagline: "Spatial Worlds, Meshes & Shaders",
      description: "3D scene graph, polygon meshes, materials, shaders, dynamic camera rigs, and immersive 3D simulations.",
      confirmation: "Your game architecture is classified with a 3D Game Engine."
    },
    {
      id: "game-browser",
      title: "BROWSER / WEB GAME",
      category: "ARCHITECTURE PATH",
      tagline: "Canvas, WebGL & Instant Play",
      description: "Zero-install browser games leveraging HTML5 Canvas, WebGL, Web Audio, and responsive touch/keyboard controls.",
      confirmation: "Your game architecture is classified as a Browser / Web Game."
    }
  ],

  software: [
    {
      id: "desktop-app",
      title: "DESKTOP APPLICATION",
      category: "ARCHITECTURE PATH",
      tagline: "Native OS Window & System Access",
      description: "Cross-platform or native desktop app with local OS windowing, filesystem access, and desktop UI frameworks.",
      confirmation: "Your software architecture is classified as a Desktop Application."
    },
    {
      id: "cli-utility",
      title: "CLI & DEVELOPER UTILITY",
      category: "ARCHITECTURE PATH",
      tagline: "Command Line, Scripts & Automation",
      description: "Terminal-driven tool featuring argument parsing, standard I/O streaming, background worker tasks, and developer automation.",
      confirmation: "Your software architecture is classified as a CLI / Developer Utility."
    },
    {
      id: "backend-service",
      title: "BACKEND & API SERVICE",
      category: "ARCHITECTURE PATH",
      tagline: "Microservices, Endpoints & Daemons",
      description: "Headless server services, background daemon processes, REST/gRPC API routing, task queues, and data pipelines.",
      confirmation: "Your software architecture is classified as a Backend & API Service."
    }
  ]
};

