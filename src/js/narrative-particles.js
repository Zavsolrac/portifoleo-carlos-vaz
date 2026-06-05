/**
 * Narrative Particles · The single thread of energy
 * ──────────────────────────────────────────────────────────────────
 * One fullscreen canvas, one particle field, five behaviours. The
 * same particles travel with the visitor through every act of the
 * portfolio — chaotic in Act I, structured in Act II, crystalline
 * in Act III, ink-like in Act IV, converging in Act V. The visitor
 * never sees five disjoint visual systems; they see one organism
 * evolving with the story.
 *
 *  Modes
 *  ─────
 *    idle           default drift — slow, dispersed, no anchor
 *    form-text      particles converge to form "CARLOS VAZ" letterforms
 *                   anchored on the hero's H1 (Act I — Cosmic Resonance)
 *    pulse-out      a wave radiates from the constellation centre
 *                   outward; particles ride the wave (Act II)
 *    orbit          particles orbit around the memory-crystals area
 *                   (Act III — Gravitational Pulse)
 *    trail          particles slowly drift downward like gold ink
 *                   crossing the codex pages (Act IV)
 *    converge       every particle on screen pulls toward the portal
 *                   centre — "every road leads here" (Act V)
 *
 *  Why a canvas
 *  ────────────
 *    DOM particles would blow up the layer count on long pages and
 *    fight the existing SkillTree wallpaper. A single transparent
 *    canvas is cheap to composite, supports thousands of moving
 *    points at 60fps, and avoids hit-testing entirely (the canvas is
 *    `pointer-events: none`).
 *
 *  Performance
 *  ───────────
 *    · Particle state lives in a Float32Array for cache locality.
 *      No per-frame allocations after init.
 *    · The render loop pauses when document.hidden becomes true.
 *    · A resize debouncer rebuilds the offscreen letterform target
 *      cache only when truly needed.
 *
 *  Accessibility
 *  ─────────────
 *    Honors prefers-reduced-motion by short-circuiting the loop and
 *    drawing nothing — the page still works, just without the
 *    living particle thread.
 */
window.NarrativeParticles = (() => {
  /* ── tunables ─────────────────────────────────────────────────── */
  /* COSMIC RESONANCE bump (June 2026): the field now carries thousands
     of particles so Act I reads as a true nebula collapse instead of
     a sparse drift. The count scales linearly with viewport area, so
     phones still stay at ~280 while 1080p desktops see ~800 points.
     Hard cap at 1100 prevents 4K monitors from drowning the GPU. */
  const BASE_COUNT     = 800;   // particle population on a 1080p viewport
  const MIN_COUNT      = 280;   // floor for small screens
  const MAX_COUNT      = 1100;  // ceiling for ultra-wide / 4K displays
  const TARGET_FPS     = 60;
  const DRIFT_SPEED    = 0.18;  // px per frame baseline
  /* Cosmic Resonance palette · gold + violet + cyan together read
     as a real deep-space nebula instead of a single-tone confetti. */
  const PARTICLE_RGB   = [255, 231, 160]; // warm gold, the "energy" colour
  const PARTICLE_ALT   = [155, 124, 214]; // violet accent — every Nth
  const COLOR_GOLD     = [255, 231, 160];
  const COLOR_VIOLET   = [180, 140, 230];
  const COLOR_CYAN     = [120, 200, 255];
  const ALT_EVERY      = 5;

  /* ── runtime state ────────────────────────────────────────────── */
  let canvas, ctx;
  let dpr = 1;
  let width = 0, height = 0;
  let count = BASE_COUNT;

  /* Each particle is six floats: x, y, vx, vy, tx, ty
     where (tx, ty) is a per-particle target used in form-text and
     converge modes. We use a single Float32Array so we never allocate
     per-frame. */
  let P;
  const STRIDE = 6;
  const X = 0, Y = 1, VX = 2, VY = 3, TX = 4, TY = 5;

  let mode = "idle";
  let modeStart = 0;
  let modeData = null;             // mode-specific payload (cache, anchor rect)
  let textTargets = null;          // [ [x,y], ... ] from offscreen pass

  let mouse = { x: -9999, y: -9999, active: false };
  let mouseAffinity = 0;           // 0..1, lifted in Act V on hover near portal
  let lastPointerAt = performance.now();
  let narrativeFrame = 0;

  let rafId = null;
  let isReducedMotion = false;
  let hidden = false;

  /* ── public api ──────────────────────────────────────────────── */
  function init() {
    canvas = document.getElementById("narrative-particles");
    if (!canvas) return;
    ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    isReducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReducedMotion) return; // CSS shows nothing extra; we just don't run.

    resize();
    seedField();

    window.addEventListener("resize", debouncedResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    /* React to act changes — the only contract with narrative.js. */
    setMode(modeForAct(document.documentElement.dataset.narrativeAct || "1"));
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes" && r.attributeName === "data-narrative-act") {
          setMode(modeForAct(document.documentElement.dataset.narrativeAct || "1"));
        }
      }
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-narrative-act"],
    });

    const ktreeObs = new MutationObserver(() => {
      if (!document.body.classList.contains("ktree-open") && rafId === null && !hidden) {
        rafId = requestAnimationFrame(loop);
      }
    });
    ktreeObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    rafId = requestAnimationFrame(loop);
  }

  /* ── mode mapping ────────────────────────────────────────────── */
  /* Act I used to use "form-text" (particles converging to spell
     "Carlos Vaz") but the user explicitly asked for the particle
     formation to be removed (June 2026); only the CSS letter
     emergence + new lava text effect should drive the name now.
     We fall back to "idle" so the global energy thread keeps its
     ambient nebula drift across the hero — the canvas stays alive
     in the background without targeting the headline. */
  function modeForAct(act) {
    switch (act) {
      case "1": return "idle";
      case "2": return "pulse-out";
      case "3": return "orbit";
      case "4": return "trail";
      case "5": return "converge";
      default:  return "idle";
    }
  }

  function setMode(next) {
    if (next === mode) return;
    mode = next;
    modeStart = performance.now();
    /* Per-mode entry hooks. Each populates `modeData` with whatever
       its render branch needs — usually a target rect or anchor. */
    switch (mode) {
      case "form-text": {
        const anchor = document.getElementById("hero-headline");
        textTargets = computeTextTargets("CARLOS VAZ", anchor);
        /* Re-randomize positions + velocities on every entry so the
           chaos phase ALWAYS reads as a fresh nebula collapse — even
           when the visitor scrolls back to the hero from Act II. */
        seedRangeRandom(0, count);
        seedTargetsFromCache();
        /* Cache the anchor rect so any phase that needs it (e.g.
           future overlays anchored to the headline) can read it
           without doing a layout query on every animation frame. */
        modeData = anchor ? anchor.getBoundingClientRect() : null;
        break;
      }
      case "pulse-out": {
        const anchor = document.getElementById("craft-stage");
        modeData = anchor ? rectCentre(anchor.getBoundingClientRect())
                          : { x: width / 2, y: height / 2 };
        modeData.waveT = 0;
        break;
      }
      case "orbit": {
        const anchor = document.getElementById("memories");
        modeData = anchor ? rectCentre(anchor.getBoundingClientRect())
                          : { x: width / 2, y: height / 2 };
        /* Give each particle a base orbital radius + phase. We reuse
           tx/ty as polar (radius, phase) for orbit mode. */
        for (let i = 0; i < count; i++) {
          const off = i * STRIDE;
          P[off + TX] = 60 + Math.random() * 220;      // radius
          P[off + TY] = Math.random() * Math.PI * 2;   // phase
        }
        break;
      }
      case "trail": {
        const anchor = document.getElementById("contracts");
        modeData = anchor ? anchor.getBoundingClientRect()
                          : { left: 0, top: 0, width, height };
        /* Re-seed velocities to a soft downward bias so the ink
           appears to drip across the codex. */
        for (let i = 0; i < count; i++) {
          const off = i * STRIDE;
          P[off + VX] = (Math.random() - 0.5) * 0.20;
          P[off + VY] = 0.20 + Math.random() * 0.35;
        }
        break;
      }
      case "converge": {
        const anchor = document.getElementById("portal-canvas");
        modeData = anchor ? rectCentre(anchor.getBoundingClientRect())
                          : { x: width / 2, y: height - 220 };
        break;
      }
      default:
        modeData = null;
    }
  }

  /* ── canvas / resize ─────────────────────────────────────────── */
  let resizeTimer = null;
  function debouncedResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }
  function resize() {
    const isTouchWallpaper = window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      window.matchMedia("(max-width: 767px)").matches;
    dpr     = Math.min(isTouchWallpaper ? 1 : 2, window.devicePixelRatio || 1);
    width   = window.innerWidth;
    height  = window.innerHeight;
    canvas.style.width  = width + "px";
    canvas.style.height = height + "px";
    canvas.width  = Math.round(width  * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* Adjust population to viewport area: phones get ~280, 1080p
       gets ~800, 4K gets capped at 1100 so we never blow the GPU. */
    const target = Math.round(BASE_COUNT * (width * height) / (1920 * 1080));
    const minCount = isTouchWallpaper ? 140 : MIN_COUNT;
    count = Math.max(minCount, Math.min(MAX_COUNT, target));
    /* When count grows on resize we extend the array; when it shrinks
       we just stop iterating past `count` — no churn. */
    if (!P || P.length < count * STRIDE) {
      const old = P;
      P = new Float32Array(count * STRIDE);
      if (old) P.set(old);
      seedRangeRandom(old ? Math.floor(old.length / STRIDE) : 0, count);
    }
    /* Mode-specific caches that depend on geometry need refreshing. */
    if (mode === "form-text") {
      const anchor = document.getElementById("hero-headline");
      textTargets = computeTextTargets("CARLOS VAZ", anchor);
      seedTargetsFromCache();
      modeData = anchor ? anchor.getBoundingClientRect() : null;
    } else {
      setMode(mode); // rebuild modeData for the new size
    }
  }

  /* ── field seeding ───────────────────────────────────────────── */
  function seedField() {
    P = new Float32Array(count * STRIDE);
    seedRangeRandom(0, count);
  }
  function seedRangeRandom(from, to) {
    for (let i = from; i < to; i++) {
      const off = i * STRIDE;
      P[off + X]  = Math.random() * width;
      P[off + Y]  = Math.random() * height;
      const a = Math.random() * Math.PI * 2;
      const s = DRIFT_SPEED * (0.4 + Math.random() * 1.2);
      P[off + VX] = Math.cos(a) * s;
      P[off + VY] = Math.sin(a) * s;
      P[off + TX] = P[off + X];
      P[off + TY] = P[off + Y];
    }
  }
  function seedTargetsFromCache() {
    if (!textTargets || !textTargets.length) return;
    for (let i = 0; i < count; i++) {
      const off = i * STRIDE;
      const t   = textTargets[i % textTargets.length];
      P[off + TX] = t[0];
      P[off + TY] = t[1];
    }
  }

  /* ── offscreen letterform sampler ────────────────────────────── */
  /* Rasterizes the hero name to an offscreen canvas, samples opaque
     pixels on a fixed grid and returns their global page coords.
     The targets are what the particle field converges toward during
     Act I's COSMIC RESONANCE.
     ─────────────────────────────────────────────────────────────
     IMPORTANT: the hero name lives across TWO styled lines in the
     DOM:
        .hero__name-first  → "Carlos"  (block, regular)
        .hero__name-last   → "Vaz"     (block, italic)
     The earlier implementation rasterized "CARLOS VAZ" as a SINGLE
     horizontal line and computed font-size from rect.height (which
     measures BOTH stacked lines). On any narrow viewport this
     produced a giant single-line string ~600–900px wide; once
     centred on the H1's centre it overflowed the screen and the
     draw guard inside drawDotCosmic() culled every off-screen
     particle. Result: only ~half the name was ever visible — the
     bug the user reported.

     Fix: render the SAME two-line layout the DOM does, at the H1's
     ACTUAL computed font-size (read via getComputedStyle so we
     match the CSS pixel-for-pixel — works on every breakpoint,
     including the @media (max-width: 480px) override that drops
     the H1 to 2.5rem). Then centre the resulting cloud on the H1's
     box centre. Now the constellation never extends beyond the
     visible name, regardless of viewport size. */
  function computeTextTargets(_text, anchorEl) {
    const LINE1 = "Carlos";
    const LINE2 = "Vaz";
    /* Match the EXACT --font-display stack used by .hero__name in
       style.css so the offscreen rasterization picks the same face
       and metrics the DOM uses. */
    const FONT_FAMILY = `"Cinzel", "Libre Caslon Text", Georgia, serif`;
    /* Match .hero__name { font-weight: 400 }. Using 700 here would
       produce thicker strokes than the DOM glyphs and the cloud
       would look slightly bolder than the final name. */
    const FONT_WEIGHT = 400;
    /* Spaced to match the visual line-height of the DOM H1
       (.hero__letter line-height: 1.18 + .hero__name-* padding-block:
       0.12em). 1.25 lines up well across breakpoints. */
    const LINE_RATIO = 1.25;

    const fallback = {
      left:   width / 2 - 200,
      top:    height / 2 - 100,
      width:  400,
      height: 200,
    };
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : fallback;

    /* Read the H1's actual font-size in CSS pixels. On desktop this
       resolves to the clamp(2.75rem, 8vw, 4.5rem) value; on phones
       (<=480px) the @media override drops it to 2.5rem (40px). The
       particle silhouette therefore matches the visible glyphs at
       every breakpoint without any manual breakpoint plumbing here. */
    let fontSize = 64;
    if (anchorEl && window.getComputedStyle) {
      const parsed = parseFloat(window.getComputedStyle(anchorEl).fontSize);
      if (parsed > 0) fontSize = parsed;
    }

    const off  = document.createElement("canvas");
    const octx = off.getContext("2d");

    /* Measure both lines independently at their respective weights
       and styles (line 2 is italic to match .hero__name-last). */
    octx.font = `${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
    octx.textBaseline = "top";
    const m1 = octx.measureText(LINE1);
    octx.font = `italic ${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
    const m2 = octx.measureText(LINE2);

    const lineH = Math.ceil(fontSize * LINE_RATIO);
    /* Generous padding for italic descenders + glow overdraw. */
    const pad   = Math.ceil(fontSize * 0.20);
    const maxW  = Math.ceil(Math.max(m1.width, m2.width));
    off.width   = maxW + pad * 2;
    off.height  = lineH * 2 + pad * 2;

    /* Re-apply state (canvas resize wipes it) and draw each line
       centred horizontally within the offscreen canvas. */
    octx.fillStyle = "#fff";
    octx.textBaseline = "top";
    octx.font = `${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
    octx.fillText(LINE1, pad + (maxW - m1.width) / 2, pad);
    octx.font = `italic ${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
    octx.fillText(LINE2, pad + (maxW - m2.width) / 2, pad + lineH);

    /* Sample opaque pixels on a 4-pixel grid. */
    const img = octx.getImageData(0, 0, off.width, off.height);
    const step = 4;
    const points = [];
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const i = (y * off.width + x) * 4 + 3;
        if (img.data[i] > 128) points.push([x, y]);
      }
    }
    if (!points.length) return null;

    /* Centre the cloud on the H1's box centre. Because we centred
       both lines inside the offscreen canvas, the resulting
       constellation is automatically centred over the visible name
       even when "Carlos" and "Vaz" have different widths. */
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const ox = cx - off.width  / 2;
    const oy = cy - off.height / 2;
    return points.map(([x, y]) => [ox + x, oy + y]);
  }

  /* ── mouse / visibility ──────────────────────────────────────── */
  function onPointerMove(e) {
    lastPointerAt = performance.now();
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    if (mode === "converge" && modeData) {
      /* In Act V, mouse proximity to the portal centre lifts the
         affinity factor — particles rush in faster when invited. */
      const dx = mouse.x - modeData.x;
      const dy = mouse.y - modeData.y;
      const dist = Math.hypot(dx, dy);
      mouseAffinity = clamp01(1 - dist / 480);
    }
  }
  function onVisibility() {
    hidden = document.hidden;
    if (!hidden && rafId === null) rafId = requestAnimationFrame(loop);
  }

  /* ── render loop ─────────────────────────────────────────────── */
  function loop(now) {
    if (hidden) { rafId = null; return; }
    if (document.body.classList.contains("ktree-open")) { rafId = null; return; }
    rafId = requestAnimationFrame(loop);

    /* Mobile: freeze the particle field while the welcome overlay is
       on screen — form-text + near-lines still cost fill-rate on top
       of the welcome DOM paint budget. */
    const __welcomeEl = document.getElementById("arcane-welcome");
    const __welcomeBusy = __welcomeEl &&
      (__welcomeEl.classList.contains("is-active") ||
        __welcomeEl.classList.contains("is-leaving"));
    const __touchWall = window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      window.matchMedia("(max-width: 767px)").matches;
    if (__welcomeBusy && __touchWall) return;

    // #region agent log
    const __dbgN0 = performance.now();
    window.__npCalls = (window.__npCalls || 0) + 1;
    // #endregion

    narrativeFrame++;
    const narrIdle = performance.now() - lastPointerAt > 2000;
    if (narrIdle && (narrativeFrame & 1) === 1) return;

    // Freeze the ambient field while the page is being scrolled — its
    // fixed full-viewport canvas then composites from cache instead of
    // re-uploading a texture every frame. Only the always-on "idle"
    // wash is frozen; scripted narrative beats keep playing.
    if (mode === "idle" && window.__cvScrolling) return;

    ctx.clearRect(0, 0, width, height);

    /* Light wash that softens previous frame trails. Drawing a
       translucent rect over the cleared canvas is a no-op visually
       but ensures we never accumulate banding from compositing. */
    const baseAlpha = mode === "trail" ? 0.85 : 0.78;

    switch (mode) {
      case "form-text": renderFormText(now, baseAlpha); break;
      case "pulse-out": renderPulseOut(now, baseAlpha); break;
      case "orbit":     renderOrbit(now, baseAlpha);    break;
      case "trail":     renderTrail(now, baseAlpha);    break;
      case "converge":  renderConverge(now, baseAlpha); break;
      default:          renderIdle(baseAlpha);
    }

    // #region agent log
    window.__npHeavy = (window.__npHeavy || 0) + 1;
    window.__npTime = (window.__npTime || 0) + (performance.now() - __dbgN0);
    window.__dbgNP = (window.__dbgNP || 0) + 1;
    window.__dbgNPms = (window.__dbgNPms || 0) + (performance.now() - __dbgN0);
    if (!window.__npLast || performance.now() - window.__npLast > 1000) {
      const __dt = window.__npLast ? (performance.now() - window.__npLast) / 1000 : 1;
      fetch('http://127.0.0.1:7279/ingest/89c13b11-4c60-49a0-81e3-64782c804124',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bc6917'},body:JSON.stringify({sessionId:'bc6917',runId:'run1',hypothesisId:'H3',location:'narrative-particles.js:loop',message:'narrative particles per-sec',data:{rafFps:Math.round((window.__npCalls||0)/__dt),heavyFps:Math.round((window.__npHeavy||0)/__dt),avgHeavyMs:+((window.__npTime||0)/Math.max(1,window.__npHeavy)).toFixed(2),count:count,mode:mode,innerW:window.innerWidth,dpr:dpr},timestamp:Date.now()})}).catch(()=>{});
      window.__npLast = performance.now(); window.__npCalls = 0; window.__npHeavy = 0; window.__npTime = 0;
    }
    // #endregion
  }

  /* ── render branches ─────────────────────────────────────────── */

  /* IDLE · slow random drift; particles wrap at the edges so the
     field never thins out. The faint connecting lines between
     nearby particles are what give the "alive neural" sensation. */
  function renderIdle(alpha) {
    for (let i = 0; i < count; i++) {
      const off = i * STRIDE;
      P[off + X] += P[off + VX];
      P[off + Y] += P[off + VY];
      wrap(off);
      drawDot(P[off + X], P[off + Y], i, alpha);
    }
    drawNearLines(70, 0.05);
  }

  /* FORM-TEXT · "COSMIC RESONANCE" four-phase cinematic for Act I.
     ──────────────────────────────────────────────────────────────
     The single thread of energy goes through four perceptual stages
     when the hero section enters the viewport. (The earlier RAY
     phase — a horizontal beam crossing the screen — was removed
     at the user's request in June 2026; the cloud now drifts
     calmly through the dispersion and then converges on its own,
     which reads as a quieter, more contemplative materialization.)

       CHAOS       0    → 1.7s   thousands of particles dispersed
                                 across the screen in nebula colours;
                                 they drift idly with no anchor and
                                 a faint neural-net connection mesh.
                                 (Extended by 0.6s to absorb the
                                 removed RAY window without shifting
                                 the downstream CSS letter delays.)

       CONVERGE    1.7  → 4.2s   each particle eases toward its
                                 pre-assigned letterform target,
                                 spiralling in with decreasing jitter.
                                 The name takes shape as a cloud of
                                 light slowly precipitating into
                                 readable glyph silhouettes.

       FORGE       4.2  → 6.0s   particles settle inside the letter
                                 shapes with a tight breath; the DOM
                                 glyphs of "Carlos Vaz" ignite on top
                                 of them (CSS-driven, see style.css).

       RESONANCE   6.0s+         particles continue to orbit each
                                 letter target with a slow Lissajous
                                 motion — a living halo around the
                                 hero name until the visitor scrolls.
  */
  function renderFormText(now, alpha) {
    const t = (now - modeStart) / 1000;

    /* Phase boundaries (seconds). The FORGE start at 4.2s is locked
       to the CSS `act1-letter-emerge` animation-delay — keep both
       in sync if you ever retune the cinematic. */
    const T_CHAOS_END    = 1.7;
    const T_CONVERGE_END = 4.2;
    const T_FORGE_END    = 6.0;

    /* ── PHASE 0 · CHAOS ─────────────────────────────────────── */
    if (t < T_CHAOS_END) {
      const fade = clamp01(t / 0.35);
      for (let i = 0; i < count; i++) {
        const off = i * STRIDE;
        P[off + X] += P[off + VX];
        P[off + Y] += P[off + VY];
        wrap(off);
        /* Twinkle so the dispersed field never reads as static dots. */
        const tw = 0.82 + 0.18 * Math.sin(i * 0.73 + t * 4.2);
        drawDotCosmic(P[off + X], P[off + Y], i, fade * 0.85 * tw, 1.0);
      }
      drawNearLines(86, 0.05 * fade);
      return;
    }

    /* If letterform sampling failed (font load race, hidden anchor)
       degrade to a calm idle so the act never appears broken. */
    if (!textTargets || !textTargets.length) {
      renderIdle(alpha);
      return;
    }

    /* ── PHASE 1 · CONVERGENCE ───────────────────────────────── */
    if (t < T_CONVERGE_END) {
      const p     = (t - T_CHAOS_END) / (T_CONVERGE_END - T_CHAOS_END);
      const eased = easeOutCubic(p);
      for (let i = 0; i < count; i++) {
        const off = i * STRIDE;
        const tx  = P[off + TX];
        const ty  = P[off + TY];
        /* Jitter scales with (1 - eased): the spiral collapses
           gradually rather than snapping to the target. */
        const jx = tx + (Math.random() - 0.5) * (1 - eased) * 90;
        const jy = ty + (Math.random() - 0.5) * (1 - eased) * 90;
        const k  = 0.045 + eased * 0.13;
        P[off + X] += (jx - P[off + X]) * k;
        P[off + Y] += (jy - P[off + Y]) * k;
        drawDotCosmic(
          P[off + X], P[off + Y], i,
          0.85 + eased * 0.4,
          1.0 + eased * 0.25
        );
      }
      drawNearLines(40 + (1 - p) * 30, 0.10 + eased * 0.08);
      return;
    }

    /* ── PHASE 2 · FORGE ─────────────────────────────────────── */
    if (t < T_FORGE_END) {
      const p = (t - T_CONVERGE_END) / (T_FORGE_END - T_CONVERGE_END);
      for (let i = 0; i < count; i++) {
        const off = i * STRIDE;
        const tx  = P[off + TX];
        const ty  = P[off + TY];
        /* Tight breath: a tiny Lissajous around each target so the
           cloud feels alive while the DOM letters ignite on top. */
        const ang = (i / count) * Math.PI * 2 + t * 0.75;
        const r   = 0.8 + 0.3 * Math.sin(t * 1.6 + i);
        const dx  = tx + Math.cos(ang) * r;
        const dy  = ty + Math.sin(ang) * r;
        P[off + X] += (dx - P[off + X]) * 0.18;
        P[off + Y] += (dy - P[off + Y]) * 0.18;
        /* As the DOM letters get sharper the particle cloud dims
           slightly so the readable glyphs take centre stage. */
        const fade = 1 - p * 0.18;
        const flick = 1 + 0.18 * Math.sin(t * 3 + i * 0.5);
        drawDotCosmic(P[off + X], P[off + Y], i, fade * flick, 1.1);
      }
      drawNearLines(30, 0.10);
      return;
    }

    /* ── PHASE 3 · RESONANCE ─────────────────────────────────── */
    const orbitT = t - T_FORGE_END;
    for (let i = 0; i < count; i++) {
      const off = i * STRIDE;
      const tx  = P[off + TX];
      const ty  = P[off + TY];
      const ang = (i / count) * Math.PI * 2 + orbitT * 0.45;
      const r   = 1.4 + 0.55 * Math.sin(orbitT * 1.15 + i * 0.3);
      const dx  = tx + Math.cos(ang) * r;
      const dy  = ty + Math.sin(ang) * r * 0.85;
      P[off + X] += (dx - P[off + X]) * 0.10;
      P[off + Y] += (dy - P[off + Y]) * 0.10;
      const breath = 0.80 + 0.20 * Math.sin(t * 1.8 + i * 0.45);
      drawDotCosmic(P[off + X], P[off + Y], i, breath, 1.0);
    }
    drawNearLines(28, 0.07);
  }

  /* PULSE-OUT · radial energy wave emanating from the constellation
     centre. Particles ride the wave: they receive a brief outward
     impulse as the wavefront passes through their radius. */
  function renderPulseOut(now, alpha) {
    const t = (now - modeStart) / 1000;
    /* Wave radius grows linearly for 2.5s then idles. */
    const wave = Math.min(1, t / 2.5) * Math.max(width, height) * 0.7;
    const cx = modeData.x, cy = modeData.y;

    for (let i = 0; i < count; i++) {
      const off = i * STRIDE;
      const dx = P[off + X] - cx;
      const dy = P[off + Y] - cy;
      const r  = Math.hypot(dx, dy);
      /* Impulse band: particles within 60px of the wavefront get a
         radial push outward. */
      const band = Math.abs(r - wave);
      if (band < 60 && r > 1) {
        const push = (1 - band / 60) * 0.6;
        P[off + VX] += (dx / r) * push;
        P[off + VY] += (dy / r) * push;
      }
      /* Damping so the field doesn't accelerate forever. */
      P[off + VX] *= 0.985;
      P[off + VY] *= 0.985;
      P[off + X]  += P[off + VX];
      P[off + Y]  += P[off + VY];
      wrap(off);
      const glow = band < 60 ? 0.4 * (1 - band / 60) : 0;
      drawDot(P[off + X], P[off + Y], i, alpha + glow);
    }
    drawNearLines(80, 0.08);
  }

  /* ORBIT · each particle revolves around the memories centre at
     its own radius and phase. The result is a slowly swirling halo
     of satellites — the "gravitational pulse" the brief asked for. */
  function renderOrbit(now, alpha) {
    const t = (now - modeStart) / 1000;
    const cx = modeData.x, cy = modeData.y;
    for (let i = 0; i < count; i++) {
      const off = i * STRIDE;
      const radius = P[off + TX];
      const phase  = P[off + TY] + t * (0.12 + (i % 7) * 0.012);
      const x = cx + Math.cos(phase) * radius;
      const y = cy + Math.sin(phase) * radius * 0.55;
      P[off + X] = x;
      P[off + Y] = y;
      drawDot(x, y, i, alpha);
    }
    drawNearLines(46, 0.05);
  }

  /* TRAIL · particles drift downward across the codex pages, gently
     wrapping at the bottom so the column always feels populated.
     A soft horizontal sway makes the ink look hand-poured. */
  function renderTrail(now, alpha) {
    const t = (now - modeStart) / 1000;
    for (let i = 0; i < count; i++) {
      const off = i * STRIDE;
      P[off + X] += P[off + VX] + Math.sin(t * 0.6 + i) * 0.10;
      P[off + Y] += P[off + VY];
      if (P[off + Y] > height + 8) {
        P[off + Y] = -8;
        P[off + X] = Math.random() * width;
      }
      if (P[off + X] < -8) P[off + X] = width + 8;
      else if (P[off + X] > width + 8) P[off + X] = -8;
      drawDot(P[off + X], P[off + Y], i, alpha);
    }
  }

  /* CONVERGE · everything bends toward the portal centre, slowly.
     Mouse proximity lifts the affinity factor so the field rushes
     in when the visitor flirts with the portal. */
  function renderConverge(now, alpha) {
    const cx = modeData.x, cy = modeData.y;
    const baseAffinity = 0.012;
    const aff = baseAffinity + mouseAffinity * 0.08;
    /* Decay mouseAffinity slowly so a brief hover lifts the field
       for a moment after the cursor leaves. */
    mouseAffinity *= 0.96;

    for (let i = 0; i < count; i++) {
      const off = i * STRIDE;
      const dx = cx - P[off + X];
      const dy = cy - P[off + Y];
      const r  = Math.hypot(dx, dy);
      if (r > 12) {
        P[off + VX] += (dx / r) * aff;
        P[off + VY] += (dy / r) * aff;
      } else {
        /* Once a particle reaches the portal, recycle it to the
           page edges so the convergence keeps feeding. */
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0)      { P[off + X] = -8;       P[off + Y] = Math.random() * height; }
        else if (edge === 1) { P[off + X] = width + 8;P[off + Y] = Math.random() * height; }
        else if (edge === 2) { P[off + Y] = -8;       P[off + X] = Math.random() * width; }
        else                  { P[off + Y] = height+8;P[off + X] = Math.random() * width; }
        P[off + VX] = 0; P[off + VY] = 0;
      }
      P[off + VX] *= 0.97;
      P[off + VY] *= 0.97;
      P[off + X]  += P[off + VX];
      P[off + Y]  += P[off + VY];
      drawDot(P[off + X], P[off + Y], i, alpha + mouseAffinity * 0.25);
    }
    drawNearLines(60, 0.06 + mouseAffinity * 0.12);
  }

  /* ── primitives ──────────────────────────────────────────────── */
  function drawDot(x, y, i, a) {
    if (x < -4 || x > width + 4 || y < -4 || y > height + 4) return;
    const isAlt = (i % ALT_EVERY) === 0;
    const [r, g, b] = isAlt ? PARTICLE_ALT : PARTICLE_RGB;
    ctx.beginPath();
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.arc(x, y, isAlt ? 1.4 : 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  /* COSMIC dot · used by Act I's form-text mode. Cycles through three
     nebula colours (gold majority, violet every 5th, cyan every 11th)
     and varies size deterministically per particle index so the field
     reads as real depth instead of identical sprites. The optional
     sizeMul lets a phase boost particle radius without changing the
     base assignment. */
  function drawDotCosmic(x, y, i, a, sizeMul) {
    if (x < -4 || x > width + 4 || y < -4 || y > height + 4) return;
    let r, g, b;
    if (i % 11 === 0)     { r = COLOR_CYAN[0];   g = COLOR_CYAN[1];   b = COLOR_CYAN[2]; }
    else if (i % 5 === 0) { r = COLOR_VIOLET[0]; g = COLOR_VIOLET[1]; b = COLOR_VIOLET[2]; }
    else                  { r = COLOR_GOLD[0];   g = COLOR_GOLD[1];   b = COLOR_GOLD[2]; }
    /* Deterministic 0.9 → 1.65 radius spread across the field. */
    const size = (0.9 + ((i * 13) % 8) * 0.10) * (sizeMul || 1);
    ctx.beginPath();
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Cheap, lossy neighbour-line pass. We sample every Nth particle
     as a "leader" and connect it to a handful of close neighbours.
     Skipping random pairs keeps cost O(count) instead of O(count²). */
  function drawNearLines(maxDist, baseAlpha) {
    if (baseAlpha <= 0) return;
    ctx.lineWidth = 0.55;
    for (let i = 0; i < count; i += 3) {
      const ox = P[i * STRIDE + X];
      const oy = P[i * STRIDE + Y];
      for (let j = i + 1; j < Math.min(count, i + 11); j++) {
        const dx = P[j * STRIDE + X] - ox;
        const dy = P[j * STRIDE + Y] - oy;
        const d  = Math.hypot(dx, dy);
        if (d > maxDist) continue;
        const a = baseAlpha * (1 - d / maxDist);
        ctx.strokeStyle = `rgba(255,231,160,${a})`;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(P[j * STRIDE + X], P[j * STRIDE + Y]);
        ctx.stroke();
      }
    }
  }

  function wrap(off) {
    if (P[off + X] < -8)       P[off + X] = width + 8;
    else if (P[off + X] > width + 8)  P[off + X] = -8;
    if (P[off + Y] < -8)       P[off + Y] = height + 8;
    else if (P[off + Y] > height + 8) P[off + Y] = -8;
  }

  /* ── tiny math helpers ───────────────────────────────────────── */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function rectCentre(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  return { init };
})();
