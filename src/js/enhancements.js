/* ============================================================
 * ENHANCEMENTS · professional-evolution layer (June 2026)
 * ------------------------------------------------------------
 * Two small, self-contained behaviours for the new conversion
 * sections. Both are progressive — if their markup is absent the
 * module simply does nothing, and both honour prefers-reduced-motion.
 *
 *   1. Count-up stats  → "Conquistas e Marcos" (#milestones)
 *      Numbers live in data-count-to (easy to edit). An optional
 *      data-count-prefix is preserved (e.g. "+"). The count animates
 *      once, the first time the section scrolls into view.
 *
 *   2. Testimonials slider → "Relatos do Reino" (#testimonials)
 *      A single rotating parchment quote with prev/next + dots,
 *      auto-advancing while idle. Works with 1..n slides (controls
 *      auto-hide for a single slide).
 * ============================================================ */
(function () {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
   * 1 · COUNT-UP STATS
   * ------------------------------------------------------------- */
  function initCounters() {
    const nums = Array.from(document.querySelectorAll("[data-count-to]"));
    if (!nums.length) return;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const run = (el) => {
      if (el.dataset.counted === "true") return;
      el.dataset.counted = "true";

      const target = parseInt(el.dataset.countTo, 10) || 0;
      const prefix = el.dataset.countPrefix || "";
      const render = (v) => { el.textContent = prefix + v.toLocaleString("pt-BR"); };

      if (REDUCED) { render(target); return; }

      const duration = 1600;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        render(Math.round(easeOutCubic(p) * target));
        if (p < 1) requestAnimationFrame(tick);
        else render(target);
      };
      // Start from 0 so the climb reads clearly.
      render(0);
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------
   * 2 · TESTIMONIALS SLIDER
   * ------------------------------------------------------------- */
  function initRelatos() {
    const stage = document.querySelector("[data-relatos]");
    if (!stage) return;

    const track = stage.querySelector("[data-relatos-track]");
    const slides = Array.from(stage.querySelectorAll("[data-relato]"));
    const prevBtn = stage.querySelector("[data-relatos-prev]");
    const nextBtn = stage.querySelector("[data-relatos-next]");
    const dotsWrap = stage.querySelector("[data-relatos-dots]");
    if (!track || slides.length === 0) return;

    // Single slide → no controls needed.
    if (slides.length < 2) {
      [prevBtn, nextBtn, dotsWrap].forEach((el) => el && (el.style.display = "none"));
      slides[0].classList.add("is-active");
      return;
    }

    let index = slides.findIndex((s) => s.classList.contains("is-active"));
    if (index < 0) index = 0;
    let timer = null;
    const INTERVAL = 7000;

    // Build dots.
    const dots = [];
    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "relatos__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Relato " + (i + 1));
        dot.addEventListener("click", () => { go(i); restart(); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
      dots.forEach((d, n) => {
        const on = n === index;
        d.classList.toggle("is-active", on);
        d.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    const next = () => go(index + 1);
    const prev = () => go(index - 1);

    function start() {
      if (REDUCED || timer) return;
      timer = setInterval(next, INTERVAL);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    const restart = () => { stop(); start(); };

    nextBtn && nextBtn.addEventListener("click", () => { next(); restart(); });
    prevBtn && prevBtn.addEventListener("click", () => { prev(); restart(); });

    // Pause while the visitor is reading / interacting.
    stage.addEventListener("mouseenter", stop);
    stage.addEventListener("mouseleave", start);
    stage.addEventListener("focusin", stop);
    stage.addEventListener("focusout", start);

    // Keyboard arrows when focus is within the slider.
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { next(); restart(); }
      else if (e.key === "ArrowLeft") { prev(); restart(); }
    });

    // Don't burn cycles while the tab is hidden.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else start();
    });

    // Only auto-rotate while the section is on screen.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { entry.isIntersecting ? start() : stop(); });
      }, { threshold: 0.25 });
      io.observe(stage);
    } else {
      start();
    }

    go(index);
  }

  const Enhancements = {
    init() {
      initCounters();
      initRelatos();
    },
  };

  window.Enhancements = Enhancements;
})();
