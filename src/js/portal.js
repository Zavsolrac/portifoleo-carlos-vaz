/**
 * Portal · Mystical galaxy-portal canvas
 * ─────────────────────────────────────────────────────────────
 * A layered, additive-blended galaxy that reads as a dimensional
 * gateway rather than a flat spiral. Composed of (back → front):
 *
 *   1 · DEPTH HAZE      large violet nebula radial seating the
 *                       portal in deep space (sense of a tunnel)
 *   2 · NEBULA CLOUDS   a few slow-orbiting violet/magenta blobs
 *                       (the "névoa") breathing in opacity
 *   3 · SPIRAL ARMS     logarithmic arms with multi-frequency
 *                       wobble so they curve organically (never a
 *                       mechanical "spring"); colour graded
 *                       gold → amber → violet from core outward
 *   4 · STAR FIELD      drifting stellar dust + brighter sparks
 *                       under differential rotation (inner faster)
 *   5 · RUNE RING       circle of hand-drawn elvish-style glyphs,
 *                       slowly turning, glow pulsing
 *   6 · ENERGY CORE     white-gold nucleus that breathes (radius +
 *                       intensity), drawing the eye inward
 *   7 · ETHEREAL BORDER faint violet rim suggesting a dimensional
 *                       opening
 *
 * Everything is drawn with `globalCompositeOperation = "lighter"`
 * for true additive glow, then reset. Honours reduced-motion with
 * a calm static composition. Controller entry: Portal.init()
 */
const Portal = {
  /* ── palette (RGB triplets) ───────────────────────────────── */
  COL: {
    coreLight: [255, 250, 236],
    gold: [242, 200, 121],
    amber: [224, 138, 46],
    violet: [156, 124, 214],
    deepViolet: [104, 72, 168],
    magenta: [150, 86, 176],
    white: [248, 244, 232],
  },

  init() {
    this.canvas = document.getElementById("portal-canvas");
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    this.angle = 0;
    this.t = 0;
    this.intensity = 1;        // eased "state" (subtle → intense on hover)
    this.intensityTarget = 1;
    this.last = performance.now();
    this._inView = true;

    this.resize();
    window.addEventListener("resize", () => this.resize());

    /* React to the visitor's presence — the stage hover lifts the
       portal from "subtle" toward "intense". */
    const stage = this.canvas.closest(".portal__stage") || this.canvas.parentElement;
    if (stage) {
      stage.addEventListener("pointerenter", () => (this.intensityTarget = 1.4));
      stage.addEventListener("pointerleave", () => (this.intensityTarget = 1));
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      this.buildScene();
      this.drawStatic();
      return;
    }

    this.buildScene();
    this.animate();

    const section = this.canvas.closest("section") || document.getElementById("portal");
    if (section && "IntersectionObserver" in window) {
      this._viewObs = new IntersectionObserver(
        (entries) => {
          this._inView = !!entries[0]?.isIntersecting;
          if (this._inView && !document.body.classList.contains("ktree-open")) this.animate();
        },
        { rootMargin: "120px 0px" }
      );
      this._viewObs.observe(section);
    }

    if (!this._ktreeObs) {
      this._ktreeObs = new MutationObserver(() => {
        if (!document.body.classList.contains("ktree-open")) this.animate();
      });
      this._ktreeObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
  },

  resize() {
    const parentW = this.canvas.parentElement
      ? this.canvas.parentElement.offsetWidth
      : 480;
    const size = Math.max(280, Math.min(parentW * 0.92, 560));
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = size + "px";
    this.canvas.style.height = size + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.size = size;
    this.cx = size / 2;
    this.cy = size / 2;
    this.maxR = size * 0.47;
  },

  /* Generate the stable, resolution-independent scene data once.
     Positions are stored normalised (0..1 of maxR) so a resize
     never needs to regenerate anything. */
  buildScene() {
    const rnd = (a, b) => a + Math.random() * (b - a);

    /* ── spiral arms ── */
    this.arms = [];
    const armCount = 6;
    for (let a = 0; a < armCount; a++) {
      this.arms.push({
        phase: (a / armCount) * Math.PI * 2,
        twist: rnd(2.7, 3.3) * Math.PI,   // total angular span
        wob1: rnd(1.4, 2.0),
        wob2: rnd(2.8, 3.8),
        wobPhase: rnd(0, Math.PI * 2),
        speed: rnd(0.18, 0.3),
      });
    }

    /* ── star field (dust + sparks) ── */
    this.stars = [];
    const starCount = 170;
    for (let i = 0; i < starCount; i++) {
      // bias toward mid-disk, a few far out
      const nr = Math.pow(Math.random(), 0.7) * 0.98 + 0.02;
      const spark = Math.random() < 0.12;
      const goldish = Math.random() < 0.5;
      this.stars.push({
        nr,
        ang: Math.random() * Math.PI * 2,
        // differential rotation: inner orbits faster
        spd: (0.05 + (1 - nr) * 0.16) * (Math.random() < 0.5 ? 1 : 0.92),
        size: spark ? rnd(1.3, 2.2) : rnd(0.5, 1.3),
        spark,
        col: goldish ? this.COL.gold : this.COL.violet,
        tw: Math.random() * Math.PI * 2,   // twinkle phase
        twSpd: rnd(0.6, 1.8),
      });
    }

    /* ── nebula clouds ── */
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        nr: rnd(0.28, 0.66),
        ang: rnd(0, Math.PI * 2),
        spd: rnd(0.02, 0.05) * (Math.random() < 0.5 ? 1 : -1),
        rad: rnd(0.26, 0.42),
        col: Math.random() < 0.5 ? this.COL.violet : this.COL.magenta,
        breathe: rnd(0, Math.PI * 2),
        breatheSpd: rnd(0.25, 0.5),
      });
    }

    /* ── rune ring ── (hand-drawn elvish-style glyphs) ── */
    this.runeGlyphs = this.makeRuneGlyphs();
    this.runeCount = 16;
  },

  /* A small library of geometric "runes" — each is an array of
     polyline strokes in a unit box centred on (0,0), y-down. They
     are intentionally angular and staff-based to evoke Futhark /
     Tengwar inscriptions without depending on any font. */
  makeRuneGlyphs() {
    return [
      // Fehu-like
      [[[0, -0.5], [0, 0.5]], [[0, -0.2], [0.34, -0.4]], [[0, 0.02], [0.34, -0.18]]],
      // Uruz-like
      [[[-0.18, 0.5], [-0.18, -0.5], [0.2, -0.34], [0.2, 0.5]]],
      // Thurisaz-like
      [[[0, -0.5], [0, 0.5]], [[0, -0.16], [0.3, 0], [0, 0.16]]],
      // Ansuz-like
      [[[0, -0.5], [0, 0.5]], [[0, -0.36], [0.32, -0.18]], [[0, -0.08], [0.32, 0.1]]],
      // Raido-like
      [[[0, -0.5], [0, 0.5]], [[0, -0.5], [0.3, -0.3], [0, -0.08]], [[0, -0.08], [0.32, 0.5]]],
      // Kaunan-like (chevron)
      [[[0.0, -0.42], [0.3, 0], [0.0, 0.42]]],
      // Gebo-like (X)
      [[[-0.28, -0.42], [0.28, 0.42]], [[0.28, -0.42], [-0.28, 0.42]]],
      // Isa + dot
      [[[0, -0.5], [0, 0.5]], [[-0.06, 0], [0.06, 0]]],
      // Sowilo-like (zigzag)
      [[[0.26, -0.46], [-0.18, -0.14], [0.18, 0.14], [-0.26, 0.46]]],
      // Tiwaz-like (arrow up)
      [[[0, 0.5], [0, -0.5]], [[-0.26, -0.22], [0, -0.5], [0.26, -0.22]]],
      // Berkana-like
      [[[0, -0.5], [0, 0.5]], [[0, -0.5], [0.3, -0.34], [0, -0.06], [0.3, 0.16], [0, 0.42]]],
      // Eihwaz-like
      [[[-0.22, -0.46], [0, -0.3], [0, 0.3], [0.22, 0.46]]],
    ];
  },

  /* ── helpers ── */
  rgba(c, a) {
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  },
  lerpCol(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  },

  /* ───────────────────────── LAYERS ─────────────────────────── */

  drawDepthHaze(ctx, k) {
    const { cx, cy, size } = this;
    const g = ctx.createRadialGradient(cx, cy, size * 0.02, cx, cy, size * 0.52);
    g.addColorStop(0, this.rgba(this.COL.amber, 0.1 * k));
    g.addColorStop(0.32, this.rgba(this.COL.deepViolet, 0.16 * k));
    g.addColorStop(0.7, this.rgba(this.COL.magenta, 0.08 * k));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  },

  drawClouds(ctx, k) {
    const { cx, cy, maxR } = this;
    for (const c of this.clouds) {
      const ang = c.ang + this.t * c.spd;
      const r = c.nr * maxR;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      const breathe = 0.5 + 0.5 * Math.sin(this.t * c.breatheSpd + c.breathe);
      const rad = c.rad * maxR * (0.85 + 0.25 * breathe);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, this.rgba(c.col, (0.12 + 0.06 * breathe) * k));
      g.addColorStop(0.5, this.rgba(c.col, 0.05 * k));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawArms(ctx, k) {
    const { cx, cy, maxR } = this;
    const innerR = maxR * 0.06;
    const STEPS = 92;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const arm of this.arms) {
      let px = null, py = null;
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;                       // 0..1 along arm
        const theta = t * arm.twist;
        // organic wobble (multi-frequency → no "spring")
        const wob =
          Math.sin(theta * arm.wob1 + arm.wobPhase + this.t * 0.3) * 0.07 +
          Math.sin(theta * arm.wob2 - this.t * 0.22) * 0.035;
        const ang = arm.phase + theta + this.angle * arm.speed * 3 + wob;
        const rr =
          (innerR + (maxR - innerR) * Math.pow(t, 0.92)) *
          (1 + Math.sin(theta * 2.1 + arm.phase + this.t * 0.25) * 0.018);
        const x = cx + Math.cos(ang) * rr;
        const y = cy + Math.sin(ang) * rr;

        if (px !== null) {
          // colour graded core → rim
          let col;
          if (t < 0.2) col = this.lerpCol(this.COL.coreLight, this.COL.gold, t / 0.2);
          else if (t < 0.55) col = this.lerpCol(this.COL.gold, this.COL.amber, (t - 0.2) / 0.35);
          else col = this.lerpCol(this.COL.amber, this.COL.violet, (t - 0.55) / 0.45);

          const fade = Math.sin(t * Math.PI);       // dim at both ends
          const aGlow = 0.16 * fade * k;
          const aCore = 0.4 * fade * k;

          // glow pass (wide, soft)
          ctx.strokeStyle = this.rgba(col, aGlow);
          ctx.lineWidth = (7 * (1 - t) + 2.4);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();

          // core pass (thin, bright)
          ctx.strokeStyle = this.rgba(col, aCore);
          ctx.lineWidth = (2.2 * (1 - t) + 0.7);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        px = x;
        py = y;
      }
    }
  },

  drawStars(ctx, k) {
    const { cx, cy, maxR } = this;
    for (const s of this.stars) {
      const ang = s.ang + this.t * s.spd;
      const r = s.nr * maxR;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      const tw = 0.55 + 0.45 * Math.sin(this.t * s.twSpd + s.tw);
      const a = (s.spark ? 0.85 : 0.6) * tw * k;
      const rad = s.size * (s.spark ? 1 : 1);

      const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 3);
      g.addColorStop(0, this.rgba(s.spark ? this.COL.white : s.col, a));
      g.addColorStop(0.4, this.rgba(s.col, a * 0.5));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad * 3, 0, Math.PI * 2);
      ctx.fill();

      // spark cross-flare
      if (s.spark) {
        ctx.strokeStyle = this.rgba(this.COL.white, a * 0.5);
        ctx.lineWidth = 0.6;
        const fl = rad * 3.4;
        ctx.beginPath();
        ctx.moveTo(x - fl, y); ctx.lineTo(x + fl, y);
        ctx.moveTo(x, y - fl); ctx.lineTo(x, y + fl);
        ctx.stroke();
      }
    }
  },

  drawRunes(ctx, k) {
    const { cx, cy, maxR } = this;
    const ringR = maxR * 0.7;
    const ringRot = this.angle * 0.15;          // slow turn
    const glyphScale = this.size * 0.05;

    for (let i = 0; i < this.runeCount; i++) {
      const ang = (i / this.runeCount) * Math.PI * 2 + ringRot;
      const x = cx + Math.cos(ang) * ringR;
      const y = cy + Math.sin(ang) * ringR;
      // each rune pulses on its own phase
      const pulse = 0.45 + 0.55 * Math.sin(this.t * 0.9 + i * 0.7);
      const a = (0.18 + 0.42 * pulse) * k;
      const glyph = this.runeGlyphs[i % this.runeGlyphs.length];

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang + Math.PI / 2);             // stand radially
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // glow
      ctx.strokeStyle = this.rgba(this.COL.gold, a * 0.5);
      ctx.lineWidth = 3.2;
      this.strokeGlyph(ctx, glyph, glyphScale);
      // core
      ctx.strokeStyle = this.rgba(this.COL.coreLight, a);
      ctx.lineWidth = 1.1;
      this.strokeGlyph(ctx, glyph, glyphScale);
      ctx.restore();
    }
  },

  strokeGlyph(ctx, glyph, scale) {
    for (const stroke of glyph) {
      ctx.beginPath();
      for (let p = 0; p < stroke.length; p++) {
        const px = stroke[p][0] * scale;
        const py = stroke[p][1] * scale;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  },

  drawCore(ctx, k, breath) {
    const { cx, cy, size } = this;
    const coreR = size * (0.17 + 0.035 * breath) * (0.9 + 0.1 * k);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    g.addColorStop(0, this.rgba(this.COL.coreLight, 0.95 * k));
    g.addColorStop(0.16, this.rgba([255, 228, 170], 0.7 * k));
    g.addColorStop(0.42, this.rgba(this.COL.amber, 0.3 * k));
    g.addColorStop(0.78, this.rgba(this.COL.magenta, 0.08 * k));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();

    // bright nucleus
    const nr = size * 0.02 * (0.85 + 0.3 * breath);
    const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, nr * 3);
    ng.addColorStop(0, this.rgba(this.COL.white, 0.95 * k));
    ng.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(cx, cy, nr * 3, 0, Math.PI * 2);
    ctx.fill();

    // gentle 4-point star flare
    const fl = size * (0.1 + 0.04 * breath) * k;
    ctx.strokeStyle = this.rgba(this.COL.coreLight, 0.28 * k);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - fl, cy); ctx.lineTo(cx + fl, cy);
    ctx.moveTo(cx, cy - fl); ctx.lineTo(cx, cy + fl);
    ctx.stroke();
  },

  drawBorder(ctx, k) {
    const { cx, cy, maxR } = this;
    const g = ctx.createRadialGradient(cx, cy, maxR * 0.78, cx, cy, maxR * 1.02);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.7, this.rgba(this.COL.deepViolet, 0.1 * k));
    g.addColorStop(0.92, this.rgba(this.COL.violet, 0.16 * k));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 1.02, 0, Math.PI * 2);
    ctx.fill();
  },

  /* ───────────────────────── RENDER ─────────────────────────── */

  render(animated) {
    const { ctx, size } = this;
    ctx.clearRect(0, 0, size, size);

    const k = this.intensity;
    const breath = animated
      ? 0.5 + 0.5 * Math.sin(this.t * 0.85)
      : 0.55;

    ctx.globalCompositeOperation = "lighter";
    this.drawDepthHaze(ctx, k);
    this.drawClouds(ctx, k);
    this.drawArms(ctx, k);
    this.drawStars(ctx, k);
    this.drawRunes(ctx, k);
    this.drawBorder(ctx, k);
    this.drawCore(ctx, k, breath);
    ctx.globalCompositeOperation = "source-over";
  },

  drawStatic() {
    this.angle = 0.6;
    this.t = 1.4;
    this.intensity = 1;
    this.render(false);
  },

  animate() {
    if (document.body.classList.contains("ktree-open") || !this._inView) return;
    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;                  // clamp after tab-switch

    // ease the intensity ("state") toward its target
    this.intensity += (this.intensityTarget - this.intensity) * Math.min(1, dt * 3);

    this.t += dt;
    this.angle += dt * 0.16;                 // smooth continuous spin

    this.render(true);
    requestAnimationFrame(() => this.animate());
  },
};

window.Portal = Portal;
