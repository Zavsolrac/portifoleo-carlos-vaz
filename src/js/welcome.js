/* ============================================================
   ARCANE WELCOME · first-visit onboarding overlay controller

   Responsibilities:
   - Show #arcane-welcome ONLY on the first visit (persisted in
     localStorage), then remove it from the DOM forever.
   - Drive the 3-phase timeline: materialize → idle → dissolve.
   - Trigger a single Arcane Core pulse on .hero__portrait when
     the last line has dissolved.
   - Respect prefers-reduced-motion (shorter, simpler timings).
   - Never block the page: the overlay is pointer-events:none in
     CSS, and we do not attach any blocking listeners.

   Timeline (defaults):
     materialize ............. 2.0s   (char-by-char + dragon's breath)
     idle / read ............. 9.0s
     dissolve (char by char) . 3.0s   (bottom-up, left→right within line)
     -----------------------------
     total visible ........... ~14s
   ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "cv:arcane-welcome:seen:v1";

  /** Returns a working Storage, or null if unavailable (private mode, etc.). */
  function safeLocalStorage() {
    try {
      const k = "__cv_welcome_probe__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return window.localStorage;
    } catch (_e) {
      return null;
    }
  }

  /** Touch / narrow viewports — per-char lava CSS costs ~2 FPS on device. */
  function isMobileWelcome() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      window.matchMedia("(max-width: 767px)").matches;
  }

  /** Phase durations tuned for the active motion preference. */
  function getTimings() {
    const reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      return { materialize: 250, idle: 7500, dissolve: 600 };
    }
    if (isMobileWelcome()) {
      return { materialize: 450, idle: 3200, dissolve: 700 };
    }
    // Bumped to 2s to comfortably cover the char-by-char cascade
    // (last char of the title finishes ~1.85s in).
    return { materialize: 2000, idle: 9000, dissolve: 3000 };
  }

  /** Split each .welcome__line into individual .welcome__char spans
   *  so the entrance and exit animations can stagger one character
   *  at a time. The h2 title contains decorative <span class="welcome__star">
   *  bookends around a <span class="welcome__title-text"> — for the
   *  title we ONLY split the inner title-text, leaving the stars
   *  intact (they animate alongside the chars).
   *
   *  We set CSS variables on each char span:
   *    --ci  the character's 0-based index within its line
   *  The line-level --line-delay and --leave-delay variables defined
   *  in CSS are inherited and combined via calc() in animation-delay.
   *
   *  For accessibility we set the original text as aria-label on the
   *  split container so screen readers announce the whole sentence
   *  instead of letter-by-letter. */
  function splitLinesIntoChars(rootEl) {
    if (!rootEl) return;
    const lines = rootEl.querySelectorAll(".welcome__line");
    lines.forEach((line) => {
      const titleText = line.querySelector(".welcome__title-text");
      const target = titleText || line;

      // Already split? bail out.
      if (target.querySelector(".welcome__char")) return;

      const text = (target.textContent || "").trim();
      if (!text) return;

      target.setAttribute("aria-label", text);
      target.textContent = "";

      // Each character is an inline-block span (needed for the per-letter
      // transform cascade). Inline-block boxes create a soft-wrap
      // opportunity between every pair, which let a line break in the
      // MIDDLE of a word (e.g. "C" + "onhecimento"). To prevent that we
      // group the letters of each word inside a `.welcome__word` wrapper
      // (white-space:nowrap), and keep the spaces OUTSIDE the wrappers as
      // the only legal break points. The global --ci index is preserved
      // across words so the entrance/exit cascade stays continuous.
      const chars = Array.from(text);
      let word = null;
      chars.forEach((ch, idx) => {
        if (ch === " ") {
          word = null; // close the current word → break opportunity here
          const space = document.createElement("span");
          space.className = "welcome__char welcome__char--space";
          space.setAttribute("aria-hidden", "true");
          space.textContent = "\u00A0";
          space.style.setProperty("--ci", String(idx));
          target.appendChild(space);
          return;
        }
        if (!word) {
          word = document.createElement("span");
          word.className = "welcome__word";
          word.setAttribute("aria-hidden", "true");
          target.appendChild(word);
        }
        const span = document.createElement("span");
        span.className = "welcome__char";
        span.setAttribute("aria-hidden", "true");
        span.textContent = ch;
        span.style.setProperty("--ci", String(idx));
        word.appendChild(span);
      });

      // Pass the character count up so any sibling decorations
      // (e.g. the title's closing star) can offset themselves
      // after the last char.
      line.style.setProperty("--char-count", String(chars.length));
    });
  }

  /** True when the page is being viewed in a local dev environment
   *  (localhost, 127.0.0.1, .local, *.test, *.localhost, or opened
   *  directly via file://). In this mode we ignore the "seen" flag
   *  so the developer always sees the welcome on every reload while
   *  iterating. On a real production domain the first-visit-only
   *  behaviour is preserved. */
  function isLocalDev() {
    try {
      const proto = window.location.protocol;
      if (proto === "file:") return true;
      const host = (window.location.hostname || "").toLowerCase();
      if (!host) return true;
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
      if (host.endsWith(".localhost")) return true;
      if (host.endsWith(".local")) return true;
      if (host.endsWith(".test")) return true;
      return false;
    } catch (_e) {
      return false;
    }
  }

  /** URL / hash hooks for developers and QA:
   *    ?welcome=show   → ignore storage, force-show
   *    ?welcome=reset  → clear the storage flag, then show
   *    #arcane-welcome → same as ?welcome=show
   */
  function readURLIntent() {
    try {
      const params = new URLSearchParams(window.location.search);
      const w = (params.get("welcome") || "").toLowerCase();
      const hash = (window.location.hash || "").toLowerCase();
      if (w === "show" || w === "force" || w === "1") return "force";
      if (w === "reset" || w === "clear") return "reset";
      if (hash === "#arcane-welcome" || hash === "#welcome") return "force";
    } catch (_e) { /* ignore */ }
    return null;
  }

  /** Fire one short pulse on the existing .hero__portrait-glow. The
      CSS class auto-finishes the animation; we strip the class after
      its lifetime so it can be retriggered if ever needed. */
  function pulseArcaneCore() {
    const portrait = document.querySelector(".hero__portrait");
    if (!portrait) return;
    portrait.classList.remove("is-welcome-pulse");
    // force reflow so the animation restarts cleanly
    /* eslint-disable-next-line no-unused-expressions */
    portrait.offsetWidth;
    portrait.classList.add("is-welcome-pulse");
    window.setTimeout(() => {
      portrait.classList.remove("is-welcome-pulse");
    }, 1700);
  }

  /** Ensure a fresh #arcane-welcome node exists in the DOM. If the
      original was already removed (returning visitor), this lets a
      forced replay still work by cloning the template element kept
      in the cache. We snapshot the original on first sight. */
  let templateCache = null;
  function getOrRestoreElement() {
    let el = document.getElementById("arcane-welcome");
    if (el) {
      if (!templateCache) templateCache = el.cloneNode(true);
      return el;
    }
    if (templateCache) {
      const clone = templateCache.cloneNode(true);
      clone.classList.remove("is-active", "is-leaving", "is-done", "welcome--mobile-lite");
      clone.setAttribute("aria-hidden", "true");
      document.body.appendChild(clone);
      return clone;
    }
    return null;
  }

  /** Run the full welcome sequence. Returns true when started. */
  function play({ persist = true } = {}) {
    const el = getOrRestoreElement();
    if (!el) return false;

    // Mobile: line-level fade only — ~80 `background-clip:text` spans
    // each repainting every frame was the proven ~2 FPS bottleneck.
    const mobileLite = isMobileWelcome();
    if (mobileLite) {
      el.classList.add("welcome--mobile-lite");
    } else {
      splitLinesIntoChars(el);
    }

    const store = safeLocalStorage();
    const t = getTimings();

    // Begin materialization on the next paint frame so the
    // opacity transition is observed by the browser.
    // The body flag lets CSS suspend the full-viewport canvas
    // wallpaper while the overlay is up — :has() isn't relied upon.
    document.body.classList.add("cv-welcome-active");
    requestAnimationFrame(() => {
      el.setAttribute("aria-hidden", "false");
      el.classList.add("is-active");
    });

    const tStartDissolve = t.materialize + t.idle;

    window.setTimeout(() => {
      el.classList.add("is-leaving");
    }, tStartDissolve);

    // Cue the Arcane Core awakening once the veil is MOSTLY lifted (near
    // the end of the dissolve) so the cosmos wakes on an almost-clear
    // screen — "o universo desperta em silêncio". Firing it this late
    // (rather than at the start of the dissolve) means the core pulse and
    // the wave of light are clearly witnessed instead of hiding behind
    // the veil. The skill-tree holds its dormant seed until this event.
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cv-welcome-awaken"));
    }, tStartDissolve + Math.max(0, t.dissolve - 150));

    window.setTimeout(() => {
      pulseArcaneCore();
    }, tStartDissolve + t.dissolve - 80);

    window.setTimeout(() => {
      el.classList.add("is-done");
      document.body.classList.remove("cv-welcome-active");
      if (persist && store) {
        try { store.setItem(STORAGE_KEY, "1"); } catch (_e) { /* ignore */ }
      }
      window.setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 900);
    }, tStartDissolve + t.dissolve + 200);

    return true;
  }

  function init() {
    const store = safeLocalStorage();
    const el = document.getElementById("arcane-welcome");
    if (!el) return;
    templateCache = el.cloneNode(true);

    const intent = readURLIntent();

    // Mobile (touch / narrow viewports): the welcome cinematic is
    // disabled entirely. The per-letter lava text + full-viewport veil
    // over the fixed canvases tanked the first-impression framerate on
    // phones, so the visitor now lands straight on the page. A forced
    // ?welcome=show still works for QA on any device.
    const isMobile = (window.matchMedia &&
      (window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
        window.matchMedia("(max-width: 767px)").matches));
    if (isMobile && intent !== "force") {
      el.parentNode && el.parentNode.removeChild(el);
      document.body.classList.remove("cv-welcome-active");
      return;
    }

    if (intent === "reset" && store) {
      try { store.removeItem(STORAGE_KEY); } catch (_e) { /* ignore */ }
    }

    // Product direction (June 2026): the welcome message and the Arcane
    // Core awakening now play on EVERY visit AND every page refresh — not
    // just the first time. We therefore no longer skip returning visitors
    // and no longer persist a "seen" flag (persist:false). The localStorage
    // helpers stay only for the ArcaneWelcome.reset()/isSeen() dev API.
    if (window.console && console.info) {
      console.info(
        "%c✦ Arcane Welcome",
        "color:#FFD089;font-weight:600;letter-spacing:0.08em",
        "(plays on every load)"
      );
      console.info(
        "%c   Replay anytime:",
        "color:#C9986A",
        "ArcaneWelcome.show()  ·  ?welcome=show"
      );
    }

    play({ persist: false });
  }

  /** Public dev/test API on the global scope.
      Use `ArcaneWelcome.show()` in the console to replay anytime,
      `ArcaneWelcome.reset()` to clear the seen-flag. */
  window.ArcaneWelcome = {
    show() {
      // Tear down any in-flight overlay first.
      const existing = document.getElementById("arcane-welcome");
      if (existing) existing.remove();
      return play({ persist: false });
    },
    reset() {
      const store = safeLocalStorage();
      if (!store) return false;
      try { store.removeItem(STORAGE_KEY); return true; }
      catch (_e) { return false; }
    },
    isSeen() {
      const store = safeLocalStorage();
      return !!(store && store.getItem(STORAGE_KEY));
    }
  };

  if (document.readyState === "loading") {
    // Defer past main.js's DOMContentLoaded handler so I18n.init() has
    // already swapped any data-i18n text by the time we materialize.
    document.addEventListener("DOMContentLoaded", () => {
      window.setTimeout(init, 0);
    }, { once: true });
  } else {
    window.setTimeout(init, 0);
  }
})();
