/**
 * Main bootstrap
 */
document.addEventListener("DOMContentLoaded", () => {
  I18n.init();
  Effects.init();
  SkillTree.init();
  Craft.init();
  /* Narrative MUST init after Craft + SkillTree are mounted so the
     scroll handler has #knowledge ready to measure. It's deliberately
     last in the visual stack because its only job is to translate
     scroll position into CSS variables — every other module owns its
     own visuals. */
  Narrative.init();
  /* NarrativeParticles paints the single thread of "energy" that
     ties every act together. It listens to data-narrative-act on
     <html> (which Narrative.init sets), so it MUST start AFTER
     Narrative so the initial mode lands on the correct act. */
  if (window.NarrativeParticles) NarrativeParticles.init();
  Crystals.init();
  Portal.init();
  Merlin.init();
  Codex.init();
  if (window.Convergence) Convergence.init();
  if (window.Enhancements) Enhancements.init();
  initAudio();
  initAmbience();
  initTheme();
  initSmoothAnchors();
});

/* ------------------------------------------------------------------
 *  AMBIENT SOUNDTRACK · controller (no autoplay)
 * ------------------------------------------------------------------
 *  Wraps the looped <audio id="ambient-track"> ( "In Search of the
 *  Philosopher's Stone", .ogg + .mp3 ) in a tiny shared controller
 *  exposed on `window.AmbientAudio`. Both the legacy nav tool button
 *  and the new "Cristal da Ambiência" (initAmbience) consume it, so
 *  the play/pause/volume state always stays in sync.
 *
 *  Product direction (June 2026): the track NEVER auto-starts. The
 *  visitor must awaken it deliberately (the Ambience Crystal). We only
 *  persist the chosen VOLUME as a preference; playback always begins
 *  from an explicit user action. Volume is intentionally low (0.18).
 * ----------------------------------------------------------------- */
function initAudio() {
  const audio = document.getElementById("ambient-track");
  if (!audio) return;

  const VOL_KEY      = "cv-audio-vol";   // "0".."1"
  const DEFAULT_VOL  = 0.18;
  const FADE_MS      = 1200;
  const FADE_STEP_MS = 60;

  audio.loop   = true;
  audio.volume = 0;

  let targetVol = DEFAULT_VOL;
  try {
    const v = parseFloat(localStorage.getItem(VOL_KEY));
    if (!Number.isNaN(v) && v >= 0 && v <= 1) targetVol = v;
  } catch { /* ignore */ }

  // Explicit intent flag — the source of truth for the UI. Volume is
  // faded asynchronously, so checking audio.volume directly would race
  // with the fade; the flag flips synchronously on play()/stop().
  let wantPlaying = false;

  const subscribers = new Set();
  function notify() {
    subscribers.forEach((fn) => { try { fn(wantPlaying); } catch { /* ignore */ } });
  }

  let fadeTimer = null;
  function clearFade() {
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
  }
  function fadeTo(target, onDone) {
    clearFade();
    const startVol = audio.volume;
    const steps    = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS));
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      const t = i / steps;
      audio.volume = Math.max(0, Math.min(1, startVol + (target - startVol) * t));
      if (i >= steps) {
        clearFade();
        if (onDone) onDone();
      }
    }, FADE_STEP_MS);
  }

  const AmbientAudio = {
    /** Intended playing state (drives all UI). */
    isPlaying() { return wantPlaying; },
    /** Begin (or resume) playback with a soft fade-in. Returns a Promise. */
    play() {
      wantPlaying = true;
      notify();
      audio.muted = false;
      const p = audio.play();
      const onStarted = () => { fadeTo(targetVol); };
      if (p && typeof p.then === "function") {
        return p.then(onStarted).catch((err) => {
          // Could not start (rare without a gesture) — revert UI.
          wantPlaying = false;
          notify();
          throw err;
        });
      }
      onStarted();
      return Promise.resolve();
    },
    /** Fade out, then pause. */
    stop() {
      wantPlaying = false;
      notify();
      fadeTo(0, () => { try { audio.pause(); } catch { /* ignore */ } });
    },
    toggle() {
      if (wantPlaying) { this.stop(); return Promise.resolve(); }
      return this.play();
    },
    getVolume() { return targetVol; },
    setVolume(v) {
      targetVol = Math.max(0, Math.min(1, Number(v) || 0));
      try { localStorage.setItem(VOL_KEY, String(targetVol)); } catch { /* ignore */ }
      // Apply live while playing (skip the fade so the slider feels direct).
      if (wantPlaying && !audio.muted) { clearFade(); audio.volume = targetVol; }
    },
    /** Subscribe to play/pause changes. Returns an unsubscribe fn. */
    onChange(fn) {
      if (typeof fn === "function") subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
  window.AmbientAudio = AmbientAudio;

  /* Legacy nav tool button — kept as a secondary control, in sync. */
  const navBtn = document.getElementById("audio-toggle");
  if (navBtn) {
    const syncNav = (playing) => {
      navBtn.setAttribute("aria-pressed", playing ? "true" : "false");
      navBtn.classList.toggle("is-playing", playing);
      navBtn.setAttribute(
        "aria-label",
        playing ? "Silenciar música ambiente" : "Ativar música ambiente"
      );
    };
    navBtn.addEventListener("click", () => AmbientAudio.toggle());
    AmbientAudio.onChange(syncNav);
    syncNav(false);
  }

  /* No autoplay: the cosmos stays silent until the visitor awakens the
     Ambience Crystal (or clicks the nav tool). */
}

/* ------------------------------------------------------------------
 *  CRISTAL DA AMBIÊNCIA · a tiny hidden relic that awakens the score
 * ------------------------------------------------------------------
 *  A ~34px runic crystal anchored bottom-left. Dormant by default
 *  (faint, slow pulse). Clicking it awakens the ambient track AND
 *  unfurls a small grimoire panel ("Trilha do Reino") with a
 *  play/pause action and a hidden-until-needed volume control.
 *  Consumes window.AmbientAudio so it stays in sync with the nav tool.
 * ----------------------------------------------------------------- */
function initAmbience() {
  const root = document.getElementById("ambience");
  const api  = window.AmbientAudio;
  if (!root || !api) return;

  const crystal     = document.getElementById("ambience-crystal");
  const panel       = document.getElementById("ambience-panel");
  const actionBtn   = document.getElementById("ambience-toggle");
  const actionRune  = actionBtn ? actionBtn.querySelector(".ambience__action-rune") : null;
  const actionLabel = actionBtn ? actionBtn.querySelector(".ambience__action-label") : null;
  const volume      = document.getElementById("ambience-volume");

  const t = (key, fallback) => {
    try {
      if (window.I18n && typeof I18n.t === "function") {
        const v = I18n.t(key);
        if (v && v !== key) return v;
      }
    } catch { /* ignore */ }
    return fallback;
  };

  if (volume) volume.value = String(Math.round(api.getVolume() * 100));

  function reflect(playing) {
    root.classList.toggle("is-awake", playing);
    if (crystal) crystal.setAttribute("aria-pressed", playing ? "true" : "false");
    if (actionRune)  actionRune.textContent  = playing ? "❚❚" : "▶";
    if (actionLabel) actionLabel.textContent = playing
      ? t("ambience.pause", "Pausar")
      : t("ambience.play", "Iniciar Música");
  }
  api.onChange(reflect);

  function openPanel() {
    if (panel) panel.hidden = false;
    root.classList.add("is-open");
    if (crystal) crystal.setAttribute("aria-expanded", "true");
  }
  function closePanel() {
    if (panel) panel.hidden = true;
    root.classList.remove("is-open");
    if (crystal) crystal.setAttribute("aria-expanded", "false");
  }

  /* Clicking the crystal unfurls the grimoire. On first awakening it
     also starts the ambience (the relic "comes alive"); clicking it
     again simply furls the panel — the music keeps flowing. */
  if (crystal) {
    crystal.addEventListener("click", (e) => {
      e.stopPropagation();
      if (root.classList.contains("is-open")) {
        closePanel();
        return;
      }
      openPanel();
      if (!api.isPlaying()) {
        api.play().catch(() => { /* rejected before gesture — rare */ });
      }
    });
  }

  if (actionBtn) {
    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      api.toggle();
    });
  }

  if (volume) {
    volume.addEventListener("input", () => {
      api.setVolume((Number(volume.value) || 0) / 100);
    });
    // Keep the slider in sync if volume changes elsewhere.
    api.onChange(() => {
      const pct = String(Math.round(api.getVolume() * 100));
      if (volume.value !== pct) volume.value = pct;
    });
  }

  // Dismiss the panel on outside click / Escape (music is unaffected).
  document.addEventListener("click", (e) => {
    if (root.classList.contains("is-open") && !root.contains(e.target)) closePanel();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-open")) closePanel();
  });

  // Re-translate labels when the language changes.
  window.addEventListener("langchange", () => reflect(api.isPlaying()));

  reflect(api.isPlaying());
}

/* ------------------------------------------------------------------
 *  THEME TOGGLE · Vesper (dark) ↔ Solis (light)
 * ------------------------------------------------------------------ */
function initTheme() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const root = document.documentElement;
  const STORAGE_KEY = "cv-theme";

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    root.dataset.theme = saved;
  }
  syncButton();

  btn.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    syncButton();
  });

  function syncButton() {
    const theme = root.dataset.theme || "dark";
    const isLight = theme === "light";
    btn.setAttribute("aria-pressed", isLight ? "true" : "false");
    btn.dataset.theme = theme;
    btn.setAttribute(
      "aria-label",
      isLight
        ? "Mudar para Vesper (modo escuro)"
        : "Mudar para Solis (modo claro)"
    );
  }
}

function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
