/**
 * Árvore do Conhecimento · monumental living-tree overlay
 * ======================================================================
 * A secret chapter of the portfolio. Clicking "Explorar Árvore" opens a
 * fullscreen astral plane: the page behind is blurred + darkened +
 * desaturated (CSS) and frozen (background scenes paused), while a
 * monumental ancestral tree GROWS left → right across the widescreen.
 *
 *   roots (lower-left, origin)  →  engraved trunk (CARLOS VAZ)
 *   →  four structural branches expanding to the right
 *   →  crystal "fruits" (skills) growing from the branches
 *
 * A living magic circuit of energy rises from the roots, climbs the
 * trunk and streams out to every crystal. Hover a crystal → tooltip;
 * click → contextual relic panel (experience · projects · tech). No
 * page change ever happens.
 *
 * Pure Canvas 2D (no extra deps). Public API:
 *   window.KnowledgeTree.open() / .close() / .toggle()
 */
const KnowledgeTree = (() => {
  "use strict";

  /* ──────────────────────────────────────────────────────────────────
   * 1 · DATA — areas, skills and their relic content
   * ────────────────────────────────────────────────────────────────── */
  const AREAS = [
    {
      id: "web",
      label: "Desenvolvimento Web",
      color: "#4EA8E0",
      experience:
        "Construção de interfaces e sites responsivos com foco em performance, acessibilidade e experiência viva.",
      projects: ["Portfólio temático imersivo", "Landing pages interativas", "Componentes de UI animados"],
      tech: ["HTML", "CSS", "JavaScript", "Bootstrap", "Three.js"],
      skills: [
        { name: "HTML", desc: "Estrutura semântica e acessível — a fundação de toda interface." },
        { name: "CSS", desc: "Estilização avançada, animações e layouts fluidos." },
        { name: "JavaScript", desc: "Interatividade, lógica de front-end e experiências dinâmicas." },
        { name: "Bootstrap", desc: "Prototipagem rápida com sistemas de grid e componentes." },
        { name: "Responsividade", desc: "Layouts que respiram em qualquer tela, do mobile ao widescreen." },
        { name: "SEO", desc: "Estrutura e performance que tornam o conteúdo encontrável." },
      ],
    },
    {
      id: "ia",
      label: "Inteligência Artificial",
      color: "#A87BE6",
      experience:
        "Desenho de fluxos com IA, engenharia de prompts e automações que ampliam o trabalho criativo.",
      projects: ["Agentes de automação", "Pipelines de conteúdo assistido por IA", "Fluxos inteligentes de produtividade"],
      tech: ["LLMs", "Prompt Engineering", "n8n", "APIs de IA"],
      skills: [
        { name: "Prompt Engineering", desc: "A arte de dialogar com modelos para resultados precisos." },
        { name: "Agentes IA", desc: "Sistemas autônomos que executam tarefas encadeadas." },
        { name: "Automação", desc: "Eliminar o repetitivo para liberar o criativo." },
        { name: "Fluxos Inteligentes", desc: "Orquestração de etapas e decisões assistidas por IA." },
        { name: "IA Generativa", desc: "Criação de texto, imagem e código a partir de intenção." },
      ],
    },
    {
      id: "design",
      label: "Design de Experiência",
      color: "#43C7BE",
      experience:
        "Direção de experiências visuais e interativas, do conceito à ambientação final.",
      projects: ["Sistema visual do portfólio", "Direção de arte temática", "Protótipos de experiência"],
      tech: ["Figma", "Design Tokens", "CSS", "Motion Design"],
      skills: [
        { name: "UI Design", desc: "Composição de interfaces belas e funcionais." },
        { name: "UX Design", desc: "Decisões guiadas pela jornada e pela emoção do usuário." },
        { name: "Direção Artística", desc: "A coerência estética que dá alma ao produto." },
        { name: "Ambientação", desc: "Atmosfera, luz e textura que envolvem o visitante." },
        { name: "Design Visual", desc: "Tipografia, cor e ritmo a serviço da mensagem." },
      ],
    },
    {
      id: "story",
      label: "Storytelling Digital",
      color: "#E8B84B",
      experience:
        "Narrativas digitais que transformam navegação em jornada e produto em mundo.",
      projects: ["Portfólio como jornada narrativa", "Worldbuilding temático", "Experiências gamificadas"],
      tech: ["Narrative Design", "Motion", "Web Interativa"],
      skills: [
        { name: "Narrativas", desc: "Conduzir o visitante por uma história com clímax e descoberta." },
        { name: "Worldbuilding", desc: "Construir universos coerentes e memoráveis." },
        { name: "Gamificação", desc: "Progressão, recompensa e curiosidade como motores." },
        { name: "Experiências Imersivas", desc: "Dissolver a fronteira entre interface e mundo." },
      ],
    },
  ];

  const ROOTS = {
    id: "roots",
    label: "Raízes · Origem",
    color: "#5BBE6E",
    experience:
      "A base ambiental que sustenta uma visão sistêmica e responsável do digital.",
    projects: ["Estudos de sustentabilidade", "Planejamento e licenciamento ambiental"],
    tech: ["Gestão Ambiental", "Análise Territorial"],
    skills: [
      { name: "Gestão Ambiental", desc: "Visão sistêmica de recursos, impacto e responsabilidade." },
      { name: "Sustentabilidade", desc: "Construir pensando no longo prazo e no equilíbrio." },
      { name: "Licenciamento Ambiental", desc: "Rigor, processo e conformidade aplicados ao real." },
      { name: "Planejamento Ambiental", desc: "Organizar o território com método e propósito." },
    ],
  };

  const TRUNK_NAME = "CARLOS VAZ";
  const TRUNK_ROLE = "ARQUITETO DIGITAL";

  /* ──────────────────────────────────────────────────────────────────
   * 2 · STATE
   * ────────────────────────────────────────────────────────────────── */
  let overlay, canvas, ctx;
  let tipEl, tipKicker, tipName, tipDesc;
  let panelEl, hintEl;
  let dpr = 1, W = 0, H = 0;
  let rafId = null;
  let open = false, closing = false, reduced = false;

  let time = 0;
  let growth = 0;      // 0 → 1 build-in
  let energy = 0;      // 0 → 1 circuit ignition (follows growth, lags)
  let dissolve = 0;    // 0 → 1 on close

  let baseX = 0, baseY = 0, span = 1, trunkW = 0;
  let branches = [];   // {kind, path, color, gStart, gEnd, phase, depth, area, label, labelAt}
  let crystals = [];   // interactive skill nodes
  let cracks = [];     // trunk bark crack polylines
  let spores = [];     // rising magic particles
  let motes = [];      // parallax background dust
  let mist = [];       // volumetric fog blobs

  const mouse = { x: -9999, y: -9999, nx: 0, ny: 0, inside: false };
  let hovered = null;
  let selected = null;
  let hintDismissed = false;

  /* ──────────────────────────────────────────────────────────────────
   * 3 · HELPERS
   * ────────────────────────────────────────────────────────────────── */
  function rnd(o) { o.s = (o.s * 1103515245 + 12345) & 0x7fffffff; return o.s / 0x7fffffff; }
  function hexRgb(hex) {
    const h = hex.replace("#", "");
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function rgba(hex, a) { const { r, g, b } = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function litA(hex, amt, a) {
    const { r, g, b } = hexRgb(hex);
    const f = (v) => Math.min(255, Math.round(v + (255 - v) * amt));
    return `rgba(${f(r)},${f(g)},${f(b)},${a})`;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - clamp01(t), 3); }

  // build a curved tapering path → { pts:[{x,y,w}], cum:[], len }
  function makePath(x0, y0, angle, length, width, opts) {
    const segs = opts.segs || 16;
    const curl = opts.curl || 0;
    const lift = opts.lift || 0;          // gradual bend (negative = upward)
    const wiggle = opts.wiggle || 0;
    const taper = opts.taper == null ? 0.82 : opts.taper;
    const pts = [];
    let x = x0, y = y0, a = angle;
    for (let i = 0; i <= segs; i++) {
      const s = i / segs;
      pts.push({ x, y, w: Math.max(0.5, width * (1 - s * taper)) });
      const step = length / segs;
      a += curl + lift + Math.sin(s * 6.28 + (opts.phase || 0)) * wiggle;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
    }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    return { pts, cum, len: cum[cum.length - 1] || 1 };
  }

  // sample a point at param t (0..1 by arc-length), with live sway applied
  function pointAt(path, t) {
    const target = clamp01(t) * path.len;
    const cum = path.cum, pts = path.pts;
    let i = 1;
    while (i < cum.length && cum[i] < target) i++;
    const a = pts[i - 1], b = pts[i] || pts[i - 1];
    const seg = (cum[i] - cum[i - 1]) || 1;
    const f = (target - cum[i - 1]) / seg;
    const x = a.x + (b.x - a.x) * f;
    const y = a.y + (b.y - a.y) * f;
    return applySway({ x, y });
  }

  // gentle coherent wind — far canopy sways more than the trunk base
  function swayVec(x, y, phase) {
    if (reduced) return { dx: 0, dy: 0 };
    const sf = clamp01(Math.hypot(x - baseX, y - baseY) / (span)); // 0 near base
    const amp = sf * sf;
    const wind = Math.sin(time * 0.0012 + x * 0.0026 + (phase || 0));
    const gust = Math.sin(time * 0.0021 + y * 0.0033) * 0.4;
    return { dx: (wind + gust) * amp * 16, dy: Math.sin(time * 0.0016 + x * 0.004) * amp * 6 };
  }
  function applySway(p, phase) {
    const s = swayVec(p.x, p.y, phase);
    return { x: p.x + s.dx, y: p.y + s.dy };
  }

  /* ──────────────────────────────────────────────────────────────────
   * 4 · BUILD GEOMETRY (left-anchored, horizontal, monumental)
   * ────────────────────────────────────────────────────────────────── */
  function buildTree() {
    branches = []; crystals = []; cracks = []; mist = []; motes = [];
    const seed = { s: 20260603 };

    span = Math.hypot(W, H) * 0.74;
    baseX = W * 0.155;
    baseY = H * 0.66;
    trunkW = Math.min(Math.max(W * 0.05, 58), 132);

    // ── TRUNK: rises up and leans right, organic S-curve ──────────────
    const trunkTopX = W * 0.34;
    const trunkTopY = H * 0.20;
    const trunkPts = [];
    const tSegs = 22;
    for (let i = 0; i <= tSegs; i++) {
      const s = i / tSegs;
      const e = easeOutCubic(s);
      const x = baseX + (trunkTopX - baseX) * e + Math.sin(s * Math.PI * 1.1) * trunkW * 0.22;
      const y = baseY + (trunkTopY - baseY) * s;
      trunkPts.push({ x, y, w: trunkW * (1 - s * 0.66) });
    }
    const trunkCum = [0];
    for (let i = 1; i < trunkPts.length; i++) {
      trunkCum.push(trunkCum[i - 1] + Math.hypot(trunkPts[i].x - trunkPts[i - 1].x, trunkPts[i].y - trunkPts[i - 1].y));
    }
    const trunk = { pts: trunkPts, cum: trunkCum, len: trunkCum[trunkCum.length - 1] };
    branches.push({ kind: "trunk", path: trunk, color: "#7c5a2f", gStart: 0.16, gEnd: 0.42, phase: 0, depth: 0.2, flow: 0.1 });

    // helper to read a trunk point + local tangent angle at param a
    const trunkAt = (a) => {
      const idx = Math.min(trunkPts.length - 2, Math.floor(a * (trunkPts.length - 1)));
      const p0 = trunkPts[idx], p1 = trunkPts[idx + 1];
      return { x: p0.x, y: p0.y, ang: Math.atan2(p1.y - p0.y, p1.x - p0.x), w: p0.w };
    };

    // ── ROOTS: fan into the lower-left, each tip an origin crystal ────
    const rootsN = ROOTS.skills.length;
    for (let i = 0; i < rootsN; i++) {
      const t = (i + 0.5) / rootsN;            // 0..1
      const dir = (t - 0.5) * 2;               // -1..1
      // angles between straight-down (PI/2) leaning left/right; stay lower-left
      const ang = Math.PI / 2 + dir * 0.62 - 0.12;
      const len = H * (0.16 + Math.abs(dir) * 0.07) + 40;
      const path = makePath(
        baseX + dir * trunkW * 0.30, baseY + trunkW * 0.18,
        ang, len, trunkW * (0.30 - Math.abs(dir) * 0.05),
        { segs: 12, curl: dir * 0.05, wiggle: 0.02, phase: i, taper: 0.9 }
      );
      branches.push({ kind: "root", path, color: ROOTS.color, gStart: 0.0, gEnd: 0.22, phase: i * 1.3, depth: 0.1, flow: 0.0 });
      const tip = path.pts[path.pts.length - 1];
      crystals.push(makeCrystal(tip.x, tip.y, ROOTS, ROOTS.skills[i], 0.18, seed, "root"));
    }

    // ── FOUR STRUCTURAL BRANCHES expanding to the right ───────────────
    // Upper branches are kept shallower so the Storytelling crown does
    // not shoot past the top edge of the viewport.
    const BR = [
      { attach: 0.32, ang: 0.16,  lift: -0.020 },  // lowest, sweeps up
      { attach: 0.52, ang: -0.06, lift: -0.015 },
      { attach: 0.70, ang: -0.26, lift: -0.009 },
      { attach: 0.86, ang: -0.44, lift: -0.004 },  // top, gentler up-right
    ];

    AREAS.forEach((area, ai) => {
      const cfg = BR[ai];
      const at = trunkAt(cfg.attach);
      const pLen = W * (0.40 + ai * 0.015);
      const primary = makePath(
        at.x, at.y, cfg.ang, pLen, at.w * 0.62,
        { segs: 22, curl: 0, lift: cfg.lift, wiggle: 0.012, phase: ai, taper: 0.74 }
      );
      branches.push({
        kind: "primary", path: primary, color: "#6f5230",
        gStart: 0.40 + ai * 0.02, gEnd: 0.66 + ai * 0.02, phase: ai * 0.8,
        depth: 0.5, flow: 0.3 + cfg.attach * 0.12,
        area, label: area.label, labelAt: 0.30,
      });

      // sub-branches → one per skill, alternating up/down along outer 0.38..0.94
      const n = area.skills.length;
      area.skills.forEach((skill, si) => {
        const along = 0.38 + (si / Math.max(1, n - 1)) * 0.56;
        const idx = Math.min(primary.pts.length - 2, Math.floor(along * (primary.pts.length - 1)));
        const anchor = primary.pts[idx];
        const nx = primary.pts[idx + 1];
        const baseAng = Math.atan2(nx.y - anchor.y, nx.x - anchor.x);
        const side = si % 2 === 0 ? -1 : 1;     // up / down
        const subAng = baseAng + side * (0.5 + (si % 3) * 0.12);
        const sLen = W * (0.07 + (si % 2) * 0.02) + 30;
        const sub = makePath(
          anchor.x, anchor.y, subAng, sLen, anchor.w * 0.6,
          { segs: 12, curl: side * 0.05, lift: -side * 0.01, wiggle: 0.03, phase: si, taper: 0.86 }
        );
        branches.push({
          kind: "secondary", path: sub, color: "#6a4f2f",
          gStart: 0.58 + along * 0.06, gEnd: 0.82 + along * 0.05, phase: ai + si,
          depth: 0.8, flow: 0.55 + along * 0.3,
        });
        const tip = sub.pts[sub.pts.length - 1];
        crystals.push(makeCrystal(tip.x, tip.y, area, skill, 0.80 + (si / n) * 0.08, seed, "skill"));

        // a few glowing motes around each sub for lush canopy
        const leafN = 5 + Math.floor(rnd(seed) * 4);
        for (let k = 0; k < leafN; k++) {
          const lp = sub.pts[Math.min(sub.pts.length - 1, Math.floor((0.5 + rnd(seed) * 0.5) * sub.pts.length))];
          motes.push({
            kind: "leaf", bx: lp.x + (rnd(seed) - 0.5) * 34, by: lp.y + (rnd(seed) - 0.5) * 30,
            r: 1.6 + rnd(seed) * 2.2, color: area.color, gStart: 0.84 + rnd(seed) * 0.1,
            phase: rnd(seed) * 6.28, tw: rnd(seed) * 6.28,
          });
        }
      });
    });

    // ── TRUNK BARK CRACKS (dark veins of the wood) ────────────────────
    for (let c = 0; c < 5; c++) {
      const off = (c / 4 - 0.5);                // lateral offset across trunk
      const pts = [];
      const segs = 14;
      for (let i = 0; i <= segs; i++) {
        const s = i / segs;
        const tp = trunkAt(clamp01(0.06 + s * 0.8));
        const perpX = Math.cos(tp.ang + Math.PI / 2);
        const perpY = Math.sin(tp.ang + Math.PI / 2);
        const lat = (off + Math.sin(s * 7 + c) * 0.16) * tp.w * 0.7;
        pts.push({ x: tp.x + perpX * lat, y: tp.y + perpY * lat });
      }
      cracks.push(pts);
    }

    // ── ATMOSPHERE: mist blobs + parallax dust ────────────────────────
    for (let i = 0; i < 5; i++) {
      mist.push({
        x: W * (0.2 + rnd(seed) * 0.6), y: H * (0.2 + rnd(seed) * 0.7),
        r: H * (0.22 + rnd(seed) * 0.3), depth: rnd(seed) * 0.6 + 0.2,
        hue: rnd(seed) < 0.5 ? "#2f6a72" : "#3a5a78", drift: rnd(seed) * 6.28,
      });
    }
    for (let i = 0; i < 70; i++) {
      motes.push({
        kind: "dust", bx: rnd(seed) * W, by: rnd(seed) * H,
        r: rnd(seed) * 1.5 + 0.3, a: rnd(seed) * 0.4 + 0.1,
        tw: rnd(seed) * 6.28, depth: rnd(seed) * 0.7 + 0.2,
      });
    }

    fitCanopy();
  }

  /* Safety fit: compress the canopy vertically toward the trunk base so
     the highest crystal/branch (plus its glow and a little sway head-
     room) always stays inside the viewport. Only the canopy (points
     above the base) is scaled; the roots below the base are untouched. */
  function fitCanopy() {
    const topMargin = Math.max(H * 0.12, 96);   // clears the title block
    const glowPad = 34;                          // crystal glow + sway slack
    let minY = Infinity;
    for (const b of branches) for (const p of b.path.pts) if (p.y < minY) minY = p.y;
    for (const c of crystals) if (c.by - glowPad < minY) minY = c.by - glowPad;
    for (const m of motes) if (m.kind === "leaf" && m.by < minY) minY = m.by;
    if (minY >= topMargin) return;

    const k = (baseY - topMargin) / (baseY - minY);   // < 1
    const sc = (y) => (y < baseY ? baseY + (y - baseY) * k : y);

    for (const b of branches) {
      for (const p of b.path.pts) p.y = sc(p.y);
      const cum = [0];
      for (let i = 1; i < b.path.pts.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(
          b.path.pts[i].x - b.path.pts[i - 1].x,
          b.path.pts[i].y - b.path.pts[i - 1].y));
      }
      b.path.cum = cum;
      b.path.len = cum[cum.length - 1] || 1;
    }
    for (const c of crystals) { c.by = sc(c.by); c.y = c.by; }
    for (const m of motes) if (m.kind === "leaf") m.by = sc(m.by);
    for (const pts of cracks) for (const p of pts) p.y = sc(p.y);
  }

  function makeCrystal(x, y, area, skill, gStart, seed, group) {
    return {
      x, y, bx: x, by: y,
      name: skill.name, desc: skill.desc, kicker: area.label,
      color: area.color, area, group,
      r: group === "root" ? 9 : 10.5,
      gStart, appear: 0, pulse: rnd(seed) * 6.28,
      // short connecting stem so it reads as grown FROM the branch
      stemAng: 0,
    };
  }

  /* ──────────────────────────────────────────────────────────────────
   * 5 · DRAW
   * ────────────────────────────────────────────────────────────────── */
  function drawnPts(path, frac) {
    if (frac >= 1) return path.pts;
    const total = path.pts.length - 1;
    const exact = total * frac;
    const last = Math.floor(exact);
    const out = path.pts.slice(0, last + 1);
    const f = exact - last;
    if (f > 0 && last < total) {
      const a = path.pts[last], b = path.pts[last + 1];
      out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, w: a.w + (b.w - a.w) * f });
    }
    return out;
  }

  function drawBranch(b, frac) {
    if (frac <= 0) return;
    const raw = drawnPts(b.path, frac);
    if (raw.length < 2) return;
    // apply sway to a working copy
    const pts = raw.map((p) => { const s = applySway(p, b.phase); return { x: s.x, y: s.y, w: p.w }; });

    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
      let tx = next.x - prev.x, ty = next.y - prev.y;
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const nx = -ty, ny = tx, hw = pts[i].w / 2;
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
      grad.addColorStop(0, "#2c1d0e");
      grad.addColorStop(0.4, "#5e4322");
      grad.addColorStop(0.8, "#7c5a2f");
      grad.addColorStop(1, "#9a7340");
    } else if (b.kind === "root") {
      grad.addColorStop(0, "#4a3416");
      grad.addColorStop(1, rgba(b.color, 0.42));
    } else {
      grad.addColorStop(0, "#4a3520");
      grad.addColorStop(1, "#8a6736");
    }
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = b.kind === "trunk" ? 30 : 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // volumetric lit edge (upper-left side catches the astral light)
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
    ctx.strokeStyle = b.kind === "trunk" ? "rgba(242,214,150,0.16)" : "rgba(236,206,150,0.20)";
    ctx.lineWidth = Math.max(0.6, pts[0].w * 0.08);
    ctx.lineCap = "round";
    ctx.stroke();

    return pts;
  }

  // bark cracks (dark) — only after trunk has formed
  function drawCracks() {
    const reveal = ease((growth - 0.30) / 0.16);
    if (reveal <= 0) return;
    ctx.save();
    ctx.globalAlpha = reveal * (1 - dissolve);
    for (const pts of cracks) {
      ctx.beginPath();
      const p0 = applySway(pts[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < pts.length; i++) { const p = applySway(pts[i]); ctx.lineTo(p.x, p.y); }
      ctx.strokeStyle = "rgba(18,10,4,0.5)";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.restore();
  }

  // the living energy circuit — static tracery + travelling pulses
  function drawEnergy() {
    if (energy <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const PULSE_SPEED = reduced ? 0 : 0.0016;
    for (const b of branches) {
      const frac = ease(clamp01((growth - b.gStart) / ((b.gEnd - b.gStart) || 1)));
      if (frac <= 0.02) continue;
      const isRoot = b.kind === "root";
      const veinA = energy * (b.kind === "trunk" ? 0.5 : isRoot ? 0.32 : 0.4);

      // faint continuous vein along the centerline (the circuit tracery)
      ctx.beginPath();
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * frac;
        const p = pointAt(b.path, t);
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = rgba("#F2C879", veinA * 0.5);
      ctx.lineWidth = b.kind === "trunk" ? 2.4 : b.kind === "primary" ? 1.6 : 1;
      ctx.shadowColor = rgba("#F2C879", veinA);
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // travelling pulses (energy rises from roots, streams to crystals)
      const pulses = Math.max(1, Math.round(b.path.len / 150));
      for (let k = 0; k < pulses; k++) {
        let tp = (time * PULSE_SPEED + b.flow * 0.6 + k / pulses) % 1;
        if (isRoot) tp = 1 - tp;             // roots flow inward/up to the trunk
        if (tp > frac) continue;
        const p = pointAt(b.path, tp);
        const env = Math.sin(tp * Math.PI);  // brightest mid-path
        const a = energy * (0.5 + env * 0.5);
        const pr = (b.kind === "trunk" ? 7 : 5) * (0.7 + env * 0.6);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pr * 2.4);
        g.addColorStop(0, litA(b.color, 0.7, a));
        g.addColorStop(0.4, rgba("#F2C879", a * 0.6));
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pr * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawTrunkEngraving() {
    const reveal = ease((growth - 0.40) / 0.16);
    if (reveal <= 0) return;
    // place along the lower trunk, rotated to follow its lean
    const tp = (() => {
      const path = branches.find((b) => b.kind === "trunk").path;
      const a = pointAt(path, 0.30), b = pointAt(path, 0.46);
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x) };
    })();
    const size = Math.max(15, Math.min(trunkW * 0.34, 30));
    ctx.save();
    ctx.translate(tp.x, tp.y);
    ctx.rotate(tp.ang + Math.PI / 2);          // run text up the trunk
    ctx.globalAlpha = reveal * (1 - dissolve);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `600 ${size}px "Cinzel", "Cormorant Garamond", serif`;
    ctx.fillStyle = "rgba(24,15,6,0.7)";
    ctx.fillText(TRUNK_NAME, 1, 1);
    ctx.shadowColor = "rgba(242,200,121,0.7)";
    ctx.shadowBlur = 14 + Math.sin(time * 0.004) * 5 * energy;
    ctx.fillStyle = "#F6E6B6";
    ctx.fillText(TRUNK_NAME, 0, 0);
    ctx.shadowBlur = 0;

    ctx.font = `600 ${size * 0.46}px "Cinzel", "Cormorant Garamond", serif`;
    ctx.fillStyle = "rgba(220,184,124,0.92)";
    ctx.fillText(TRUNK_ROLE, 0, size * 0.92);
    ctx.restore();
  }

  function drawAreaLabels() {
    const reveal = ease((growth - 0.62) / 0.2);
    if (reveal <= 0) return;
    ctx.save();
    ctx.globalAlpha = reveal * (1 - dissolve);
    for (const b of branches) {
      if (b.kind !== "primary" || !b.label) continue;
      const a = pointAt(b.path, b.labelAt);
      const n = pointAt(b.path, b.labelAt + 0.06);
      const ang = Math.atan2(n.y - a.y, n.x - a.x);
      const isHot = hovered && hovered.area === b.area;
      ctx.save();
      ctx.translate(a.x, a.y - 12);
      ctx.rotate(ang);
      ctx.textAlign = "center";
      ctx.font = `600 ${Math.max(9, W * 0.0078)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isHot ? litA(b.area.color, 0.4, 0.95) : rgba(b.area.color, 0.5);
      ctx.shadowColor = rgba(b.area.color, isHot ? 0.7 : 0.3);
      ctx.shadowBlur = isHot ? 10 : 4;
      ctx.fillText(b.label.toUpperCase(), 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawCrystal(n) {
    if (n.appear <= 0) return;
    const sc = n.appear;
    const isHover = hovered === n;
    const isSel = selected === n;
    const pulse = 1 + Math.sin(time * 0.004 + n.pulse) * 0.08;
    const hoverBoost = isHover ? 1.35 : isSel ? 1.2 : 1;
    const r = n.r * sc * hoverBoost;
    const x = n.x, y = n.y;

    // outer glow
    const glowR = r * (3.6 + (isHover ? 2 : 0)) * pulse;
    const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    g.addColorStop(0, rgba(n.color, (0.5 + energy * 0.2) * sc));
    g.addColorStop(0.4, rgba(n.color, 0.16 * sc));
    g.addColorStop(1, "transparent");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // faceted gem
    const w = r * 0.92, h = r * 1.32;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w, y - h * 0.16);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.lineTo(x - w * 0.5, y + h);
    ctx.lineTo(x - w, y - h * 0.16);
    ctx.closePath();
    const gem = ctx.createLinearGradient(x, y - h, x, y + h);
    gem.addColorStop(0, litA(n.color, 0.6, sc));
    gem.addColorStop(0.5, rgba(n.color, sc));
    gem.addColorStop(1, litA(n.color, 0.1, sc));
    ctx.fillStyle = gem;
    ctx.fill();
    // facets
    ctx.strokeStyle = litA(n.color, 0.75, 0.7 * sc);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y - h); ctx.lineTo(x, y + h);
    ctx.moveTo(x - w, y - h * 0.16); ctx.lineTo(x + w, y - h * 0.16);
    ctx.stroke();
    ctx.strokeStyle = litA(n.color, 0.45, 0.9 * sc);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w, y - h * 0.16);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.lineTo(x - w * 0.5, y + h);
    ctx.lineTo(x - w, y - h * 0.16);
    ctx.closePath();
    ctx.stroke();

    if (isHover || isSel) {
      ctx.beginPath();
      ctx.arc(x, y, r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = litA(n.color, 0.5, 0.85);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }

  function drawMotesAndLeaves() {
    for (const m of motes) {
      if (m.kind === "dust") {
        const px = m.bx + mouse.nx * 22 * m.depth;
        const py = m.by + mouse.ny * 14 * m.depth;
        const a = m.a * (0.6 + (reduced ? 0.4 : Math.sin(time * 0.003 + m.tw) * 0.4));
        ctx.beginPath(); ctx.arc(px, py, m.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba("#bfeaff", a); ctx.fill();
      } else { // leaf glow
        const appear = clamp01((growth - m.gStart) / 0.12) * (1 - dissolve);
        if (appear <= 0) continue;
        const s = applySway({ x: m.bx, y: m.by }, m.phase);
        const tw = 0.5 + (reduced ? 0.3 : Math.sin(time * 0.014 + m.tw) * 0.45);
        const gg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, m.r * 3);
        gg.addColorStop(0, litA(m.color, 0.4, 0.55 * tw * appear));
        gg.addColorStop(1, "transparent");
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(s.x, s.y, m.r * 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s.x, s.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = litA(m.color, 0.5, 0.8 * appear); ctx.fill();
      }
    }
  }

  function drawAtmosphere() {
    // deep astral backlight behind the canopy
    const cx = W * 0.45 + mouse.nx * 10;
    const cy = H * 0.42 + mouse.ny * 8;
    const r = span * 0.6;
    const breathe = 0.14 + Math.sin(time * 0.0015) * 0.05;
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    bg.addColorStop(0, rgba("#356a70", breathe));
    bg.addColorStop(0.5, rgba("#1f3a48", breathe * 0.5));
    bg.addColorStop(1, "transparent");
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    // volumetric mist blobs (parallax drift)
    for (const m of mist) {
      const dx = (reduced ? 0 : Math.sin(time * 0.0006 + m.drift) * 18) + mouse.nx * 26 * m.depth;
      const dy = (reduced ? 0 : Math.cos(time * 0.0005 + m.drift) * 12) + mouse.ny * 16 * m.depth;
      const mg = ctx.createRadialGradient(m.x + dx, m.y + dy, 0, m.x + dx, m.y + dy, m.r);
      mg.addColorStop(0, rgba(m.hue, 0.10 * m.depth));
      mg.addColorStop(1, "transparent");
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(m.x + dx, m.y + dy, m.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ── particles ──────────────────────────────────────────────────── */
  function spawnSpore() {
    spores.push({
      x: baseX + Math.random() * W * 0.7,
      y: H * (0.2 + Math.random() * 0.7),
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.2 + Math.random() * 0.5),
      life: 1, decay: 0.004 + Math.random() * 0.005,
      r: 0.6 + Math.random() * 1.6,
      color: Math.random() < 0.5 ? "#F2C879" : "#9FD0C6",
    });
  }
  function drawSpores() {
    for (let i = spores.length - 1; i >= 0; i--) {
      const p = spores[i];
      p.x += p.vx + (reduced ? 0 : Math.sin(time * 0.01 + i) * 0.2);
      p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) { spores.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(p.color, p.life * 0.7); ctx.fill();
    }
  }

  /* ──────────────────────────────────────────────────────────────────
   * 6 · FRAME
   * ────────────────────────────────────────────────────────────────── */
  function frame() {
    if (!open && dissolve >= 1) { rafId = null; return; }
    time++;

    if (closing) {
      dissolve = clamp01(dissolve + (reduced ? 0.14 : 0.024));
      energy = Math.max(0, energy - 0.03);
    } else {
      growth = clamp01(growth + (reduced ? 1 : 0.011));
      // energy ignites after the trunk forms, then follows to full
      energy = clamp01((growth - 0.34) / 0.5);
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1 - dissolve * 0.15;

    drawAtmosphere();

    // recompute live crystal positions (sway) + appear
    for (const n of crystals) {
      n.appear = ease(clamp01((growth - n.gStart) / 0.16));
      const s = applySway({ x: n.bx, y: n.by }, n.pulse);
      n.x = s.x; n.y = s.y;
    }

    // draw order: roots → trunk → cracks → branches → energy → leaves → crystals
    for (const b of branches) if (b.kind === "root")
      drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));
    for (const b of branches) if (b.kind === "trunk")
      drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));
    drawCracks();
    for (const b of branches) if (b.kind === "primary")
      drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));
    for (const b of branches) if (b.kind === "secondary")
      drawBranch(b, ease(clamp01((growth - b.gStart) / (b.gEnd - b.gStart))));

    drawEnergy();
    drawTrunkEngraving();
    drawAreaLabels();
    drawMotesAndLeaves();
    for (const n of crystals) drawCrystal(n);

    if (!reduced && open && !closing && time % 6 === 0 && spores.length < 90) spawnSpore();
    drawSpores();

    ctx.globalAlpha = 1;
    updateHover();

    if (closing && dissolve >= 1) { finishClose(); return; }
    rafId = requestAnimationFrame(frame);
  }

  /* ──────────────────────────────────────────────────────────────────
   * 7 · HOVER + TOOLTIP + CONTEXTUAL PANEL
   * ────────────────────────────────────────────────────────────────── */
  function updateHover() {
    if (!mouse.inside || closing) { if (hovered) { hovered = null; hideTip(); document.body.style.cursor = ""; } return; }
    let best = null, bestD = Infinity;
    for (const n of crystals) {
      if (n.appear < 0.6) continue;
      const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      const reach = 20 + n.r;
      if (d < reach && d < bestD) { bestD = d; best = n; }
    }
    if (best !== hovered) {
      hovered = best;
      if (best) showTip(best); else hideTip();
      document.body.style.cursor = best ? "pointer" : "";
    }
    if (hovered) positionTip(hovered);
  }

  function showTip(n) {
    if (!tipEl) return;
    tipKicker.textContent = n.kicker;
    tipName.textContent = n.name;
    tipDesc.textContent = n.desc;
    tipEl.style.setProperty("--ktree-accent", n.color);
    tipEl.classList.add("is-visible");
    tipEl.setAttribute("aria-hidden", "false");
    if (!hintDismissed) { hintDismissed = true; hintEl?.classList.add("is-dismissed"); }
  }
  function positionTip(n) {
    if (!tipEl) return;
    tipEl.style.left = `${n.x}px`;
    tipEl.style.top = `${n.y - n.r - 10}px`;
  }
  function hideTip() { tipEl?.classList.remove("is-visible"); tipEl?.setAttribute("aria-hidden", "true"); }

  function openPanel(n) {
    if (!panelEl) return;
    selected = n;
    const a = n.area;
    panelEl.style.setProperty("--ktree-accent", n.color);
    document.getElementById("ktree-panel-sigil").style.background =
      `radial-gradient(circle at 40% 35%, ${litA(n.color, 0.4, 1)}, ${rgba(n.color, 0.85)})`;
    document.getElementById("ktree-panel-kicker").textContent = n.kicker;
    document.getElementById("ktree-panel-title").textContent = n.name;
    document.getElementById("ktree-panel-desc").textContent = n.desc;
    document.getElementById("ktree-panel-exp").textContent = a.experience;
    const proj = document.getElementById("ktree-panel-proj");
    proj.innerHTML = a.projects.map((p) => `<li>${p}</li>`).join("");
    const tech = document.getElementById("ktree-panel-tech");
    tech.innerHTML = a.tech.map((t) => `<span class="ktree__panel-tag">${t}</span>`).join("");
    panelEl.classList.add("is-open");
    panelEl.setAttribute("aria-hidden", "false");
  }
  function closePanel() {
    selected = null;
    panelEl?.classList.remove("is-open");
    panelEl?.setAttribute("aria-hidden", "true");
  }

  /* ──────────────────────────────────────────────────────────────────
   * 8 · SIZING / OPEN / CLOSE
   * ────────────────────────────────────────────────────────────────── */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    if (!canvas) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTree();
  }

  function doOpen() {
    if (open) return;
    open = true; closing = false;
    growth = 0; energy = 0; dissolve = 0;
    hovered = null; selected = null; hintDismissed = false;
    spores.length = 0;
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.body.classList.add("ktree-open");
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    hintEl?.classList.remove("is-dismissed");
    closePanel();

    resize();
    if (reduced) { growth = 1; energy = 1; }
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);

    setTimeout(() => document.getElementById("ktree-close")?.focus({ preventScroll: true }), 60);
  }

  function doClose() {
    if (!open || closing) return;
    closing = true;
    closePanel();
    // scatter crystals into rising motes
    for (const n of crystals) {
      for (let k = 0; k < 4; k++) {
        spores.push({
          x: n.x, y: n.y, vx: (Math.random() - 0.5) * 2.4, vy: -(0.4 + Math.random() * 2.2),
          life: 1, decay: 0.02 + Math.random() * 0.02, r: 0.8 + Math.random() * 2.2, color: n.color,
        });
      }
    }
    hideTip();
    overlay.classList.remove("is-open");
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);
  }

  function finishClose() {
    open = false; closing = false;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ktree-open");
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ctx && ctx.clearRect(0, 0, W, H);
    spores.length = 0;
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

    document.querySelectorAll("[data-ktree-open]").forEach((el) => {
      el.addEventListener("click", (e) => { e.preventDefault(); doOpen(); });
    });
    document.getElementById("ktree-close")?.addEventListener("click", doClose);
    document.getElementById("ktree-panel-close")?.addEventListener("click", closePanel);

    canvas.addEventListener("pointermove", (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true;
      mouse.nx = (e.clientX / W - 0.5) * 2;
      mouse.ny = (e.clientY / H - 0.5) * 2;
    });
    canvas.addEventListener("pointerleave", () => { mouse.inside = false; });
    canvas.addEventListener("click", (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      // hit test on click directly (don't rely on prior hover for touch)
      let best = null, bestD = Infinity;
      for (const n of crystals) {
        if (n.appear < 0.4) continue;
        const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const reach = 22 + n.r;
        if (d < reach && d < bestD) { bestD = d; best = n; }
      }
      if (best) openPanel(best); else closePanel();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !open) return;
      if (selected) closePanel(); else doClose();
    });
    window.addEventListener("resize", () => { if (open) resize(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return { open: doOpen, close: doClose, toggle };
})();

window.KnowledgeTree = KnowledgeTree;
