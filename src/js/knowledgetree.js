/**
 * Árvore do Conhecimento · explorable living World-Tree (v3)
 * ======================================================================
 * A secret chapter unlocked inside Carlos Vaz's universe. Not a drawing
 * of a tree — an ancestral entity you EXPLORE with a camera.
 *
 *   · World-space scene rendered on a single Canvas 2D surface.
 *   · A monumental tree grows left → right; canopy, branches and roots
 *     spill beyond the viewport (you only ever see a fraction of it).
 *   · Camera: drag to pan, wheel to zoom, click a crystal to glide in.
 *   · Depth layers — atmosphere · fog · far branches (soft) · mid · near
 *     · crystals · UI · tooltips — each with its own blur/parallax.
 *   · Organic trunk: bark gradient, wood grain, cracks, rim lighting.
 *   · Living golden energy rises roots → trunk → branches → crystals,
 *     slow and breathing.
 *   · Categories are NOT text on branches — they are large ancestral
 *     crystals. Skills emerge organically only when you hover a crystal.
 *   · Click a crystal → camera focuses + a contextual relic panel opens
 *     (experience · projects · technologies). No page change.
 *
 * Public API: window.KnowledgeTree.open() / .close() / .toggle()
 *
 * A fallback of the previous version lives in .backups/ktree-v2/.
 */
const KnowledgeTree = (() => {
  "use strict";

  /* ──────────────────────────────────────────────────────────────────
   * 1 · DATA
   * ────────────────────────────────────────────────────────────────── */
  const AREAS = [
    {
      id: "web", label: "Desenvolvimento Web", color: "#4EA8E0",
      years: "4+ anos de prática",
      experience: "Construção de interfaces e sites responsivos com foco em performance, acessibilidade e experiência viva.",
      projects: ["Portfólio temático imersivo", "Landing pages interativas", "Componentes de UI animados"],
      tech: ["HTML5", "CSS3", "JavaScript", "Bootstrap", "Three.js"],
      skills: [
        { name: "HTML", desc: "Estrutura semântica e acessível — a fundação de toda interface.", years: "4+ anos", tech: ["HTML5", "ARIA", "SEO técnico"] },
        { name: "CSS", desc: "Estilização avançada, animações e layouts fluidos.", years: "4+ anos", tech: ["CSS3", "Grid", "Flexbox", "Animations"] },
        { name: "JavaScript", desc: "Interatividade, lógica de front-end e experiências dinâmicas.", years: "3+ anos", tech: ["ES2023", "Canvas", "DOM"] },
        { name: "Bootstrap", desc: "Prototipagem rápida com sistemas de grid e componentes.", years: "3+ anos", tech: ["Bootstrap 5"] },
        { name: "Responsividade", desc: "Layouts que respiram em qualquer tela, do mobile ao widescreen.", years: "4+ anos", tech: ["Media Queries", "clamp()", "Container Queries"] },
        { name: "SEO", desc: "Estrutura e performance que tornam o conteúdo encontrável.", years: "3+ anos", tech: ["Meta", "Schema", "Core Web Vitals"] },
      ],
    },
    {
      id: "ia", label: "Inteligência Artificial", color: "#A87BE6",
      years: "3+ anos explorando",
      experience: "Desenho de fluxos com IA, engenharia de prompts e automações que ampliam o trabalho criativo.",
      projects: ["Agentes de automação", "Pipelines de conteúdo assistido por IA", "Fluxos inteligentes de produtividade"],
      tech: ["LLMs", "Prompt Engineering", "n8n", "APIs de IA"],
      skills: [
        { name: "Prompt Engineering", desc: "A arte de dialogar com modelos para resultados precisos.", years: "3+ anos", tech: ["LLMs", "Few-shot", "Chain-of-thought"] },
        { name: "Agentes IA", desc: "Sistemas autônomos que executam tarefas encadeadas.", years: "2+ anos", tech: ["Agents", "Tools", "MCP"] },
        { name: "Automação", desc: "Eliminar o repetitivo para liberar o criativo.", years: "3+ anos", tech: ["n8n", "Make", "Webhooks"] },
        { name: "Fluxos Inteligentes", desc: "Orquestração de etapas e decisões assistidas por IA.", years: "2+ anos", tech: ["Workflows", "RAG"] },
        { name: "IA Generativa", desc: "Criação de texto, imagem e código a partir de intenção.", years: "3+ anos", tech: ["GPT", "Image Models", "Code Gen"] },
      ],
    },
    {
      id: "design", label: "Design de Experiência", color: "#43C7BE",
      years: "4+ anos de ofício",
      experience: "Direção de experiências visuais e interativas, do conceito à ambientação final.",
      projects: ["Sistema visual do portfólio", "Direção de arte temática", "Protótipos de experiência"],
      tech: ["Figma", "Design Tokens", "CSS", "Motion Design"],
      skills: [
        { name: "UI Design", desc: "Composição de interfaces belas e funcionais.", years: "4+ anos", tech: ["Figma", "Design Systems"] },
        { name: "UX Design", desc: "Decisões guiadas pela jornada e pela emoção do usuário.", years: "3+ anos", tech: ["Wireframes", "User Flows"] },
        { name: "Direção Artística", desc: "A coerência estética que dá alma ao produto.", years: "4+ anos", tech: ["Moodboards", "Art Direction"] },
        { name: "Ambientação", desc: "Atmosfera, luz e textura que envolvem o visitante.", years: "3+ anos", tech: ["Lighting", "Texture", "Mood"] },
        { name: "Design Visual", desc: "Tipografia, cor e ritmo a serviço da mensagem.", years: "4+ anos", tech: ["Type", "Color", "Layout"] },
      ],
    },
    {
      id: "story", label: "Storytelling Digital", color: "#E8B84B",
      years: "Linha-mestra do trabalho",
      experience: "Narrativas digitais que transformam navegação em jornada e produto em mundo.",
      projects: ["Portfólio como jornada narrativa", "Worldbuilding temático", "Experiências gamificadas"],
      tech: ["Narrative Design", "Motion", "Web Interativa"],
      skills: [
        { name: "Narrativas", desc: "Conduzir o visitante por uma história com clímax e descoberta.", years: "4+ anos", tech: ["Story Arcs", "Pacing"] },
        { name: "Worldbuilding", desc: "Construir universos coerentes e memoráveis.", years: "3+ anos", tech: ["Lore", "Systems"] },
        { name: "Gamificação", desc: "Progressão, recompensa e curiosidade como motores.", years: "2+ anos", tech: ["Progression", "Rewards"] },
        { name: "Experiências Imersivas", desc: "Dissolver a fronteira entre interface e mundo.", years: "3+ anos", tech: ["Interaction", "Atmosphere"] },
      ],
    },
  ];

  const ROOTS = {
    id: "roots", label: "Raízes · Origem Ambiental", color: "#5BBE6E",
    years: "A base de tudo",
    experience: "A formação ambiental que sustenta uma visão sistêmica e responsável do digital.",
    projects: ["Estudos de sustentabilidade", "Planejamento e licenciamento ambiental"],
    tech: ["Gestão Ambiental", "Análise Territorial"],
    skills: [
      { name: "Gestão Ambiental", desc: "Visão sistêmica de recursos, impacto e responsabilidade.", years: "Formação", tech: ["Sistemas", "Gestão"] },
      { name: "Sustentabilidade", desc: "Construir pensando no longo prazo e no equilíbrio.", years: "Formação", tech: ["ESG", "Ciclo de vida"] },
      { name: "Licenciamento Ambiental", desc: "Rigor, processo e conformidade aplicados ao real.", years: "Formação", tech: ["Normas", "Processos"] },
      { name: "Planejamento Ambiental", desc: "Organizar o território com método e propósito.", years: "Formação", tech: ["Territorial", "Análise"] },
    ],
  };

  const TRUNK_NAME = "CARLOS VAZ";
  const TRUNK_ROLE = "ARQUITETO DIGITAL";

  // a few faint rune glyphs for the "ancient symbols" of the background
  const RUNES = [
    (c) => { c.moveTo(0, -1); c.lineTo(0, 1); c.moveTo(-0.5, -0.3); c.lineTo(0.5, -0.3); },
    (c) => { c.moveTo(0, -1); c.lineTo(0.6, 0); c.lineTo(0, 1); c.lineTo(-0.6, 0); c.closePath(); },
    (c) => { c.arc(0, 0, 0.7, 0, Math.PI * 2); c.moveTo(0, -0.7); c.lineTo(0, 0.7); },
    (c) => { c.moveTo(-0.6, -0.7); c.lineTo(0.6, 0); c.lineTo(-0.6, 0.7); },
    (c) => { c.moveTo(0, -0.9); c.lineTo(0.5, 0.6); c.lineTo(-0.5, 0.6); c.closePath(); },
  ];

  /* ──────────────────────────────────────────────────────────────────
   * 2 · STATE
   * ────────────────────────────────────────────────────────────────── */
  let overlay, canvas, ctx;
  let tipEl, tipKicker, tipName, tipDesc, panelEl, hintEl;
  let dpr = 1, W = 0, H = 0;
  let rafId = null;
  let open = false, closing = false, reduced = false;

  let time = 0, growth = 0, energy = 0, dissolve = 0;
  let last = 0, sporeAccum = 0;

  // world & camera
  const BASE = { x: 0, y: 0 };          // trunk base in world coords
  let cam = { x: 0, y: 0, zoom: 1 };
  let camTarget = { x: 0, y: 0, zoom: 1 };
  let camHome = { x: 0, y: 0, zoom: 1 };
  let trunkW = 0;

  let branches = [];     // {kind, layer, path, gStart, gEnd, phase, flow}
  let mainCrystals = []; // 4 areas + roots origin
  let cracks = [], grain = [];
  let spores = [], dust = [], stars = [], constLines = [], runeMarks = [], mist = [];

  // input
  const ptr = { x: -9999, y: -9999, sx: 0, sy: 0, nx: 0, ny: 0, inside: false, down: false, drag: false, downX: 0, downY: 0, moved: 0 };
  let hovered = null;        // crystal under cursor (main or revealed skill)
  let selected = null;
  let hintDismissed = false;
  let camIntro = 0;          // 0→1 cinematic dolly-in
  let interactUntil = 0;       // timestamp — lite render tier while panning/zooming
  let interactLite = false;    // set each frame from interactUntil / ptr.drag / desktopLite
  let desktopLite = false;     // permanent lite tier on large desktop screens (logs: full idle ≈15fps, lite ≈75fps)
  let _scrollLockY = 0;        // preserved while body is position:fixed (ktree open)

  function markInteracting(ms) {
    interactUntil = Date.now() + (ms || 380);
  }

  /* ──────────────────────────────────────────────────────────────────
   * 3 · HELPERS
   * ────────────────────────────────────────────────────────────────── */
  function rnd(o) { o.s = (o.s * 1103515245 + 12345) & 0x7fffffff; return o.s / 0x7fffffff; }
  function hexRgb(hex) { const h = hex.replace("#", ""); return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }; }
  function rgba(hex, a) { const { r, g, b } = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function litA(hex, amt, a) { const { r, g, b } = hexRgb(hex); const f = (v) => Math.min(255, Math.round(v + (255 - v) * amt)); return `rgba(${f(r)},${f(g)},${f(b)},${a})`; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - clamp01(t), 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // world → screen (camera + cinematic intro dolly)
  function w2s(wx, wy) {
    const z = cam.zoom;
    return { x: W / 2 + (wx - cam.x) * z, y: H / 2 + (wy - cam.y) * z };
  }
  function s2w(sx, sy) {
    const z = cam.zoom;
    return { x: cam.x + (sx - W / 2) / z, y: cam.y + (sy - H / 2) / z };
  }

  // build a curved tapering world path → { pts:[{x,y,w}], cum, len }
  function makePath(x0, y0, angle, length, width, opts) {
    const segs = opts.segs || 16;
    const curl = opts.curl || 0, lift = opts.lift || 0, wiggle = opts.wiggle || 0;
    const taper = opts.taper == null ? 0.82 : opts.taper;
    const pts = []; let x = x0, y = y0, a = angle;
    for (let i = 0; i <= segs; i++) {
      const s = i / segs;
      pts.push({ x, y, w: Math.max(0.4, width * (1 - s * taper)) });
      const step = length / segs;
      a += curl + lift + Math.sin(s * 6.28 + (opts.phase || 0)) * wiggle;
      x += Math.cos(a) * step; y += Math.sin(a) * step;
    }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return { pts, cum, len: cum[cum.length - 1] || 1, endAng: a };
  }
  function pointAtW(path, t) {
    const target = clamp01(t) * path.len, cum = path.cum, pts = path.pts;
    let i = 1; while (i < cum.length && cum[i] < target) i++;
    const a = pts[i - 1], b = pts[i] || pts[i - 1];
    const seg = (cum[i] - cum[i - 1]) || 1, f = (target - cum[i - 1]) / seg;
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }

  // gentle world-space sway (breathing wind), stronger far from base
  function sway(wx, wy, phase) {
    if (reduced) return { dx: 0, dy: 0 };
    const sf = clamp01(Math.hypot(wx - BASE.x, wy - BASE.y) / 1200);
    const amp = sf * sf;
    const wind = Math.sin(time * 0.0010 + wx * 0.0024 + (phase || 0));
    const gust = Math.sin(time * 0.0018 + wy * 0.0030) * 0.4;
    return { dx: (wind + gust) * amp * 22, dy: Math.sin(time * 0.0014 + wx * 0.0035) * amp * 9 };
  }

  /* ──────────────────────────────────────────────────────────────────
   * 4 · BUILD (world coordinates, monumental)
   * ────────────────────────────────────────────────────────────────── */
  function buildTree() {
    branches = []; mainCrystals = []; cracks = []; grain = [];
    dust = []; stars = []; constLines = []; runeMarks = []; mist = [];
    const seed = { s: 70226 };

    trunkW = 132;

    // ── TRUNK: rises up-right with an ancient S-lean ──────────────────
    const topX = 300, topY = -640;
    const tPts = []; const tSeg = 26;
    for (let i = 0; i <= tSeg; i++) {
      const s = i / tSeg, e = easeOutCubic(s);
      const x = BASE.x + (topX - BASE.x) * e + Math.sin(s * Math.PI * 1.15) * trunkW * 0.34;
      const y = BASE.y + (topY - BASE.y) * s;
      tPts.push({ x, y, w: trunkW * (1 - s * 0.72) });
    }
    const tCum = [0];
    for (let i = 1; i < tPts.length; i++) tCum.push(tCum[i - 1] + Math.hypot(tPts[i].x - tPts[i - 1].x, tPts[i].y - tPts[i - 1].y));
    const trunk = { pts: tPts, cum: tCum, len: tCum[tCum.length - 1] };
    branches.push({ kind: "trunk", layer: 2, path: trunk, gStart: 0.14, gEnd: 0.42, phase: 0, flow: 0.1 });

    const trunkAt = (a) => {
      const idx = Math.min(tPts.length - 2, Math.floor(a * (tPts.length - 1)));
      const p0 = tPts[idx], p1 = tPts[idx + 1];
      return { x: p0.x, y: p0.y, ang: Math.atan2(p1.y - p0.y, p1.x - p0.x), w: p0.w };
    };

    // ── ROOTS: fan down into darkness, origin crystal at the deepest ──
    const rN = ROOTS.skills.length;
    let rootDeep = null;
    for (let i = 0; i < rN; i++) {
      const dir = ((i + 0.5) / rN - 0.5) * 2;
      const ang = Math.PI / 2 + dir * 0.7 - 0.05;
      const len = 230 + Math.abs(dir) * 120;
      const path = makePath(BASE.x + dir * trunkW * 0.34, BASE.y + trunkW * 0.22, ang, len, trunkW * (0.34 - Math.abs(dir) * 0.05),
        { segs: 14, curl: dir * 0.05, wiggle: 0.025, phase: i, taper: 0.92 });
      branches.push({ kind: "root", layer: 2, path, gStart: 0.0, gEnd: 0.2, phase: i * 1.3, flow: 0.0 });
      // tertiary rootlets for richness
      addChildBranches(path, 0.55, 2, "root", seed, 0.05);
      const tip = path.pts[path.pts.length - 1];
      if (!rootDeep || tip.y > rootDeep.y) rootDeep = { x: tip.x, y: tip.y };
    }
    // origin ancestral crystal nestled where the roots gather
    mainCrystals.push(makeMain(BASE.x - trunkW * 0.2, BASE.y + trunkW * 1.05, ROOTS, seed, 0.2, "down"));

    // ── FOUR PRIMARY BRANCHES → ancestral category crystals ───────────
    const BR = [
      { attach: 0.34, ang: 0.12, lift: -0.018, len: 760 },
      { attach: 0.54, ang: -0.08, lift: -0.014, len: 820 },
      { attach: 0.72, ang: -0.26, lift: -0.009, len: 780 },
      { attach: 0.88, ang: -0.46, lift: -0.004, len: 720 },
    ];
    AREAS.forEach((area, ai) => {
      const cfg = BR[ai];
      const at = trunkAt(cfg.attach);
      const primary = makePath(at.x, at.y, cfg.ang, cfg.len, at.w * 0.6,
        { segs: 26, curl: 0, lift: cfg.lift, wiggle: 0.01, phase: ai, taper: 0.72 });
      branches.push({ kind: "primary", layer: 2, path: primary, gStart: 0.40 + ai * 0.02, gEnd: 0.66 + ai * 0.02, phase: ai * 0.8, flow: 0.3 + cfg.attach * 0.12 });

      // secondary + tertiary + micro silhouette branches off the primary
      addChildBranches(primary, 0.34, 3, "secondary", seed, cfg.lift);

      // the ancestral category crystal — a rare fruit at ~0.72 along
      const cpos = pointAtW(primary, 0.72);
      const main = makeMain(cpos.x, cpos.y, area, seed, 0.78 + ai * 0.02, "out");
      // pre-compute skill sub-branches that EMERGE on hover
      const baseAngP = (() => { const a = pointAtW(primary, 0.66), b = pointAtW(primary, 0.78); return Math.atan2(b.y - a.y, b.x - a.x); })();
      const sN = area.skills.length;
      main.skills = area.skills.map((sk, si) => {
        const spreadT = (si / (sN - 1) - 0.5);     // -0.5..0.5
        const side = si % 2 === 0 ? -1 : 1;
        const sa = baseAngP + spreadT * 1.5 + side * 0.12;
        const slen = 150 + (si % 2) * 40;
        const sp = makePath(cpos.x, cpos.y, sa, slen, 10,
          { segs: 10, curl: side * 0.04, lift: -side * 0.012, wiggle: 0.03, phase: si, taper: 0.7 });
        const tip = sp.pts[sp.pts.length - 1];
        return {
          name: sk.name, desc: sk.desc, years: sk.years || area.years,
          tech: sk.tech || area.tech, area,
          path: sp, x: tip.x, y: tip.y, color: area.color,
          kicker: area.label, reveal: 0, pulse: rnd(seed) * 6.28,
          projects: sk.projects || area.projects,
        };
      });
      mainCrystals.push(main);
    });

    // ── FAR decorative branches (depth layer 0/1, soft + blurred) ─────
    for (let i = 0; i < 7; i++) {
      const fy = -120 - i * 90 - rnd(seed) * 60;
      const fx = 120 + rnd(seed) * 900;
      const ang = -0.5 + rnd(seed) * 0.9;
      const path = makePath(fx, fy, ang, 360 + rnd(seed) * 300, 30 + rnd(seed) * 24,
        { segs: 16, curl: (rnd(seed) - 0.5) * 0.06, lift: -0.008, wiggle: 0.02, phase: i, taper: 0.85 });
      branches.push({ kind: "far", layer: rnd(seed) < 0.5 ? 0 : 1, path, gStart: 0.3, gEnd: 0.7, phase: i, flow: 0.4 });
      addChildBranches(path, 0.4, 1, "far", seed, -0.008);
    }

    // ── TRUNK bark cracks + wood grain ────────────────────────────────
    for (let c = 0; c < 6; c++) {
      const off = c / 5 - 0.5; const pts = []; const segs = 16;
      for (let i = 0; i <= segs; i++) {
        const s = i / segs; const tp = trunkAt(clamp01(0.05 + s * 0.82));
        const px = Math.cos(tp.ang + Math.PI / 2), py = Math.sin(tp.ang + Math.PI / 2);
        const lat = (off + Math.sin(s * 7 + c) * 0.18) * tp.w * 0.72;
        pts.push({ x: tp.x + px * lat, y: tp.y + py * lat });
      }
      cracks.push(pts);
    }
    for (let g = 0; g < 9; g++) {
      const off = (g / 8 - 0.5) * 1.7; const pts = []; const segs = 20;
      for (let i = 0; i <= segs; i++) {
        const s = i / segs; const tp = trunkAt(clamp01(0.02 + s * 0.9));
        const px = Math.cos(tp.ang + Math.PI / 2), py = Math.sin(tp.ang + Math.PI / 2);
        const lat = (off * 0.42 + Math.sin(s * 4 + g * 1.3) * 0.12) * tp.w;
        pts.push({ x: tp.x + px * lat, y: tp.y + py * lat });
      }
      grain.push(pts);
    }

    // ── BACKGROUND FIELD: stars, constellations, runes, mist, dust ────
    for (let i = 0; i < 130; i++) {
      stars.push({ x: (rnd(seed) - 0.2) * 2600 - 200, y: -1200 + rnd(seed) * 1900, r: rnd(seed) * 1.5 + 0.3, a: rnd(seed) * 0.5 + 0.12, tw: rnd(seed) * 6.28, depth: rnd(seed) * 0.5 + 0.2 });
    }
    // a couple of faint constellations on the right
    for (let c = 0; c < 3; c++) {
      const cx = 1100 + rnd(seed) * 700, cy = -500 + rnd(seed) * 700;
      const node = []; const n = 4 + Math.floor(rnd(seed) * 3);
      for (let i = 0; i < n; i++) node.push({ x: cx + (rnd(seed) - 0.5) * 300, y: cy + (rnd(seed) - 0.5) * 280 });
      constLines.push({ node, depth: 0.3 + rnd(seed) * 0.2 });
    }
    for (let i = 0; i < 6; i++) {
      runeMarks.push({ x: 950 + rnd(seed) * 900, y: -650 + rnd(seed) * 900, r: 16 + rnd(seed) * 22, rune: Math.floor(rnd(seed) * RUNES.length), depth: 0.25 + rnd(seed) * 0.25, tw: rnd(seed) * 6.28 });
    }
    for (let i = 0; i < 6; i++) {
      mist.push({ x: 200 + rnd(seed) * 1100, y: -500 + rnd(seed) * 800, r: 420 + rnd(seed) * 460, depth: rnd(seed) * 0.5 + 0.2, hue: rnd(seed) < 0.5 ? "#2f6a72" : "#34527a", drift: rnd(seed) * 6.28 });
    }
    for (let i = 0; i < 90; i++) {
      dust.push({ x: (rnd(seed) - 0.2) * 2400 - 200, y: -1000 + rnd(seed) * 1700, r: rnd(seed) * 1.6 + 0.3, a: rnd(seed) * 0.4 + 0.1, tw: rnd(seed) * 6.28, depth: rnd(seed) * 0.6 + 0.25, vy: 0.05 + rnd(seed) * 0.12 });
    }

    computeHomeCamera();
  }

  // recursively add child branches (secondary → tertiary → micro) for a
  // natural, non-geometric silhouette
  function addChildBranches(parent, startAlong, depthLeft, kind, seed, lift) {
    if (depthLeft <= 0) return;
    const count = depthLeft === 3 ? 4 : depthLeft === 2 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const along = startAlong + (i / count) * (0.95 - startAlong);
      const idx = Math.min(parent.pts.length - 2, Math.floor(along * (parent.pts.length - 1)));
      const a0 = parent.pts[idx], a1 = parent.pts[idx + 1];
      const baseAng = Math.atan2(a1.y - a0.y, a1.x - a0.x);
      const side = i % 2 === 0 ? -1 : 1;
      const ang = baseAng + side * (0.5 + (i % 3) * 0.14) + (Math.random() - 0.5) * 0.1;
      const plen = a0.w * (depthLeft === 3 ? 5.5 : depthLeft === 2 ? 4 : 3);
      const sub = makePath(a0.x, a0.y, ang, plen, a0.w * 0.66,
        { segs: depthLeft === 3 ? 12 : 8, curl: side * 0.05, lift: lift - side * 0.008, wiggle: 0.035, phase: i + depthLeft, taper: 0.84 });
      const layer = kind === "far" ? 1 : 2;
      branches.push({ kind: depthLeft === 3 ? "secondary" : depthLeft === 2 ? "tertiary" : "micro", layer, path: sub,
        gStart: 0.5 + along * 0.1, gEnd: 0.8 + along * 0.08, phase: i + depthLeft, flow: 0.55 + along * 0.3 });
      addChildBranches(sub, 0.45, depthLeft - 1, kind, seed, lift);
    }
  }

  function makeMain(x, y, area, seed, gStart, facing) {
    return {
      x, y, bx: x, by: y, name: area.label, kicker: area.label.toUpperCase(),
      desc: area.experience, years: area.years, color: area.color, area,
      r: 26, big: true, gStart, appear: 0, pulse: rnd(seed) * 6.28,
      hoverEase: 0, skills: [], facing,
      projects: area.projects, tech: area.tech, experience: area.experience,
    };
  }

  function computeHomeCamera() {
    // Frame the entity monumentally: trunk rises from lower-left, the four
    // crystals fill the centre-right, canopy spills past the top and right,
    // roots dissolve below the bottom edge — you only see a fraction.
    const z = clamp(W / 1650, 0.42, 1.4);
    // on wide screens lift the framing so all four crystals are in view at rest;
    // the canopy/roots still spill beyond the edges.
    camHome = { x: 480, y: W > 900 ? -330 : -210, zoom: z };
  }

  /* ──────────────────────────────────────────────────────────────────
   * 5 · DRAW
   * ────────────────────────────────────────────────────────────────── */
  function drawnPts(path, frac) {
    if (frac >= 1) return path.pts;
    const total = path.pts.length - 1, exact = total * frac, last = Math.floor(exact);
    const out = path.pts.slice(0, last + 1), f = exact - last;
    if (f > 0 && last < total) { const a = path.pts[last], b = path.pts[last + 1]; out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, w: a.w + (b.w - a.w) * f }); }
    return out;
  }

  function strokeWorldPath(path, frac, lineWFn, style) {
    const raw = drawnPts(path, frac);
    if (raw.length < 2) return;
    ctx.beginPath();
    for (let i = 0; i < raw.length; i++) {
      const sv = sway(raw[i].x, raw[i].y);
      const sp = w2s(raw[i].x + sv.dx, raw[i].y + sv.dy);
      if (i === 0) ctx.moveTo(sp.x, sp.y); else ctx.lineTo(sp.x, sp.y);
    }
    ctx.strokeStyle = style; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineWidth = lineWFn();
    ctx.stroke();
  }

  function drawBranch(b, frac) {
    if (frac <= 0) return;
    if (interactLite && b.kind === "micro") return;
    const raw = drawnPts(b.path, frac);
    if (raw.length < 2) return;
    const pts = raw.map((p) => { const s = sway(p.x, p.y, b.phase); const sp = w2s(p.x + s.dx, p.y + s.dy); return { x: sp.x, y: sp.y, w: p.w * cam.zoom }; });

    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
      let tx = next.x - prev.x, ty = next.y - prev.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const nx = -ty, ny = tx, hw = Math.max(0.4, pts[i].w / 2);
      left.push({ x: pts[i].x + nx * hw, y: pts[i].y + ny * hw });
      right.push({ x: pts[i].x - nx * hw, y: pts[i].y - ny * hw });
    }

    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();

    const a0 = pts[0], a1 = pts[pts.length - 1];
    const grad = ctx.createLinearGradient(a0.x, a0.y, a1.x, a1.y);
    if (b.kind === "trunk") {
      grad.addColorStop(0, "#241608"); grad.addColorStop(0.4, "#5a4020"); grad.addColorStop(0.8, "#7c5a2f"); grad.addColorStop(1, "#9c7541");
    } else if (b.kind === "root") {
      grad.addColorStop(0, "#3c2912"); grad.addColorStop(1, rgba(b.path ? "#5BBE6E" : "#5BBE6E", 0.3));
    } else if (b.kind === "far") {
      grad.addColorStop(0, "#2a2436"); grad.addColorStop(1, "#3a4250");
    } else {
      grad.addColorStop(0, "#46321d"); grad.addColorStop(1, "#82602f");
    }

    if (b.layer === 0) {
      ctx.globalAlpha = interactLite ? 0.22 : 0.3;
      if (!interactLite) { try { ctx.filter = "blur(3px)"; } catch (e) { /* noop */ } }
    } else if (b.layer === 1) {
      ctx.globalAlpha = interactLite ? 0.42 : 0.55;
      if (!interactLite) { try { ctx.filter = "blur(1.2px)"; } catch (e) { /* noop */ } }
    }

    ctx.fillStyle = grad;
    if (!interactLite) {
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = b.kind === "trunk" ? 34 : (b.kind === "primary" || b.kind === "secondary" ? 8 : 0);
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.filter = "none";
    ctx.globalAlpha = 1;

    // rim light on the upper-left silhouette edge (volumetric)
    if (b.layer === 2 && !interactLite) {
      ctx.beginPath();
      ctx.moveTo(left[0].x, left[0].y);
      for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
      ctx.strokeStyle = b.kind === "trunk" ? "rgba(244,216,150,0.18)" : "rgba(236,206,150,0.20)";
      ctx.lineWidth = Math.max(0.5, pts[0].w * 0.08);
      ctx.lineCap = "round"; ctx.stroke();
    }
    return pts;
  }

  function drawTrunkDetail() {
    const reveal = ease((growth - 0.28) / 0.18);
    if (reveal <= 0 || interactLite) return;
    ctx.save();
    ctx.globalAlpha = reveal * (1 - dissolve);
    // wood grain (flowing curved lines)
    for (const pts of grain) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) { const s = sway(pts[i].x, pts[i].y); const sp = w2s(pts[i].x + s.dx, pts[i].y + s.dy); if (i === 0) ctx.moveTo(sp.x, sp.y); else ctx.lineTo(sp.x, sp.y); }
      ctx.strokeStyle = "rgba(60,40,18,0.32)"; ctx.lineWidth = Math.max(0.6, 1.1 * cam.zoom); ctx.stroke();
    }
    // cracks (darker, sharper)
    for (const pts of cracks) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) { const s = sway(pts[i].x, pts[i].y); const sp = w2s(pts[i].x + s.dx, pts[i].y + s.dy); if (i === 0) ctx.moveTo(sp.x, sp.y); else ctx.lineTo(sp.x, sp.y); }
      ctx.strokeStyle = "rgba(14,8,3,0.5)"; ctx.lineWidth = Math.max(0.8, 1.6 * cam.zoom); ctx.stroke();
    }
    ctx.restore();
  }

  function drawEngraving() {
    const reveal = ease((growth - 0.4) / 0.16);
    if (reveal <= 0) return;
    const trunk = branches.find((b) => b.kind === "trunk").path;
    const a = pointAtW(trunk, 0.28), b = pointAtW(trunk, 0.46);
    const sa = sway(a.x, a.y), sb = sway(b.x, b.y);
    const pa = w2s(a.x + sa.dx, a.y + sa.dy), pb = w2s(b.x + sb.dx, b.y + sb.dy);
    const ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
    const size = clamp(trunkW * 0.32 * cam.zoom, 13, 40);
    ctx.save();
    ctx.translate((pa.x + pb.x) / 2, (pa.y + pb.y) / 2);
    ctx.rotate(ang + Math.PI / 2);
    ctx.globalAlpha = reveal * (1 - dissolve);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `600 ${size}px "Cinzel","Cormorant Garamond",serif`;
    ctx.fillStyle = "rgba(22,13,5,0.7)"; ctx.fillText(TRUNK_NAME, 1.5, 1.5);
    if (!interactLite) { ctx.shadowColor = "rgba(242,200,121,0.7)"; ctx.shadowBlur = (14 + Math.sin(time * 0.004) * 5) * energy; }
    ctx.fillStyle = "#F6E6B6"; ctx.fillText(TRUNK_NAME, 0, 0);
    ctx.shadowBlur = 0;
    ctx.font = `600 ${size * 0.46}px "Cinzel","Cormorant Garamond",serif`;
    ctx.fillStyle = "rgba(220,184,124,0.92)"; ctx.fillText(TRUNK_ROLE, 0, size * 0.92);
    ctx.restore();
  }

  function drawEnergy() {
    if (energy <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const SPEED = reduced ? 0 : 0.0015;
    for (const b of branches) {
      if (b.layer !== 2) continue;
      if (interactLite && b.kind !== "trunk" && b.kind !== "primary" && b.kind !== "root") continue;
      const frac = ease(clamp01((growth - b.gStart) / ((b.gEnd - b.gStart) || 1)));
      if (frac <= 0.02) continue;
      const veinA = energy * (b.kind === "trunk" ? 0.5 : b.kind === "root" ? 0.3 : 0.38);
      // tracery
      ctx.beginPath();
      const steps = interactLite ? 8 : 16;
      for (let i = 0; i <= steps; i++) { const t = (i / steps) * frac; const p = pointAtW(b.path, t); const s = sway(p.x, p.y); const sp = w2s(p.x + s.dx, p.y + s.dy); if (i === 0) ctx.moveTo(sp.x, sp.y); else ctx.lineTo(sp.x, sp.y); }
      ctx.strokeStyle = rgba("#F2C879", veinA * (interactLite ? 0.38 : 0.5));
      ctx.lineWidth = (b.kind === "trunk" ? 2.4 : b.kind === "primary" ? 1.6 : 1) * cam.zoom;
      if (!interactLite) { ctx.shadowColor = rgba("#F2C879", veinA); ctx.shadowBlur = 6; }
      ctx.stroke(); ctx.shadowBlur = 0;
      // pulses
      let pulses = Math.max(1, Math.round(b.path.len / 200));
      if (interactLite) pulses = 1;
      for (let k = 0; k < pulses; k++) {
        let tp = (time * SPEED + b.flow * 0.6 + k / pulses) % 1;
        if (b.kind === "root") tp = 1 - tp;
        if (tp > frac) continue;
        const p = pointAtW(b.path, tp); const s = sway(p.x, p.y); const sp = w2s(p.x + s.dx, p.y + s.dy);
        const env = Math.sin(tp * Math.PI), a = energy * (0.5 + env * 0.5);
        const pr = (b.kind === "trunk" ? 7 : 5) * (0.7 + env * 0.6) * cam.zoom;
        const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, pr * 2.4);
        g.addColorStop(0, rgba("#FFE9B0", a)); g.addColorStop(0.4, rgba("#F2C879", a * 0.6)); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sp.x, sp.y, pr * 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawGem(sp, r, color, sc, hot) {
    const w = r * 0.92, h = r * 1.34;
    // glow
    const glowR = r * (interactLite ? 2.4 : (3.4 + (hot ? 2 : 0)));
    const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, glowR);
    g.addColorStop(0, rgba(color, (0.5 + energy * 0.2) * sc * (interactLite ? 0.75 : 1))); g.addColorStop(0.4, rgba(color, 0.15 * sc)); g.addColorStop(1, "transparent");
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sp.x, sp.y, glowR, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // gem body
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y - h); ctx.lineTo(sp.x + w, sp.y - h * 0.16); ctx.lineTo(sp.x + w * 0.5, sp.y + h);
    ctx.lineTo(sp.x - w * 0.5, sp.y + h); ctx.lineTo(sp.x - w, sp.y - h * 0.16); ctx.closePath();
    const gem = ctx.createLinearGradient(sp.x, sp.y - h, sp.x, sp.y + h);
    gem.addColorStop(0, litA(color, 0.6, sc)); gem.addColorStop(0.5, rgba(color, sc)); gem.addColorStop(1, litA(color, 0.1, sc));
    ctx.fillStyle = gem; ctx.fill();
    ctx.strokeStyle = litA(color, 0.75, 0.7 * sc); ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(sp.x, sp.y - h); ctx.lineTo(sp.x, sp.y + h); ctx.moveTo(sp.x - w, sp.y - h * 0.16); ctx.lineTo(sp.x + w, sp.y - h * 0.16); ctx.stroke();
    ctx.strokeStyle = litA(color, 0.45, 0.9 * sc); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sp.x, sp.y - h); ctx.lineTo(sp.x + w, sp.y - h * 0.16); ctx.lineTo(sp.x + w * 0.5, sp.y + h); ctx.lineTo(sp.x - w * 0.5, sp.y + h); ctx.lineTo(sp.x - w, sp.y - h * 0.16); ctx.closePath(); ctx.stroke();
    if (hot && !interactLite) { ctx.beginPath(); ctx.arc(sp.x, sp.y, r + 7, 0, Math.PI * 2); ctx.strokeStyle = litA(color, 0.5, 0.85); ctx.lineWidth = 1.5; ctx.stroke(); }
  }

  function drawCrystals() {
    for (const m of mainCrystals) {
      m.appear = ease(clamp01((growth - m.gStart) / 0.16));
      if (m.appear <= 0) continue;
      const branchOpen = mainCrystalActive(m);
      const branchVisible = m.skills.some((sk) => sk.reveal > 0.45);
      const decay = reduced ? 1 : (branchOpen ? 0.12 : branchVisible ? 0.055 : 0.12);
      m.hoverEase = lerp(m.hoverEase, branchOpen ? 1 : 0, decay);

      // revealed skill sub-branches + mini crystals (emerge organically)
      for (const sk of m.skills) {
        sk.reveal = lerp(sk.reveal, m.hoverEase, reduced ? 1 : 0.16);
        if (sk.reveal > 0.02) {
          strokeWorldPath(sk.path, sk.reveal, () => Math.max(0.6, 3 * cam.zoom), rgba(sk.color, 0.5 * sk.reveal));
          const s = sway(sk.x, sk.y, sk.pulse); const sp = w2s(sk.x + s.dx, sk.y + s.dy);
          sk._sx = sp.x; sk._sy = sp.y; sk._sr = 8 * cam.zoom;
          drawGem(sp, 8 * cam.zoom * sk.reveal, sk.color, sk.reveal, hovered === sk);
          // tiny skill label
          if (sk.reveal > 0.6 && !interactLite) {
            ctx.save();
            ctx.globalAlpha = (sk.reveal - 0.6) / 0.4;
            ctx.font = `600 ${Math.max(9, 11 * cam.zoom)}px "Cinzel","Cormorant Garamond",serif`;
            ctx.textAlign = "center"; ctx.fillStyle = litA(sk.color, 0.6, 0.9);
            ctx.fillText(sk.name, sp.x, sp.y - 14 * cam.zoom);
            ctx.restore();
          }
        } else { sk._sr = 0; }
      }

      // the ancestral crystal itself
      const s = sway(m.bx, m.by, m.pulse); const sp = w2s(m.bx + s.dx, m.by + s.dy);
      m.x = m.bx; m.y = m.by; m._sx = sp.x; m._sy = sp.y;
      const pulse = 1 + Math.sin(time * 0.004 + m.pulse) * 0.07;
      const r = m.r * cam.zoom * m.appear * pulse * (1 + m.hoverEase * 0.18);
      m._sr = r;
      // ornamental ring for "ancestral" weight
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.beginPath(); ctx.arc(sp.x, sp.y, r * 1.7, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(m.color, (0.25 + m.hoverEase * 0.3) * m.appear); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
      drawGem(sp, r, m.color, m.appear, hovered === m);
    }
  }

  function drawAtmosphere() {
    /* Translucent base: the .ktree__backdrop (RPG-library photo, fixed
       to the full viewport) sits behind this canvas, so we let it show
       through as ambience instead of painting an opaque fill. The wash
       still darkens enough to keep the tree + crystals the focus, and
       covers the whole viewport so panning never reveals page holes. */
    ctx.fillStyle = "rgba(5, 10, 12, 0.46)";
    ctx.fillRect(0, 0, W, H);
    // base astral wash
    const cx = W * 0.46, cy = H * 0.44;
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * 0.6);
    const br = 0.14 + Math.sin(time * 0.0015) * 0.04;
    bg.addColorStop(0, rgba("#356a70", br)); bg.addColorStop(0.5, rgba("#1f3a48", br * 0.5)); bg.addColorStop(1, "transparent");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // parallax stars
    for (const st of stars) {
      const sp = w2s(st.x, st.y);
      const px = sp.x + ptr.nx * 16 * st.depth, py = sp.y + ptr.ny * 10 * st.depth;
      if (px < -10 || px > W + 10 || py < -10 || py > H + 10) continue;
      const a = st.a * (0.6 + (reduced ? 0.4 : Math.sin(time * 0.002 + st.tw) * 0.4));
      ctx.beginPath(); ctx.arc(px, py, st.r, 0, Math.PI * 2); ctx.fillStyle = rgba("#cfe6ff", a); ctx.fill();
    }
    // faint constellations
    ctx.save(); ctx.globalAlpha = 0.5;
    for (const c of constLines) {
      ctx.beginPath();
      for (let i = 0; i < c.node.length; i++) { const sp = w2s(c.node[i].x, c.node[i].y); const px = sp.x + ptr.nx * 18 * c.depth, py = sp.y + ptr.ny * 12 * c.depth; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.strokeStyle = "rgba(150,190,230,0.10)"; ctx.lineWidth = 1; ctx.stroke();
      for (const nd of c.node) { const sp = w2s(nd.x, nd.y); const px = sp.x + ptr.nx * 18 * c.depth, py = sp.y + ptr.ny * 12 * c.depth; ctx.beginPath(); ctx.arc(px, py, 1.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(180,210,240,0.5)"; ctx.fill(); }
    }
    ctx.restore();
    // ancient runes (very faint)
    for (const rm of runeMarks) {
      const sp = w2s(rm.x, rm.y); const px = sp.x + ptr.nx * 14 * rm.depth, py = sp.y + ptr.ny * 9 * rm.depth;
      const a = 0.06 + Math.sin(time * 0.0016 + rm.tw) * 0.03;
      ctx.save(); ctx.translate(px, py); ctx.scale(rm.r * cam.zoom * 0.5, rm.r * cam.zoom * 0.5);
      ctx.beginPath(); RUNES[rm.rune](ctx); ctx.strokeStyle = `rgba(214,196,150,${a})`; ctx.lineWidth = 0.08; ctx.stroke(); ctx.restore();
    }
    // volumetric mist (fewer blobs while panning)
    const mistN = interactLite ? 3 : mist.length;
    for (let mi = 0; mi < mistN; mi++) {
      const m = mist[mi];
      const sp = w2s(m.x, m.y);
      const dx = (reduced ? 0 : Math.sin(time * 0.0006 + m.drift) * 22) + ptr.nx * 26 * m.depth;
      const dy = (reduced ? 0 : Math.cos(time * 0.0005 + m.drift) * 14) + ptr.ny * 16 * m.depth;
      const r = m.r * cam.zoom;
      const mg = ctx.createRadialGradient(sp.x + dx, sp.y + dy, 0, sp.x + dx, sp.y + dy, r);
      mg.addColorStop(0, rgba(m.hue, 0.09 * m.depth)); mg.addColorStop(1, "transparent");
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(sp.x + dx, sp.y + dy, r, 0, Math.PI * 2); ctx.fill();
    }
    // subtle god rays from upper area
    if (!interactLite) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i++) {
      const ox = W * (0.28 + i * 0.18);
      const grd = ctx.createLinearGradient(ox, -50, ox - 120, H);
      const a = (0.03 + Math.sin(time * 0.0012 + i) * 0.015);
      grd.addColorStop(0, `rgba(220,200,150,${a})`); grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd; ctx.save(); ctx.translate(ox, 0); ctx.rotate(0.18); ctx.fillRect(-90, -50, 180, H + 100); ctx.restore();
    }
    ctx.restore();
    }
  }

  function drawDust(fu) {
    fu = fu || 1;
    for (const d of dust) {
      d.y -= reduced ? 0 : d.vy * fu;
      if (d.y < -1100) d.y = 700;
      const sp = w2s(d.x, d.y);
      const px = sp.x + ptr.nx * 24 * d.depth, py = sp.y + ptr.ny * 16 * d.depth;
      if (px < -8 || px > W + 8 || py < -8 || py > H + 8) continue;
      const a = d.a * (0.6 + (reduced ? 0.4 : Math.sin(time * 0.003 + d.tw) * 0.4));
      ctx.beginPath(); ctx.arc(px, py, d.r * Math.max(0.6, cam.zoom * 0.8), 0, Math.PI * 2);
      ctx.fillStyle = rgba("#bfe6ff", a); ctx.fill();
    }
  }

  function spawnSpore() {
    spores.push({ x: BASE.x + (Math.random() - 0.2) * 900, y: -100 - Math.random() * 600, vx: (Math.random() - 0.5) * 0.5, vy: -(0.3 + Math.random() * 0.6), life: 1, decay: 0.004 + Math.random() * 0.005, r: 0.8 + Math.random() * 1.8, color: Math.random() < 0.5 ? "#F2C879" : "#9FD0C6" });
  }
  function drawSpores(fu) {
    fu = fu || 1;
    for (let i = spores.length - 1; i >= 0; i--) {
      const p = spores[i]; p.x += p.vx * fu; p.y += p.vy * fu; p.life -= p.decay * fu;
      if (p.life <= 0) { spores.splice(i, 1); continue; }
      const sp = w2s(p.x, p.y);
      ctx.beginPath(); ctx.arc(sp.x, sp.y, p.r * Math.max(0.6, cam.zoom * 0.8), 0, Math.PI * 2);
      ctx.fillStyle = rgba(p.color, p.life * 0.7); ctx.fill();
    }
  }

  /* ──────────────────────────────────────────────────────────────────
   * 6 · FRAME
   * ────────────────────────────────────────────────────────────────── */
  function frame(now) {
    if (!open && dissolve >= 1) { rafId = null; return; }
    // time-based so the cinematic timing is identical on any framerate
    if (!last) last = now || performance.now();
    let dtms = (now || performance.now()) - last; last = now || performance.now();
    if (dtms > 500 || dtms < 0) dtms = 16.667; // clamp only true tab-switch gaps
    const fu = dtms / 16.667;                 // frame-units relative to 60fps
    const fl = (k) => 1 - Math.pow(1 - k, fu); // framerate-independent lerp factor
    time += fu;

    if (closing) { dissolve = clamp01(dissolve + (reduced ? 1 : 0.05 * fu)); energy = Math.max(0, energy - 0.05 * fu); }
    else { growth = clamp01(growth + (reduced ? 1 : 0.0115 * fu)); energy = clamp01((growth - 0.34) / 0.5); }

    interactLite = !reduced && (desktopLite || ptr.drag || Date.now() < interactUntil);
    if (interactLite) document.body.classList.add("ktree-interacting");
    else document.body.classList.remove("ktree-interacting");

    // camera: direct follow while dragging (no rubber-band lag); smooth lerp when idle
    if (!reduced && !closing) camIntro = clamp01(camIntro + 0.007 * fu);
    else camIntro = 1;
    const zoomGoal = camTarget.zoom * (0.94 + 0.06 * camIntro);
    if (ptr.drag) {
      cam.x = camTarget.x;
      cam.y = camTarget.y;
      cam.zoom = lerp(cam.zoom, zoomGoal, fl(0.28));
    } else {
      cam.x = lerp(cam.x, camTarget.x, fl(0.08));
      cam.y = lerp(cam.y, camTarget.y, fl(0.08));
      cam.zoom = lerp(cam.zoom, zoomGoal, fl(0.08));
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1 - dissolve * 0.12;

    drawAtmosphere();

    // FAR branches (layers 0/1)
    for (const b of branches) if (b.layer === 0) drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));
    for (const b of branches) if (b.layer === 1) drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));

    // NEAR structure
    for (const b of branches) if (b.layer === 2 && b.kind === "root") drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));
    for (const b of branches) if (b.layer === 2 && b.kind === "trunk") drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));
    drawTrunkDetail();
    for (const b of branches) if (b.layer === 2 && b.kind === "primary") drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));
    for (const b of branches) if (b.layer === 2 && (b.kind === "secondary" || b.kind === "tertiary" || b.kind === "micro")) drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));

    drawEnergy();
    drawEngraving();
    drawCrystals();

    drawDust(fu);
    sporeAccum += fu;
    if (!reduced && open && !closing && sporeAccum >= 7 && spores.length < 80) { sporeAccum = 0; spawnSpore(); }
    drawSpores(fu);

    ctx.globalAlpha = 1;
    updateHover();

    if (closing && dissolve >= 1) { finishClose(); return; }
    rafId = requestAnimationFrame(frame);
  }

  /* ──────────────────────────────────────────────────────────────────
   * 7 · INTERACTION
   * ────────────────────────────────────────────────────────────────── */
  /** True while the main crystal (or one of its revealed skills) is active. */
  function mainCrystalActive(m) {
    if (hovered === m) return true;
    if (selected === m || (selected && selected._mainRef === m)) return true;
    if (hovered && hovered._mainRef === m) return true;
    return false;
  }

  function allClickable() {
    const out = [];
    for (const m of mainCrystals) {
      if (m.appear > 0.4) out.push(m);
      for (const sk of m.skills) {
        // Skills stay targetable while the branch is opening or the parent
        // is still held open — avoids the gap where reveal drops below 0.5
        // before the cursor reaches the tip crystal.
        if (sk.reveal > 0.35 || m.hoverEase > 0.5) {
          sk._mainRef = m;
          out.push(sk);
        }
      }
    }
    return out;
  }
  function hitTest(sx, sy) {
    let best = null, bestD = Infinity;
    for (const n of allClickable()) {
      if (n._sr == null) continue;
      const d = Math.hypot((n._sx ?? -9999) - sx, (n._sy ?? -9999) - sy);
      const isSkill = !n.skills;
      const reach = (n._sr || 8) + (isSkill ? 28 : 16);
      if (d < reach && d < bestD) { bestD = d; best = n; }
    }
    return best;
  }

  function updateHover() {
    if (!ptr.inside || closing) { if (hovered) { hovered = null; hideTip(); document.body.style.cursor = ptr.down ? "grabbing" : ""; } return; }
    const n = hitTest(ptr.sx, ptr.sy);
    if (n !== hovered) {
      hovered = n;
      if (n) showTip(n); else hideTip();
      if (!ptr.down) document.body.style.cursor = n ? "pointer" : "grab";
    }
    if (hovered) positionTip(hovered);
  }

  function showTip(n) {
    if (!tipEl) return;
    tipKicker.textContent = n.kicker || (n.area ? n.area.label : "");
    tipName.textContent = n.name;
    tipDesc.textContent = n.desc || "";
    tipEl.style.setProperty("--ktree-accent", n.color);
    tipEl.classList.add("is-visible"); tipEl.setAttribute("aria-hidden", "false");
    if (!hintDismissed) { hintDismissed = true; hintEl?.classList.add("is-dismissed"); }
  }
  function positionTip(n) { if (!tipEl) return; tipEl.style.left = `${n._sx}px`; tipEl.style.top = `${n._sy - (n._sr || 10) - 8}px`; }
  function hideTip() { tipEl?.classList.remove("is-visible"); tipEl?.setAttribute("aria-hidden", "true"); }

  function focusOn(n) {
    camTarget.x = n.bx != null ? n.bx : n.x;
    camTarget.y = (n.by != null ? n.by : n.y);
    camTarget.zoom = clamp(camHome.zoom * 1.7, 0.6, 2.6);
  }
  function goHome() { camTarget = { ...camHome }; }

  function openPanel(n) {
    if (!panelEl) return;
    selected = n;
    const accent = n.color;
    panelEl.style.setProperty("--ktree-accent", accent);
    document.getElementById("ktree-panel-sigil").style.background = `radial-gradient(circle at 40% 35%, ${litA(accent, 0.4, 1)}, ${rgba(accent, 0.85)})`;
    document.getElementById("ktree-panel-kicker").textContent = n.kicker || (n.area ? n.area.label : "");
    document.getElementById("ktree-panel-title").textContent = n.name;
    const yearsEl = document.getElementById("ktree-panel-years");
    if (yearsEl) yearsEl.textContent = n.years || (n.area ? n.area.years : "");
    const descTxt = n.desc || n.experience || "";
    const expTxt = (n.area ? n.area.experience : n.experience) || "";
    document.getElementById("ktree-panel-desc").textContent = descTxt;
    document.getElementById("ktree-panel-exp").textContent = expTxt;
    // hide the "experiência relacionada" block when it just repeats the description
    const expWrap = document.getElementById("ktree-panel-exp-wrap");
    if (expWrap) expWrap.style.display = (!expTxt || expTxt === descTxt) ? "none" : "";
    const proj = n.projects || (n.area ? n.area.projects : []);
    document.getElementById("ktree-panel-proj").innerHTML = proj.map((p) => `<li>${p}</li>`).join("");
    const tech = n.tech || (n.area ? n.area.tech : []);
    document.getElementById("ktree-panel-tech").innerHTML = tech.map((t) => `<span class="ktree__panel-tag">${t}</span>`).join("");
    panelEl.classList.add("is-open"); panelEl.setAttribute("aria-hidden", "false");
    focusOn(n);
  }
  function closePanel() { selected = null; panelEl?.classList.remove("is-open"); panelEl?.setAttribute("aria-hidden", "true"); }

  /* ──────────────────────────────────────────────────────────────────
   * 8 · SIZING / OPEN / CLOSE
   * ────────────────────────────────────────────────────────────────── */
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    const rawDpr = window.devicePixelRatio || 1;
    // Large desktop viewports: cap DPR so fill-rate stays manageable (mobile stays sharp).
    dpr = Math.min(rawDpr, W * H > 900000 ? 1.25 : 2);
    // The full-quality render path applies per-frame ctx.filter blur and
    // shadowBlur, which cost ~60ms/frame of GPU compositor time on every
    // viewport tested (~15fps), whereas the lite tier runs at ~75fps. Those
    // blur/shadow ops are not affordable per frame, so the optimized tier is
    // the permanent baseline for all sizes.
    desktopLite = true;
    if (!canvas) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTree();
    // keep camera framing on resize
    camTarget.zoom = clamp(camTarget.zoom, 0.5, 2.8);
  }

  function doOpen() {
    if (open) return;
    open = true; closing = false;
    growth = 0; energy = 0; dissolve = 0; camIntro = 0; last = 0; sporeAccum = 0; time = 0;
    hovered = null; selected = null; hintDismissed = false; spores.length = 0;
    ptr.nx = 0; ptr.ny = 0; ptr.inside = false; ptr.down = false; ptr.drag = false;
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    _scrollLockY = window.scrollY || 0;
    document.body.style.top = `-${_scrollLockY}px`;
    document.body.classList.add("ktree-open");
    overlay.classList.add("is-open"); overlay.setAttribute("aria-hidden", "false");
    hintEl?.classList.remove("is-dismissed"); closePanel();
    resize();
    camHome.x = camHome.x; cam = { ...camHome }; camTarget = { ...camHome };
    if (reduced) { growth = 1; energy = 1; camIntro = 1; }
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);
    setTimeout(() => document.getElementById("ktree-close")?.focus({ preventScroll: true }), 60);
  }

  function doClose() {
    if (!open || closing) return;
    closing = true; closePanel();
    for (const m of mainCrystals) for (let k = 0; k < 6; k++) spores.push({ x: m.x, y: m.y, vx: (Math.random() - 0.5) * 2.6, vy: -(0.4 + Math.random() * 2.4), life: 1, decay: 0.02 + Math.random() * 0.02, r: 1 + Math.random() * 2.4, color: m.color });
    hideTip();
    overlay.classList.remove("is-open");
    if (rafId) cancelAnimationFrame(rafId); rafId = requestAnimationFrame(frame);
  }
  function finishClose() {
    open = false; closing = false;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ktree-open", "ktree-interacting");
    document.body.style.top = "";
    window.scrollTo(0, _scrollLockY);
    if (rafId) cancelAnimationFrame(rafId); rafId = null;
    ctx && ctx.clearRect(0, 0, W, H); spores.length = 0;
    document.querySelector("[data-ktree-open]")?.focus?.({ preventScroll: true });
  }
  function toggle() { open ? doClose() : doOpen(); }

  /* ──────────────────────────────────────────────────────────────────
   * 9 · WIRING
   * ────────────────────────────────────────────────────────────────── */
  function init() {
    overlay = document.getElementById("knowledge-tree");
    canvas = document.getElementById("ktree-canvas");
    tipEl = document.getElementById("ktree-tip");
    tipKicker = document.getElementById("ktree-tip-kicker");
    tipName = document.getElementById("ktree-tip-name");
    tipDesc = document.getElementById("ktree-tip-desc");
    panelEl = document.getElementById("ktree-panel");
    hintEl = document.getElementById("ktree-hint");
    if (!overlay || !canvas) return;
    ctx = canvas.getContext("2d");
    W = window.innerWidth; H = window.innerHeight;   // avoid divide-by-zero before first open

    document.querySelectorAll("[data-ktree-open]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); doOpen(); }));
    document.getElementById("ktree-close")?.addEventListener("click", doClose);
    document.getElementById("ktree-panel-close")?.addEventListener("click", () => { closePanel(); goHome(); });

    // pointer: hover + drag-pan + click-to-focus
    canvas.addEventListener("pointerdown", (e) => {
      ptr.down = true; ptr.drag = false; ptr.moved = 0; ptr.downX = e.clientX; ptr.downY = e.clientY;
      markInteracting();
      document.body.style.cursor = "grabbing";
    });
    window.addEventListener("pointermove", (e) => {
      if (!open) return;                      // only track while the world is live
      ptr.sx = e.clientX; ptr.sy = e.clientY; ptr.inside = true;
      ptr.nx = W ? (e.clientX / W - 0.5) * 2 : 0;
      ptr.ny = H ? (e.clientY / H - 0.5) * 2 : 0;
      const w = s2w(e.clientX, e.clientY); ptr.x = w.x; ptr.y = w.y;
      if (ptr.down) {
        const ddx = e.clientX - ptr.downX, ddy = e.clientY - ptr.downY;
        ptr.moved += Math.abs(ddx) + Math.abs(ddy);
        if (ptr.moved > 6) ptr.drag = true;
        if (ptr.drag) { camTarget.x -= ddx / cam.zoom; camTarget.y -= ddy / cam.zoom; ptr.downX = e.clientX; ptr.downY = e.clientY; clampCam(); markInteracting(); }
      }
    });
    window.addEventListener("pointerup", (e) => {
      if (open && ptr.down && !ptr.drag) {
        const n = hitTest(e.clientX, e.clientY);
        if (n) openPanel(n); else { closePanel(); goHome(); }
      }
      ptr.down = false; ptr.drag = false;
      document.body.style.cursor = hovered ? "pointer" : (ptr.inside ? "grab" : "");
    });
    canvas.addEventListener("pointerleave", () => { ptr.inside = false; });

    canvas.addEventListener("wheel", (e) => {
      if (!open) return;
      e.preventDefault();
      markInteracting();
      const before = s2w(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      camTarget.zoom = clamp(camTarget.zoom * factor, camHome.zoom * 0.7, camHome.zoom * 2.8);
      // zoom toward cursor: keep the world point under the cursor stable
      const z = camTarget.zoom;
      camTarget.x = before.x - (e.clientX - W / 2) / z;
      camTarget.y = before.y - (e.clientY - H / 2) / z;
      clampCam();
    }, { passive: false });

    window.addEventListener("keydown", (e) => {
      if (!open) return;
      if (e.key === "Escape") { if (selected) { closePanel(); goHome(); } else doClose(); }
    });
    window.addEventListener("resize", () => { if (open) resize(); });
  }

  function clampCam() {
    camTarget.x = clamp(camTarget.x, -400, 1500);
    camTarget.y = clamp(camTarget.y, -1000, 600);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return {
    open: doOpen, close: doClose, toggle,
    _nodes: () => mainCrystals.map((m) => ({ x: m._sx, y: m._sy, r: m._sr, name: m.name, appear: m.appear, gStart: m.gStart, bx: m.bx, by: m.by })),
    _state: () => ({ growth, energy, dissolve, zoom: cam.zoom, camx: cam.x, camy: cam.y, counts: branches.reduce((a, b) => { a[b.kind] = (a[b.kind] || 0) + 1; return a; }, {}) }),
  };
})();

window.KnowledgeTree = KnowledgeTree;
