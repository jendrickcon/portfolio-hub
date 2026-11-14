/**
 * PROJECT BLUEPRINT // Technology Stack Canonical Data
 * Stage 5 data model: for each Stage 4 architecture path, three parallel "tiers"
 * (configuration stages) that each offer sibling technology choices.
 *
 * Structure:
 *   TECHNOLOGY_STACKS[architecturePathId] = [ tier, tier, tier ]
 *   tier = { id, title, subtitle, options: [{ id, title, category, tagline, description, iconId }] }
 *
 * Tiers are sequential configuration stages; the options inside a tier are siblings.
 */

export const TECHNOLOGY_STACKS = {
  // ── WEBSITE ────────────────────────────────
  "static-jamstack": [
    {
      id: "framework",
      title: "STATIC SITE FRAMEWORK",
      subtitle: "Pre-render & Content Layer",
      options: [
        { id: "astro", title: "Astro", category: "FRAMEWORK", tagline: "Content-first islands", description: "Ships zero JS by default with selective hydration islands.", iconId: "framework" },
        { id: "eleventy", title: "Eleventy", category: "FRAMEWORK", tagline: "Simple static generator", description: "Fast, template-agnostic static site generator.", iconId: "framework" },
        { id: "next-export", title: "Next.js (Export)", category: "FRAMEWORK", tagline: "React static export", description: "React-based SSG with a familiar component model.", iconId: "framework" }
      ]
    },
    {
      id: "styling",
      title: "STYLING SYSTEM",
      subtitle: "Presentation & Design Tokens",
      options: [
        { id: "tailwind", title: "Tailwind CSS", category: "STYLING", tagline: "Utility-first CSS", description: "Composable utility classes with design-token theming.", iconId: "styling" },
        { id: "vanilla-css", title: "Vanilla CSS", category: "STYLING", tagline: "Hand-authored stylesheets", description: "Zero-dependency plain CSS with custom properties.", iconId: "styling" },
        { id: "sass", title: "Sass / SCSS", category: "STYLING", tagline: "Preprocessed stylesheets", description: "Variables, nesting, and mixins compiled to CSS.", iconId: "styling" }
      ]
    },
    {
      id: "deployment",
      title: "EDGE DEPLOYMENT",
      subtitle: "Hosting & CDN Delivery",
      options: [
        { id: "netlify", title: "Netlify", category: "DEPLOYMENT", tagline: "Git-driven edge hosting", description: "Zero-config deploys with global edge caching.", iconId: "cloud" },
        { id: "vercel", title: "Vercel", category: "DEPLOYMENT", tagline: "Frontend cloud platform", description: "Instant previews and edge-network delivery.", iconId: "cloud" },
        { id: "github-pages", title: "GitHub Pages", category: "DEPLOYMENT", tagline: "Free static hosting", description: "Simple, version-controlled static hosting.", iconId: "cloud" }
      ]
    }
  ],

  "fullstack-web": [
    {
      id: "frontend",
      title: "CLIENT / FRONTEND",
      subtitle: "UI Component Architecture",
      options: [
        {
          id: "react",
          title: "React",
          category: "FRONTEND",
          tagline: "UI component library",
          description: "Declarative, component-based UI layer.",
          iconId: "frontend",
          relationships: ["ui-components", "client-state", "api-client"],
          expansionSubtree: {
            title: "React UI Subtree",
            modules: [
              { id: "react-components", title: "Component Hierarchy", category: "UI", iconId: "frontend" },
              { id: "react-state", title: "Client State Store", category: "STATE", iconId: "database" }
            ]
          }
        },
        { id: "vue", title: "Vue.js", category: "FRONTEND", tagline: "Progressive framework", description: "Approachable, performant reactive UI framework.", iconId: "frontend" },
        { id: "svelte", title: "Svelte", category: "FRONTEND", tagline: "Compiled reactivity", description: "Compiles components down to tiny vanilla JS.", iconId: "frontend" }
      ]
    },
    {
      id: "backend",
      title: "SERVER / BACKEND",
      subtitle: "API & Business Logic Engine",
      options: [
        { id: "express", title: "Express", category: "BACKEND", tagline: "Fast unopinionated Node.js", description: "Minimalist server framework for Node.js.", iconId: "backend" },
        {
          id: "fastapi",
          title: "FastAPI",
          category: "BACKEND",
          tagline: "Modern, high-perf Python",
          description: "High-performance async Python web API engine.",
          iconId: "backend",
          dependencies: ["postgresql"],
          relationships: ["async-endpoints", "pydantic-models", "celery-workers"],
          expansionSubtree: {
            title: "FastAPI Architecture Subtree",
            modules: [
              { id: "fastapi-routers", title: "Async Route Handlers", category: "API", iconId: "backend" },
              { id: "pydantic-schemas", title: "Pydantic Schemas", category: "SCHEMA", iconId: "devtools" }
            ]
          }
        },
        { id: "spring-boot", title: "Spring Boot", category: "BACKEND", tagline: "Enterprise Java backend", description: "Production-grade, highly scalable backend services.", iconId: "backend" }
      ]
    },
    {
      id: "database",
      title: "PERSISTENCE / DATABASE",
      subtitle: "Data Layer & Storage Engine",
      options: [
        {
          id: "postgresql",
          title: "PostgreSQL",
          category: "DATABASE",
          tagline: "Advanced open-source SQL",
          description: "Rock-solid ACID relational persistence engine.",
          iconId: "database",
          relationships: ["relational-tables", "acid-transactions"],
          expansionSubtree: {
            title: "PostgreSQL Schema Subtree",
            modules: [
              { id: "sql-tables", title: "Relational Tables", category: "SCHEMA", iconId: "database" },
              { id: "sql-indexes", title: "B-Tree Indexes", category: "OPTIMIZATION", iconId: "analytics" }
            ]
          }
        },
        { id: "mongodb", title: "MongoDB", category: "DATABASE", tagline: "Distributed document store", description: "Flexible JSON document database for modern web apps.", iconId: "database" },
        { id: "sqlite", title: "SQLite / LibSQL", category: "DATABASE", tagline: "Serverless embedded SQL", description: "Ultra-fast zero-latency embedded database.", iconId: "database" }
      ]
    }
  ],

  "interactive-spa": [
    {
      id: "ui-layer",
      title: "UI / STATE LAYER",
      subtitle: "Reactive Interface & Store",
      options: [
        { id: "react", title: "React", category: "UI LAYER", tagline: "Component UI + hooks", description: "Declarative UI with mature state ecosystem.", iconId: "frontend" },
        { id: "solid", title: "SolidJS", category: "UI LAYER", tagline: "Fine-grained reactivity", description: "Fine-grained reactive primitives, no virtual DOM.", iconId: "frontend" },
        { id: "vanilla-spa", title: "Vanilla + Store", category: "UI LAYER", tagline: "Hand-rolled reactive core", description: "Framework-free SPA with a custom reactive store.", iconId: "frontend" }
      ]
    },
    {
      id: "rendering",
      title: "RENDERING ENGINE",
      subtitle: "Canvas, WebGL & Motion",
      options: [
        { id: "canvas2d", title: "Canvas 2D", category: "RENDERING", tagline: "Immediate-mode 2D graphics", description: "Direct pixel drawing for charts, editors, and tools.", iconId: "rendering" },
        { id: "webgl", title: "WebGL", category: "RENDERING", tagline: "GPU-accelerated 3D", description: "Hardware-accelerated 3D and shader pipelines.", iconId: "rendering" },
        { id: "threejs", title: "Three.js", category: "RENDERING", tagline: "High-level 3D toolkit", description: "Scene graph and materials built on WebGL.", iconId: "rendering" }
      ]
    },
    {
      id: "realtime",
      title: "REAL-TIME TRANSPORT",
      subtitle: "Live Sync & Eventing",
      options: [
        { id: "websockets", title: "WebSockets", category: "REALTIME", tagline: "Bidirectional live channel", description: "Persistent socket channel for low-latency updates.", iconId: "realtime" },
        { id: "sse", title: "Server-Sent Events", category: "REALTIME", tagline: "One-way event stream", description: "Simple HTTP streaming of live updates.", iconId: "realtime" },
        { id: "webrtc", title: "WebRTC", category: "REALTIME", tagline: "Peer-to-peer media/data", description: "Low-latency peer connections for audio, video, data.", iconId: "realtime" }
      ]
    }
  ],

  // ── GAME ───────────────────
  "game-2d": [
    {
      id: "engine",
      title: "GAME ENGINE",
      subtitle: "Core Loop & Scene System",
      options: [
        {
          id: "godot-2d",
          title: "Godot (2D)",
          category: "ENGINE",
          tagline: "Open-source 2D engine",
          description: "Scene-node engine with dedicated pixel-perfect 2D pipeline.",
          iconId: "engine",
          dependencies: ["gdscript", "csharp"],
          exclusions: ["gml", "lua", "typescript"],
          relationships: ["gameplay", "audio", "physics"],
          expansionSubtree: {
            title: "Godot Architecture Subtree",
            modules: [
              { id: "godot-nodes", title: "Scene Tree & Node Hierarchy", category: "CORE", iconId: "framework" },
              { id: "godot-gameplay", title: "Gameplay Systems", category: "COMPONENT", iconId: "action" },
              { id: "godot-audio", title: "AudioServer & Buses", category: "AUDIO", iconId: "assets" }
            ]
          }
        },
        {
          id: "unity-2d",
          title: "Unity 2D",
          category: "ENGINE",
          tagline: "Cross-platform 2D engine",
          description: "Mature 2D physics, Sprite Shape, and tilemap authoring.",
          iconId: "engine",
          dependencies: ["csharp"],
          exclusions: ["gdscript", "gml", "lua"],
          relationships: ["gameplay", "ui", "multiplayer"],
          expansionSubtree: {
            title: "Unity Architecture Subtree",
            modules: [
              { id: "unity-gameplay", title: "Gameplay Architecture", category: "COMPONENT", iconId: "action" },
              { id: "unity-ui", title: "UI Toolkit", category: "COMPONENT", iconId: "frontend" },
              { id: "unity-multiplayer", title: "Multiplayer & Netcode", category: "MODULE", iconId: "community",
                children: [
                  { id: "netcode-gameobjects", title: "Netcode for GameObjects", category: "NETWORKING", iconId: "realtime" },
                  { id: "game-backend", title: "Dedicated Game Server", category: "BACKEND", iconId: "backend" }
                ]
              }
            ]
          }
        },
        { id: "gamemaker", title: "GameMaker", category: "ENGINE", tagline: "Rapid 2D game authoring", description: "Fast 2D-first game authoring with rooms and sprite workflows.", iconId: "engine", dependencies: ["gml"], exclusions: ["gdscript", "csharp", "lua"] },
        { id: "defold", title: "Defold", category: "ENGINE", tagline: "Lightweight Lua engine", description: "Tiny binary footprint, fast startup, zero runtime bloat.", iconId: "engine", dependencies: ["lua"], exclusions: ["gdscript", "csharp", "gml"] },
        { id: "phaser", title: "Phaser", category: "ENGINE", tagline: "HTML5 2D game framework", description: "Batteries-included 2D engine for web, mobile web, and instant play.", iconId: "engine", dependencies: ["typescript"], exclusions: ["gdscript", "gml"] },
        { id: "love2d", title: "LÖVE", category: "ENGINE", tagline: "Lightweight Lua engine", description: "Minimal, clean 2D engine driven by Lua code.", iconId: "engine", dependencies: ["lua"], exclusions: ["gdscript", "csharp"] },
        { id: "construct", title: "Construct 3", category: "ENGINE", tagline: "Visual event engine", description: "Rapid browser-based authoring with visual event sheets.", iconId: "engine", dependencies: ["typescript"], exclusions: ["gdscript", "gml"] },
        { id: "raylib", title: "Raylib", category: "ENGINE", tagline: "Zero-boilerplate C/C++", description: "Minimalist, highly educational C/C++ game library.", iconId: "engine", dependencies: ["rust"], exclusions: ["gdscript", "gml"] },
        { id: "bevy", title: "Bevy", category: "ENGINE", tagline: "Data-driven Rust ECS", description: "High-performance data-driven 2D ECS engine in Rust.", iconId: "engine", dependencies: ["rust"], exclusions: ["gdscript", "gml", "csharp"] }
      ]
    },
    {
      id: "language",
      title: "SCRIPTING LANGUAGE",
      subtitle: "Logic & Gameplay Code",
      options: [
        { id: "gdscript", title: "GDScript", category: "LANGUAGE", tagline: "Godot-native scripting", description: "Engine-integrated, Pythonic high-productivity game scripting.", iconId: "language", compatibleWith: { engine: ["godot-2d"] } },
        { id: "csharp", title: "C# (.NET)", category: "LANGUAGE", tagline: "Typed OOP language", description: "Strongly-typed industry standard for Unity and Godot C#.", iconId: "language", compatibleWith: { engine: ["godot-2d", "unity-2d"] } },
        { id: "gml", title: "GML", category: "LANGUAGE", tagline: "GameMaker Language", description: "Ergonomic scripting tailored directly for 2D game loops.", iconId: "language", compatibleWith: { engine: ["gamemaker"] } },
        { id: "lua", title: "Lua", category: "LANGUAGE", tagline: "Embedded scripting", description: "Fast, embeddable scripting for Defold and LÖVE.", iconId: "language", compatibleWith: { engine: ["defold", "love2d"] } },
        { id: "typescript", title: "TypeScript", category: "LANGUAGE", tagline: "Typed JavaScript", description: "Static types and modular tooling for Phaser and web games.", iconId: "language", compatibleWith: { engine: ["phaser", "construct"] } },
        { id: "rust", title: "Rust", category: "LANGUAGE", tagline: "Memory-safe systems", description: "Zero-cost abstractions and extreme safety for Bevy and Raylib.", iconId: "language", compatibleWith: { engine: ["bevy", "raylib"] } }
      ]
    },
    {
      id: "assets",
      title: "ASSETS & AUDIO",
      subtitle: "Sprites, Tilemaps & Sound",
      options: [
        { id: "aseprite", title: "Aseprite", category: "ASSETS", tagline: "Pixel art & animation", description: "Sprite and animation authoring tool.", iconId: "assets" },
        { id: "tiled", title: "Tiled", category: "ASSETS", tagline: "Tilemap editor", description: "Level and tilemap authoring for 2D worlds.", iconId: "assets" },
        { id: "ldtk", title: "LDtk", category: "ASSETS", tagline: "Modern 2D level designer", description: "Rule-based tile layering and entity placement.", iconId: "assets" },
        { id: "fmod", title: "FMOD Studio", category: "ASSETS", tagline: "Interactive audio", description: "Adaptive, event-driven game audio system.", iconId: "assets" },
        { id: "wwise", title: "Wwise", category: "ASSETS", tagline: "Adaptive audio middleware", description: "Interactive audio graphs and profiling.", iconId: "assets" },
        { id: "spine", title: "Spine 2D", category: "ASSETS", tagline: "Skeletal 2D animation", description: "Fluid bone animation and mesh deformation for 2D sprites.", iconId: "assets" }
      ]
    }
  ],

  "game-3d": [
    {
      id: "engine",
      title: "GAME ENGINE",
      subtitle: "Renderer & Scene Graph",
      options: [
        { id: "unreal", title: "Unreal Engine", category: "ENGINE", tagline: "AAA photorealism", description: "Nanite virtualized geometry, Lumen GI, and high-end rendering.", iconId: "engine" },
        { id: "unity", title: "Unity", category: "ENGINE", tagline: "Cross-platform 3D engine", description: "Mature 3D engine with Universal and High Definition pipelines.", iconId: "engine" },
        { id: "godot-3d", title: "Godot (3D)", category: "ENGINE", tagline: "Open-source 3D engine", description: "Lightweight Forward+ open-source 3D scene engine.", iconId: "engine" },
        { id: "bevy-3d", title: "Bevy (3D)", category: "ENGINE", tagline: "Rust ECS 3D engine", description: "Clustered forward/deferred PBR renderer in Rust.", iconId: "engine" }
      ]
    },
    {
      id: "language",
      title: "SCRIPTING LANGUAGE",
      subtitle: "Logic & Systems Code",
      options: [
        { id: "csharp", title: "C#", category: "LANGUAGE", tagline: "Unity & Godot scripting", description: "Primary, performant gameplay language for Unity and Godot.", iconId: "language", compatibleWith: { engine: ["unity", "godot-3d"] } },
        { id: "cpp", title: "C++", category: "LANGUAGE", tagline: "High-performance systems", description: "Low-level native control for Unreal Engine and custom systems.", iconId: "language", compatibleWith: { engine: ["unreal", "godot-3d"] } },
        { id: "blueprints", title: "Visual Scripting", category: "LANGUAGE", tagline: "Node-based logic", description: "Node-graph gameplay logic in Unreal without raw code.", iconId: "language", compatibleWith: { engine: ["unreal"] } },
        { id: "rust", title: "Rust", category: "LANGUAGE", tagline: "Systems safety", description: "Memory safety and parallel ECS systems for Bevy.", iconId: "language", compatibleWith: { engine: ["bevy-3d"] } }
      ]
    },
    {
      id: "assets",
      title: "3D ASSETS & AUDIO",
      subtitle: "Meshes, Materials & Sound",
      options: [
        { id: "blender", title: "Blender", category: "ASSETS", tagline: "3D modeling & rigging", description: "Open-source modeling, rigging, and animation suite.", iconId: "assets" },
        { id: "substance", title: "Substance 3D", category: "ASSETS", tagline: "Procedural materials", description: "Procedural PBR texture and material authoring.", iconId: "assets" },
        { id: "wwise", title: "Wwise", category: "ASSETS", tagline: "Adaptive game audio", description: "Interactive, spatialized audio middleware.", iconId: "assets" },
        { id: "fmod", title: "FMOD Studio", category: "ASSETS", tagline: "Dynamic game audio", description: "Timeline-based sound events and adaptive music.", iconId: "assets" }
      ]
    }
  ],

  "game-browser": [
    {
      id: "engine",
      title: "WEB GAME ENGINE",
      subtitle: "Canvas & Runtime Core",
      options: [
        { id: "phaser", title: "Phaser", category: "ENGINE", tagline: "HTML5 2D framework", description: "Mature browser 2D game framework.", iconId: "engine" },
        { id: "threejs", title: "Three.js", category: "ENGINE", tagline: "WebGL 3D toolkit", description: "High-level WebGL for browser 3D games.", iconId: "engine" },
        { id: "babylon", title: "Babylon.js", category: "ENGINE", tagline: "Full web 3D engine", description: "Complete WebGL engine with game tooling.", iconId: "engine" }
      ]
    },
    {
      id: "language",
      title: "SCRIPTING LANGUAGE",
      subtitle: "Gameplay & Logic Code",
      options: [
        { id: "typescript", title: "TypeScript", category: "LANGUAGE", tagline: "Typed JavaScript", description: "Safer, typed gameplay code for the web.", iconId: "language" },
        { id: "javascript", title: "JavaScript", category: "LANGUAGE", tagline: "Native web scripting", description: "Zero-build, directly-in-the-browser scripting.", iconId: "language" },
        { id: "wasm", title: "WebAssembly", category: "LANGUAGE", tagline: "Near-native performance", description: "Compiled near-native modules for heavy logic.", iconId: "language" }
      ]
    },
    {
      id: "assets",
      title: "AUDIO & ASSETS",
      subtitle: "Sound, Sprites & Loading",
      options: [
        { id: "webaudio", title: "Web Audio API", category: "ASSETS", tagline: "Native browser audio", description: "Programmatic, low-latency browser audio graph.", iconId: "assets" },
        { id: "howler", title: "Howler.js", category: "ASSETS", tagline: "Simple audio library", description: "Cross-browser audio with an easy API.", iconId: "assets" },
        { id: "atlas", title: "Texture Atlas", category: "ASSETS", tagline: "Batched sprite sheets", description: "Packed sprite sheets for efficient rendering.", iconId: "assets" }
      ]
    }
  ],

  // ── SOFTWARE ───────────────────────────────
  "desktop-app": [
    {
      id: "shell",
      title: "APP SHELL",
      subtitle: "Window & Packaging Layer",
      options: [
        { id: "tauri", title: "Tauri", category: "SHELL", tagline: "Rust-powered light shell", description: "Tiny, secure desktop shell using OS system webviews.", iconId: "shell" },
        { id: "electron", title: "Electron", category: "SHELL", tagline: "Chromium + Node shell", description: "Web technologies packaged as cross-platform native desktop apps.", iconId: "shell" },
        { id: "qt", title: "Qt / QML", category: "SHELL", tagline: "Native cross-platform UI", description: "High-performance native toolkit for rich desktop applications.", iconId: "shell" },
        { id: "flutter-desktop", title: "Flutter Desktop", category: "SHELL", tagline: "Hardware-accelerated UI", description: "Skia/Impeller-rendered multi-platform UI with Dart.", iconId: "shell" },
        { id: "avalonia", title: "Avalonia UI", category: "SHELL", tagline: "Cross-platform .NET XAML", description: "Modern .NET desktop UI framework for Windows, macOS, Linux.", iconId: "shell" }
      ]
    },
    {
      id: "runtime",
      title: "CORE RUNTIME",
      subtitle: "Language & Process Model",
      options: [
        { id: "rust", title: "Rust", category: "RUNTIME", tagline: "Memory-safe performance", description: "Fast, safe systems language for core business and rendering logic.", iconId: "runtime" },
        { id: "nodejs", title: "Node.js", category: "RUNTIME", tagline: "JavaScript runtime", description: "Event-driven asynchronous runtime shared with frontend UI.", iconId: "runtime" },
        { id: "python", title: "Python", category: "RUNTIME", tagline: "Batteries-included runtime", description: "Rapid development and rich scientific/data ecosystem.", iconId: "runtime" },
        { id: "csharp-dotnet", title: "C# (.NET 8)", category: "RUNTIME", tagline: "Managed high-performance", description: "Cross-platform JIT/AOT runtime with async/await and LINQ.", iconId: "runtime" },
        { id: "go", title: "Go", category: "RUNTIME", tagline: "Lightweight concurrency", description: "Fast compiling, concurrent systems core with goroutines.", iconId: "runtime" }
      ]
    },
    {
      id: "storage",
      title: "LOCAL STORAGE",
      subtitle: "Persistence & State",
      options: [
        { id: "sqlite", title: "SQLite", category: "STORAGE", tagline: "Embedded relational SQL", description: "Zero-configuration ACID SQL stored in a single disk file.", iconId: "database" },
        { id: "duckdb", title: "DuckDB", category: "STORAGE", tagline: "Analytical columnar SQL", description: "In-process analytical database optimized for fast data queries.", iconId: "database" },
        { id: "leveldb", title: "LevelDB / RocksDB", category: "STORAGE", tagline: "Embedded key-value", description: "High write-throughput on-disk sorted key-value store.", iconId: "database" },
        { id: "filesystem", title: "Flat Files (JSON/TOML)", category: "STORAGE", tagline: "Configuration & state", description: "Human-readable file-backed persistence for settings and preferences.", iconId: "database" }
      ]
    }
  ],

  "cli-utility": [
    {
      id: "language",
      title: "IMPLEMENTATION LANGUAGE",
      subtitle: "Primary Development Language",
      options: [
        { id: "rust", title: "Rust", category: "LANGUAGE", tagline: "Fast & safe binaries", description: "High-performance, memory-safe CLI tools with zero runtime.", iconId: "language" },
        { id: "go", title: "Go", category: "LANGUAGE", tagline: "Static single binary", description: "Compiles to ultra-fast, dependency-free static binaries.", iconId: "language" },
        { id: "python", title: "Python", category: "LANGUAGE", tagline: "Expressive scripting", description: "Rapid authoring with rich standard libraries and ecosystem.", iconId: "language" },
        { id: "nodejs-cli", title: "Node.js", category: "LANGUAGE", tagline: "JavaScript / TypeScript", description: "Broad npm ecosystem and cross-platform terminal tooling.", iconId: "language" },
        { id: "zig", title: "Zig", category: "LANGUAGE", tagline: "Minimalist systems", description: "Zero hidden control flow and tiny binary footprints.", iconId: "language" }
      ]
    },
    {
      id: "cli-framework",
      title: "CLI FRAMEWORK & TUI",
      subtitle: "Parsing, Flags & Terminal UI",
      options: [
        { id: "clap", title: "Clap", category: "CLI", tagline: "Rust argument parser", description: "Declarative, type-safe CLI argument parser for Rust.", iconId: "framework" },
        { id: "cobra", title: "Cobra", category: "CLI", tagline: "Go command framework", description: "Standard nested command router powering Kubernetes and Hugo.", iconId: "framework" },
        { id: "click", title: "Click / Typer", category: "CLI", tagline: "Python composable CLI", description: "Decorator-based CLI authoring with automatic type coercion.", iconId: "framework" },
        { id: "bubbletea", title: "Bubble Tea", category: "CLI", tagline: "Elm architecture TUI", description: "Rich interactive terminal interfaces with animations and keybindings.", iconId: "framework" },
        { id: "ink", title: "Ink (React CLI)", category: "CLI", tagline: "React for CLI", description: "Build interactive terminal applications using React components.", iconId: "framework" }
      ]
    },
    {
      id: "distribution",
      title: "DISTRIBUTION & PACKAGING",
      subtitle: "Packaging, Delivery & Install",
      options: [
        { id: "homebrew", title: "Homebrew / Winget", category: "DISTRIBUTION", tagline: "OS package managers", description: "Effortless installation via standard package managers.", iconId: "cloud" },
        { id: "cargo-npm", title: "Cargo / npm / PyPI", category: "DISTRIBUTION", tagline: "Language registries", description: "Global language registry publication for developers.", iconId: "cloud" },
        { id: "github-releases", title: "GitHub Releases", category: "DISTRIBUTION", tagline: "Multi-arch binaries", description: "Automated CI/CD matrix releases for Linux, macOS, and Windows.", iconId: "cloud" },
        { id: "docker-cli", title: "OCI / Docker", category: "DISTRIBUTION", tagline: "Containerized tool", description: "Instant zero-install execution in container environments.", iconId: "cloud" }
      ]
    }
  ],

  "backend-service": [
    {
      id: "runtime",
      title: "SERVICE RUNTIME",
      subtitle: "Language & Server Core",
      options: [
        { id: "nodejs", title: "Node.js", category: "RUNTIME", tagline: "Async event-driven", description: "Non-blocking runtime for API services.", iconId: "runtime" },
        { id: "go", title: "Go", category: "RUNTIME", tagline: "Concurrent service core", description: "Lightweight concurrency for high-throughput services.", iconId: "runtime" },
        { id: "python", title: "Python", category: "RUNTIME", tagline: "Data & API ecosystem", description: "Rich ecosystem for APIs and data pipelines.", iconId: "runtime" }
      ]
    },
    {
      id: "api-layer",
      title: "API LAYER",
      subtitle: "Endpoints & Contracts",
      options: [
        { id: "rest", title: "REST", category: "API", tagline: "Resource-oriented HTTP", description: "Conventional, cacheable HTTP resource APIs.", iconId: "backend" },
        { id: "graphql", title: "GraphQL", category: "API", tagline: "Typed query interface", description: "Client-specified queries over a typed schema.", iconId: "backend" },
        { id: "grpc", title: "gRPC", category: "API", tagline: "High-perf RPC", description: "Contract-first, binary RPC for services.", iconId: "backend" }
      ]
    },
    {
      id: "datastore",
      title: "DATASTORE & QUEUES",
      subtitle: "Persistence & Async Work",
      options: [
        { id: "postgresql", title: "PostgreSQL", category: "DATASTORE", tagline: "Relational core", description: "ACID relational store for service data.", iconId: "database" },
        { id: "redis", title: "Redis", category: "DATASTORE", tagline: "In-memory cache & queues", description: "Fast cache, pub/sub, and job queues.", iconId: "database" },
        { id: "kafka", title: "Kafka", category: "DATASTORE", tagline: "Distributed event stream", description: "Durable, high-throughput event streaming.", iconId: "database" }
      ]
    }
  ]
};

/**
 * Resolves the tier definitions for a given architecture path id.
 * @param {string} architecturePathId
 * @returns {Array}
 */
export function getStackForPath(architecturePathId) {
  return TECHNOLOGY_STACKS[architecturePathId] || [];
}

/**
 * Filters and validates candidate options within a tier against current stack selections.
 * Eliminates mutually exclusive or incompatible options.
 * @param {Object} tier - The tier object containing options
 * @param {Object} selectedStack - Currently selected technologies { [tierId]: techId }
 * @returns {Array} - Compatible options
 */
export function getCompatibleStackOptions(tier, selectedStack = {}) {
  if (!tier || !tier.options) return [];
  return tier.options.filter(opt => {
    if (!opt.compatibleWith) return true;
    for (const [parentTierId, allowedParentIds] of Object.entries(opt.compatibleWith)) {
      const selectedParent = selectedStack[parentTierId];
      if (selectedParent && !allowedParentIds.includes(selectedParent)) {
        return false;
      }
    }
    return true;
  });
}
