/**
 * Path of Ascension · Body-wide PoE-style skill tree wallpaper
 */
const SkillTree = (() => {
  const WORLD = 3600;
  const CX = WORLD / 2;
  const CY = WORLD / 2;

  const CLUSTERS = [
    {
      id: "fund",
      label: "Fundamentos",
      color: "#6B9FD4",
      angle: -Math.PI / 2,
      skills: ["HTML", "CSS", "JavaScript", "TypeScript", "Git", "GitHub", "Terminal", "Linux"],
    },
    {
      id: "fe",
      label: "Front-End",
      color: "#7EC8A0",
      angle: -Math.PI / 2 + (2 * Math.PI) / 7,
      skills: ["React", "Next.js", "Vue", "Astro", "Tailwind", "Bootstrap", "UX", "UI Design"],
    },
    {
      id: "be",
      label: "Back-End",
      color: "#C2A46B",
      angle: -Math.PI / 2 + (4 * Math.PI) / 7,
      skills: ["Node.js", "Express", "NestJS", "API REST", "GraphQL", "SQL", "MongoDB", "Redis", "Docker"],
    },
    {
      id: "ai",
      label: "Inteligência Artificial",
      color: "#B07EE8",
      angle: -Math.PI / 2 + (6 * Math.PI) / 7,
      skills: [
        "Prompt Engineering",
        "LLM Design",
        "RAG",
        "Embeddings",
        "Fine Tuning",
        "Agents",
        "MCP",
        "Vector DBs",
        "LangChain",
        "LangGraph",
        "OpenAI API",
        "Gemini API",
        "Claude API",
        "AI Workflows",
      ],
    },
    {
      id: "auto",
      label: "Automação",
      color: "#E8A07E",
      angle: -Math.PI / 2 + (8 * Math.PI) / 7,
      skills: ["n8n", "Zapier", "Make", "Python Automation", "Web Scraping", "Browser Automation"],
    },
    {
      id: "cloud",
      label: "Cloud",
      color: "#7EB8E8",
      angle: -Math.PI / 2 + (10 * Math.PI) / 7,
      skills: ["AWS", "Azure", "Google Cloud", "Vercel", "Cloudflare", "CI/CD"],
    },
    {
      id: "soft",
      label: "Soft Skills",
      color: "#E8C87E",
      angle: -Math.PI / 2 + (12 * Math.PI) / 7,
      skills: [
        "Comunicação",
        "Criatividade",
        "Pensamento Crítico",
        "Liderança",
        "Gestão de Projetos",
        "Resolução de Problemas",
      ],
    },
  ];

  const PASSIVE_NAMES = [
    "Vigor", "Foco", "Ritmo", "Clareza", "Fluxo", "Precisão", "Ímpeto", "Resiliência",
    "Insight", "Sintonia", "Âncora", "Impulso", "Visão", "Tato", "Ética", "Paciência",
  ];

  /** 16 runic RPG icons drawn in unit circle (-1..1) */
  const RUNE_DRAW = [
    (c) => { c.moveTo(0, -0.85); c.lineTo(0, 0.75); c.moveTo(-0.35, -0.2); c.lineTo(0.35, -0.2); },
    (c) => { c.arc(0, 0.05, 0.55, 0, Math.PI * 2); c.moveTo(-0.7, -0.35); c.lineTo(0.7, -0.35); },
    (c) => { c.moveTo(0, 0.8); c.bezierCurveTo(0.5, 0.2, 0.45, -0.5, 0, -0.75); c.bezierCurveTo(-0.45, -0.5, -0.5, 0.2, 0, 0.8); },
    (c) => { c.moveTo(0, -0.9); c.lineTo(0.25, 0.1); c.lineTo(0, 0.5); c.lineTo(-0.25, 0.1); c.closePath(); c.moveTo(0, 0.5); c.lineTo(0, 0.85); },
    (c) => { c.ellipse(0, 0, 0.55, 0.35, 0, 0, Math.PI * 2); c.arc(0, 0, 0.18, 0, Math.PI * 2); },
    (c) => { for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; const x = Math.cos(a) * 0.75; const y = Math.sin(a) * 0.75; if (i === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.closePath(); },
    (c) => { c.arc(0, 0, 0.55, 0, Math.PI * 2); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.moveTo(Math.cos(a) * 0.35, Math.sin(a) * 0.35); c.lineTo(Math.cos(a) * 0.55, Math.sin(a) * 0.55); } },
    (c) => { c.moveTo(-0.6, 0.5); c.lineTo(-0.2, -0.5); c.lineTo(0.2, 0.5); c.lineTo(0.6, -0.5); },
    (c) => { c.arc(-0.25, 0.1, 0.35, 0, Math.PI * 2); c.arc(0.25, 0.1, 0.35, 0, Math.PI * 2); c.moveTo(-0.6, 0.55); c.quadraticCurveTo(0, 0.85, 0.6, 0.55); },
    (c) => { c.moveTo(-0.5, 0.3); c.bezierCurveTo(-0.2, -0.5, 0.2, -0.5, 0.5, 0.3); c.moveTo(-0.35, 0.1); c.lineTo(0.35, 0.1); },
    (c) => { c.arc(-0.35, 0, 0.22, 0, Math.PI * 2); c.arc(0.35, 0, 0.22, 0, Math.PI * 2); c.moveTo(-0.13, 0); c.lineTo(0.13, 0); },
    (c) => { c.moveTo(-0.5, -0.6); c.lineTo(0.5, -0.6); c.lineTo(0.5, 0.6); c.lineTo(-0.5, 0.6); c.closePath(); c.moveTo(0, -0.6); c.lineTo(0, 0.6); },
    (c) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; const x = Math.cos(a) * 0.7; const y = Math.sin(a) * 0.7; if (i === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.closePath(); },
    (c) => { c.moveTo(0, -0.8); c.lineTo(0.65, 0); c.lineTo(0, 0.8); c.lineTo(-0.65, 0); c.closePath(); },
    (c) => { c.moveTo(-0.7, 0.2); c.quadraticCurveTo(0, -0.9, 0.7, 0.2); c.moveTo(-0.45, 0.35); c.quadraticCurveTo(0, -0.2, 0.45, 0.35); },
    (c) => { c.moveTo(-0.55, 0.35); c.lineTo(0, -0.55); c.lineTo(0.55, 0.35); c.moveTo(-0.35, 0.15); c.lineTo(0.35, 0.15); },
  ];

  let nodes = [];
  let edges = [];
  let nodeById = new Map();

  let canvasBg, canvasFg, ctxBg, ctxFg;
  let tooltip, hint;
  let masteredCountEl, masteredTotalEl, masteredBar, clusterLegend;
  let resetBtn, recenterBtn, zoomInBtn, zoomOutBtn;
  let ritualEl, ritualCanvas;

  let cam = { x: CX, y: CY, zoom: 0.7 };
  let targetCam = { x: CX, y: CY, zoom: 0.7 };
  let mouse = { x: 0, y: 0, wx: 0, wy: 0, down: false, drag: false, dx: 0, dy: 0, overUI: false };
  let hovered = null;
  let time = 0;
  let globalGlow = 0;
  let reducedMotion = false;
  let lastInteractAt = performance.now();
  let cachedBgGrad = null;
  let cachedBgSize = { w: 0, h: 0 };

  // ──────────────────────────────────────────────────────────────────
  // ARCANE CORE AWAKENING · cinematic first-session intro
  // A 2–3s contemplative reveal that plays ONCE per browser session.
  // The Núcleo Arcano wakes, a wave of light travels the primary spokes
  // in narrative order (Fundamentos → Front-End → Back-End → Cloud →
  // Automação → IA → Soft Skills) and each domain blooms into being —
  // its NAME surfacing a heartbeat before its glow, for a prophetic
  // feel. Purely additive: when `intro` is null, node._reveal is left
  // undefined and the whole tree renders at full strength as before.
  // Hit-testing uses world radii (node.r), never _reveal, so the
  // visitor can interact freely while the universe wakes.
  // ──────────────────────────────────────────────────────────────────
  let intro = null;              // { startMs, endMs } | null — live progression
  let introElapsed = -1;         // ms since the awakening began, -1 when idle
  let pendingIntro = null;       // { endMs } | null — armed & dormant, awaiting cue
  let drawAlpha = 1;             // global rune/ornament alpha multiplier
  const AWAKEN_SESSION_KEY = "cv-arcane-awakened-v1";
  const AWAKEN_ORDER = ["fund", "fe", "be", "cloud", "auto", "ai", "soft"];

  const particles = [];
  const bursts = [];
  const lightWaves = [];
  const stars = [];
  // Magical click flashes: concentric arcane rings that expand from the
  // clicked node. Decoupled from `bursts` (which only fires on
  // activation) so that ANY click — including on the already-active
  // Arcane Core or a blocked node — produces a satisfying shimmer.
  const clickFlashes = [];

  // ──────────────────────────────────────────────────────────────────
  // CORE GRAVITATIONAL DISTORTION
  // Hover effect that replaces the old "tree-hint" dialog. When the
  // cursor approaches the Arcane Core (within PROX_OUTER world units),
  // a continuous reality-distortion field manifests: pulsing
  // gravitational waves emanate from the core, a chromatic-aberration
  // lens forms around it, the central glow breathes, and faint motes
  // are pulled inward like a small accretion event. The closer the
  // mouse gets, the stronger the field — peaking at full intensity
  // inside PROX_INNER. Decays smoothly when the cursor leaves.
  // ──────────────────────────────────────────────────────────────────
  const CORE_PROX_OUTER = 320;   // world units — onde o efeito começa
  const CORE_PROX_INNER = 60;    // world units — força máxima dentro
  const coreField = {
    strength: 0,        // 0..1, lerped current intensity
    targetStrength: 0,  // 0..1, set by pointer proximity
    phase: 0,           // continuous ring phase
    motePulse: 0,       // throttles inward-pulled mote spawns
  };

  // Audio: rune activation chime, played on every click that lands on a node
  let runeAudio = null;
  function initAudio() {
    try {
      runeAudio = new Audio("src/assets/sounds/rune-activate.mp3");
      runeAudio.preload = "auto";
      runeAudio.volume = 0.55;
    } catch {
      runeAudio = null;
    }
  }
  function playRuneSound(volume = 0.55) {
    if (!runeAudio) return;
    try {
      // clone so rapid clicks can overlap without restart-cutoff
      const a = runeAudio.cloneNode();
      a.volume = volume;
      a.play().catch(() => { /* autoplay blocked until first user gesture */ });
    } catch { /* ignore */ }
  }

  let mastered = new Set();
  let ritualPlayed = false;
  let milestoneFired = false;
  // Distinct skill-tree nodes the visitor has clicked. The portrait
  // milestone fires on the 3rd DIFFERENT node clicked — the Arcane Core,
  // the keystones around it, the far leaves, ANY node counts, whether it
  // can be activated or not. The 3rd distinct click triggers the event.
  const clickedNodes = new Set();
  const STORAGE_KEY = "cv-skilltree-v3";
  const MILESTONE_KEY = "cv-skilltree-milestone-3";
  const MILESTONE_TARGET = 3;

  function seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function hexRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  function buildStars() {
    stars.length = 0;
    const rng = seededRandom(42);
    for (let i = 0; i < 420; i++) {
      stars.push({
        x: rng() * WORLD,
        y: rng() * WORLD,
        r: rng() * 1.2 + 0.2,
        a: rng() * 0.5 + 0.15,
        tw: rng() * Math.PI * 2,
      });
    }
  }

  function buildTree() {
    nodes = [];
    edges = [];
    nodeById = new Map();
    mastered.clear();
    let id = 0;

    const core = {
      id: id++,
      x: CX,
      y: CY,
      r: 26,
      label: "Núcleo Arcano",
      cluster: "core",
      color: "#E5BEAE",
      type: "keystone",
      rune: 5,
      active: true,
      notable: true,
      pulse: 0,
    };
    nodes.push(core);
    nodeById.set(core.id, core);
    mastered.add(core.id);

    CLUSTERS.forEach((cluster, ci) => {
      const rng = seededRandom(1000 + ci * 137);
      const sectorW = (2 * Math.PI) / 7;
      const baseAngle = cluster.angle;
      const clusterNodes = [];

      const keystoneDist = 320 + rng() * 70;
      const kAngle = baseAngle + (rng() - 0.5) * 0.32;
      const keystone = {
        id: id++,
        x: CX + Math.cos(kAngle) * keystoneDist,
        y: CY + Math.sin(kAngle) * keystoneDist,
        r: 22,
        label: cluster.label,
        cluster: cluster.id,
        color: cluster.color,
        type: "keystone",
        rune: ci % RUNE_DRAW.length,
        active: true,
        notable: true,
        pulse: rng() * Math.PI * 2,
      };
      nodes.push(keystone);
      nodeById.set(keystone.id, keystone);
      mastered.add(keystone.id);
      clusterNodes.push(keystone);
      // PRIMARY pathway: from the Arcane Core to each cluster keystone.
      // The `primary` flag tells drawEdges() to apply an enhanced glow
      // and a continuous animated stream so these 7 spokes stand out
      // visually from the more distant connections inside each cluster.
      edges.push({ a: core.id, b: keystone.id, cluster: cluster.id, flow: 1, primary: true });

      const nodesPerRing = [5, 8, 12, 16, 20];
      let skillIdx = 0;

      for (let ring = 0; ring < nodesPerRing.length; ring++) {
        const ringDist = keystoneDist + 130 + ring * 110 + rng() * 35;
        const count = nodesPerRing[ring];
        const angleStep = (sectorW * 0.88) / count;

        for (let i = 0; i < count; i++) {
          const a = baseAngle - (sectorW * 0.44) / 2 + i * angleStep + (rng() - 0.5) * 0.1;
          const dist = ringDist + (rng() - 0.5) * 40;
          const isNotable = skillIdx < cluster.skills.length;
          const label = isNotable
            ? cluster.skills[skillIdx++]
            : PASSIVE_NAMES[Math.floor(rng() * PASSIVE_NAMES.length)];

          const node = {
            id: id++,
            x: CX + Math.cos(a) * dist,
            y: CY + Math.sin(a) * dist,
            r: isNotable ? 13 + rng() * 2 : 8 + rng() * 1.5,
            label,
            cluster: cluster.id,
            color: cluster.color,
            type: isNotable ? "notable" : "passive",
            rune: (id + ci) % RUNE_DRAW.length,
            active: false,
            notable: isNotable,
            pulse: rng() * Math.PI * 2,
          };
          nodes.push(node);
          nodeById.set(node.id, node);
          clusterNodes.push(node);
        }
      }

      for (let i = 1; i < clusterNodes.length; i++) {
        const parent = clusterNodes[Math.floor(rng() * Math.min(i, 5))];
        edges.push({ a: parent.id, b: clusterNodes[i].id, cluster: cluster.id, flow: 0 });
      }

      for (let i = 0; i < clusterNodes.length - 1; i++) {
        if (rng() > 0.5) {
          const j = i + 1 + Math.floor(rng() * Math.min(3, clusterNodes.length - i - 1));
          if (j < clusterNodes.length) {
            const a = clusterNodes[i].id;
            const b = clusterNodes[j].id;
            const exists = edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
            if (!exists) edges.push({ a, b, cluster: cluster.id, flow: 0 });
          }
        }
      }
    });

    for (let i = 0; i < CLUSTERS.length; i++) {
      const n1 = nodes.find((n) => n.type === "keystone" && n.cluster === CLUSTERS[i].id);
      const n2 = nodes.find((n) => n.type === "keystone" && n.cluster === CLUSTERS[(i + 1) % CLUSTERS.length].id);
      if (n1 && n2) edges.push({ a: n1.id, b: n2.id, cluster: "bridge", flow: 1 });
    }
  }

  function screenToWorld(sx, sy) {
    const w = canvasFg.clientWidth;
    const h = canvasFg.clientHeight;
    return {
      x: cam.x + (sx - w / 2) / cam.zoom,
      y: cam.y + (sy - h / 2) / cam.zoom,
    };
  }

  function worldToScreen(wx, wy) {
    const w = canvasFg.clientWidth;
    const h = canvasFg.clientHeight;
    return {
      x: w / 2 + (wx - cam.x) * cam.zoom,
      y: h / 2 + (wy - cam.y) * cam.zoom,
    };
  }

  /** Skip edges whose bounding box is entirely off-screen. */
  function segmentOnScreen(p1, p2, margin = 80) {
    const w = canvasFg.clientWidth;
    const h = canvasFg.clientHeight;
    if (Math.max(p1.x, p2.x) < -margin || Math.min(p1.x, p2.x) > w + margin) return false;
    if (Math.max(p1.y, p2.y) < -margin || Math.min(p1.y, p2.y) > h + margin) return false;
    return true;
  }

  function findNodeAt(wx, wy) {
    const hitPad = 14 / cam.zoom;
    let best = null;
    let bestD = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(n.x - wx, n.y - wy);
      const r = n.r + (n.type === "keystone" ? 8 : n.notable ? 5 : 2);
      if (d < r + hitPad && d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  function isAdjacentToActive(node) {
    if (node.active) return false;
    return edges.some((e) => {
      const other = e.a === node.id ? nodeById.get(e.b) : e.b === node.id ? nodeById.get(e.a) : null;
      return other && other.active;
    });
  }

  function canActivate(node) {
    if (node.active) return false;
    return isAdjacentToActive(node);
  }

  function activateNode(node) {
    if (!canActivate(node)) return false;

    node.active = true;
    mastered.add(node.id);
    saveProgress();

    bursts.push({ x: node.x, y: node.y, r: 0, life: 1, color: node.color });
    spawnBurstParticles(node.x, node.y, node.color, 28);

    edges.forEach((e) => {
      if (e.a === node.id || e.b === node.id) {
        const other = nodeById.get(e.a === node.id ? e.b : e.a);
        if (other && other.active) {
          e.flow = 0;
          lightWaves.push({ edge: e, t: 0, speed: 0.03 + Math.random() * 0.02 });
        }
      }
    });

    const notableCount = nodes.filter((n) => n.notable).length;
    globalGlow = Math.min(1, mastered.size / notableCount);
    updateHUD();
    checkRitual();
    hint?.classList.add("is-fading");
    return true;
  }

  // Portrait milestone: counts EVERY distinct node the visitor clicks
  // (core, keystones, neighbours, distant leaves — activatable or not).
  // The 3rd different node clicked fires the "Clique na foto de Carlos!"
  // nudge. Fires once per browser; cleared by the tree reset button.
  function registerMilestoneClick(node) {
    if (!node || milestoneFired) return;
    if (localStorage.getItem(MILESTONE_KEY) === "1") return;
    clickedNodes.add(node.id);
    if (clickedNodes.size >= MILESTONE_TARGET) {
      milestoneFired = true;
      try { localStorage.setItem(MILESTONE_KEY, "1"); } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent("cv-milestone-8skills", {
        detail: { count: clickedNodes.size, node },
      }));
    }
  }

  function spawnBurstParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.018,
        r: 1 + Math.random() * 2.5,
        color,
      });
    }
  }

  /** Magical click feedback. Fires for any node click (active, blocked,
   *  or activatable) so the visitor always gets visceral confirmation
   *  that the orb received the touch. The Arcane Core gets a richer
   *  variant because of its narrative weight. Pure additive:
   *  drawing logic lives in drawClickFlashes() and is rendered AFTER
   *  the regular nodes so the rings sit on top.                      */
  function spawnClickFlash(node, kind = "default") {
    if (!node) return;
    const isCore = node.cluster === "core";
    const isKey  = node.type === "keystone";
    const tier   = isCore ? 3 : isKey ? 2 : 1;

    // Flag the node so drawNodeOrb() can paint an extra halo while
    // the click pulse decays. Cleared in render() once back to 0.
    node.clickPulse = 1;
    node.clickKind  = kind;

    const baseR = (isCore ? 38 : isKey ? 30 : node.r * 1.6);
    const ringCount = isCore ? 4 : isKey ? 3 : 2;
    for (let i = 0; i < ringCount; i++) {
      clickFlashes.push({
        x: node.x,
        y: node.y,
        r: 0,
        rMax: baseR * (2.4 + i * 0.55),
        life: 1,
        decay: 0.022 + i * 0.004,
        color: node.color || "#E5BEAE",
        delay: i * 90,        // staggered ring start (ms)
        born: time,
        tier,
        rainbow: kind === "blocked" ? false : true,
      });
    }

    // Sparkle burst — golden motes that fly outward briefly, regardless
    // of activation. They reuse the existing particle pipeline so they
    // play perfectly with everything else.
    const sparkColor = kind === "blocked" ? "#A13E1E" : (node.color || "#E5BEAE");
    spawnBurstParticles(node.x, node.y, sparkColor, isCore ? 22 : isKey ? 16 : 10);
  }

  function auroraColor(t, alpha = 1) {
    const hue = (t * 0.4 + time * 0.018) % 1;
    const r = Math.sin(hue * Math.PI * 2) * 0.5 + 0.5;
    const g = Math.sin(hue * Math.PI * 2 + 2.1) * 0.5 + 0.5;
    const b = Math.sin(hue * Math.PI * 2 + 4.2) * 0.5 + 0.5;
    return `rgba(${Math.floor(r * 90 + 100)},${Math.floor(g * 160 + 70)},${Math.floor(b * 200 + 40)},${alpha})`;
  }

  function drawRuneIcon(ctx, x, y, size, runeIdx, color, alpha) {
    const draw = RUNE_DRAW[runeIdx % RUNE_DRAW.length];
    if (!draw) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.beginPath();
    draw(ctx);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * drawAlpha;
    ctx.lineWidth = 0.12;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawOrnamentRing(ctx, x, y, r, spikes, color, alpha, lineW) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * drawAlpha;
    ctx.lineWidth = lineW;
    ctx.stroke();

    if (spikes > 0) {
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2 + time * 0.0005;
        const x1 = x + Math.cos(a) * (r - 1);
        const y1 = y + Math.sin(a) * (r - 1);
        const x2 = x + Math.cos(a) * (r + 3);
        const y2 = y + Math.sin(a) * (r + 3);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function isLightTheme() {
    return document.documentElement.dataset.theme === "light";
  }

  function drawNodeOrb(node, p, screenR) {
    const available = canActivate(node);
    const { r: cr, g: cg, b: cb } = hexRgb(node.color || "#C2A46B");
    const pulse = Math.sin(time * 0.004 + node.pulse) * 0.12 + 1;
    const light = isLightTheme();

    // Click halo: a brief, bright shimmer painted UNDER the node so
    // the orb stays crisp on top while a magical aura blooms around
    // it. Active for ~700ms after spawnClickFlash() touched the node.
    if (node.clickPulse && node.clickPulse > 0) {
      const cp     = node.clickPulse;          // 1 → 0
      const haloR  = screenR * (3.6 + (1 - cp) * 4.5);
      const haloG  = ctxFg.createRadialGradient(p.x, p.y, screenR * 0.5, p.x, p.y, haloR);
      const baseA  = (node.clickKind === "blocked") ? 0.45 : 0.7;
      haloG.addColorStop(0, `rgba(${Math.min(255, cr + 80)},${Math.min(255, cg + 60)},${Math.min(255, cb + 40)},${cp * baseA})`);
      haloG.addColorStop(0.55, `rgba(${cr},${cg},${cb},${cp * baseA * 0.5})`);
      haloG.addColorStop(1, "transparent");
      ctxFg.save();
      ctxFg.globalCompositeOperation = "screen";
      ctxFg.fillStyle = haloG;
      ctxFg.beginPath();
      ctxFg.arc(p.x, p.y, haloR, 0, Math.PI * 2);
      ctxFg.fill();
      ctxFg.restore();
    }

    if (node.active) {
      const glowR = screenR * (3.2 + globalGlow) * pulse;
      const g = ctxFg.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},0.45)`);
      g.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.12)`);
      g.addColorStop(1, "transparent");
      ctxFg.fillStyle = g;
      ctxFg.beginPath();
      ctxFg.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctxFg.fill();

      ctxFg.beginPath();
      ctxFg.arc(p.x, p.y, screenR * 0.72, 0, Math.PI * 2);
      ctxFg.fillStyle = light
        ? `rgba(${cr},${cg},${cb},0.55)`     // mais saturado p/ não esmaecer no multiply
        : `rgba(${cr},${cg},${cb},0.35)`;
      ctxFg.fill();

      // Em modo claro usamos a cor saturada DIRETO; em modo escuro,
      // uma versão clareada para "lava brilhante".
      const borderColor = light
        ? `rgba(${cr},${cg},${cb},0.98)`
        : `rgba(${Math.min(255, cr + 60)},${Math.min(255, cg + 50)},${Math.min(255, cb + 30)},0.95)`;
      if (node.type === "keystone") {
        drawOrnamentRing(ctxFg, p.x, p.y, screenR, 12, borderColor, 1, 2);
        drawOrnamentRing(ctxFg, p.x, p.y, screenR * 0.78, 8, borderColor, 0.5, 1);
      } else if (node.type === "notable") {
        drawOrnamentRing(ctxFg, p.x, p.y, screenR, 8, borderColor, 1, 1.6);
        drawOrnamentRing(ctxFg, p.x, p.y, screenR * 0.82, 0, borderColor, 0.45, 0.8);
      } else {
        drawOrnamentRing(ctxFg, p.x, p.y, screenR, 0, borderColor, 0.9, 1);
      }

      // Rune: tinta escura no pergaminho / creme luminoso no escuro
      drawRuneIcon(ctxFg, p.x, p.y, screenR * 0.55, node.rune, light ? "#2B241C" : "#F5E6D0", 1);
    } else {
      const dimAlpha = available ? 0.78 : 0.55;
      let border;
      if (light) {
        // Cluster color direto, sem clarear (multiply na CSS afina)
        border = available
          ? `rgba(${cr},${cg},${cb},${0.85 + Math.sin(time * 0.006 + node.pulse) * 0.15})`
          : `rgba(${cr},${cg},${cb},0.55)`;
      } else {
        border = available
          ? `rgba(${Math.min(255, cr + 80)},${Math.min(255, cg + 60)},${Math.min(255, cb + 30)},${0.85 + Math.sin(time * 0.006 + node.pulse) * 0.15})`
          : `rgba(${cr},${cg},${cb},0.55)`;
      }

      // Inner orb. Em modo claro usamos um tom médio do cluster
      // (multiply o aprofunda); no escuro usamos versão sombria.
      ctxFg.beginPath();
      ctxFg.arc(p.x, p.y, screenR * 0.75, 0, Math.PI * 2);
      const orbGrad = ctxFg.createRadialGradient(p.x, p.y, 0, p.x, p.y, screenR * 0.75);
      if (light) {
        orbGrad.addColorStop(0, `rgba(${cr},${cg},${cb},${dimAlpha * 0.55})`);
        orbGrad.addColorStop(1, `rgba(${Math.floor(cr * 0.7)},${Math.floor(cg * 0.7)},${Math.floor(cb * 0.7)},${dimAlpha * 0.7})`);
      } else {
        orbGrad.addColorStop(0, `rgba(${Math.floor(cr * 0.4)},${Math.floor(cg * 0.4)},${Math.floor(cb * 0.5)},${dimAlpha})`);
        orbGrad.addColorStop(1, `rgba(${Math.floor(cr * 0.15)},${Math.floor(cg * 0.18)},${Math.floor(cb * 0.22)},${dimAlpha})`);
      }
      ctxFg.fillStyle = orbGrad;
      ctxFg.fill();

      if (node.type === "keystone") {
        drawOrnamentRing(ctxFg, p.x, p.y, screenR, 12, border, dimAlpha + 0.1, 1.8);
        drawOrnamentRing(ctxFg, p.x, p.y, screenR * 0.78, 0, border, dimAlpha * 0.6, 1);
      } else if (node.type === "notable") {
        drawOrnamentRing(ctxFg, p.x, p.y, screenR, 8, border, dimAlpha + 0.05, 1.4);
      } else {
        drawOrnamentRing(ctxFg, p.x, p.y, screenR * 0.95, 0, border, dimAlpha, 0.9);
      }

      let runeColor;
      if (light) {
        // Runas em tinta marrom escura quando inativas; cor do
        // cluster (saturada) quando disponíveis para ativação.
        runeColor = available
          ? `rgba(${cr},${cg},${cb},0.98)`
          : "rgba(93, 81, 67, 0.7)";
      } else {
        runeColor = available
          ? `rgba(${Math.min(255, cr + 90)},${Math.min(255, cg + 70)},${Math.min(255, cb + 40)},0.95)`
          : `rgba(${Math.min(255, cr + 40)},${Math.min(255, cg + 40)},${Math.min(255, cb + 40)},0.7)`;
      }
      drawRuneIcon(ctxFg, p.x, p.y, screenR * 0.55, node.rune, runeColor, 1);
    }

    if (hovered && hovered.id === node.id) {
      ctxFg.beginPath();
      ctxFg.arc(p.x, p.y, screenR + 5, 0, Math.PI * 2);
      // Hover ring: cor escura legível em modo claro / cream no escuro
      ctxFg.strokeStyle = light
        ? "rgba(43, 36, 28, 0.85)"
        : "rgba(229, 190, 174, 0.85)";
      ctxFg.lineWidth = 1.5;
      ctxFg.stroke();
    }
  }

  function drawBackground() {
    const w = canvasBg.width / (window.devicePixelRatio || 1);
    const h = canvasBg.height / (window.devicePixelRatio || 1);
    ctxBg.clearRect(0, 0, w, h);

    if (!cachedBgGrad || cachedBgSize.w !== w || cachedBgSize.h !== h) {
      cachedBgGrad = ctxBg.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      cachedBgGrad.addColorStop(0, "#0c1420");
      cachedBgGrad.addColorStop(0.45, "#080f18");
      cachedBgGrad.addColorStop(1, "#040810");
      cachedBgSize = { w, h };
    }
    ctxBg.fillStyle = cachedBgGrad;
    ctxBg.fillRect(0, 0, w, h);

    stars.forEach((s) => {
      const sp = worldToScreen(s.x, s.y);
      if (sp.x < -4 || sp.x > w + 4 || sp.y < -4 || sp.y > h + 4) return;
      const tw = s.a * (0.6 + Math.sin(time * 0.003 + s.tw) * 0.4);
      ctxBg.beginPath();
      ctxBg.arc(sp.x, sp.y, s.r, 0, Math.PI * 2);
      ctxBg.fillStyle = `rgba(200, 220, 255, ${tw})`;
      ctxBg.fill();
    });

    CLUSTERS.forEach((cluster, i) => {
      const angle = cluster.angle + time * 0.00015;
      const wx = CX + Math.cos(angle) * 400;
      const wy = CY + Math.sin(angle) * 400;
      const sp = worldToScreen(wx, wy);
      const { r, g, b } = hexRgb(cluster.color);
      const neb = ctxBg.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 220);
      neb.addColorStop(0, `rgba(${r},${g},${b},${0.06 + globalGlow * 0.04})`);
      neb.addColorStop(1, "transparent");
      ctxBg.fillStyle = neb;
      ctxBg.fillRect(0, 0, w, h);
    });
  }

  /** Awakening wavefront · a luminous comet that climbs a primary spoke
   *  from the Núcleo Arcano outward, FILLING the connection with light
   *  as it advances (a glowing head + a trailing illuminated segment).
   *  Sampled along the same quadratic bezier the spoke is drawn on so it
   *  tracks the curve exactly. Reads clearly even as a dim wallpaper. */
  function drawSpokeWavefront(p1, cx, cy, p2, wt, tint, light) {
    const sample = (t) => {
      const o = 1 - t;
      return {
        x: o * o * p1.x + 2 * o * t * cx + t * t * p2.x,
        y: o * o * p1.y + 2 * o * t * cy + t * t * p2.y,
      };
    };

    const trail = 0.6;                       // length of the lit tail (0..1)
    const startT = Math.max(0, wt - trail);
    const SEG = 16;

    ctxFg.save();
    ctxFg.globalCompositeOperation = "screen";
    ctxFg.lineCap = "round";
    ctxFg.lineJoin = "round";
    for (let i = 0; i < SEG; i++) {
      const t0 = startT + (wt - startT) * (i / SEG);
      const t1 = startT + (wt - startT) * ((i + 1) / SEG);
      const a0 = sample(t0);
      const a1 = sample(t1);
      const f = (i + 1) / SEG;                // 0 at tail → 1 at the head
      const alpha = f * f;
      ctxFg.beginPath();
      ctxFg.moveTo(a0.x, a0.y);
      ctxFg.lineTo(a1.x, a1.y);
      ctxFg.strokeStyle = light
        ? `rgba(255, 234, 180, ${0.9 * alpha})`
        : `rgba(255, 242, 208, ${0.95 * alpha})`;
      ctxFg.lineWidth = (light ? 2 : 2.6) * (0.5 + f);
      ctxFg.shadowColor = `rgba(${tint.r},${tint.g},${tint.b},0.9)`;
      ctxFg.shadowBlur = (light ? 9 : 13) * f;
      ctxFg.stroke();
    }

    // Bright head — the crest of the wave.
    const head = sample(wt);
    const hr = 17;
    const hg = ctxFg.createRadialGradient(head.x, head.y, 0, head.x, head.y, hr);
    hg.addColorStop(0, light ? "rgba(255,246,214,0.95)" : "rgba(255,249,224,0.98)");
    hg.addColorStop(0.45, `rgba(${tint.r},${tint.g},${tint.b},0.6)`);
    hg.addColorStop(1, "transparent");
    ctxFg.shadowBlur = 0;
    ctxFg.fillStyle = hg;
    ctxFg.beginPath();
    ctxFg.arc(head.x, head.y, hr, 0, Math.PI * 2);
    ctxFg.fill();
    ctxFg.restore();
  }

  function drawEdges() {
    const light = isLightTheme();
    edges.forEach((e) => {
      const a = nodeById.get(e.a);
      const b = nodeById.get(e.b);
      if (!a || !b) return;

      // Awakening: a connection only carries energy once BOTH ends have
      // been reached by the wave, so the network lights up in cascade.
      const ra = a._reveal == null ? 1 : a._reveal;
      const rb = b._reveal == null ? 1 : b._reveal;
      const er = Math.min(ra, rb);
      if (er <= 0.01) return;

      const p1 = worldToScreen(a.x, a.y);
      const p2 = worldToScreen(b.x, b.y);
      if (!segmentOnScreen(p1, p2)) return;
      ctxFg.globalAlpha = er;

      const both = a.active && b.active;

      ctxFg.beginPath();
      ctxFg.moveTo(p1.x, p1.y);

      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(28, len * 0.12);
      const cx = mx + (-dy / len) * bend;
      const cy = my + (dx / len) * bend;
      ctxFg.quadraticCurveTo(cx, cy, p2.x, p2.y);

      if (both) {
        e.flow = Math.min(1, e.flow + 0.025);
        const flowT = (time * 0.004 + e.flow) % 1;
        if (light) {
          // Codex Arcano · gradiente dourado animado para "tinta de
          // ouro líquida" sobre o pergaminho. Vívido mas calmo.
          const grad = ctxFg.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          const a1 = 0.55 * e.flow;
          const a2 = 0.85 * e.flow;
          grad.addColorStop(0,    `rgba(184, 138, 59, ${a1})`);
          grad.addColorStop(0.35, `rgba(216, 174, 99, ${a2})`);
          grad.addColorStop(0.65, `rgba(184, 138, 59, ${a2})`);
          grad.addColorStop(1,    `rgba(165, 107, 60, ${a1})`);
          ctxFg.strokeStyle = grad;
          ctxFg.lineWidth = 1.6 + e.flow * 1.8;
          ctxFg.shadowBlur = 0;
        } else {
          // Vesper (escuro) · aurora boreal em rainbow shader
          const grad = ctxFg.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, auroraColor(flowT, 0.55 * e.flow));
          grad.addColorStop(0.35, `rgba(225, 190, 110, ${0.95 * e.flow})`);
          grad.addColorStop(0.65, auroraColor(flowT + 0.4, 0.85 * e.flow));
          grad.addColorStop(1, auroraColor(flowT + 0.7, 0.55 * e.flow));
          ctxFg.strokeStyle = grad;
          ctxFg.lineWidth = 2 + e.flow * 2.4;
          ctxFg.shadowBlur = 0;
        }
      } else {
        // Conexões inativas
        ctxFg.strokeStyle = light
          ? "rgba(120, 90, 40, 0.42)"   // ink dourado-marrom translúcido (a multiply na CSS afina)
          : "rgba(80, 100, 130, 0.32)"; // cinza-azulado quase invisível
        ctxFg.lineWidth = light ? 0.95 : 1.1;
        ctxFg.shadowBlur = 0;
      }
      ctxFg.stroke();
      ctxFg.shadowBlur = 0;
      ctxFg.globalAlpha = 1;
    });

    /* ──────────────────────────────────────────────────────────
     * PRIMARY PATHWAYS · the 7 spokes from the Arcane Core to each
     * cluster keystone. They render an EXTRA pass on top of the
     * regular edge draw so the visual hierarchy is unmistakable:
     *   · thicker outer glow (cluster-coloured)
     *   · two animated sparkles continuously running outward
     *   · subtle aurora shimmer interleaved with cluster colour
     * Pure additive — if you delete this block, the tree falls back
     * to the original look without any other side effect.
     * ────────────────────────────────────────────────────────── */
    edges.forEach((e) => {
      if (!e.primary) return;
      const a = nodeById.get(e.a);
      const b = nodeById.get(e.b);
      if (!a || !b) return;

      // Spoke energy follows the wave: gate the enhanced glow + sparkles
      // by the keystone's reveal so it ignites as the wave arrives.
      const ra = a._reveal == null ? 1 : a._reveal;
      const rb = b._reveal == null ? 1 : b._reveal;
      const er = Math.min(ra, rb);
      // Don't bail while a wavefront is still climbing this spoke — the
      // line must light progressively even before the keystone glows.
      const waveActive = introElapsed >= 0 && e._waveEnd != null &&
        introElapsed >= e._waveStart && introElapsed < e._waveEnd;
      if (er <= 0.02 && !waveActive) return;

      const p1 = worldToScreen(a.x, a.y);
      const p2 = worldToScreen(b.x, b.y);
      if (!segmentOnScreen(p1, p2)) return;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(28, len * 0.12);
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const cx = mx + (-dy / len) * bend;
      const cy = my + (dx / len) * bend;

      // Cluster colour to tint the spoke (matches the keystone)
      const cluster = CLUSTERS.find((c) => c.id === e.cluster);
      const tint    = cluster ? hexRgb(cluster.color) : { r: 229, g: 190, b: 174 };

      // Soft outer glow stroke (thicker, semi-transparent, cluster colour)
      ctxFg.save();
      ctxFg.globalCompositeOperation = "screen";
      ctxFg.globalAlpha = er;
      ctxFg.beginPath();
      ctxFg.moveTo(p1.x, p1.y);
      ctxFg.quadraticCurveTo(cx, cy, p2.x, p2.y);
      const breathe = 0.55 + Math.sin(time * 0.012 + e.a * 0.7) * 0.18;
      ctxFg.strokeStyle = `rgba(${tint.r},${tint.g},${tint.b},${breathe * 0.55})`;
      ctxFg.lineWidth = light ? 4.2 : 5.6;
      ctxFg.shadowBlur = 0;
      ctxFg.stroke();

      // Inner crisp filament — bright cream highlight that reads
      // through the multiply blend in light theme.
      ctxFg.beginPath();
      ctxFg.moveTo(p1.x, p1.y);
      ctxFg.quadraticCurveTo(cx, cy, p2.x, p2.y);
      ctxFg.strokeStyle = light
        ? `rgba(255, 232, 178, ${0.7 + breathe * 0.15})`
        : `rgba(255, 240, 205, ${0.85})`;
      ctxFg.lineWidth = light ? 1.3 : 1.5;
      ctxFg.shadowBlur = 0;
      ctxFg.stroke();
      ctxFg.restore();

      // Two sparkle nodes traveling continuously outward along the
      // path (offset so they never overlap). Sampled along the
      // quadratic bezier for accuracy on the curved arcs.
      const sampleCurve = (t) => {
        const omt = 1 - t;
        return {
          x: omt * omt * p1.x + 2 * omt * t * cx + t * t * p2.x,
          y: omt * omt * p1.y + 2 * omt * t * cy + t * t * p2.y,
        };
      };
      const speed = 0.0014;
      for (let s = 0; s < 2; s++) {
        const t = ((time * speed) + s * 0.5 + e.a * 0.07) % 1;
        const pt = sampleCurve(t);
        const grad = ctxFg.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 9);
        const sparkA = 0.95 * (0.6 + Math.sin(t * Math.PI) * 0.4);
        grad.addColorStop(0, light
          ? `rgba(255, 240, 195, ${sparkA})`
          : auroraColor(t + s * 0.3, sparkA));
        grad.addColorStop(0.6, `rgba(${tint.r},${tint.g},${tint.b},${sparkA * 0.5})`);
        grad.addColorStop(1, "transparent");
        ctxFg.save();
        ctxFg.globalCompositeOperation = "screen";
        ctxFg.globalAlpha = er;
        ctxFg.fillStyle = grad;
        ctxFg.beginPath();
        ctxFg.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
        ctxFg.fill();
        ctxFg.restore();
      }

      // ── Awakening · luminous wavefront climbing the spoke ──────────
      // Drawn LAST so the comet head reads on top of everything. The
      // line fills with light progressively (core → keystone) instead
      // of snapping on, satisfying "iluminar-se progressivamente".
      if (introElapsed >= 0 && e._waveEnd != null) {
        const span = Math.max(1, e._waveEnd - e._waveStart);
        const wt = (introElapsed - e._waveStart) / span;
        if (wt > 0 && wt < 1.02) {
          drawSpokeWavefront(p1, cx, cy, p2, Math.min(1, wt), tint, light);
        }
      }
    });

    lightWaves.forEach((w, wi) => {
      w.t += w.speed;
      if (w.t >= 1) {
        lightWaves.splice(wi, 1);
        return;
      }
      const e = w.edge;
      const a = nodeById.get(e.a);
      const b = nodeById.get(e.b);
      if (!a || !b) return;
      const p1 = worldToScreen(a.x, a.y);
      const p2 = worldToScreen(b.x, b.y);
      const tx = p1.x + (p2.x - p1.x) * w.t;
      const ty = p1.y + (p2.y - p1.y) * w.t;
      const g = ctxFg.createRadialGradient(tx, ty, 0, tx, ty, 14);
      // Em light mode a "centelha" viaja em ouro líquido; no escuro
      // ela é uma faísca aurora rainbow.
      g.addColorStop(0, light
        ? `rgba(255, 229, 166, ${0.95})`
        : auroraColor(w.t, 0.95));
      g.addColorStop(1, "transparent");
      ctxFg.fillStyle = g;
      ctxFg.beginPath();
      ctxFg.arc(tx, ty, 14, 0, Math.PI * 2);
      ctxFg.fill();
    });
  }

  function drawNodes() {
    const showLabels = cam.zoom > 0.52;
    const light = isLightTheme();

    // Two passes (inactive → active) replace the per-frame [...nodes].sort()
    // allocation — same z-order, zero GC pressure.
    const drawOne = (n) => {
      const rv = n._reveal == null ? 1 : n._reveal;
      if (rv <= 0.004) return;

      const p = worldToScreen(n.x, n.y);
      const grow = n.cluster === "core" ? 1 : (0.5 + 0.5 * rv);
      const screenR = n.r * cam.zoom * grow;
      if (screenR < 1.2) return;
      if (p.x < -80 || p.x > canvasFg.clientWidth + 80 || p.y < -80 || p.y > canvasFg.clientHeight + 80) return;

      const prevAlpha = ctxFg.globalAlpha;
      ctxFg.globalAlpha = prevAlpha * rv;
      drawAlpha = rv;
      drawNodeOrb(n, p, screenR);
      drawAlpha = 1;
      ctxFg.globalAlpha = prevAlpha;

      if (showLabels && n.notable && screenR > 4) {
        const lrev = n._labelReveal == null ? 1 : n._labelReveal;
        if (lrev > 0.01) {
          const fs = Math.max(7, Math.min(10, screenR * 1.1));
          ctxFg.font = `${n.active ? 600 : 400} ${fs}px "JetBrains Mono", monospace`;
          ctxFg.textAlign = "center";
          if (light) {
            ctxFg.fillStyle = n.active
              ? "rgba(43, 36, 28, 0.95)"
              : canActivate(n)
                ? "rgba(184, 138, 59, 0.95)"
                : "rgba(93, 81, 67, 0.55)";
          } else {
            ctxFg.fillStyle = n.active
              ? "rgba(245, 230, 208, 0.92)"
              : canActivate(n)
                ? "rgba(194, 164, 107, 0.75)"
                : "rgba(100, 120, 140, 0.4)";
          }
          ctxFg.globalAlpha = lrev;
          ctxFg.fillText(n.label, p.x, p.y - screenR - 8);
          ctxFg.globalAlpha = 1;
        }
      }
    };

    for (const n of nodes) {
      if (n.active) continue;
      drawOne(n);
    }
    for (const n of nodes) {
      if (!n.active) continue;
      drawOne(n);
    }
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      const sp = worldToScreen(p.x, p.y);
      const { r, g, b } = hexRgb(p.color || "#C2A46B");
      ctxFg.beginPath();
      ctxFg.arc(sp.x, sp.y, p.r * cam.zoom, 0, Math.PI * 2);
      ctxFg.fillStyle = `rgba(${r},${g},${b},${p.life * 0.85})`;
      ctxFg.fill();
    }

    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.r += b.blocked ? 1.8 : 2.6;
      b.life -= b.blocked ? 0.04 : 0.022;
      if (b.life <= 0) {
        bursts.splice(i, 1);
        continue;
      }
      const sp = worldToScreen(b.x, b.y);
      ctxFg.beginPath();
      ctxFg.arc(sp.x, sp.y, b.r * cam.zoom, 0, Math.PI * 2);
      if (b.blocked) {
        ctxFg.strokeStyle = `rgba(220, 80, 60, ${b.life * 0.85})`;
        ctxFg.lineWidth = 3;
      } else {
        ctxFg.strokeStyle = `rgba(229, 190, 174, ${b.life * 0.45})`;
        ctxFg.lineWidth = 2;
      }
      ctxFg.stroke();
    }
  }

  /** Render the magical click rings spawned by spawnClickFlash().
   *  Uses an additive composite so the rings layer warmly over each
   *  other without darkening. Each ring honours its own delay so the
   *  Arcane Core blooms a four-stage shockwave.                      */
  function drawClickFlashes() {
    if (!clickFlashes.length) return;
    ctxFg.save();
    ctxFg.globalCompositeOperation = "screen";
    for (let i = clickFlashes.length - 1; i >= 0; i--) {
      const f = clickFlashes[i];
      // Honour stagger delay
      if ((time - f.born) * 16 < f.delay) continue;
      f.r   += (f.rMax - f.r) * 0.085;
      f.life -= f.decay;
      if (f.life <= 0) {
        clickFlashes.splice(i, 1);
        continue;
      }
      const sp = worldToScreen(f.x, f.y);
      const radius = f.r * cam.zoom;
      const { r, g, b } = hexRgb(f.color);
      const alpha = Math.min(1, f.life * (f.tier >= 2 ? 0.95 : 0.8));

      // Outer rainbow halo (or red flash if blocked)
      const halo = ctxFg.createRadialGradient(sp.x, sp.y, radius * 0.55, sp.x, sp.y, radius * 1.3);
      if (f.rainbow) {
        halo.addColorStop(0, auroraColor(time * 0.012 + f.tier * 0.3, alpha * 0.55));
        halo.addColorStop(0.6, `rgba(${r},${g},${b},${alpha * 0.35})`);
        halo.addColorStop(1, "transparent");
      } else {
        halo.addColorStop(0, `rgba(220, 80, 60, ${alpha * 0.45})`);
        halo.addColorStop(1, "transparent");
      }
      ctxFg.fillStyle = halo;
      ctxFg.beginPath();
      ctxFg.arc(sp.x, sp.y, radius * 1.3, 0, Math.PI * 2);
      ctxFg.fill();

      // Crisp ring stroke
      ctxFg.beginPath();
      ctxFg.arc(sp.x, sp.y, radius, 0, Math.PI * 2);
      ctxFg.strokeStyle = `rgba(${Math.min(255, r + 40)},${Math.min(255, g + 35)},${Math.min(255, b + 25)},${alpha})`;
      ctxFg.lineWidth = (f.tier === 3 ? 2.8 : f.tier === 2 ? 2.2 : 1.6);
      ctxFg.stroke();

      // Inner highlight
      ctxFg.beginPath();
      ctxFg.arc(sp.x, sp.y, radius * 0.55, 0, Math.PI * 2);
      ctxFg.strokeStyle = `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 60)},${Math.min(255, b + 40)},${alpha * 0.55})`;
      ctxFg.lineWidth = 1;
      ctxFg.stroke();
    }
    ctxFg.restore();
  }

  function drawMouseAura() {
    if (reducedMotion) return;
    const sp = worldToScreen(mouse.wx, mouse.wy);
    const g = ctxFg.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 50);
    g.addColorStop(0, auroraColor(time * 0.002, 0.1));
    g.addColorStop(1, "transparent");
    ctxFg.fillStyle = g;
    ctxFg.beginPath();
    ctxFg.arc(sp.x, sp.y, 50, 0, Math.PI * 2);
    ctxFg.fill();
  }

  /** Reality distortion around the Arcane Core.
   *  Camadas, da mais externa pra mais interna:
   *    1. Anéis gravitacionais — 4 anéis nascendo do centro e se
   *       expandindo, defasados em phase, com força modulada por
   *       coreField.strength. Cada anel é uma stroke + halo gradient.
   *    2. Aberração cromática — dois "anéis fantasma" deslocados
   *       em ±2-3px (canais ciano e magenta) sugerindo lensing.
   *    3. Halo central pulsante — respiração dourada/quartz que
   *       reforça a sensação de massa concentrada no núcleo.
   *    4. Motes orbitantes — partículas spawned às bordas do campo
   *       e puxadas pra dentro, criando um mini disco de acreção.
   *
   *  Usa globalCompositeOperation = "screen" (light mode) ou "lighter"
   *  (dark mode), para somar luz em vez de cobrir. Custo:
   *  early-out se strength < 0.02 (mouse longe). */
  function drawCoreDistortion() {
    if (reducedMotion) return;

    // Lerp current strength toward target and advance phase always.
    coreField.strength += (coreField.targetStrength - coreField.strength) * 0.10;
    coreField.phase = (coreField.phase + 0.012) % 1;

    const s = coreField.strength;
    if (s < 0.02) return;

    const sp = worldToScreen(CX, CY);
    const light = isLightTheme();
    ctxFg.save();
    ctxFg.globalCompositeOperation = light ? "multiply" : "lighter";

    // (1) Anéis gravitacionais — 4 ondas concêntricas defasadas
    const ringCount = 4;
    const RING_MAX_R = 240; // world units (será escalado por zoom)
    for (let i = 0; i < ringCount; i++) {
      const ringPhase = (coreField.phase + i / ringCount) % 1;
      const radius = (12 + ringPhase * RING_MAX_R) * cam.zoom;
      // Envelope: a onda nasce sutil, atinge pico no meio e some.
      const env = Math.sin(ringPhase * Math.PI);
      const alpha = env * s * (light ? 0.55 : 0.45);
      if (alpha < 0.01) continue;

      // Halo radial — preenche o anel com brilho suave
      const halo = ctxFg.createRadialGradient(
        sp.x, sp.y, radius * 0.86,
        sp.x, sp.y, radius * 1.08
      );
      if (light) {
        // Tinta sépia + ouro velho sobre pergaminho (multiply escurece)
        halo.addColorStop(0, `rgba(95, 55, 18, 0)`);
        halo.addColorStop(0.55, `rgba(95, 55, 18, ${alpha * 0.85})`);
        halo.addColorStop(1, `rgba(95, 55, 18, 0)`);
      } else {
        halo.addColorStop(0, `rgba(229, 190, 174, 0)`);
        halo.addColorStop(0.55, `rgba(229, 190, 174, ${alpha})`);
        halo.addColorStop(1, `rgba(229, 190, 174, 0)`);
      }
      ctxFg.fillStyle = halo;
      ctxFg.beginPath();
      ctxFg.arc(sp.x, sp.y, radius * 1.08, 0, Math.PI * 2);
      ctxFg.fill();

      // Stroke crisp por cima do halo
      ctxFg.beginPath();
      ctxFg.arc(sp.x, sp.y, radius, 0, Math.PI * 2);
      if (light) {
        ctxFg.strokeStyle = `rgba(120, 70, 25, ${alpha * 1.1})`;
      } else {
        ctxFg.strokeStyle = `rgba(255, 230, 200, ${alpha * 1.3})`;
      }
      ctxFg.lineWidth = 0.9 + s * 0.6;
      ctxFg.stroke();
    }

    // (2) Aberração cromática — dois anéis fantasma deslocados
    const lensPhase = (coreField.phase * 1.5) % 1;
    const lensRadius = (24 + lensPhase * 140) * cam.zoom;
    const lensEnv = Math.sin(lensPhase * Math.PI);
    const lensAlpha = lensEnv * s * 0.40;
    if (lensAlpha > 0.01) {
      ctxFg.lineWidth = 0.7 + s * 0.3;
      ctxFg.strokeStyle = `rgba(120, 200, 255, ${lensAlpha})`;
      ctxFg.beginPath();
      ctxFg.arc(sp.x + 2.5 * s, sp.y, lensRadius, 0, Math.PI * 2);
      ctxFg.stroke();
      ctxFg.strokeStyle = `rgba(255, 80, 140, ${lensAlpha})`;
      ctxFg.beginPath();
      ctxFg.arc(sp.x - 2.5 * s, sp.y, lensRadius, 0, Math.PI * 2);
      ctxFg.stroke();
    }

    // (3) Halo central pulsante — massa concentrada
    const breath = (Math.sin(time * 0.06) * 0.5 + 0.5);
    const auraR = (44 + breath * 24) * cam.zoom * (0.85 + s * 0.5);
    const aura = ctxFg.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, auraR);
    if (light) {
      aura.addColorStop(0, `rgba(120, 70, 25, ${s * 0.45})`);
      aura.addColorStop(0.5, `rgba(95, 55, 18, ${s * 0.22})`);
      aura.addColorStop(1, "transparent");
    } else {
      aura.addColorStop(0, `rgba(255, 220, 170, ${s * 0.55})`);
      aura.addColorStop(0.5, `rgba(229, 190, 174, ${s * 0.30})`);
      aura.addColorStop(1, "transparent");
    }
    ctxFg.fillStyle = aura;
    ctxFg.beginPath();
    ctxFg.arc(sp.x, sp.y, auraR, 0, Math.PI * 2);
    ctxFg.fill();

    ctxFg.restore();

    // (4) Motes orbitantes puxados pra dentro (sucção gravitacional).
    // Throttled por motePulse para não saturar o array de partículas.
    coreField.motePulse += s;
    if (coreField.motePulse > 1.2 && particles.length < 240) {
      coreField.motePulse = 0;
      const burst = 1 + Math.floor(s * 3);
      for (let k = 0; k < burst; k++) {
        const angle = Math.random() * Math.PI * 2;
        const r0 = 180 + Math.random() * 90;
        // Velocidade aponta pra dentro com leve componente tangencial
        const vIn = 1.2 + s * 1.4;
        const vTan = (Math.random() - 0.5) * 1.6;
        particles.push({
          x: CX + Math.cos(angle) * r0,
          y: CY + Math.sin(angle) * r0,
          vx: -Math.cos(angle) * vIn + -Math.sin(angle) * vTan,
          vy: -Math.sin(angle) * vIn +  Math.cos(angle) * vTan,
          life: 1,
          decay: 0.014 + Math.random() * 0.008,
          r: 0.8 + Math.random() * 1.6,
          color: light ? "#5A3E1C" : "#E5BEAE",
        });
      }
    }
  }

  let renderRaf = null;
  let ktreePaused = false;

  function scheduleRender() {
    if (renderRaf != null || ktreePaused) return;
    renderRaf = requestAnimationFrame(render);
  }

  function pauseForKtree() {
    ktreePaused = true;
    if (renderRaf != null) {
      cancelAnimationFrame(renderRaf);
      renderRaf = null;
    }
  }

  function resumeFromKtree() {
    if (!ktreePaused) return;
    ktreePaused = false;
    scheduleRender();
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  /** Force every node to its fully-awake state. Used when the intro is
   *  skipped (returning within the same session, reduced motion). */
  function markAllRevealed() {
    for (const n of nodes) { n._reveal = 1; n._labelReveal = 1; }
  }

  /** Build and ARM the awakening timeline, seeding every node into its
   *  dormant state so the very first paint shows the sleeping cosmos —
   *  but WITHOUT starting the clock. The progression is held in
   *  `pendingIntro` until `beginAwakening()` is called (typically as the
   *  welcome veil lifts, so the visitor actually witnesses the reveal
   *  instead of it playing hidden behind the overlay).
   *
   *  Gated to the first visit of the browser SESSION (sessionStorage) so
   *  it never repeats on internal navigation or when returning to the
   *  section. Honours prefers-reduced-motion by skipping to the awake
   *  state. Returns true when an awakening was armed (caller should then
   *  arrange to call beginAwakening), false when it was skipped. */
  /** True on file:// / localhost / *.local|test — mirrors welcome.js so
   *  the awakening REPLAYS on every reload during development (the
   *  welcome itself replays in dev too). On a real host the once-per-
   *  session gate below applies, exactly as specified. */
  function isLocalDev() {
    try {
      if (window.location.protocol === "file:") return true;
      const host = (window.location.hostname || "").toLowerCase();
      if (!host) return true;
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
      if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".test")) return true;
      return false;
    } catch (_e) { return false; }
  }

  function armAwakening() {
    if (reducedMotion) { markAllRevealed(); return false; }

    // In dev we always replay so the sequence can be witnessed on every
    // reload; in production it runs once per browser session.
    const dev = isLocalDev();
    let firstThisSession = dev;
    try {
      if (dev) {
        sessionStorage.setItem(AWAKEN_SESSION_KEY, "1");
      } else if (!sessionStorage.getItem(AWAKEN_SESSION_KEY)) {
        sessionStorage.setItem(AWAKEN_SESSION_KEY, "1");
        firstThisSession = true;
      }
    } catch (_e) { firstThisSession = dev; }
    if (!firstThisSession) { markAllRevealed(); return false; }

    // Cinematic timing (ms). Total settle ≈ 2.8s.
    const P1         = 540;   // Phase I — the core awakens
    const REACH0     = 540;   // first domain reached by the wave
    const STEP       = 138;   // gap as the wave advances domain → domain
    const KEY_DUR    = 460;   // keystone bloom duration
    const SEC_DUR    = 430;   // secondary leaf bloom duration
    const SEC_DELAY  = 150;   // delay after a keystone before leaves wake
    const SEC_SPREAD = 460;   // staggered spread of the leaf cascade
    const LABEL_LEAD = 190;   // domain NAME surfaces before its glow
    const WAVE_TRAVEL = 560;  // ms for a wavefront to climb a spoke
    const TAIL       = 320;   // Phase IV — stabilisation

    const orderIdx = {};
    AWAKEN_ORDER.forEach((id, i) => { orderIdx[id] = i; });

    // Clear any stale wavefront windows from a previous arming.
    edges.forEach((e) => { e._waveStart = undefined; e._waveEnd = undefined; });

    let maxEnd = P1;

    for (const n of nodes) {
      if (n.cluster === "core") {
        n._revealAt = 0;
        n._revealDur = P1;
        n._revealFloor = 0.16;     // dim but present from the first frame
        n._labelLead = 0;
        n._reveal = n._revealFloor;
        n._labelReveal = n._revealFloor;
        continue;
      }

      const oi = orderIdx[n.cluster] != null ? orderIdx[n.cluster] : 0;
      const reach = REACH0 + oi * STEP;

      if (n.type === "keystone") {
        n._revealAt = reach;
        n._revealDur = KEY_DUR;
        n._revealFloor = 0;
        n._labelLead = LABEL_LEAD;          // prophetic name-before-glow
        // Arm the luminous wavefront on this spoke so the line itself
        // FILLS with light from the core outward, arriving exactly as
        // the keystone begins to glow.
        const spoke = edges.find((e) => e.primary && (e.a === n.id || e.b === n.id));
        if (spoke) {
          spoke._waveStart = Math.max(0, reach - WAVE_TRAVEL);
          spoke._waveEnd = reach;
        }
        maxEnd = Math.max(maxEnd, reach + KEY_DUR);
      } else {
        // Distant leaves cascade outward after their keystone wakes.
        const jitter = Math.abs((Math.sin(n.id * 12.9898) * 43758.5453) % 1);
        const off = SEC_DELAY + jitter * SEC_SPREAD;
        n._revealAt = reach + off;
        n._revealDur = SEC_DUR;
        n._revealFloor = 0;
        n._labelLead = 60;
        maxEnd = Math.max(maxEnd, reach + off + SEC_DUR);
      }
      n._reveal = 0;
      n._labelReveal = 0;
    }

    // Armed but dormant: hold the clock until beginAwakening() fires.
    // Nodes already sit at their reveal floors above, so the first paint
    // is the sleeping cosmos — no flash of the fully-lit tree.
    intro = null;
    introElapsed = -1;
    pendingIntro = { endMs: maxEnd + TAIL };
    return true;
  }

  /** Release the armed awakening: start the clock NOW. Safe to call once;
   *  no-ops if nothing is pending (already played, skipped, or reduced
   *  motion). The cosmos animates from its dormant seed to fully alive. */
  function beginAwakening() {
    if (!pendingIntro) return;
    intro = { startMs: performance.now(), endMs: pendingIntro.endMs };
    introElapsed = 0;
    pendingIntro = null;

    // Phase I · a single soft breath of motes from the awakening core.
    // (No expanding ring — the luminous wavefronts climbing each spoke
    // carry the awakening; a stroked circle here read as a stray outline
    // glued to the welcome's fire-breath.)
    const core = nodes.find((n) => n.cluster === "core");
    if (core) {
      spawnBurstParticles(core.x, core.y, core.color || "#C9A24B", 10);
    }
    lastInteractAt = performance.now();   // run at full FPS through the reveal
    scheduleRender();
  }

  /** Dev/test helper: clear the once-per-session gate and replay the
   *  awakening immediately on a clear screen. Exposed on SkillTree. */
  function replayAwakening() {
    try { sessionStorage.removeItem(AWAKEN_SESSION_KEY); } catch (_e) { /* ignore */ }
    intro = null; introElapsed = -1; pendingIntro = null;
    if (armAwakening()) beginAwakening();
  }

  /** Advance the intro each frame: spawn the travelling sparks as the
   *  wave reaches each spoke, ease every node's reveal/label factor,
   *  and retire the sequence once the universe has settled. */
  function updateIntro() {
    if (!intro) return;
    const el = performance.now() - intro.startMs;
    introElapsed = el;

    for (const n of nodes) {
      const at = n._revealAt || 0;
      const dur = n._revealDur || 400;
      const floor = n._revealFloor || 0;
      const t = Math.max(0, Math.min(1, (el - at) / dur));
      n._reveal = floor + (1 - floor) * easeOutCubic(t);

      const lt = Math.max(0, Math.min(1, (el - (at - (n._labelLead || 0))) / dur));
      n._labelReveal = easeOutCubic(lt);

      // A faint sparkle the instant a domain's energy lands.
      if (n.type === "keystone" && !n._litBurst && el >= at) {
        n._litBurst = true;
        spawnBurstParticles(n.x, n.y, n.color, 8);
      }
    }

    if (el >= intro.endMs) {
      markAllRevealed();
      intro = null;
      introElapsed = -1;
    }
  }

  function render() {
    renderRaf = null;
    if (document.body.classList.contains("ktree-open")) {
      pauseForKtree();
      return;
    }
    ktreePaused = false;
    time++;

    // The wallpaper is a calm FIXED backdrop — it no longer parallaxes
    // with scroll. Coupling the camera to window.scrollY forced a full
    // two-canvas redraw on every scroll frame (the scroll-lag cause).
    targetCam.y = CY;
    cam.x += (targetCam.x - cam.x) * 0.1;
    cam.y += (targetCam.y - cam.y) * 0.1;
    cam.zoom += (targetCam.zoom - cam.zoom) * 0.1;

    // Decay per-node click pulses (cheap, runs only over recently
    // clicked nodes thanks to the early-out on === 0).
    for (const n of nodes) {
      if (n.clickPulse) {
        n.clickPulse = Math.max(0, n.clickPulse - 0.022);
      }
    }

    updateIntro();

    // When the visitor is idle (no pointer, intro finished), render at
    // half rate — halves compositor pressure from the full-viewport canvas.
    const isIdle = introElapsed < 0 && !mouse.down && !hovered &&
      performance.now() - lastInteractAt > 1500 &&
      coreField.targetStrength < 0.05;
    if (isIdle && (time & 1) === 1) {
      scheduleRender();
      return;
    }

    // SCROLL FREEZE — while the page is being scrolled (and the visitor
    // isn't interacting with the tree), skip the two-canvas redraw so the
    // fixed wallpaper composites from its cached GPU texture. Since the
    // wallpaper no longer parallaxes, the frozen frame is identical to
    // what scroll would show → perfectly smooth, with no jump. Never
    // freeze during the awakening intro (introElapsed >= 0).
    if (introElapsed < 0 && window.__cvScrolling &&
        !mouse.down && !hovered && coreField.targetStrength < 0.05) {
      scheduleRender();
      return;
    }

    drawBackground();
    ctxFg.clearRect(0, 0, canvasFg.width, canvasFg.height);
    drawEdges();
    drawCoreDistortion();   // gravitational waves atrás dos nodes
    drawNodes();
    drawClickFlashes();
    drawParticles();
    drawMouseAura();

    scheduleRender();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    [canvasBg, canvasFg].forEach((c) => {
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = w + "px";
      c.style.height = h + "px";
      c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ctxBg = canvasBg.getContext("2d");
    ctxFg = canvasFg.getContext("2d");
  }

  function updateHUD() {
    const notableNodes = nodes.filter((n) => n.notable);
    const masteredNotables = notableNodes.filter((n) => mastered.has(n.id)).length;

    if (masteredCountEl) masteredCountEl.textContent = masteredNotables;
    if (masteredTotalEl) masteredTotalEl.textContent = notableNodes.length;
    if (masteredBar) masteredBar.style.width = `${(masteredNotables / notableNodes.length) * 100}%`;

    if (clusterLegend) {
      clusterLegend.innerHTML = CLUSTERS.map((c) => {
        const cn = nodes.filter((n) => n.cluster === c.id && n.notable);
        const cm = cn.filter((n) => mastered.has(n.id)).length;
        const done = cm === cn.length;
        return `<span class="cluster-tag ${done ? "is-mastered" : ""}" style="--cluster-color:${c.color}">
          <span class="cluster-tag__dot"></span>${c.label}
          <span class="cluster-tag__count">${cm}/${cn.length}</span>
        </span>`;
      }).join("");
    }
  }

  function showTooltip(node, clientX, clientY) {
    if (!tooltip) return;
    const title = tooltip.querySelector(".tree-tooltip__title");
    const meta = tooltip.querySelector(".tree-tooltip__meta");
    if (title) title.textContent = node.label;
    if (meta) {
      const cluster = CLUSTERS.find((c) => c.id === node.cluster);
      meta.textContent = node.active
        ? "DOMINADO"
        : canActivate(node)
          ? "CLIQUE PARA INVOCAR"
          : cluster
            ? cluster.label.toUpperCase()
            : "NÚCLEO";
    }
    tooltip.style.left = clientX + "px";
    tooltip.style.top = clientY + "px";
    tooltip.classList.add("is-visible");
  }

  function hideTooltip() {
    tooltip?.classList.remove("is-visible");
  }

  function checkRitual() {
    const notableNodes = nodes.filter((n) => n.notable);
    if (notableNodes.every((n) => mastered.has(n.id)) && !ritualPlayed) {
      ritualPlayed = true;
      setTimeout(startRitual, 500);
    }
  }

  function startRitual() {
    if (!ritualEl) return;
    ritualEl.classList.add("is-active");
    ritualEl.setAttribute("aria-hidden", "false");
    nodes.forEach((n) => {
      if (n.notable) spawnBurstParticles(n.x, n.y, n.color, 5);
    });
    ritualCanvas = document.getElementById("ritual-canvas");
    if (ritualCanvas) {
      ritualCanvas.width = window.innerWidth;
      ritualCanvas.height = window.innerHeight;
      animateRitualParticles();
    }
    setTimeout(() => ritualEl.classList.add("is-revealed"), 2800);
    window.dispatchEvent(new CustomEvent("merlin-summon"));
  }

  let ritualAnimId = null;
  const ritualParticles = [];

  function animateRitualParticles() {
    const ctx = ritualCanvas?.getContext("2d");
    if (!ctx) return;
    const w = ritualCanvas.width;
    const h = ritualCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    if (ritualParticles.length < 220) {
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        ritualParticles.push({
          angle,
          dist: 60 + Math.random() * 280,
          speed: 0.012 + Math.random() * 0.02,
          life: 1,
          r: 1 + Math.random() * 2,
        });
      }
    }

    ctx.fillStyle = "rgba(2, 6, 4, 0.12)";
    ctx.fillRect(0, 0, w, h);

    ritualParticles.forEach((p) => {
      p.angle += p.speed;
      p.dist *= 0.993;
      p.life -= 0.0015;
      const x = cx + Math.cos(p.angle) * p.dist;
      const y = cy + Math.sin(p.angle) * p.dist;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = auroraColor(p.angle / (Math.PI * 2), p.life * 0.75);
      ctx.fill();
    });

    ritualAnimId = requestAnimationFrame(animateRitualParticles);
  }

  function closeRitual() {
    ritualEl?.classList.remove("is-active", "is-revealed");
    ritualEl?.setAttribute("aria-hidden", "true");
    if (ritualAnimId) cancelAnimationFrame(ritualAnimId);
    ritualParticles.length = 0;
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...mastered]));
    } catch { /* ignore */ }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      JSON.parse(raw).forEach((id) => {
        mastered.add(id);
        const n = nodeById.get(id);
        if (n) {
          n.active = true;
          edges.forEach((e) => {
            if (e.a === id || e.b === id) {
              const other = nodeById.get(e.a === id ? e.b : e.a);
              if (other?.active) e.flow = 1;
            }
          });
        }
      });
      globalGlow = Math.min(1, mastered.size / nodes.filter((n) => n.notable).length);
    } catch { /* ignore */ }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MILESTONE_KEY);
    clickedNodes.clear();
    milestoneFired = false;
    buildTree();
    buildStars();
    ritualPlayed = false;
    particles.length = 0;
    bursts.length = 0;
    clickFlashes.length = 0;
    lightWaves.length = 0;
    globalGlow = 0;
    targetCam = { x: CX, y: CY, zoom: 0.7 };
    cam = { x: CX, y: CY, zoom: 0.7 };
    updateHUD();
    hint?.classList.remove("is-fading");
  }

  function recenter() {
    targetCam.x = CX;
    targetCam.y = CY;
    targetCam.zoom = 0.7;
  }

  function spawnBlockedRipple(x, y) {
    bursts.push({ x, y, r: 0, life: 1, color: "#A13E1E", blocked: true });
  }

  function isOverUI(target) {
    if (!target || !(target instanceof Element)) return false;
    return !!target.closest(
      ".nav, .tree-hud, .merlin, .crystal-caption, .crystal-vault, .memories__head, .crystal-loader, .portal__link, .btn, .ritual, .footer, .hero__portrait, .codex, .ktree, a, button, input, select, textarea"
    );
  }

  /** Block tree input only on real UI or when a crystal is under the cursor. */
  function blocksTreeInput(e) {
    if (document.body.classList.contains("ktree-open")) return true;
    if (isOverUI(e.target)) return true;
    const C = window.Crystals;
    if (!C) return false;
    if (C.isOverMemoriesUI?.(e.target)) return true;
    if (C.isInCrystalField?.(e.clientX, e.clientY) && C._hovered) return true;
    return false;
  }

  function bindEvents() {
    const onPointerDown = (e) => {
      lastInteractAt = performance.now();
      if (e.button !== 0) return;
      if (document.body.classList.contains("ktree-open")) return;
      if (blocksTreeInput(e)) return;
      mouse.down = true;
      mouse.drag = false;
      mouse.dx = e.clientX;
      mouse.dy = e.clientY;
    };

    const onPointerMove = (e) => {
      lastInteractAt = performance.now();
      if (document.body.classList.contains("ktree-open")) return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const w = screenToWorld(mouse.x, mouse.y);
      mouse.wx = w.x;
      mouse.wy = w.y;

      // Gravitational field around the Arcane Core — escala de força
      // baseada em quão perto o cursor está do centro do mundo (CX, CY).
      // Mapping linear: dentro de PROX_INNER → força 1; em PROX_OUTER → 0.
      // Quando o cursor sai do raio externo OU está sobre UI bloqueante,
      // o alvo cai pra 0 e o campo decai suavemente no render().
      if (!blocksTreeInput(e)) {
        const distToCore = Math.hypot(mouse.wx - CX, mouse.wy - CY);
        if (distToCore < CORE_PROX_OUTER) {
          const span = CORE_PROX_OUTER - CORE_PROX_INNER;
          const t = (CORE_PROX_OUTER - distToCore) / span;
          coreField.targetStrength = Math.max(0, Math.min(1, t));
        } else {
          coreField.targetStrength = 0;
        }
      } else {
        coreField.targetStrength = 0;
      }

      if (mouse.down) {
        const ddx = e.clientX - mouse.dx;
        const ddy = e.clientY - mouse.dy;
        if (Math.abs(ddx) > 5 || Math.abs(ddy) > 5) mouse.drag = true;
        if (mouse.drag) {
          targetCam.x -= ddx / cam.zoom;
          targetCam.y -= ddy / cam.zoom;
          mouse.dx = e.clientX;
          mouse.dy = e.clientY;
          document.body.style.cursor = "grabbing";
        }
      }

      if (blocksTreeInput(e)) {
        if (hovered) {
          hovered = null;
          hideTooltip();
          if (!window.Crystals?._hovered) document.body.style.cursor = "";
        }
        return;
      }

      const node = findNodeAt(w.x, w.y);
      if (node !== hovered) {
        hovered = node;
        if (node) {
          showTooltip(node, e.clientX, e.clientY);
          document.body.style.cursor = "pointer";
        } else {
          hideTooltip();
          document.body.style.cursor = mouse.down ? "grabbing" : "";
        }
      } else if (node) {
        showTooltip(node, e.clientX, e.clientY);
      }
    };

    const onPointerUp = (e) => {
      if (document.body.classList.contains("ktree-open")) return;
      if (!mouse.drag && mouse.down && !blocksTreeInput(e)) {
        const w = screenToWorld(e.clientX, e.clientY);
        const node = findNodeAt(w.x, w.y);
        if (node) {
          if (canActivate(node)) {
            playRuneSound(0.6);
            spawnClickFlash(node, "activate");
            activateNode(node);
          } else if (!node.active) {
            playRuneSound(0.25);
            spawnClickFlash(node, "blocked");
            spawnBlockedRipple(node.x, node.y);
          } else {
            playRuneSound(0.35);
            // Already-active node: the visitor still deserves visual
            // feedback. The Arcane Core in particular gets a richer
            // 4-ring shimmer thanks to the tier=3 branch in spawnClickFlash.
            spawnClickFlash(node, "echo");
          }
          // Any node click counts toward the 3-node portrait milestone,
          // regardless of whether it was activated, blocked or echoed.
          registerMilestoneClick(node);
        }
      }
      mouse.down = false;
      mouse.drag = false;
      document.body.style.cursor = hovered ? "pointer" : "";
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    resetBtn?.addEventListener("click", reset);
    recenterBtn?.addEventListener("click", recenter);
    zoomInBtn?.addEventListener("click", () => {
      targetCam.zoom = Math.min(2.4, targetCam.zoom * 1.18);
    });
    zoomOutBtn?.addEventListener("click", () => {
      targetCam.zoom = Math.max(0.28, targetCam.zoom / 1.18);
    });
    document.getElementById("ritual-close")?.addEventListener("click", closeRitual);

    let touchDist = 0;
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        touchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (document.body.classList.contains("ktree-open")) return;
      if (e.touches.length === 2 && touchDist > 0) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        targetCam.zoom = Math.max(0.28, Math.min(2.4, targetCam.zoom * (d / touchDist)));
        touchDist = d;
      }
    }, { passive: true });
  }

  function init() {
    canvasBg = document.getElementById("tree-canvas-bg");
    canvasFg = document.getElementById("tree-canvas-fg");
    tooltip = document.getElementById("tree-tooltip");
    hint = document.getElementById("tree-hint");
    masteredCountEl = document.getElementById("mastered-count");
    masteredTotalEl = document.getElementById("mastered-total");
    masteredBar = document.getElementById("mastered-bar");
    clusterLegend = document.getElementById("cluster-legend");
    resetBtn = document.getElementById("tree-reset");
    recenterBtn = document.getElementById("tree-recenter");
    zoomInBtn = document.getElementById("tree-zoom-in");
    zoomOutBtn = document.getElementById("tree-zoom-out");
    ritualEl = document.getElementById("ritual");

    if (!canvasBg || !canvasFg) return;

    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    initAudio();
    buildTree();
    buildStars();
    loadProgress();
    resize();
    bindEvents();
    updateHUD();

    if (masteredTotalEl) {
      masteredTotalEl.textContent = nodes.filter((n) => n.notable).length;
    }

    window.addEventListener("resize", resize);

    /* Pause the wallpaper loop entirely while the Knowledge Tree is
       open (not just skip draws — cancel RAF so the main thread stays
       free for the explorable tree). Resume on "Retornar ao Mundo". */
    const ktreeObs = new MutationObserver(() => {
      if (document.body.classList.contains("ktree-open")) pauseForKtree();
      else resumeFromKtree();
    });
    ktreeObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    if (document.body.classList.contains("ktree-open")) pauseForKtree();
    else {
      // Seed the dormant state BEFORE the first paint so the very first
      // frame the visitor sees is the sleeping cosmos — never a flash of
      // the fully-lit tree that then snaps dark.
      const armed = armAwakening();
      scheduleRender();

      if (armed) {
        // The awakening only matters if it is SEEN. On a first visit the
        // welcome overlay covers the cosmos for several seconds, so hold
        // the sequence until the veil begins to lift — the visitor then
        // watches the universe wake "em silêncio" as the welcome clears.
        // When there is no welcome (returning visitor, fresh session),
        // begin right away on an already-clear screen.
        const welcomeEl = document.getElementById("arcane-welcome");
        if (welcomeEl && !welcomeEl.classList.contains("is-done")) {
          let begun = false;
          const go = () => {
            if (begun) return;
            begun = true;
            window.removeEventListener("cv-welcome-awaken", go);
            beginAwakening();
          };
          window.addEventListener("cv-welcome-awaken", go, { once: true });
          // Safety net: never leave the cosmos dormant if the cue is
          // somehow missed (welcome torn down, script error, etc.).
          window.setTimeout(go, 16000);
        } else {
          beginAwakening();
        }
      }
    }
  }

  return { init, reset, recenter, replayAwakening };
})();

window.SkillTree = SkillTree;
