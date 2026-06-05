/**
 * Atmospheric effects: dust particles + scroll reveal
 */
const Effects = {
  init() {
    this.initDust();
    this.initReveal();
    this.initNavScroll();
    this.initMobileNav();
  },

  initDust() {
    const canvas = document.getElementById("dust-canvas");
    if (!canvas) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let w, h, animId;

    const COUNT = 80;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.25 + 0.05),
        alpha: Math.random() * 0.4 + 0.1,
        hue: Math.random() > 0.5 ? "194,164,107" : "214,195,189",
      };
    }

    function initParticles() {
      particles = Array.from({ length: COUNT }, createParticle);
    }

    function dustVisible() {
      /* Dust is a hero atmosphere — stop repainting once the visitor
         has scrolled past the first viewport. Saves a full-screen
         canvas layer on every downstream section. */
      return window.scrollY < window.innerHeight * 1.15;
    }

    function scheduleDraw() {
      if (animId != null) return;
      animId = requestAnimationFrame(draw);
    }

    function draw() {
      animId = null;
      if (document.hidden) return;
      if (document.body.classList.contains("ktree-open")) return;
      if (!dustVisible()) return;
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue}, ${p.alpha})`;
        ctx.fill();
      });
      scheduleDraw();
    }

    resize();
    initParticles();
    scheduleDraw();

    const ktreeObs = new MutationObserver(() => {
      if (!document.body.classList.contains("ktree-open") && animId == null && dustVisible()) scheduleDraw();
    });
    ktreeObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && animId == null && dustVisible()) scheduleDraw();
    });

    window.addEventListener("scroll", () => {
      if (dustVisible() && animId == null && !document.hidden &&
          !document.body.classList.contains("ktree-open")) scheduleDraw();
    }, { passive: true });

    window.addEventListener("resize", () => {
      resize();
      initParticles();
    });

    return () => cancelAnimationFrame(animId);
  },

  initReveal() {
    const targets = document.querySelectorAll(
      ".tree-vault__header, .memories__head, .portal__stage, .hero__copy, .contracts__head, .contract"
    );

    targets.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  },

  initNavScroll() {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    /* The nav carries a backdrop-filter blur. Mutating its inline
       `background` on EVERY scroll event forced a style recalc +
       re-blur of the backdrop each frame. We now only flip a class
       when the 60px threshold is actually crossed, so 99% of scroll
       events do zero work. The colour itself lives in CSS. */
    let scrolled = null; // unknown → force first apply
    const onScroll = () => {
      const next = window.scrollY > 60;
      if (next === scrolled) return;
      scrolled = next;
      nav.classList.toggle("is-scrolled", next);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  },

  /* Mobile navigation: the burger toggles the collapsed .nav__links
     drop-down (<768px). Closes on link tap, outside click, Escape, or
     when the viewport grows back to desktop width. */
  initMobileNav() {
    const burger = document.getElementById("nav-burger");
    const links = document.getElementById("nav-links");
    if (!burger || !links) return;

    const isOpen = () => burger.getAttribute("aria-expanded") === "true";
    const close = () => {
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Abrir menu");
      links.classList.remove("is-open");
    };
    const open = () => {
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Fechar menu");
      links.classList.add("is-open");
    };

    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isOpen()) close(); else open();
    });

    // Tapping a destination navigates, then collapses the panel.
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) close();
    });

    // Any click outside the open panel dismisses it.
    document.addEventListener("click", (e) => {
      if (isOpen() && !links.contains(e.target) && !burger.contains(e.target)) {
        close();
      }
    });

    // Escape closes and returns focus to the trigger.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) {
        close();
        burger.focus();
      }
    });

    // Growing back to desktop reveals the inline links — reset state.
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768 && isOpen()) close();
    }, { passive: true });
  },
};

window.Effects = Effects;

/* ============================================================
   GLOBAL SCROLL-ACTIVITY SIGNAL  (registered immediately)
   ------------------------------------------------------------
   The skill-tree wallpaper, the WebGL crystal field and the
   narrative-particle field are all `position: fixed`, full-
   viewport canvases behind the page. The wallpaper no longer
   parallaxes with scroll (it is a calm fixed backdrop), so we
   can safely FREEZE these canvases' redraws while a scroll is in
   flight: their pixels don't change, the compositor reuses the
   cached GPU texture, and the page scrolls glass-smooth. Because
   nothing moves with scroll anymore, freezing produces NO visible
   jump (unlike the earlier parallax-coupled attempt). Ambient
   animation resumes ~120 ms after the last scroll event.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;
  window.__cvScrolling = false;
  let releaseTimer = null;
  window.addEventListener(
    "scroll",
    () => {
      window.__cvScrolling = true;
      if (releaseTimer) clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => { window.__cvScrolling = false; }, 120);
    },
    { passive: true }
  );
})();

// #region agent log
/* On-screen diagnostic overlay — fetch logs can't reach 127.0.0.1 from a
   physical phone, so this shows live frame-budget data on the device for
   the user to screenshot. Tests H7 (compositing-bound), H8 (worst at
   welcome/awakening), H9 (touch drag detection), H10 (fill-rate). */
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof document === "undefined") return;
  let box = null;
  let last = performance.now(), frames = 0, fps = 0, fpsMin = 999;
  let prev = { st: 0, cr: 0, np: 0, stms: 0, crms: 0, npms: 0 };
  let prevT = performance.now();
  function ensureBox() {
    if (box) return;
    box = document.createElement("div");
    box.id = "cv-dbg-overlay";
    box.style.cssText = "position:fixed;top:6px;left:6px;z-index:99999;background:rgba(0,0,0,.82);color:#3f6;font:11px/1.35 monospace;padding:6px 8px;border:1px solid #0a0;border-radius:6px;white-space:pre;pointer-events:none;max-width:64vw;";
    (document.body || document.documentElement).appendChild(box);
  }
  function tick() {
    frames++;
    const now = performance.now();
    const inst = 1000 / Math.max(1, now - (window.__dbgLastFrame || now));
    window.__dbgLastFrame = now;
    if (inst < fpsMin) fpsMin = inst;
    if (now - last >= 500) {
      fps = Math.round(frames * 1000 / (now - last));
      frames = 0; last = now;
      const dt = (now - prevT) / 1000; prevT = now;
      const st = window.__dbgST || 0, cr = window.__dbgCR || 0, np = window.__dbgNP || 0;
      const stms = window.__dbgSTms || 0, crms = window.__dbgCRms || 0, npms = window.__dbgNPms || 0;
      const stF = Math.round((st - prev.st) / dt), crF = Math.round((cr - prev.cr) / dt), npF = Math.round((np - prev.np) / dt);
      const stMs = (st - prev.st) > 0 ? ((stms - prev.stms) / (st - prev.st)).toFixed(1) : "0";
      const crMs = (cr - prev.cr) > 0 ? ((crms - prev.crms) / (cr - prev.cr)).toFixed(1) : "0";
      const npMs = (np - prev.np) > 0 ? ((npms - prev.npms) / (np - prev.np)).toFixed(1) : "0";
      prev = { st, cr, np, stms, crms, npms };
      const cv = document.querySelectorAll("canvas");
      let mpx = 0; cv.forEach((c) => { mpx += c.width * c.height; });
      const welcome = document.getElementById("arcane-welcome");
      const wstate = welcome ? (welcome.classList.contains("is-done") ? "done" : (welcome.classList.contains("is-active") ? "ACTIVE" : "idle")) : "none";
      const intro = window.__dbgIntro;
      const phase = (typeof intro === "number" && intro >= 0) ? "AWAKEN" : "normal";
      ensureBox();
      box.textContent =
        "FPS " + fps + "  min " + Math.round(fpsMin) + "\n" +
        "ST  " + stF + "f " + stMs + "ms\n" +
        "CR  " + crF + "f " + crMs + "ms\n" +
        "NP  " + npF + "f " + npMs + "ms\n" +
        "scroll " + (window.__cvScrolling ? "YES" : "no") + "  touch " + (window.__dbgTouch ? "Y" : "n") + "\n" +
        "camDrift " + (window.__dbgCamDrift || 0) + "\n" +
        "welcome " + wstate + "  " + phase + "\n" +
        "canvas " + cv.length + " " + (mpx / 1e6).toFixed(2) + "Mpx dpr" + (window.devicePixelRatio || 1);
      fetch('http://127.0.0.1:7279/ingest/89c13b11-4c60-49a0-81e3-64782c804124', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'bc6917' }, body: JSON.stringify({ sessionId: 'bc6917', runId: 'run2', hypothesisId: 'H7', location: 'effects.js:overlay', message: 'frame budget snapshot', data: { fps, fpsMin: Math.round(fpsMin), stF, stMs: +stMs, crF, crMs: +crMs, npF, npMs: +npMs, scrolling: !!window.__cvScrolling, touch: !!window.__dbgTouch, camDrift: window.__dbgCamDrift || 0, welcome: wstate, phase, canvases: cv.length, mpx: +(mpx / 1e6).toFixed(2), dpr: window.devicePixelRatio || 1 }, timestamp: Date.now() }) }).catch(() => {});
      fpsMin = 999;
    }
    requestAnimationFrame(tick);
  }
  if (document.body) requestAnimationFrame(tick);
  else window.addEventListener("DOMContentLoaded", () => requestAnimationFrame(tick));
})();
// #endregion
