/* eslint-disable */
/* ──────────────────────────────────────────────────────────────
 * VISUAL BOUNDARY AUDIT · temporary debug tool
 * ──────────────────────────────────────────────────────────────
 * Highlights every DOM element whose styling could be drawing a
 * rectangular UI surface — six independent "boundary sources":
 *   1. background-color (solid fills)
 *   2. backdrop-filter  (glass / blur panels)
 *   3. border           (hard rectangular frames)
 *   4. pseudo overlays  (::before / ::after with bg/border/shadow)
 *   5. box-shadow       (lifted card silhouettes)
 *   6. outline          (residual focus / debug rings)
 *
 * Each element receives an outline coloured by its highest-priority
 * matching category. A floating HUD shows live counts, a colour
 * legend, and per-category filters (keys 1–6, or click in the
 * legend). Detection results are also POSTed to the active debug
 * log so the user has runtime evidence of what was found.
 *
 * ACTIVATION
 *   • Toggle:  Alt+B
 *   • Force ON via URL:  append `?vba=1`
 *
 * REMOVAL (when done auditing)
 *   1. Remove the <script src="src/js/debug-boundary-audit.js">
 *      tag from index.html.
 *   2. Delete this file.
 *   Nothing else in the codebase depends on it.
 *
 * The module exposes a tiny API on `window.VBA`:
 *   VBA.enable()    – turn the audit on
 *   VBA.disable()   – turn the audit off, restore the page
 *   VBA.toggle()    – flip current state
 *   VBA.uninstall() – disable + delete `window.VBA` (one-shot
 *                     "remove everything" hatch for the console)
 * ────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  /* ── identifiers (kept short for inspection in DevTools) ── */
  const STYLE_ID  = "vba-style";
  const HUD_ID    = "vba-hud";
  const ATTR      = "data-vba";       /* primary (highest-priority) category */
  const ATTR_ALL  = "data-vba-all";   /* space-separated list of every category that matched */

  /* Categories in PRIORITY ORDER: the topmost match wins for the
     outline colour, but every match is recorded in data-vba-all so
     the legend counts stay accurate. */
  const CATEGORIES = [
    { key: "bg",       label: "background",      color: "#ff3d7f" },
    { key: "backdrop", label: "backdrop-filter", color: "#00d4ff" },
    { key: "border",   label: "border",          color: "#ff5252" },
    { key: "pseudo",   label: "pseudo overlay",  color: "#a5e34a" },
    { key: "shadow",   label: "box-shadow",      color: "#ffd54f" },
    { key: "outline",  label: "outline",         color: "#ff9100" },
  ];

  /* Elements we never audit (script glue, debug HUD itself,
     metadata nodes). The hero canvas is also skipped because it
     legitimately fills the viewport and would dominate every
     filter view. */
  const SKIP_TAGS = new Set([
    "HTML", "HEAD", "META", "LINK", "STYLE", "SCRIPT",
    "TITLE", "BR", "WBR", "NOSCRIPT",
  ]);

  let enabled = false;
  let installed = false;

  /* ── debug log helper (NDJSON via session ingest endpoint) ── */
  /* Wraps a single fetch; failures are swallowed so the audit
     stays usable even if the log server is offline. */
  function log(message, data) {
    fetch(
      "http://127.0.0.1:7279/ingest/89c13b11-4c60-49a0-81e3-64782c804124",
      {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bc6917" },
        body: JSON.stringify({
          sessionId: "bc6917",
          location:  "debug-boundary-audit.js",
          message,
          data,
          timestamp: Date.now(),
        }),
      }
    ).catch(() => {});
  }

  /* ── helpers ────────────────────────────────────────────── */

  /* True for `transparent`, `rgba(_,_,_,0)` and missing colours. */
  function isTransparent(value) {
    if (!value || value === "transparent") return true;
    const m = value.match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
    );
    if (m && parseFloat(m[4] != null ? m[4] : "1") === 0) return true;
    return false;
  }

  /* True if computed style draws a non-zero non-none border on any side. */
  function hasVisibleBorder(cs) {
    const sides = ["Top", "Right", "Bottom", "Left"];
    for (const s of sides) {
      const w = parseFloat(cs[`border${s}Width`]);
      const style = cs[`border${s}Style`];
      const color = cs[`border${s}Color`];
      if (w > 0 && style && style !== "none" && !isTransparent(color)) return true;
    }
    return false;
  }

  /* Per-element category detection — returns the list of matched
     keys (subset of CATEGORIES). */
  function classify(el) {
    const cs   = getComputedStyle(el);
    const hits = [];

    if (!isTransparent(cs.backgroundColor))           hits.push("bg");

    const bdf = cs.backdropFilter || cs.webkitBackdropFilter;
    if (bdf && bdf !== "none")                        hits.push("backdrop");

    if (hasVisibleBorder(cs))                         hits.push("border");

    /* ::before / ::after only count if they have visible content
       AND ALSO project a surface (background, border, shadow). A
       pseudo that's just typographic ornament (e.g. ascii arrow)
       isn't a "rectangle" so we don't flag it. */
    for (const pseudo of ["::before", "::after"]) {
      const pcs = getComputedStyle(el, pseudo);
      const content = pcs.content;
      if (!content || content === "none" || content === "normal") continue;
      const projectsSurface =
        !isTransparent(pcs.backgroundColor) ||
        (pcs.boxShadow && pcs.boxShadow !== "none") ||
        hasVisibleBorder(pcs);
      if (projectsSurface) {
        hits.push("pseudo");
        break;
      }
    }

    if (cs.boxShadow && cs.boxShadow !== "none")      hits.push("shadow");

    const ow = parseFloat(cs.outlineWidth);
    if (ow > 0 && cs.outlineStyle && cs.outlineStyle !== "none") {
      hits.push("outline");
    }

    return hits;
  }

  /* ── style injection ────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css = [
      /* All marked elements get a dashed neon outline. We use
         OUTLINE rather than border because outline is rendered
         outside the box and does not influence layout — the page
         keeps its true dimensions while audited. */
      ...CATEGORIES.map(c => `
        [${ATTR}="${c.key}"] {
          outline: 1.5px dashed ${c.color} !important;
          outline-offset: -1px !important;
        }
      `),

      /* When a category filter is active (html[data-vba-only=key]),
         hide outlines on everything else and switch the surviving
         outlines to SOLID 2px for emphasis. */
      ...CATEGORIES.map(c => `
        html[data-vba-only="${c.key}"] [${ATTR}]:not([${ATTR_ALL}~="${c.key}"]) {
          outline: none !important;
        }
        html[data-vba-only="${c.key}"] [${ATTR_ALL}~="${c.key}"] {
          outline: 2px solid ${c.color} !important;
          outline-offset: -1px !important;
        }
      `),

      /* HUD shell — `all: initial` keeps it visually isolated from
         any cascade leakage on the audited page. */
      `
        #${HUD_ID} {
          all: initial;
          position: fixed;
          top: 12px;
          right: 12px;
          z-index: 2147483646;
          font-family: ui-monospace, Menlo, Consolas, monospace;
          font-size: 11px;
          line-height: 1.4;
          color: #f4f4f4;
          background: rgba(8, 10, 14, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 8px;
          padding: 10px 12px;
          width: 240px;
          box-shadow: 0 10px 28px rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          pointer-events: auto;
        }
        #${HUD_ID} * { all: unset; display: revert; font-family: inherit; font-size: inherit; color: inherit; box-sizing: border-box; }
        #${HUD_ID} .vba-h {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
          padding-bottom: 6px; margin-bottom: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        #${HUD_ID} .vba-title {
          font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          font-size: 10px;
        }
        #${HUD_ID} .vba-close {
          cursor: pointer; padding: 2px 6px; border-radius: 4px;
          background: rgba(255,255,255,0.06);
        }
        #${HUD_ID} .vba-close:hover { background: rgba(255,255,255,0.14); }
        #${HUD_ID} .vba-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; padding: 3px 4px; border-radius: 4px;
          cursor: pointer; user-select: none;
        }
        #${HUD_ID} .vba-row:hover { background: rgba(255,255,255,0.06); }
        #${HUD_ID} .vba-row.is-active { background: rgba(255,255,255,0.14); }
        #${HUD_ID} .vba-sw {
          width: 10px; height: 10px; border-radius: 2px;
          display: inline-block; margin-right: 6px; vertical-align: -1px;
        }
        #${HUD_ID} .vba-key {
          font-size: 9px; opacity: 0.65;
          padding: 1px 4px; border-radius: 3px;
          background: rgba(255,255,255,0.08);
        }
        #${HUD_ID} .vba-count { opacity: 0.85; font-variant-numeric: tabular-nums; }
        #${HUD_ID} .vba-foot {
          margin-top: 8px; padding-top: 6px;
          border-top: 1px solid rgba(255,255,255,0.12);
          opacity: 0.7; font-size: 10px;
        }
        #${HUD_ID} .vba-btn {
          display: inline-block; margin-top: 6px;
          padding: 4px 8px; border-radius: 4px;
          background: rgba(255,255,255,0.10); cursor: pointer;
        }
        #${HUD_ID} .vba-btn:hover { background: rgba(255,255,255,0.20); }

        /* HUD itself must never be flagged or filtered by its own audit */
        #${HUD_ID}, #${HUD_ID} * { outline: none !important; }
      `,
    ].join("\n");
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function removeStyles() {
    const s = document.getElementById(STYLE_ID);
    if (s) s.remove();
  }

  /* ── HUD ────────────────────────────────────────────────── */
  function buildHud() {
    if (document.getElementById(HUD_ID)) return;
    const hud = document.createElement("div");
    hud.id = HUD_ID;
    hud.innerHTML = `
      <div class="vba-h">
        <span class="vba-title">Visual Boundary Audit</span>
        <span class="vba-close" data-vba-action="close" title="Disable (Alt+B)">×</span>
      </div>
      ${CATEGORIES.map((c, i) => `
        <div class="vba-row" data-vba-cat="${c.key}">
          <span><span class="vba-sw" style="background:${c.color}"></span>${c.label}</span>
          <span>
            <span class="vba-count" data-vba-count="${c.key}">0</span>
            <span class="vba-key">${i + 1}</span>
          </span>
        </div>
      `).join("")}
      <div class="vba-row" data-vba-cat="__all__">
        <span>all categories</span><span class="vba-key">0</span>
      </div>
      <div class="vba-foot">
        <div>Total flagged: <span id="vba-total">0</span></div>
        <span class="vba-btn" data-vba-action="rescan">Re-scan</span>
        <span class="vba-btn" data-vba-action="close">Disable</span>
      </div>
    `;
    document.body.appendChild(hud);

    hud.addEventListener("click", onHudClick);
  }

  function removeHud() {
    const h = document.getElementById(HUD_ID);
    if (h) {
      h.removeEventListener("click", onHudClick);
      h.remove();
    }
  }

  function onHudClick(e) {
    const t = e.target.closest("[data-vba-action], [data-vba-cat]");
    if (!t) return;
    if (t.dataset.vbaAction === "close")  { disable(); return; }
    if (t.dataset.vbaAction === "rescan") { scan(); return; }
    if (t.dataset.vbaCat) {
      const cat = t.dataset.vbaCat;
      setFilter(cat === "__all__" ? null : cat);
    }
  }

  /* Compact selector for log output (id > first class > tag). */
  function selectorPath(el) {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    if (typeof el.className === "string" && el.className.trim()) {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join(".");
      return `${tag}.${cls}`;
    }
    return tag;
  }

  /* ── scanning ───────────────────────────────────────────── */
  function clearMarks() {
    document
      .querySelectorAll(`[${ATTR}], [${ATTR_ALL}]`)
      .forEach(el => {
        el.removeAttribute(ATTR);
        el.removeAttribute(ATTR_ALL);
      });
  }

  function scan() {
    const t0 = performance.now();
    clearMarks();

    const counts = Object.fromEntries(CATEGORIES.map(c => [c.key, 0]));
    const offenders = [];
    let total = 0;

    const all = document.body.getElementsByTagName("*");
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (SKIP_TAGS.has(el.tagName)) continue;
      if (el.id === HUD_ID || el.closest(`#${HUD_ID}`)) continue;

      const hits = classify(el);
      if (!hits.length) continue;

      /* Priority order is the array order in CATEGORIES. */
      let primary = null;
      for (const c of CATEGORIES) {
        if (hits.includes(c.key)) { primary = c.key; break; }
      }
      el.setAttribute(ATTR, primary);
      el.setAttribute(ATTR_ALL, hits.join(" "));

      hits.forEach(k => counts[k]++);
      total++;

      const r = el.getBoundingClientRect();
      const area = Math.round(r.width * r.height);
      if (area > 400) {
        offenders.push({
          sel:     selectorPath(el),
          area,
          primary,
          hits:    hits.join(","),
          w:       Math.round(r.width),
          h:       Math.round(r.height),
        });
      }
    }

    offenders.sort((a, b) => b.area - a.area);
    const top = offenders.slice(0, 15);

    const elapsed = Math.round(performance.now() - t0);
    updateHudCounts(counts, total, elapsed);

    // #region agent log
    console.info("[VBA] scan", { total, counts, top });
    // #endregion

    log("VBA scan complete", {
      total,
      elapsedMs: elapsed,
      counts,
      domSize: all.length,
      filter: document.documentElement.getAttribute("data-vba-only") || "(none)",
      topOffenders: top,
      runId: "post-fix",
    });

    return { total, counts, elapsed };
  }

  function updateHudCounts(counts, total, elapsedMs) {
    CATEGORIES.forEach(c => {
      const el = document.querySelector(`#${HUD_ID} [data-vba-count="${c.key}"]`);
      if (el) el.textContent = String(counts[c.key]);
    });
    const t = document.querySelector("#vba-total");
    if (t) t.textContent = `${total}  (${elapsedMs}ms)`;
  }

  /* ── filter ─────────────────────────────────────────────── */
  function setFilter(key) {
    if (key === null) {
      document.documentElement.removeAttribute("data-vba-only");
    } else {
      document.documentElement.setAttribute("data-vba-only", key);
    }
    /* highlight the active row */
    const rows = document.querySelectorAll(`#${HUD_ID} .vba-row`);
    rows.forEach(r => r.classList.remove("is-active"));
    if (key) {
      const r = document.querySelector(`#${HUD_ID} [data-vba-cat="${key}"]`);
      if (r) r.classList.add("is-active");
    } else {
      const r = document.querySelector(`#${HUD_ID} [data-vba-cat="__all__"]`);
      if (r) r.classList.add("is-active");
    }
    log("VBA filter set", { filter: key || "(all)" });
  }

  /* ── lifecycle ──────────────────────────────────────────── */
  function enable() {
    if (enabled) return;
    enabled = true;
    injectStyles();
    buildHud();
    scan();
    document.documentElement.setAttribute("data-vba-on", "true");
    log("VBA enabled", { ua: navigator.userAgent });
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    setFilter(null);
    clearMarks();
    removeHud();
    removeStyles();
    document.documentElement.removeAttribute("data-vba-on");
    document.documentElement.removeAttribute("data-vba-only");
    log("VBA disabled");
  }

  function toggle() { enabled ? disable() : enable(); }

  function uninstall() {
    disable();
    window.removeEventListener("keydown", onKey);
    delete window.VBA;
    log("VBA uninstalled");
  }

  /* ── keyboard ───────────────────────────────────────────── */
  function onKey(e) {
    /* Alt+B toggles. Number keys 1-6 set category filter while
       audit is enabled, 0 clears the filter. */
    if (e.altKey && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      toggle();
      return;
    }
    if (!enabled) return;
    if (e.target && /^(input|textarea|select)$/i.test(e.target.tagName)) return;
    if (e.key >= "1" && e.key <= "6") {
      const idx = parseInt(e.key, 10) - 1;
      if (CATEGORIES[idx]) setFilter(CATEGORIES[idx].key);
    } else if (e.key === "0") {
      setFilter(null);
    }
  }

  /* ── install ────────────────────────────────────────────── */
  function install() {
    if (installed) return;
    installed = true;
    window.addEventListener("keydown", onKey, { capture: true });

    window.VBA = { enable, disable, toggle, uninstall, scan };

    /* Auto-enable when the URL carries ?vba=1 or #vba */
    if (/[?&]vba=1\b/.test(location.search) || /\bvba\b/.test(location.hash)) {
      enable();
    } else {
      /* Silent install — only the shortcut hint is logged so the
         user can see in the debug stream that the tool is armed. */
      log("VBA armed (Alt+B to enable)", {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
