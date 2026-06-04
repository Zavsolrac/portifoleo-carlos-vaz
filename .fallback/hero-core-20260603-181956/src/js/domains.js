/* ============================================================
 * DOMÍNIOS EM EXPANSÃO · right-rail artefact controller
 * ------------------------------------------------------------
 * The panel is pure CSS (bars, sweeps and pulses all loop on
 * their own). This controller only owns the collapse behaviour:
 *   · Desktop (> 1100px) → always expanded; the rune tab is
 *     hidden via CSS, so nothing to do.
 *   · Narrow (<= 1100px) → auto-collapse into the rune tab. The
 *     visitor toggles it open/closed; tapping outside re-collapses.
 * It also keeps aria-expanded in sync for assistive tech.
 * ============================================================ */
(function () {
  "use strict";

  const root = document.getElementById("domains");
  const handle = document.getElementById("domains-handle");
  if (!root || !handle) return;

  const NARROW = window.matchMedia("(max-width: 1100px)");

  function setCollapsed(collapsed) {
    root.dataset.collapsed = collapsed ? "true" : "false";
    handle.setAttribute("aria-expanded", collapsed ? "false" : "true");
  }

  /* Sync default state to the viewport. On narrow screens the rail
     starts collapsed (discreet); on wide screens it stays open. */
  function syncToViewport() {
    setCollapsed(NARROW.matches);
  }

  handle.addEventListener("click", (e) => {
    e.stopPropagation();
    setCollapsed(root.dataset.collapsed !== "true" ? true : false);
  });

  /* Tap/click outside collapses it again — only relevant while
     narrow and currently expanded. */
  document.addEventListener("click", (e) => {
    if (!NARROW.matches) return;
    if (root.dataset.collapsed === "true") return;
    if (root.contains(e.target)) return;
    setCollapsed(true);
  });

  /* Escape collapses on narrow screens. */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && NARROW.matches && root.dataset.collapsed !== "true") {
      setCollapsed(true);
    }
  });

  /* React to breakpoint crossings. */
  if (typeof NARROW.addEventListener === "function") {
    NARROW.addEventListener("change", syncToViewport);
  } else if (typeof NARROW.addListener === "function") {
    NARROW.addListener(syncToViewport); // legacy Safari
  }

  syncToViewport();
})();
