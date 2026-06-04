/**
 * Narrative · Five-Act scroll progression
 * ─────────────────────────────────────────────────────────────────
 * The portfolio is staged as a five-act journey instead of dumping
 * every layer on the visitor at once. Each act corresponds to a
 * concrete page section and earns a one-shot entry animation when
 * the visitor crosses into it. Scrolling back up resets the flag
 * so the animation can replay on re-entry.
 *
 *   I   · O UNIVERSO              → <section class="hero" id="hero">
 *   II  · A CONVERGÊNCIA          → <section id="knowledge">
 *   III · CRISTAIS DE MEMÓRIA     → <section id="memories">
 *   IV  · O CODEX DOS OFÍCIOS     → <section id="contracts">
 *   V   · O PORTAL                → <section id="portal">
 *
 *  Mechanisms
 *  ──────────
 *   ─ ACT SWITCHING (discrete) ───────────────────────────────
 *     An IntersectionObserver watches every chapter section.
 *     A section "claims" the active act when its center band
 *     crosses the middle 20% of the viewport. We track every
 *     section's intersection ratio and pick the one with the
 *     largest visible area; ties go to the lowest-index act so
 *     the chapter strip animates monotonically downward.
 *
 *     The result lives at <html data-narrative-act="1..5"> and
 *     drives the chapter spine in the corner of the viewport.
 *
 *   ─ ONE-SHOT ENTRY ANIMATIONS ──────────────────────────────
 *     On the rising edge of a section becoming active, we set
 *     [data-narrative-entered] on THAT SECTION element. CSS
 *     keyframes hooked to that attribute run their per-act
 *     animation (portrait burst, crystal pulse, gravitational
 *     wave, book opening, portal awakening). When the section
 *     fully leaves the viewport we drop the attribute so the
 *     animation can re-trigger on the next visit.
 *
 *   ─ SCROLL VARIABLES (continuous) ──────────────────────────
 *     Independently of the act switching, the same controller
 *     still maps the visitor's scroll position through
 *     #knowledge onto three CSS variables on <html>:
 *
 *        --narrative-progress : 0..1 raw progress through knowledge
 *        --craft-reveal       : 0..1 eased constellation reveal
 *        --tree-wall-dim      : 0..0.55 wallpaper retreat factor
 *
 *     These keep powering the constellation materialization and
 *     the live wallpaper recede that we already had — none of
 *     that visual logic moved.
 *
 *  Accessibility
 *  ─────────────
 *     Honors prefers-reduced-motion at the CSS layer; this file
 *     just sets attributes, the CSS chooses whether to animate.
 */
window.Narrative = (() => {
  /* Ordered map of acts to section ids. The order matters because
     ties in intersection ratio resolve to the lower-index entry. */
  const ACTS = [
    { id: "hero",      act: "1" },
    { id: "knowledge", act: "2" },
    { id: "memories",  act: "3" },
    { id: "contracts", act: "4" },
    { id: "portal",    act: "5" },
  ];

  let root;
  let sections = [];        // { el, act }
  let knowledge = null;     // shortcut for scroll-var section
  let rafId = null;
  let lastProgress = -1;
  let lastAct = null;
  let intersection = new Map(); // section element → current ratio

  function init() {
    root = document.documentElement;

    sections = ACTS
      .map(({ id, act }) => ({ el: document.getElementById(id), act }))
      .filter((s) => s.el);

    if (!sections.length) return;
    knowledge = (sections.find((s) => s.act === "2") || {}).el || null;

    /* Initial seed for the CSS variable handshake. Without these
       the first paint would have empty vars and our calc() chains
       in style.css would fall back to 0 ungracefully. */
    root.style.setProperty("--narrative-progress", "0");
    root.style.setProperty("--craft-reveal",       "0");
    root.style.setProperty("--tree-wall-dim",      "0");
    setAct("1");

    setupActObserver();
    setupEnterObserver();

    measureScroll();
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate, { passive: true });
    window.addEventListener("pageshow", requestScrollUpdate);
  }

  /* ── ACT SWITCHING ────────────────────────────────────────────
     A single IntersectionObserver with a 20% middle band: an
     entry's intersectionRatio reports how much of the section
     overlaps that band. The winning section becomes the active
     act. We pick the WINNER (not the first-passing one) so the
     transition feels smooth at the boundary between sections of
     wildly different heights. */
  function setupActObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersection.set(entry.target, entry.intersectionRatio);
        }
        let winner = null;
        let bestRatio = 0;
        for (const { el, act } of sections) {
          const ratio = intersection.get(el) || 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            winner = act;
          }
        }
        if (!winner) {
          /* Below all sections (footer) — pin to last act so the
             chapter strip doesn't blink back to "I". */
          const lastVisible = [...sections].reverse().find(
            (s) => (intersection.get(s.el) || 0) > 0
          );
          winner = lastVisible ? lastVisible.act : lastAct || "1";
        }
        if (winner !== lastAct) {
          lastAct = winner;
          setAct(winner);
        }
      },
      {
        /* The middle band: a section "claims" the act when it
           overlaps the central 20% of the viewport. */
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.01, 0.25, 0.5, 0.75, 1],
      }
    );
    for (const { el } of sections) observer.observe(el);
  }

  /* ── ONE-SHOT ENTRY ANIMATIONS ────────────────────────────────
     A second observer with a wider band: as soon as ANY part of
     a section enters the viewport we flag it with
     [data-narrative-entered] so its CSS animations begin. We
     remove the flag once the section has fully exited the
     viewport (intersectionRatio = 0) so the animations replay if
     the visitor scrolls back into it later. */
  function setupEnterObserver() {
    /* When the visitor lands on the page for the first time, the
       Arcane Welcome overlay covers the hero for a few seconds.
       Firing the act-I entry animation while welcome is on screen
       wastes the moment — the user can't see it through the veil.
       So for #hero specifically we defer the flag until welcome
       has dissolved. Every OTHER section flags as usual. */
    const welcome = document.getElementById("arcane-welcome");
    const isWelcomeBlockingHero = () =>
      welcome &&
      !welcome.classList.contains("is-done") &&
      !welcome.classList.contains("is-leaving");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target;
          const isHero = el.id === "hero";

          if (entry.isIntersecting && entry.intersectionRatio > 0.12) {
            if (isHero && isWelcomeBlockingHero()) {
              /* Defer: wait until welcome marks itself .is-done or
                 .is-leaving, then flag the hero. We listen to the
                 single class mutation and disconnect after firing. */
              waitForWelcomeAndFlag(el);
              continue;
            }
            /* Already flagged? Skip — the animation is running.
               This guard avoids restarting in the middle of a
               long section during scroll micro-jitters. */
            if (el.dataset.narrativeEntered === "true") continue;
            flagEntered(el);
          } else if (!entry.isIntersecting) {
            el.removeAttribute("data-narrative-entered");
          }
        }
      },
      { threshold: [0, 0.12, 0.5] }
    );
    for (const { el } of sections) observer.observe(el);
  }

  /* Marks a section as entered. Two-step (remove → reflow → set)
     so the keyframe restarts cleanly even if the attribute
     happened to linger from a prior cycle. */
  function flagEntered(el) {
    el.removeAttribute("data-narrative-entered");
    // eslint-disable-next-line no-unused-expressions
    void el.offsetWidth;
    el.dataset.narrativeEntered = "true";
  }

  /* Wait for the welcome overlay to start dissolving before
     firing the hero's act-I entry. MutationObserver gives us a
     single fire path without polling. */
  function waitForWelcomeAndFlag(heroEl) {
    const welcome = document.getElementById("arcane-welcome");
    if (!welcome) { flagEntered(heroEl); return; }
    if (welcome.classList.contains("is-done") ||
        welcome.classList.contains("is-leaving")) {
      flagEntered(heroEl);
      return;
    }
    const mo = new MutationObserver(() => {
      if (welcome.classList.contains("is-done") ||
          welcome.classList.contains("is-leaving")) {
        mo.disconnect();
        /* A short tick so the welcome veil starts fading before
           we light up the name underneath. */
        setTimeout(() => flagEntered(heroEl), 120);
      }
    });
    mo.observe(welcome, { attributes: true, attributeFilter: ["class"] });
  }

  function setAct(act) {
    root.dataset.narrativeAct = act;
  }

  /* ── SCROLL VARIABLES ────────────────────────────────────────
     Identical to the previous implementation — the constellation
     reveal and the wallpaper recede are continuous effects driven
     by the user's progress through #knowledge specifically. */
  function requestScrollUpdate() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      measureScroll();
    });
  }
  function measureScroll() {
    if (!knowledge) return;
    const rect = knowledge.getBoundingClientRect();
    const vh   = window.innerHeight || document.documentElement.clientHeight || 1;
    const total = rect.height + vh;
    const traveled = vh - rect.top;
    const progress = clamp01(traveled / total);

    if (Math.abs(progress - lastProgress) < 0.0015) return;
    lastProgress = progress;

    root.style.setProperty("--narrative-progress", progress.toFixed(4));
    const reveal = clamp01(remap(progress, 0.08, 0.42, 0, 1));
    root.style.setProperty("--craft-reveal", easeOutCubic(reveal).toFixed(4));
    const rawDim = clamp01(remap(progress, 0.15, 0.65, 0, 1));
    const dim    = easeInOutCubic(rawDim) * 0.55;
    root.style.setProperty("--tree-wall-dim", dim.toFixed(4));
  }

  /* ── helpers ─────────────────────────────────────────────────── */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function remap(v, inMin, inMax, outMin, outMax) {
    if (inMax === inMin) return outMin;
    return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
  }
  function easeOutCubic(t)   { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  return { init };
})();
