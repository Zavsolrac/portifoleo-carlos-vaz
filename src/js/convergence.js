/**
 * ✦ CONVERGÊNCIAS ARCANAS ✦
 * ------------------------------------------------------------------
 * A living cosmic event in the Codex dos Contratos. Every 10 days a
 * single contract receives a temporary "blessing" — a discount reframed
 * as lore rather than a promotion. The favoured contract carries an
 * aged-gold seal, the original price struck through, the blessed value
 * highlighted, and a live countdown to the next convergence.
 *
 * Rules honoured:
 *   · Only ONE contract is favoured at a time.
 *   · The favour rotates automatically on global 10-day boundaries
 *     (anchored to a fixed cosmic EPOCH so the countdown is meaningful
 *     and consistent for everyone), continuing across reloads.
 *   · The favoured contract is chosen pseudo-randomly and never repeats
 *     the immediately previous cycle.
 *   · State persists in localStorage; the cycle survives reloads.
 *   · Honours prefers-reduced-motion (CSS strips the slow animations).
 *
 * Purely additive: if the contracts section is absent, init() no-ops.
 */
const Convergence = (() => {
  "use strict";

  const STORAGE_KEY = "cv-convergence-v1";
  const CYCLE_MS = 10 * 24 * 60 * 60 * 1000;        // 10 days
  const EPOCH = Date.UTC(2026, 0, 1, 0, 0, 0);      // cosmic anchor
  // Curated blessing tiers — premium-safe, never Black-Friday loud.
  const BLESSINGS = [15, 12, 18, 10, 20];

  const FALLBACK = {
    "conv.seal": "Convergência Arcana",
    "conv.copy": "Uma rara convergência favoreceu este contrato neste ciclo.",
    "conv.blessing": "Bênção Arcana:",
    "conv.countdown": "Próxima Convergência em",
    "conv.days": "dias", "conv.hours": "horas",
    "conv.minutes": "min", "conv.seconds": "seg",
  };

  let contracts = [];   // [{ el, key, book, rightPage, priceCell, eur, brl, custom }]
  let eligible = [];    // indices into `contracts` that can be blessed
  let state = null;     // { cycle, favoredKey, prevKey, blessing }
  let activeIdx = -1;
  let tickTimer = null;
  let started = false;

  /* ── helpers ──────────────────────────────────────────────────── */
  function t(key) {
    if (window.I18n && typeof window.I18n.t === "function") return window.I18n.t(key);
    return FALLBACK[key] || key;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /** Parse "€1.290" / "R$ 7.200" → { value, prefix }. The European/BR
   *  thousands dot is stripped; the leading symbol becomes the prefix. */
  function parsePrice(text) {
    if (!text) return { value: 0, prefix: "" };
    const prefix = /R\$/.test(text) ? "R$ " : (/€/.test(text) ? "€" : "");
    const value = parseInt(text.replace(/[^\d]/g, ""), 10) || 0;
    return { value, prefix };
  }

  function formatMoney(value, prefix) {
    const grouped = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return prefix + grouped;
  }

  /** Blessed price — floored to a whole unit so the visitor always sees
   *  a clean, favourable figure (matches the briefing's €1.096 example). */
  function blessedValue(value, blessing) {
    return Math.floor((value * (100 - blessing)) / 100);
  }

  /* ── cycle math ───────────────────────────────────────────────── */
  function cycleIndexAt(ms) { return Math.floor((ms - EPOCH) / CYCLE_MS); }
  function cycleEndMs(cycle) { return EPOCH + (cycle + 1) * CYCLE_MS; }

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch (_e) { return null; }
  }
  function writeState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
    catch (_e) { /* private mode — fall back to in-memory only */ }
  }

  /** Pick a favoured contract, avoiding the previous cycle's choice. */
  function chooseFavored(prevKey) {
    const pool = eligible.filter((i) => contracts[i].key !== prevKey);
    const list = pool.length ? pool : eligible;
    return contracts[list[Math.floor(Math.random() * list.length)]].key;
  }

  /** Resolve (or freshly roll) the favour for a given cycle. Reuses the
   *  persisted choice when the cycle hasn't turned, so reloads agree. */
  function resolveStateFor(cycle) {
    const stored = readState();
    if (stored && stored.cycle === cycle &&
        contracts.some((c) => c.key === stored.favoredKey)) {
      return stored;
    }
    const prevKey = stored ? stored.favoredKey : null;
    const favoredKey = chooseFavored(prevKey);
    const blessing = BLESSINGS[((cycle % BLESSINGS.length) + BLESSINGS.length) % BLESSINGS.length];
    const next = { cycle, favoredKey, prevKey: prevKey || null, blessing };
    writeState(next);
    return next;
  }

  /* ── DOM discovery ────────────────────────────────────────────── */
  function indexContracts() {
    contracts = [];
    eligible = [];
    const list = document.querySelectorAll("#contracts .contracts__list .contract");
    list.forEach((node) => {
      const book = node.querySelector(".contract__book");
      const rightPage = node.querySelector(".contract__page--right");
      const priceCell = node.querySelector(".contract__price");
      const nameEl = node.querySelector(".contract__name");
      const m = nameEl && nameEl.dataset.i18n
        ? nameEl.dataset.i18n.match(/contracts\.(s\d+)\.name/) : null;
      const key = m ? m[1] : "c" + contracts.length;

      const eur = parsePrice(priceCell && priceCell.querySelector("strong")
        ? priceCell.querySelector("strong").textContent : "");
      const brl = parsePrice(priceCell && priceCell.querySelector("em")
        ? priceCell.querySelector("em").textContent : "");
      const custom = priceCell ? /\+/.test(priceCell.textContent) : true;

      const idx = contracts.length;
      contracts.push({ el: node, key, book, rightPage, priceCell, eur, brl, custom });
      // A contract is eligible only with two concrete (non-"from") prices.
      if (book && rightPage && priceCell && eur.value && brl.value && !custom) {
        eligible.push(idx);
      }
    });
  }

  /* ── builders ─────────────────────────────────────────────────── */
  function buildSeal() {
    const seal = el("div", "convergence-seal");
    seal.setAttribute("role", "img");
    seal.setAttribute("aria-label", t("conv.seal"));
    seal.innerHTML =
      '<span class="convergence-seal__edge" aria-hidden="true"></span>' +
      '<span class="convergence-seal__rune" aria-hidden="true">✦</span>' +
      '<span class="convergence-seal__text"></span>' +
      '<span class="convergence-seal__rune" aria-hidden="true">✦</span>' +
      '<span class="convergence-seal__sheen" aria-hidden="true"></span>';
    seal.querySelector(".convergence-seal__text").textContent = t("conv.seal");
    return seal;
  }

  function buildPanel(c, blessing) {
    const eurOld = formatMoney(c.eur.value, c.eur.prefix);
    const brlOld = formatMoney(c.brl.value, c.brl.prefix);
    const eurNew = formatMoney(blessedValue(c.eur.value, blessing), c.eur.prefix);
    const brlNew = formatMoney(blessedValue(c.brl.value, blessing), c.brl.prefix);

    const panel = el("aside", "convergence");
    panel.setAttribute("role", "note");
    panel.setAttribute("aria-label", t("conv.seal"));
    panel.innerHTML = [
      '<span class="convergence__frame" aria-hidden="true"></span>',
      '<span class="convergence__motes" aria-hidden="true">',
      '<i></i><i></i><i></i><i></i><i></i><i></i>',
      '</span>',
      '<div class="convergence__body">',
        '<p class="convergence__eyebrow"><span aria-hidden="true">✦</span>',
        '<b class="convergence__eyebrow-text"></b>',
        '<span aria-hidden="true">✦</span></p>',
        '<p class="convergence__copy"></p>',
        '<p class="convergence__blessing"><span class="convergence__blessing-label"></span>',
        '<span class="convergence__blessing-val">' + blessing + '%</span></p>',
        '<div class="convergence__prices">',
          '<div class="convergence__old"><s>' + eurOld + '</s><s>' + brlOld + '</s></div>',
          '<span class="convergence__arrow" aria-hidden="true">↓</span>',
          '<div class="convergence__new"><strong>' + eurNew + '</strong><em>' + brlNew + '</em></div>',
        '</div>',
        '<div class="convergence__rule" aria-hidden="true"></div>',
        '<div class="convergence__countdown">',
          '<p class="convergence__countdown-label"></p>',
          '<div class="convergence__timer">',
            '<span class="convergence__unit"><b data-cd="d">--</b><i class="convergence__u-d"></i></span>',
            '<span class="convergence__sep" aria-hidden="true">:</span>',
            '<span class="convergence__unit"><b data-cd="h">--</b><i class="convergence__u-h"></i></span>',
            '<span class="convergence__sep" aria-hidden="true">:</span>',
            '<span class="convergence__unit"><b data-cd="m">--</b><i class="convergence__u-m"></i></span>',
            '<span class="convergence__sep" aria-hidden="true">:</span>',
            '<span class="convergence__unit"><b data-cd="s">--</b><i class="convergence__u-s"></i></span>',
          '</div>',
        '</div>',
      '</div>',
    ].join("");

    panel.querySelector(".convergence__eyebrow-text").textContent = t("conv.seal");
    panel.querySelector(".convergence__copy").textContent = t("conv.copy");
    panel.querySelector(".convergence__blessing-label").textContent = t("conv.blessing");
    panel.querySelector(".convergence__countdown-label").textContent = t("conv.countdown");
    panel.querySelector(".convergence__u-d").textContent = t("conv.days");
    panel.querySelector(".convergence__u-h").textContent = t("conv.hours");
    panel.querySelector(".convergence__u-m").textContent = t("conv.minutes");
    panel.querySelector(".convergence__u-s").textContent = t("conv.seconds");
    return panel;
  }

  function blessInlinePrice(c, blessing) {
    const cell = c.priceCell;
    if (!cell) return;
    cell.classList.add("is-blessed");
    cell.querySelectorAll("strong, em").forEach((n) => n.classList.add("is-struck"));
    const wrap = el("span", "contract__price-new");
    wrap.innerHTML =
      "<strong>" + formatMoney(blessedValue(c.eur.value, blessing), c.eur.prefix) + "</strong>" +
      "<em>" + formatMoney(blessedValue(c.brl.value, blessing), c.brl.prefix) + "</em>";
    cell.appendChild(wrap);
  }

  /* ── render / clear ───────────────────────────────────────────── */
  function clearAll() {
    document.querySelectorAll(".contract--convergent")
      .forEach((n) => n.classList.remove("contract--convergent"));
    document.querySelectorAll(".convergence-seal, .convergence")
      .forEach((n) => n.remove());
    document.querySelectorAll(".contract__price.is-blessed").forEach((cell) => {
      cell.classList.remove("is-blessed");
      const inj = cell.querySelector(".contract__price-new");
      if (inj) inj.remove();
      cell.querySelectorAll(".is-struck").forEach((s) => s.classList.remove("is-struck"));
    });
  }

  function render() {
    if (!contracts.length) return;
    const cycle = cycleIndexAt(Date.now());
    state = resolveStateFor(cycle);
    activeIdx = contracts.findIndex((c) => c.key === state.favoredKey);

    clearAll();
    if (activeIdx < 0) return;

    const c = contracts[activeIdx];
    c.el.classList.add("contract--convergent");
    c.book.insertBefore(buildSeal(), c.book.firstChild);
    blessInlinePrice(c, state.blessing);

    const panel = buildPanel(c, state.blessing);
    const cta = c.rightPage.querySelector(".contract__cta");
    if (cta) c.rightPage.insertBefore(panel, cta);
    else c.rightPage.appendChild(panel);

    updateCountdown();
  }

  /* ── countdown ────────────────────────────────────────────────── */
  function setCd(unit, val) {
    const node = document.querySelector('.convergence [data-cd="' + unit + '"]');
    if (node) node.textContent = String(val).padStart(2, "0");
  }

  function updateCountdown() {
    if (!state) return;
    let ms = Math.max(0, cycleEndMs(state.cycle) - Date.now());
    const d = Math.floor(ms / 86400000); ms -= d * 86400000;
    const h = Math.floor(ms / 3600000);  ms -= h * 3600000;
    const m = Math.floor(ms / 60000);    ms -= m * 60000;
    const s = Math.floor(ms / 1000);
    setCd("d", d); setCd("h", h); setCd("m", m); setCd("s", s);
  }

  function tick() {
    const cycle = cycleIndexAt(Date.now());
    if (!state || cycle !== state.cycle) { render(); return; }  // convergence turned
    updateCountdown();
  }

  /* ── lifecycle ────────────────────────────────────────────────── */
  function init() {
    if (started) return;
    if (!document.getElementById("contracts")) return;
    indexContracts();
    if (!eligible.length) return;
    started = true;
    render();
    tickTimer = setInterval(tick, 1000);
    window.addEventListener("langchange", render);
  }

  return { init, render };
})();

window.Convergence = Convergence;
