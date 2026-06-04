/**
 * Milestone · 3 Skills
 * --------------------
 * When the user activates 3 nodes in the Skill Tree, this module triggers a
 * cinematic moment that nudges the visitor to interact with Carlos' portrait:
 *
 *   1. Page-wide quake (brief vibration) + colour intensification.
 *   2. Magic chime stinger (`milestone-magic.mp3`).
 *   3. A giant glowing arrow cursor flies in from a corner of the viewport,
 *      reaches the portrait, and orbits it for ~6 seconds.
 *   4. A floating banner appears reading "Clique na foto de perfil_carlos".
 *   5. The portrait gains a pulsing halo + `is-milestone-target` flag so future
 *      events can hook into the next step (photo click).
 *
 * Persistence: only fires once per browser. Cleared by the tree reset button.
 */
(function () {
  "use strict";

  const STATE_KEY = "cv-skilltree-milestone-3-played";
  let active = false;
  let cursorEl = null;
  let bannerEl = null;
  let portraitEl = null;
  let onResize = null;
  let cleanupTimer = null;

  let milestoneAudio = null;
  function preloadAudio() {
    try {
      milestoneAudio = new Audio("src/assets/sounds/milestone-magic.mp3");
      milestoneAudio.preload = "auto";
      milestoneAudio.volume = 0.7;
    } catch {
      milestoneAudio = null;
    }
  }
  function playMilestoneSound() {
    if (!milestoneAudio) return;
    try {
      const a = milestoneAudio.cloneNode();
      a.volume = 0.7;
      a.play().catch(() => { /* autoplay can be blocked */ });
    } catch { /* ignore */ }
  }

  function getMessage() {
    if (window.I18n && typeof window.I18n.t === "function") {
      const txt = window.I18n.t("milestone.clickPhoto");
      if (txt && txt !== "milestone.clickPhoto") return txt;
    }
    return "Clique na foto de perfil_carlos";
  }

  function buildCursorSVG() {
    return `
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id="ms-cursor-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="#FFE7A0" stop-opacity="0.95"/>
            <stop offset="55%" stop-color="#E5BEAE" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#A13E1E" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="ms-cursor-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFF6DC"/>
            <stop offset="55%" stop-color="#E5BEAE"/>
            <stop offset="100%" stop-color="#A13E1E"/>
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#ms-cursor-glow)"/>
        <path d="M14 12 L14 50 L24 41 L31 56 L37 53 L30 38 L43 38 Z"
              fill="url(#ms-cursor-fill)" stroke="#1B0B05" stroke-width="2"
              stroke-linejoin="round" filter="drop-shadow(0 4px 18px rgba(229,190,174,0.65))"/>
        <path d="M14 12 L14 50 L24 41 L31 56 L37 53 L30 38 L43 38 Z"
              fill="none" stroke="#FFF6DC" stroke-width="0.6" stroke-linejoin="round" opacity="0.85"/>
      </svg>`;
  }

  function ensureElements() {
    if (!cursorEl) {
      cursorEl = document.createElement("div");
      cursorEl.className = "milestone-cursor";
      cursorEl.setAttribute("aria-hidden", "true");
      cursorEl.innerHTML = buildCursorSVG();
      document.body.appendChild(cursorEl);
    }
    if (!bannerEl) {
      bannerEl = document.createElement("div");
      bannerEl.className = "milestone-banner";
      bannerEl.setAttribute("role", "status");
      bannerEl.innerHTML = `
        <span class="milestone-banner__sigil" aria-hidden="true">✦</span>
        <span class="milestone-banner__text">${getMessage()}</span>
        <span class="milestone-banner__sigil" aria-hidden="true">✦</span>`;
      document.body.appendChild(bannerEl);
    }
  }

  function getPortraitCenter() {
    if (!portraitEl) portraitEl = document.querySelector(".hero__portrait");
    if (!portraitEl) return null;
    const rect = portraitEl.getBoundingClientRect();
    return {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      radius: Math.max(rect.width, rect.height) / 2 + 32,
      rect,
    };
  }

  function placeBannerNearPortrait(info) {
    if (!bannerEl || !info) return;
    bannerEl.style.left = `${info.cx}px`;
    const top = Math.max(24, info.rect.top - 70);
    bannerEl.style.top = `${top}px`;
  }

  function startCursorJourney() {
    if (!cursorEl) return;
    const info = getPortraitCenter();
    if (!info) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const startX = w * 0.08;
    const startY = h * 0.86;

    cursorEl.style.setProperty("--ms-orbit-radius", `${info.radius}px`);
    cursorEl.style.left = `${info.cx}px`;
    cursorEl.style.top = `${info.cy}px`;

    cursorEl.classList.remove("is-orbiting", "is-arrived");
    cursorEl.classList.add("is-traveling");
    cursorEl.style.setProperty("--ms-x", `${startX - info.cx}px`);
    cursorEl.style.setProperty("--ms-y", `${startY - info.cy}px`);
    cursorEl.style.setProperty("--ms-scale", "0.4");
    cursorEl.style.setProperty("--ms-opacity", "0");

    requestAnimationFrame(() => {
      cursorEl.style.setProperty("--ms-x", `${info.radius}px`);
      cursorEl.style.setProperty("--ms-y", "0px");
      cursorEl.style.setProperty("--ms-scale", "1");
      cursorEl.style.setProperty("--ms-opacity", "1");
    });

    setTimeout(() => {
      cursorEl.classList.remove("is-traveling");
      cursorEl.classList.add("is-orbiting", "is-arrived");
    }, 1500);
  }

  function pulsePortrait() {
    if (!portraitEl) portraitEl = document.querySelector(".hero__portrait");
    if (!portraitEl) return;
    portraitEl.classList.add("is-milestone-target");
    portraitEl.setAttribute("data-milestone-step", "photo");

    const onClick = (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("cv-milestone-photo-clicked"));
      portraitEl.classList.remove("is-milestone-target");
      cleanup();
    };
    portraitEl.addEventListener("click", onClick, { once: true });
    portraitEl.style.cursor = "pointer";
  }

  function quakeAndCelebrate() {
    document.body.classList.add("is-milestone-quaking", "is-milestone-celebrate");
    setTimeout(() => document.body.classList.remove("is-milestone-quaking"), 700);
    setTimeout(() => document.body.classList.remove("is-milestone-celebrate"), 1800);
  }

  function cleanup() {
    if (cursorEl) {
      cursorEl.classList.add("is-fading");
      setTimeout(() => { cursorEl?.remove(); cursorEl = null; }, 700);
    }
    if (bannerEl) {
      bannerEl.classList.add("is-fading");
      setTimeout(() => { bannerEl?.remove(); bannerEl = null; }, 700);
    }
    if (onResize) {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      onResize = null;
    }
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }
    active = false;
  }

  function fire() {
    if (active) return;
    active = true;
    try { sessionStorage.setItem(STATE_KEY, "1"); } catch { /* ignore */ }

    portraitEl = document.querySelector(".hero__portrait");
    quakeAndCelebrate();
    playMilestoneSound();

    ensureElements();
    const info = getPortraitCenter();
    if (info) placeBannerNearPortrait(info);
    requestAnimationFrame(() => bannerEl?.classList.add("is-shown"));

    startCursorJourney();
    setTimeout(pulsePortrait, 1400);

    onResize = () => {
      const updated = getPortraitCenter();
      if (!updated) return;
      placeBannerNearPortrait(updated);
      if (cursorEl) {
        cursorEl.style.left = `${updated.cx}px`;
        cursorEl.style.top = `${updated.cy}px`;
        cursorEl.style.setProperty("--ms-orbit-radius", `${updated.radius}px`);
        if (cursorEl.classList.contains("is-orbiting")) {
          cursorEl.style.setProperty("--ms-x", `${updated.radius}px`);
          cursorEl.style.setProperty("--ms-y", "0px");
        }
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    cleanupTimer = setTimeout(() => {
      if (!portraitEl?.classList.contains("is-milestone-target")) return;
      cleanup();
    }, 14000);
  }

  function init() {
    preloadAudio();
    window.addEventListener("cv-milestone-8skills", fire);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.Milestone = { fire, cleanup };
})();
