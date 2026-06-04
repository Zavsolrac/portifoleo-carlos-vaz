/**
 * Codex do Arquiteto
 * ------------------
 * Click on the central portrait (Núcleo Arcano) ignites a 3-second
 * summoning ritual: the Tengwar ring brightens, runes accelerate, the
 * skill tree dims, and streams of particles converge from the screen
 * edges into the photo's centre. After the ritual, a luxurious medieval
 * codex spread unfurls from the photo's position, presenting Carlos'
 * legendary character record.
 *
 * On close, the codex collapses and dissolves into particles that fly
 * back to the Núcleo Arcano. The Tengwar ring dims and the tree returns.
 *
 * Exposes: window.Codex = { init, open, close }.
 */
const Codex = (() => {
  "use strict";

  let codexEl, veilEl, energyCanvas, ctx, closeBtn, portraitEl, bookEl;
  let raf = null;
  let isOpen = false;
  let phase = "idle"; // "summon" | "open" | "closing"
  let phaseStart = 0;
  let lastFrame = 0;
  let particles = [];
  let dissolveBox = null;

  const SUMMON_DURATION = 2800;
  const CLOSE_DURATION = 1700;

  let summonAudio = null;
  let summonAudioFallback = null;
  function preloadAudio() {
    try {
      summonAudio = new Audio("src/assets/sounds/milestone-magic.mp3");
      summonAudio.preload = "auto";
      summonAudio.volume = 0.45;
      summonAudioFallback = new Audio("src/assets/sounds/crystal-activate.mp3");
      summonAudioFallback.preload = "auto";
      summonAudioFallback.volume = 0.55;
    } catch { /* ignore */ }
  }
  function playSummon() {
    try {
      const a = (summonAudio || summonAudioFallback)?.cloneNode();
      if (!a) return;
      a.volume = 0.45;
      a.play().catch(() => { /* autoplay blocked */ });
    } catch { /* ignore */ }
  }
  function playSeal() {
    try {
      const a = summonAudioFallback?.cloneNode();
      if (!a) return;
      a.volume = 0.5;
      a.play().catch(() => { /* autoplay blocked */ });
    } catch { /* ignore */ }
  }

  function init() {
    codexEl = document.getElementById("codex");
    if (!codexEl) return;
    veilEl = document.getElementById("codex-veil");
    energyCanvas = document.getElementById("codex-energy");
    closeBtn = document.getElementById("codex-close");
    portraitEl = document.querySelector(".hero__portrait");
    bookEl = codexEl.querySelector(".codex__book");

    if (!energyCanvas || !portraitEl || !bookEl) return;
    ctx = energyCanvas.getContext("2d");

    preloadAudio();

    // Make the portrait clickable everywhere it lives
    portraitEl.addEventListener("click", onPortraitClick);
    portraitEl.style.cursor = "pointer";
    portraitEl.setAttribute("role", "button");
    portraitEl.setAttribute("tabindex", "0");
    portraitEl.setAttribute("aria-label", "Abrir Codex do Arquiteto");
    portraitEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onPortraitClick(e);
      }
    });

    // The milestone hook fires when the user clicks the photo after the
    // 8-skill tutorial cursor flow. Treat it the same way as a regular click.
    window.addEventListener("cv-milestone-photo-clicked", () => {
      if (!isOpen && phase === "idle") summon();
    });

    closeBtn?.addEventListener("click", close);
    veilEl?.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen && phase === "open") close();
    });

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  }

  function onPortraitClick(e) {
    if (isOpen || phase !== "idle") return;
    e?.preventDefault();
    summon();
  }

  function resizeCanvas() {
    if (!energyCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    energyCanvas.width = window.innerWidth * dpr;
    energyCanvas.height = window.innerHeight * dpr;
    energyCanvas.style.width = `${window.innerWidth}px`;
    energyCanvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getPortraitCenter() {
    if (!portraitEl) return null;
    const r = portraitEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
  }

  /* ------------------------------------------------------------------ *
   *  PHASE 1 · SUMMONING
   * ------------------------------------------------------------------ */
  function summon() {
    if (isOpen) return;
    isOpen = true;
    phase = "summon";
    phaseStart = performance.now();
    lastFrame = phaseStart;

    document.body.classList.add("is-codex-summoning");
    portraitEl?.classList.add("is-codex-active");
    portraitEl?.classList.remove("is-milestone-target");

    playSummon();
    spawnConvergence();
    if (!raf) raf = requestAnimationFrame(loop);

    // Anchor the codex unfurl origin on the portrait centre
    const c = getPortraitCenter();
    if (c) {
      codexEl.style.setProperty("--codex-origin-x", `${c.x}px`);
      codexEl.style.setProperty("--codex-origin-y", `${c.y}px`);
    }

    setTimeout(() => {
      if (phase !== "summon") return;
      reveal();
    }, SUMMON_DURATION);
  }

  function reveal() {
    phase = "open";
    document.body.classList.add("is-codex-open");
    codexEl.classList.add("is-open");
    codexEl.setAttribute("aria-hidden", "false");
    playSeal();
    // Fade out the live convergence streams during open phase
    setTimeout(() => {
      particles.length = 0;
    }, 600);
  }

  /* ------------------------------------------------------------------ *
   *  PHASE 3 · CLOSING (dissolution)
   * ------------------------------------------------------------------ */
  function close() {
    if (!isOpen || phase === "closing") return;
    phase = "closing";
    phaseStart = performance.now();
    lastFrame = phaseStart;

    spawnDissolve();
    if (!raf) raf = requestAnimationFrame(loop);

    codexEl.classList.add("is-closing");
    codexEl.classList.remove("is-open");

    setTimeout(() => {
      codexEl.classList.remove("is-closing");
      codexEl.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-codex-open", "is-codex-summoning");
      portraitEl?.classList.remove("is-codex-active");
      isOpen = false;
      phase = "idle";
      // Let particles finish briefly, then stop the loop
      setTimeout(() => {
        if (phase === "idle") {
          particles.length = 0;
          if (raf) { cancelAnimationFrame(raf); raf = null; }
          ctx?.clearRect(0, 0, energyCanvas.width, energyCanvas.height);
        }
      }, 800);
    }, CLOSE_DURATION);
  }

  /* ------------------------------------------------------------------ *
   *  PARTICLES
   * ------------------------------------------------------------------ */
  function spawnConvergence() {
    const c = getPortraitCenter();
    if (!c) return;
    // Streams come from the four screen edges + ambient sparks all around
    const total = 220;
    for (let i = 0; i < total; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Math.max(window.innerWidth, window.innerHeight) * (0.55 + Math.random() * 0.55);
      const sx = c.x + Math.cos(a) * dist;
      const sy = c.y + Math.sin(a) * dist;
      const speed = 0.55 + Math.random() * 1.1;
      particles.push({
        kind: "converge",
        x: sx, y: sy,
        tx: c.x, ty: c.y,
        vx: 0, vy: 0,
        size: 0.6 + Math.random() * 2.4,
        hue: Math.random() < 0.6 ? "warm" : "cool",
        life: 1,
        maxLife: 1 + Math.random() * 1.2,
        speed,
        delay: Math.random() * 1500,
        born: performance.now(),
        trail: [],
      });
    }
  }

  function spawnDissolve() {
    const portraitC = getPortraitCenter();
    if (!portraitC || !bookEl) return;
    const r = bookEl.getBoundingClientRect();
    dissolveBox = r;

    const COUNT = 320;
    for (let i = 0; i < COUNT; i++) {
      // Spawn along the page area (with a bias to the spine so it looks like
      // the codex is unraveling from the centre outward)
      const u = Math.random();
      const v = Math.random();
      const x = r.left + u * r.width;
      const y = r.top + v * r.height;
      const ang = Math.atan2(portraitC.y - y, portraitC.x - x);
      const speed = 1.4 + Math.random() * 2.6;
      particles.push({
        kind: "dissolve",
        x, y,
        tx: portraitC.x, ty: portraitC.y,
        vx: -Math.cos(ang) * (0.4 + Math.random() * 1.4),
        vy: -Math.sin(ang) * (0.4 + Math.random() * 1.4),
        size: 0.6 + Math.random() * 2.6,
        hue: Math.random() < 0.7 ? "warm" : "cool",
        life: 1,
        maxLife: 1.4 + Math.random() * 0.8,
        speed,
        delay: Math.random() * 600,
        born: performance.now(),
        trail: [],
      });
    }
  }

  /* ------------------------------------------------------------------ *
   *  RENDER LOOP
   * ------------------------------------------------------------------ */
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(48, now - lastFrame);
    lastFrame = now;

    ctx.clearRect(0, 0, energyCanvas.width, energyCanvas.height);

    // Soft additive glow at the portrait centre during summon for buildup
    const c = getPortraitCenter();
    if (c && (phase === "summon" || phase === "closing")) {
      const elapsed = now - phaseStart;
      const dur = phase === "summon" ? SUMMON_DURATION : CLOSE_DURATION;
      const tNorm = Math.min(1, elapsed / dur);
      const glow = phase === "summon"
        ? Math.pow(tNorm, 1.2)
        : Math.max(0, 1 - tNorm);
      const radius = 110 + glow * 120;
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, radius);
      grad.addColorStop(0, `rgba(255, 235, 190, ${0.45 * glow})`);
      grad.addColorStop(0.55, `rgba(229, 190, 174, ${0.18 * glow})`);
      grad.addColorStop(1, "rgba(229, 190, 174, 0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    // Update + draw particles
    if (particles.length) {
      ctx.globalCompositeOperation = "lighter";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.born;
        if (age < p.delay) continue;

        if (p.kind === "converge") {
          // Steer toward target with easing — gives organic curving streams
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const dist = Math.hypot(dx, dy);
          const accel = 0.0018 * dt * p.speed;
          p.vx += (dx / Math.max(dist, 1)) * accel * 60;
          p.vy += (dy / Math.max(dist, 1)) * accel * 60;
          // Tangential swirl for spiral feel
          p.vx += -dy / Math.max(dist, 1) * 0.05;
          p.vy +=  dx / Math.max(dist, 1) * 0.05;
          // Damping
          p.vx *= 0.965;
          p.vy *= 0.965;
          p.x += p.vx;
          p.y += p.vy;
          // Consume when close to the centre
          if (dist < 18) {
            particles.splice(i, 1);
            continue;
          }
        } else if (p.kind === "dissolve") {
          // Drift outward, then fall back into the photo
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const dist = Math.hypot(dx, dy);
          const t = Math.min(1, age / 1500);
          // First half: outward drift; second half: return
          if (t < 0.35) {
            p.x += p.vx * dt * 0.06;
            p.y += p.vy * dt * 0.06;
          } else {
            const pull = 0.0018 * dt * p.speed;
            p.vx += (dx / Math.max(dist, 1)) * pull * 80;
            p.vy += (dy / Math.max(dist, 1)) * pull * 80;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.x += p.vx;
            p.y += p.vy;
          }
          if (dist < 14 && t > 0.35) {
            particles.splice(i, 1);
            continue;
          }
        }

        // Life decay
        p.life -= dt / (p.maxLife * 1000);
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 6) p.trail.shift();

        // Draw trail
        for (let j = 0; j < p.trail.length; j++) {
          const t = p.trail[j];
          const alpha = (j / p.trail.length) * 0.55 * p.life;
          const col = p.hue === "warm"
            ? `rgba(255, 220, 170, ${alpha})`
            : `rgba(190, 220, 255, ${alpha * 0.75})`;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * (j / p.trail.length + 0.3), 0, Math.PI * 2);
          ctx.fill();
        }

        // Bright head
        const head = p.hue === "warm"
          ? `rgba(255, 240, 210, ${0.95 * p.life})`
          : `rgba(220, 240, 255, ${0.85 * p.life})`;
        ctx.fillStyle = head;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    // Stop the loop if we're idle, OR if the codex is fully open and there's
    // nothing left to draw. close() will restart it when needed.
    if (
      raf &&
      particles.length === 0 &&
      (phase === "idle" || phase === "open")
    ) {
      cancelAnimationFrame(raf);
      raf = null;
      ctx.clearRect(0, 0, energyCanvas.width, energyCanvas.height);
    }
  }

  return { init, open: summon, close };
})();

window.Codex = Codex;
