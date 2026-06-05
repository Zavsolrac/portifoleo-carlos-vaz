/**
 * ✦ ORÁCULO D-30 · Convergência Cinematográfica ✦
 * ------------------------------------------------------------------
 * "Evento do Destino" — modal compacto opcional ao clicar num contrato.
 * Gate de escolha → rolagem D30 (2–3s) → benefício ou artefato lendário;
 * persiste em localStorage e exibe contador regressivo.
 *
 * Coexiste com Convergence (bênção passiva 10 dias) sem empilhar
 * desconto sobre preço já abençoado.
 */
const OracleD30 = (() => {
  "use strict";

  const STORAGE_KEY = "cv-oracle-d30-v2";
  const BONUS_MS = 10 * 24 * 60 * 60 * 1000;
  const CONTACT_WA = "351910562698";
  const CONTACT_EMAIL = "wishmastergm@gmail.com";

  /* The five legendary boons (roll 30). One is chosen at random. */
  const LEGENDARIES = ["chatbot", "page", "npc", "fx", "relic"];

  const FALLBACK = {
    "oracle.title": "Evento do Destino",
    /* Gate (choice) modal */
    "oracle.gate.eyebrow": "Evento do Destino",
    "oracle.gate.title": "Um momento antes de prosseguir…",
    "oracle.gate.body": "Você pode seguir diretamente para a contratação ou participar de um evento opcional. Uma única rolagem do D30 poderá revelar benefícios especiais para o seu projeto.",
    "oracle.gate.question": "Qual caminho deseja seguir?",
    "oracle.gate.proceed": "Prosseguir para o Contrato",
    "oracle.gate.play": "Participar do Evento do Destino",
    /* Roll + result */
    "oracle.rolling": "Rolando o dado do destino…",
    "oracle.roll.label": "Resultado",
    "oracle.result.intro": "O destino revelou um benefício para sua jornada.",
    "oracle.result.discount": "{valor}% de desconto no seu projeto.",
    /* Legendary (roll 30) */
    "oracle.legend.title": "✨ Artefato Lendário Descoberto",
    "oracle.legend.intro": "O destino revelou uma condição extremamente rara para sua jornada.",
    "oracle.legend.note": "Seu projeto recebeu um benefício reservado aos resultados lendários.",
    "oracle.legend.chatbot.name": "Assistente Inteligente",
    "oracle.legend.chatbot.desc": "Um chatbot personalizado integrado ao site.",
    "oracle.legend.page.name": "Página Secreta",
    "oracle.legend.page.desc": "Página adicional exclusiva criada sem custo.",
    "oracle.legend.npc.name": "NPC Digital",
    "oracle.legend.npc.desc": "Personagem interativo que apresenta o site.",
    "oracle.legend.fx.name": "Efeito Épico",
    "oracle.legend.fx.desc": "Uma animação premium exclusiva criada para o projeto.",
    "oracle.legend.relic.name": "Relíquia do Arquiteto",
    "oracle.legend.relic.desc": "Funcionalidade surpresa escolhida pelo desenvolvedor para elevar a experiência do projeto.",
    /* Shared */
    "oracle.close": "Fechar",
    "oracle.countdown": "Benefício válido por",
    "oracle.days": "dias",
    "oracle.hours": "horas",
    "oracle.minutes": "min",
    "oracle.seconds": "seg",
    "oracle.contract": "Contrato",
    "oracle.seal.badge": "Evento do Destino",
    "oracle.legend.badge": "✦ Artefato Lendário",
    "oracle.reopen.title": "Os fios do destino já foram lançados para este contrato.",
    "oracle.notice.registered": "Seu destino foi registrado. Você poderá retornar a qualquer momento antes do término da promoção.",
    "oracle.promo.code": "Código da promoção",
    "oracle.arcane.code": "Código Arcano",
    "oracle.contact": "Contatar o Programador Arcano",
    "oracle.contact.whatsapp": "WhatsApp",
    "oracle.contact.email": "E-mail",
    "oracle.rewards.title": "Mapa das Probabilidades",
    "oracle.rewards.col.roll": "Resultado",
    "oracle.rewards.col.reward": "Recompensa",
    "oracle.rewards.discount": "{valor}% de desconto",
    "oracle.rewards.legendary": "Recompensa Lendária",
    "oracle.levelup": "NÍVEL LENDÁRIO!",
    "oracle.msg.wa": "Olá, Programador Arcano.\n\nAcabei de explorar seu portfólio.\n\nContrato selecionado:\n{contract}\n\nResultado do dado:\n{roll}\n\nDesconto conquistado:\n{discount}\n\nCódigo da promoção:\n{code}\n\nCódigo Arcano:\n{arcane}\n\nA promoção ainda está ativa e gostaria de conversar sobre este projeto.\n\nMensagem gerada automaticamente pelo Portal Arcano.",
    "oracle.msg.email.subject": "[Portal Arcano] Solicitação de Projeto - {contract}",
    "oracle.msg.email.body": "Olá,\n\nGostaria de solicitar um orçamento.\n\nContrato:\n{contract}\n\nResultado do dado:\n{roll}\n\nDesconto:\n{discount}\n\nCódigo:\n{code}\n\nCódigo Arcano:\n{arcane}\n\nPromoção ativa.\n\nMensagem gerada automaticamente pelo Portal Arcano.",
  };

  let modal = null;
  let els = {};
  let three = null;
  let rafId = null;
  let cdTimer = null;
  let phase = "idle";
  let activeContract = null;
  let rollResult = null;
  let reducedMotion = false;
  let isMobile = false;
  let started = false;

  /* Legendary "level up" stinger (roll 30). Independent of the ambient
     soundtrack — plays a one-shot like the other SFX in the project. */
  let levelUpAudio = null;
  function preloadLevelUp() {
    if (levelUpAudio) return;
    try {
      levelUpAudio = new Audio("src/assets/sounds/level-up.mp3");
      levelUpAudio.preload = "auto";
      levelUpAudio.volume = 0.75;
    } catch (_e) { levelUpAudio = null; }
  }
  function playLevelUpSound() {
    preloadLevelUp();
    if (!levelUpAudio) return;
    try {
      const a = levelUpAudio.cloneNode();
      a.volume = 0.75;
      a.play().catch(() => { /* autoplay may be blocked until a gesture */ });
    } catch (_e) { /* ignore */ }
  }

  /* ── i18n ─────────────────────────────────────────────────────── */
  function t(key, vars) {
    let s = FALLBACK[key] || key;
    if (window.I18n && typeof window.I18n.t === "function") {
      const v = window.I18n.t(key);
      if (v && v !== key) s = v;
    }
    if (vars) {
      Object.keys(vars).forEach((k) => {
        s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      });
    }
    return s;
  }

  /* ── storage (per-contract map) ───────────────────────────────── */
  function readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_e) { return {}; }
  }

  function writeAll(map) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); }
    catch (_e) { /* private mode */ }
  }

  function getRecord(contractId) {
    if (!contractId) return null;
    return readAll()[contractId] || null;
  }

  function setRecord(contractId, record) {
    const map = readAll();
    map[contractId] = record;
    writeAll(map);
  }

  function removeRecord(contractId) {
    const map = readAll();
    if (!map[contractId]) return;
    delete map[contractId];
    writeAll(map);
  }

  function isRecordValid(rec) {
    if (!rec) return false;
    const exp = rec.expiresAtMs != null ? rec.expiresAtMs : rec.expiresAt;
    if (exp == null) return false;
    const ms = typeof exp === "number" ? exp : Date.parse(exp);
    return !Number.isNaN(ms) && Date.now() < ms;
  }

  function canRoll(contractId) {
    const rec = getRecord(contractId);
    return !rec || !isRecordValid(rec);
  }

  function purgeExpired() {
    const map = readAll();
    let changed = false;
    Object.keys(map).forEach((id) => {
      if (!isRecordValid(map[id])) {
        delete map[id];
        removeContractBadge(id);
        changed = true;
      }
    });
    if (changed) writeAll(map);
  }

  function contractAbbrev(contract) {
    const name = (contract.name || "").trim();
    const words = name.replace(/[^\w\sÀ-ÿ]/gi, "").split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase().slice(0, 4);
    }
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return String(contract.key || "XX").toUpperCase().replace(/^S/, "C");
  }

  function makePromotionId(contract) {
    const abbr = contractAbbrev(contract);
    const num = String(Math.floor(100000 + Math.random() * 900000));
    return "ARCANO-" + abbr + "-" + num;
  }

  /* ── Arcane Code · internal manual validation ──────────────────
     Each dice result maps to a fixed "Word of Destiny". The code is
     ARC-{ABBR}-{WORD}-{SUFFIX}. Because the word is bound to the roll
     at generation time, a manually-tampered dice value in a message
     can be spotted by cross-checking the word embedded in the code.
     No backend, no crypto — purely a human-readable consistency tag. */
  const DESTINY_WORDS = {
    1: "Amor", 2: "Bondade", 3: "Carisma", 4: "Determinação", 5: "Esperança",
    6: "Fortaleza", 7: "Glória", 8: "Harmonia", 9: "Inspiração", 10: "Justiça",
    11: "Conhecimento", 12: "Lealdade", 13: "Mistério", 14: "Nobreza", 15: "Ousadia",
    16: "Perseverança", 17: "Resiliência", 18: "Sabedoria", 19: "Tradição", 20: "União",
    21: "Valor", 22: "Virtude", 23: "Vigilância", 24: "Destino", 25: "Arcano",
    26: "Relíquia", 27: "Eclipse", 28: "Fênix", 29: "Dragão", 30: "Lendário",
  };

  function destinyWord(roll) {
    const w = DESTINY_WORDS[roll] || "Arcano";
    return w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  }

  function arcaneSuffix() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let s = "";
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function makeArcaneCode(contract, roll) {
    return "ARC-" + contractAbbrev(contract) + "-" + destinyWord(roll) + "-" + arcaneSuffix();
  }

  /* Backfill arcane code for records saved before this feature existed,
     persisting the generated code so it stays stable across reopens. */
  function ensureArcaneCode(rec) {
    if (!rec) return "—";
    if (rec.arcaneCode) return rec.arcaneCode;
    const code = makeArcaneCode(
      { name: rec.contractName, key: rec.contractId }, rec.diceResult
    );
    rec.arcaneCode = code;
    if (rec.contractId) setRecord(rec.contractId, rec);
    return code;
  }

  function recordToReward(rec) {
    return {
      roll: rec.diceResult,
      tipo: rec.tipo,
      valor: rec.discountPercent,
      legendKey: rec.legendKey,
      titleKey: rec.titleKey,
      copyKey: rec.copyKey,
    };
  }

  function discountLabelForRecord(rec) {
    if (rec.tipo === "legend") {
      const lk = rec.legendKey;
      return lk ? t("oracle.legend." + lk + ".name") : t("oracle.legend.badge");
    }
    return rec.discountPercent + "%";
  }

  function msgVarsFromRecord(rec) {
    return {
      contract: rec.contractName,
      roll: String(rec.diceResult),
      discount: discountLabelForRecord(rec),
      code: rec.promotionId || "—",
      arcane: ensureArcaneCode(rec),
    };
  }

  function buildWhatsAppUrl(rec) {
    const text = t("oracle.msg.wa", msgVarsFromRecord(rec));
    return "https://wa.me/" + CONTACT_WA + "?text=" + encodeURIComponent(text);
  }

  function buildMailto(rec) {
    const vars = msgVarsFromRecord(rec);
    const subject = t("oracle.msg.email.subject", vars);
    const body = t("oracle.msg.email.body", vars);
    return "mailto:" + CONTACT_EMAIL
      + "?subject=" + encodeURIComponent(subject)
      + "&body=" + encodeURIComponent(body);
  }

  /* ── reward table ─────────────────────────────────────────────── */
  function rollD30() {
    return 1 + Math.floor(Math.random() * 30);
  }

  function pickLegendary() {
    const key = LEGENDARIES[Math.floor(Math.random() * LEGENDARIES.length)];
    return {
      tipo: "legend", valor: 0, roll: 30,
      legendKey: key,
      titleKey: "oracle.legend.title",
      copyKey: "oracle.legend." + key + ".desc",
      expiresMs: BONUS_MS,
    };
  }

  /* Single source of truth for the discount ladder. The result modal's
     "Mapa das Probabilidades" table is generated from these same tiers,
     so the displayed odds can never drift from the actual reward logic. */
  const REWARD_TIERS = [
    { min: 1,  max: 5,  valor: 5 },
    { min: 6,  max: 10, valor: 10 },
    { min: 11, max: 15, valor: 15 },
    { min: 16, max: 20, valor: 20 },
    { min: 21, max: 25, valor: 25 },
    { min: 26, max: 29, valor: 30 },
  ];

  function rewardFor(roll) {
    if (roll === 30) return pickLegendary();
    const tier = REWARD_TIERS.find((t) => roll <= t.max);
    return {
      tipo: "discount", valor: tier.valor, roll,
      titleKey: "oracle.result.intro",
      copyKey: "oracle.result.discount",
      expiresMs: BONUS_MS,
    };
  }

  function persistReward(contract, reward) {
    const now = Date.now();
    const expiresMs = reward.expiresMs || BONUS_MS;
    const record = {
      contractId: contract.key,
      contractName: contract.name,
      diceResult: reward.roll,
      tipo: reward.tipo,
      discountPercent: reward.tipo === "discount" ? reward.valor : 0,
      legendKey: reward.legendKey || null,
      titleKey: reward.titleKey,
      copyKey: reward.copyKey,
      promotionId: makePromotionId(contract),
      arcaneCode: makeArcaneCode(contract, reward.roll),
      createdAt: new Date(now).toISOString(),
      createdAtMs: now,
      expiresAt: new Date(now + expiresMs).toISOString(),
      expiresAtMs: now + expiresMs,
    };
    setRecord(contract.key, record);
    applyContractBadge(contract.key, reward);
    return record;
  }

  /* ── contract discovery ───────────────────────────────────────── */
  function indexContractFromCta(cta) {
    const book = cta.closest(".contract__book");
    const li = cta.closest(".contract");
    const nameEl = book && book.querySelector(".contract__name");
    const m = nameEl && nameEl.dataset.i18n
      ? nameEl.dataset.i18n.match(/contracts\.(s\d+)\.name/) : null;
    const key = m ? m[1] : "c" + Math.random().toString(36).slice(2, 6);
    const name = nameEl ? nameEl.textContent.trim() : t("oracle.contract");
    return { el: li, book, key, name, cta };
  }

  function removeContractBadge(contractKey) {
    const nameEl = document.querySelector(
      '.contract__name[data-i18n="contracts.' + contractKey + '.name"]'
    );
    const book = nameEl && nameEl.closest(".contract__book");
    if (!book) return;
    const badge = book.querySelector(".oracle-d30-badge");
    if (badge) badge.remove();
    const li = book.closest(".contract");
    if (li) li.classList.remove("contract--oracle");
  }

  function applyContractBadge(contractKey, reward) {
    removeContractBadge(contractKey);
    const nameEl = document.querySelector(
      '.contract__name[data-i18n="contracts.' + contractKey + '.name"]'
    );
    const book = nameEl && nameEl.closest(".contract__book");
    if (!book) return;
    const badge = document.createElement("span");
    badge.className = "oracle-d30-badge";
    badge.setAttribute("role", "status");
    let label = t("oracle.seal.badge");
    if (reward.tipo === "discount") label += " · -" + reward.valor + "%";
    else if (reward.tipo === "legend") {
      const lk = reward.legendKey;
      label = t("oracle.legend.badge");
      if (lk) label += " · " + t("oracle.legend." + lk + ".name");
    }
    badge.textContent = label;
    const cta = book.querySelector(".contract__cta");
    if (cta && cta.parentNode) cta.parentNode.insertBefore(badge, cta);
    else book.appendChild(badge);
    const li = book.closest(".contract");
    if (li) li.classList.add("contract--oracle");
  }

  function restoreBadges() {
    const map = readAll();
    Object.keys(map).forEach((id) => {
      const rec = map[id];
      if (isRecordValid(rec)) applyContractBadge(id, recordToReward(rec));
      else removeContractBadge(id);
    });
  }

  /* ── modal DOM · compact "Evento do Destino" card ───────────── */
  function buildModal() {
    if (modal) return;
    modal = document.createElement("div");
    modal.id = "oracle-d30";
    modal.className = "oracle-d30";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="oracle-d30__scrim" aria-hidden="true"></div>',
      '<div class="oracle-d30__particles" aria-hidden="true"></div>',
      '<div class="oracle-d30__card">',
      '  <button type="button" class="oracle-d30__dismiss" id="oracle-d30-dismiss" aria-label="Fechar">&times;</button>',
      '  <!-- Legendary level-up celebration overlay -->',
      '  <div class="oracle-d30__levelup" id="oracle-d30-levelup" aria-hidden="true">',
      '    <div class="oracle-d30__levelup-rays"></div>',
      '    <div class="oracle-d30__levelup-ring"></div>',
      '    <div class="oracle-d30__levelup-ring oracle-d30__levelup-ring--2"></div>',
      '    <div class="oracle-d30__levelup-sparks">',
      '      <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>',
      '    </div>',
      '    <p class="oracle-d30__levelup-text" id="oracle-d30-levelup-text" data-oracle="levelup"></p>',
      '  </div>',
      '  <!-- Gate: optional choice before contract -->',
      '  <div class="oracle-d30__gate" id="oracle-d30-gate">',
      '    <p class="oracle-d30__eyebrow" data-oracle="gate.eyebrow"></p>',
      '    <h2 class="oracle-d30__gate-title" data-oracle="gate.title"></h2>',
      '    <p class="oracle-d30__gate-body" data-oracle="gate.body"></p>',
      '    <p class="oracle-d30__gate-question" data-oracle="gate.question"></p>',
      '    <div class="oracle-d30__gate-actions">',
      '      <button type="button" class="oracle-d30__btn oracle-d30__btn--primary" id="oracle-d30-proceed" data-oracle="gate.proceed"></button>',
      '      <button type="button" class="oracle-d30__btn oracle-d30__btn--ghost" id="oracle-d30-play" data-oracle="gate.play"></button>',
      '    </div>',
      '  </div>',
      '  <!-- Roll: compact 3D die + result -->',
      '  <div class="oracle-d30__roll" id="oracle-d30-roll" hidden>',
      '    <div class="oracle-d30__stage">',
      '      <div class="oracle-d30__canvas-wrap" id="oracle-d30-canvas"></div>',
      '      <div class="oracle-d30__holo" id="oracle-d30-holo" hidden>',
      '        <span class="oracle-d30__holo-num" id="oracle-d30-num">—</span>',
      '      </div>',
      '    </div>',
      '    <p class="oracle-d30__rolling" data-oracle="rolling" hidden></p>',
      '    <div class="oracle-d30__result" id="oracle-d30-result" hidden>',
      '      <p class="oracle-d30__reopen-note" id="oracle-d30-reopen-note" hidden></p>',
      '      <p class="oracle-d30__notice" id="oracle-d30-notice" hidden></p>',
      '      <p class="oracle-d30__result-roll"><span data-oracle="roll.label"></span>: <b id="oracle-d30-result-num">—</b></p>',
      '      <h3 class="oracle-d30__result-title" id="oracle-d30-result-title"></h3>',
      '      <p class="oracle-d30__result-copy" id="oracle-d30-result-copy"></p>',
      '      <p class="oracle-d30__result-contract" id="oracle-d30-result-contract"></p>',
      '      <p class="oracle-d30__promo-code" id="oracle-d30-promo-code" hidden>',
      '        <span data-oracle="promo.code"></span>: <code id="oracle-d30-promo-val">—</code>',
      '      </p>',
      '      <p class="oracle-d30__promo-code oracle-d30__arcane-code" id="oracle-d30-arcane-code" hidden>',
      '        <span data-oracle="arcane.code"></span>: <code id="oracle-d30-arcane-val">—</code>',
      '      </p>',
      '      <div class="oracle-d30__countdown" id="oracle-d30-countdown">',
      '        <p class="oracle-d30__countdown-label" data-oracle="countdown"></p>',
      '        <div class="oracle-d30__timer">',
      '          <span><b data-cd="d">00</b><i data-oracle="days"></i></span>',
      '          <span class="oracle-d30__sep">:</span>',
      '          <span><b data-cd="h">00</b><i data-oracle="hours"></i></span>',
      '          <span class="oracle-d30__sep">:</span>',
      '          <span><b data-cd="m">00</b><i data-oracle="minutes"></i></span>',
      '          <span class="oracle-d30__sep">:</span>',
      '          <span><b data-cd="s">00</b><i data-oracle="seconds"></i></span>',
      '        </div>',
      '      </div>',
      '      <details class="oracle-d30__rewards" id="oracle-d30-rewards">',
      '        <summary class="oracle-d30__rewards-summary"><span data-oracle="rewards.title"></span></summary>',
      '        <table class="oracle-d30__rewards-table">',
      '          <thead><tr><th data-oracle="rewards.col.roll"></th><th data-oracle="rewards.col.reward"></th></tr></thead>',
      '          <tbody id="oracle-d30-rewards-body"></tbody>',
      '        </table>',
      '      </details>',
      '      <div class="oracle-d30__actions">',
      '        <button type="button" class="oracle-d30__btn oracle-d30__btn--primary oracle-d30__btn--contact" id="oracle-d30-contact" data-oracle="contact" hidden></button>',
      '        <div class="oracle-d30__channels" id="oracle-d30-channels" hidden>',
      '          <a class="oracle-d30__btn oracle-d30__btn--channel" id="oracle-d30-wa" target="_blank" rel="noopener" data-oracle="contact.whatsapp"></a>',
      '          <a class="oracle-d30__btn oracle-d30__btn--channel" id="oracle-d30-email" data-oracle="contact.email"></a>',
      '        </div>',
      '        <button type="button" class="oracle-d30__btn oracle-d30__btn--ghost" id="oracle-d30-close" data-oracle="close"></button>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join("");
    document.body.appendChild(modal);

    els = {
      gate: document.getElementById("oracle-d30-gate"),
      roll: document.getElementById("oracle-d30-roll"),
      proceed: document.getElementById("oracle-d30-proceed"),
      play: document.getElementById("oracle-d30-play"),
      stage: modal.querySelector(".oracle-d30__stage"),
      canvasWrap: document.getElementById("oracle-d30-canvas"),
      holo: document.getElementById("oracle-d30-holo"),
      holoNum: document.getElementById("oracle-d30-num"),
      result: document.getElementById("oracle-d30-result"),
      resultNum: document.getElementById("oracle-d30-result-num"),
      resultTitle: document.getElementById("oracle-d30-result-title"),
      resultCopy: document.getElementById("oracle-d30-result-copy"),
      resultContract: document.getElementById("oracle-d30-result-contract"),
      countdown: document.getElementById("oracle-d30-countdown"),
      reopenNote: document.getElementById("oracle-d30-reopen-note"),
      notice: document.getElementById("oracle-d30-notice"),
      promoCode: document.getElementById("oracle-d30-promo-code"),
      promoVal: document.getElementById("oracle-d30-promo-val"),
      arcaneCode: document.getElementById("oracle-d30-arcane-code"),
      arcaneVal: document.getElementById("oracle-d30-arcane-val"),
      contact: document.getElementById("oracle-d30-contact"),
      channels: document.getElementById("oracle-d30-channels"),
      wa: document.getElementById("oracle-d30-wa"),
      email: document.getElementById("oracle-d30-email"),
      close: document.getElementById("oracle-d30-close"),
      dismiss: document.getElementById("oracle-d30-dismiss"),
      rolling: modal.querySelector('[data-oracle="rolling"]'),
      levelup: document.getElementById("oracle-d30-levelup"),
      rewards: document.getElementById("oracle-d30-rewards"),
      rewardsBody: document.getElementById("oracle-d30-rewards-body"),
    };
    els.activeRecord = null;

    modal.querySelectorAll("[data-oracle]").forEach((n) => {
      const k = n.getAttribute("data-oracle");
      if (k && !n.id) n.textContent = t("oracle." + k);
    });
    buildRewardsTable();

    els.proceed.addEventListener("click", onProceed);
    els.play.addEventListener("click", onPlay);
    els.close.addEventListener("click", closeModal);
    els.dismiss.addEventListener("click", closeModal);
    els.contact.addEventListener("click", onContactClick);
    els.wa.addEventListener("click", () => { if (els.channels) els.channels.hidden = true; });
    els.email.addEventListener("click", () => { if (els.channels) els.channels.hidden = true; });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  /* Build the "Mapa das Probabilidades" rows from REWARD_TIERS so the
     odds table always mirrors the live reward ladder. */
  function buildRewardsTable() {
    if (!els.rewardsBody) return;
    const rows = REWARD_TIERS.map((tier) => {
      const range = tier.min === tier.max ? String(tier.min) : tier.min + " – " + tier.max;
      const reward = t("oracle.rewards.discount", { valor: tier.valor });
      return '<tr data-min="' + tier.min + '" data-max="' + tier.max + '">'
        + '<td>' + range + '</td><td>' + reward + '</td></tr>';
    });
    rows.push(
      '<tr class="oracle-d30__rewards-legend" data-min="30" data-max="30">'
      + '<td>30</td><td>' + t("oracle.rewards.legendary") + '</td></tr>'
    );
    els.rewardsBody.innerHTML = rows.join("");
  }

  /* Mark the tier the visitor actually landed on (subtle, after a roll). */
  function highlightRewardRow(roll) {
    if (!els.rewardsBody) return;
    els.rewardsBody.querySelectorAll("tr").forEach((tr) => {
      const min = parseInt(tr.dataset.min, 10);
      const max = parseInt(tr.dataset.max, 10);
      tr.classList.toggle("is-hit", roll >= min && roll <= max);
    });
  }

  function translateModal() {
    if (!modal) return;
    modal.querySelectorAll("[data-oracle]").forEach((n) => {
      const k = n.getAttribute("data-oracle");
      if (k) n.textContent = t("oracle." + k);
    });
    buildRewardsTable();
    if (els.activeRecord && els.activeRecord.diceResult) {
      highlightRewardRow(els.activeRecord.diceResult);
    }
    if (els.reopenNote && !els.reopenNote.hidden) {
      els.reopenNote.textContent = t("oracle.reopen.title");
    }
    if (els.notice && !els.notice.hidden) {
      els.notice.textContent = t("oracle.notice.registered");
    }
    if (els.activeRecord) updateContactLinks(els.activeRecord);
  }

  /* ── Three.js scene · hand-carved dark-walnut d30 die ───────── */

  /** Seeded-ish noise for procedural textures (deterministic per pixel). */
  function texNoise(x, y, seed) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453;
    return n - Math.floor(n);
  }

  /** Flowing wood-grain value at (x,y): domain-warped bands of dark walnut.
   *  Returns 0..1 where higher = lighter late-wood streak. */
  function woodGrain(x, y, size) {
    /* Domain-warp the coordinate so growth rings undulate organically
       instead of reading as straight ribs. Two octaves of warp. */
    const warp = (texNoise(x * 0.012, y * 0.04, 1) - 0.5) * 30
      + (texNoise(x * 0.04, y * 0.09, 2) - 0.5) * 12
      + (texNoise(x * 0.11, y * 0.2, 4) - 0.5) * 5;
    /* An occasional knot pulls the rings into a swirl. */
    const knotCx = size * (0.3 + texNoise(7, 7, 9) * 0.4);
    const knotCy = size * (0.35 + texNoise(8, 8, 9) * 0.4);
    const kd = Math.hypot(x - knotCx, y - knotCy);
    const knot = Math.exp(-kd * kd / (size * size * 0.012)) * 26;
    /* Growth rings reading down the face, bent by warp + knot. */
    const ring = Math.sin((y + warp + knot) * 0.13 + x * 0.01) * 0.5 + 0.5;
    /* Sharpen into fibre streaks, with a slightly irregular profile. */
    const streak = Math.pow(ring, 1.6 + texNoise(x * 0.02, y * 0.02, 5) * 0.6);
    const fibre = texNoise(x * 0.9, y * 0.16, 3) * 0.16; /* fine length fibres */
    return Math.min(1, streak * 0.84 + fibre);
  }

  /** Dark walnut wood albedo: flowing grain, warm browns, gold-pigment hints. */
  function createDieAlbedo(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const grain = woodGrain(x, y, size);
        /* Lerp between deep walnut (dark) and warm amber late-wood. */
        let r = 46 + grain * 70;
        let g = 30 + grain * 50;
        let b = 16 + grain * 26;
        /* Broad tonal blotches (heartwood vs sapwood). */
        const blot = texNoise(x * 0.03, y * 0.03, 7);
        const shade = (blot - 0.5) * 22;
        r += shade; g += shade * 0.8; b += shade * 0.5;
        /* Dark pores / micro-knots. */
        const pore = texNoise(x * 1.1, y * 1.1, 11);
        if (pore > 0.95) { r -= 30; g -= 24; b -= 14; }
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    /* Corner wear — slightly lighter, polished-through highlights at rim. */
    const edgeG = ctx.createRadialGradient(size / 2, size / 2, size * 0.28, size / 2, size / 2, size * 0.72);
    edgeG.addColorStop(0, "rgba(0,0,0,0)");
    edgeG.addColorStop(1, "rgba(150,108,54,0.16)");
    ctx.fillStyle = edgeG;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
  }

  /** Micro-relief: wood grain ridges, scratches and dents (tactile feel). */
  function createDieBump(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        /* Grain itself raises/lowers the surface (fibre ridges). */
        const grain = woodGrain(x, y, size);
        const micro = texNoise(x * 1.6, y * 0.4, 8) * 0.2;
        const v = Math.floor(90 + grain * 110 + micro * 60);
        d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, v));
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    /* Dents (soft dark blobs) + fine scratches from decades of play. */
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    for (let n = 0; n < size * 0.04; n++) {
      const cx = texNoise(n, 0, 40) * size;
      const cy = texNoise(n, 1, 41) * size;
      const r = 1 + texNoise(n, 2, 42) * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 0.4;
    for (let s = 0; s < size * 0.28; s++) {
      const sx = texNoise(s, 0, 30) * size;
      const sy = texNoise(s, 1, 31) * size;
      const len = 3 + texNoise(s, 2, 32) * 16;
      /* Scratches tend to follow the grain direction (mostly horizontal). */
      const ang = (texNoise(s, 3, 33) - 0.5) * 0.7;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
  }

  /** Roughness: wood is mostly matte, edges a touch glossier from handling. */
  function createDieRoughness(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        /* Grain streaks read slightly glossier than the matte body. */
        const grain = woodGrain(x, y, size);
        const edge = Math.min(x, y, size - x, size - y) / (size * 0.16);
        let rough = 0.86 - grain * 0.12;          /* late-wood a bit smoother */
        if (edge < 1) rough -= (1 - edge) * 0.22;  /* polished rounded corners */
        const v = Math.floor(Math.max(0, Math.min(1, rough)) * 255);
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
  }

  /** Warm env map (candle-lit library) so bronze catches reflections. */
  function createEnvMap() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(size * 0.4, size * 0.35, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "#5a4326");
    g.addColorStop(0.45, "#2a1d10");
    g.addColorStop(1, "#0a0704");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    /* A few warm candle highlights. */
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "rgba(255, 200, 120, " + (0.2 + Math.random() * 0.4) + ")";
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size * 0.6, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }

  /** Planar UVs for one triangle facet (project onto tangent plane). */
  function planarUVsForTriangle(ax, ay, az, bx, by, bz, cx, cy, cz) {
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const nlen = Math.hypot(nx, ny, nz);
    if (nlen < 1e-8) return [0, 0, 1, 0, 0.5, 1];
    nx /= nlen; ny /= nlen; nz /= nlen;
    let refX = 0, refY = 1, refZ = 0;
    if (Math.abs(ny) > 0.9) { refX = 1; refY = 0; refZ = 0; }
    let tx = refY * nz - refZ * ny;
    let ty = refZ * nx - refX * nz;
    let tz = refX * ny - refY * nx;
    const tlen = Math.hypot(tx, ty, tz);
    tx /= tlen; ty /= tlen; tz /= tlen;
    const btx = ny * tz - nz * ty;
    const bty = nz * tx - nx * tz;
    const btz = nx * ty - ny * tx;
    const verts = [[ax, ay, az], [bx, by, bz], [cx, cy, cz]];
    const pu = [], pv = [];
    for (const v of verts) {
      pu.push(v[0] * tx + v[1] * ty + v[2] * tz);
      pv.push(v[0] * btx + v[1] * bty + v[2] * btz);
    }
    const minU = Math.min(pu[0], pu[1], pu[2]);
    const maxU = Math.max(pu[0], pu[1], pu[2]);
    const minV = Math.min(pv[0], pv[1], pv[2]);
    const maxV = Math.max(pv[0], pv[1], pv[2]);
    const rU = maxU - minU || 1;
    const rV = maxV - minV || 1;
    return [
      (pu[0] - minU) / rU, (pv[0] - minV) / rV,
      (pu[1] - minU) / rU, (pv[1] - minV) / rV,
      (pu[2] - minU) / rU, (pv[2] - minV) / rV,
    ];
  }

  /** Build a rhombic triacontahedron (the true d30 shape) as a flat-faceted
   *  BufferGeometry via the convex hull of the icosahedron + dodecahedron
   *  vertices. Non-indexed so each facet shades flat like an aged ivory die. */
  function buildD30Geometry() {
    const PHI = (1 + Math.sqrt(5)) / 2;
    const iphi = 1 / PHI;
    const pts = [];
    const add = (x, y, z) => pts.push([x, y, z]);

    /* Dodecahedron (20 vertices) */
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) add(sx, sy, sz);
    for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
      add(0, s1 * iphi, s2 * PHI);
      add(s1 * iphi, s2 * PHI, 0);
      add(s2 * PHI, 0, s1 * iphi);
    }
    /* Icosahedron (12 vertices) — these coordinates yield planar rhombi. */
    for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
      add(0, s1 * PHI, s2 * 1);
      add(s1 * 1, 0, s2 * PHI);
      add(s2 * PHI, s1 * 1, 0);
    }

    const n = pts.length;
    const positions = [];
    const eps = 1e-4;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          const A = pts[i], B = pts[j], C = pts[k];
          const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
          const vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
          let nx = uy * vz - uz * vy;
          let ny = uz * vx - ux * vz;
          let nz = ux * vy - uy * vx;
          const len = Math.hypot(nx, ny, nz);
          if (len < eps) continue;
          nx /= len; ny /= len; nz /= len;
          let pos = 0, neg = 0;
          for (let m = 0; m < n; m++) {
            if (m === i || m === j || m === k) continue;
            const d = nx * (pts[m][0] - A[0]) + ny * (pts[m][1] - A[1]) + nz * (pts[m][2] - A[2]);
            if (d > eps) pos++;
            else if (d < -eps) neg++;
          }
          if (pos > 0 && neg > 0) continue; /* not a hull facet */
          /* Orient outward (normal away from centroid origin). */
          const cx = (A[0] + B[0] + C[0]) / 3;
          const cy = (A[1] + B[1] + C[1]) / 3;
          const cz = (A[2] + B[2] + C[2]) / 3;
          const tri = (nx * cx + ny * cy + nz * cz) > 0 ? [A, B, C] : [A, C, B];
          for (const p of tri) positions.push(p[0], p[1], p[2]);
        }
      }
    }

    /* Planar UV per triangle facet for procedural texture mapping. */
    const uvs = [];
    for (let t = 0; t < positions.length; t += 9) {
      const triUV = planarUVsForTriangle(
        positions[t], positions[t + 1], positions[t + 2],
        positions[t + 3], positions[t + 4], positions[t + 5],
        positions[t + 6], positions[t + 7], positions[t + 8]
      );
      uvs.push(...triUV);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals(); /* non-indexed → per-facet flat normals */
    /* Normalise size: circumradius ~1.9 → scale to ~1.25. */
    geo.scale(0.66, 0.66, 0.66);
    return geo;
  }

  /** Aged-gold engraving lines tracing the facet borders (gold pigment in
   *  the carved grooves). Cheap LineSegments — used on desktop and mobile. */
  function createGoldEdges(dieGeo, opacity) {
    const eGeo = new THREE.EdgesGeometry(dieGeo, 12);
    return new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({
      color: 0xb8893f, transparent: true, opacity,
    }));
  }

  function bootstrapThree() {
    if (three || typeof THREE === "undefined") return;
    const wrap = els.canvasWrap;
    if (!wrap) return;

    const canvas = document.createElement("canvas");
    canvas.className = "oracle-d30__gl";
    wrap.innerHTML = "";
    wrap.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas, alpha: true,
      antialias: !isMobile,
      powerPreference: isMobile ? "low-power" : "high-performance",
    });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isMobile ? 1.08 : 1.28;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0, isMobile ? 6.6 : 6.2);
    camera.lookAt(0, 0, 0);

    /* Warm candle-lit lighting — dark wood needs a strong, warm key. */
    scene.add(new THREE.AmbientLight(0x2a1c10, isMobile ? 0.85 : 0.9));
    const key = new THREE.DirectionalLight(0xffd9a0, isMobile ? 1.35 : 1.7);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffb070, isMobile ? 0.6 : 0.7);
    rim.position.set(-4, 1, -3);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    const envMap = createEnvMap();
    const texSize = isMobile ? 256 : 512;
    const albedoMap = createDieAlbedo(texSize);
    const bumpMap = createDieBump(texSize);
    const roughnessMap = isMobile ? null : createDieRoughness(texSize);

    const dieGeo = buildD30Geometry();
    /* Hand-carved dark walnut — organic, tactile, NOT smooth plastic. */
    const dieMat = new THREE.MeshStandardMaterial({
      color: 0x6e4a28, emissive: 0x140c05, emissiveIntensity: 0.1,
      metalness: 0.0, roughness: isMobile ? 0.82 : 0.8,
      map: albedoMap, bumpMap, bumpScale: isMobile ? 0.02 : 0.028,
      envMap, envMapIntensity: 0.45, flatShading: true,
    });
    if (roughnessMap) {
      dieMat.roughnessMap = roughnessMap;
      dieMat.roughness = 1;
    }
    const die = new THREE.Mesh(dieGeo, dieMat);
    group.add(die);

    /* Aged-gold engraving lines in the carved facet grooves. */
    const edges = createGoldEdges(dieGeo, isMobile ? 0.4 : 0.5);
    group.add(edges);
    const edgeInst = null;

    /* Warm fill light orbits the die (candle highlights sweep the surface). */
    const glow = new THREE.PointLight(0xffc070, isMobile ? 0.65 : 1.1, 9);
    glow.position.set(0, 0.5, 2.5);
    scene.add(glow);

    three = {
      canvas, renderer, scene, camera, group, die, dieMat, edges,
      edgeInst, glow,
      albedoMap, bumpMap, roughnessMap, envMap,
      clock: new THREE.Clock(),
      running: false, spin: 0.35, targetSpin: 0.35, wobble: 0,
      camZ: camera.position.z, camTargetZ: camera.position.z,
      baseEnvIntensity: 0.45,
    };

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    three.resize = resize;
    resize();
    window.addEventListener("resize", resize);
  }

  function renderThree(dt, elapsed) {
    if (!three || !three.running) return;
    const g = three.group;

    /* Spin eases toward its target (smooth accel / decel). */
    three.spin += (three.targetSpin - three.spin) * Math.min(1, dt * 2.4);
    g.rotation.y += dt * three.spin;
    g.rotation.x += dt * three.spin * 0.4;

    /* Gentle idle bob + realistic settle wobble. */
    g.position.y = Math.sin(elapsed * 0.8) * 0.04;
    if (three.wobble > 0.001) {
      g.rotation.z = Math.sin(elapsed * 26) * 0.05 * three.wobble;
      three.wobble *= 0.94;
    } else {
      g.rotation.z *= 0.9;
    }

    /* Cinematic camera dolly-in. */
    three.camZ += (three.camTargetZ - three.camZ) * Math.min(1, dt * 1.8);
    three.camera.position.z = three.camZ;

    /* Orbit candle light so highlights travel across engraved facets. */
    const orbitR = isMobile ? 1.8 : 2.2;
    three.glow.position.x = Math.sin(elapsed * 0.85) * orbitR;
    three.glow.position.z = Math.cos(elapsed * 0.85) * orbitR + 1.2;
    three.glow.position.y = 0.35 + Math.sin(elapsed * 1.2) * 0.28;
    three.glow.intensity = (isMobile ? 0.65 : 1.1)
      + Math.sin(elapsed * 3.1) * 0.18
      + (phase === "rolling" ? 0.55 : 0);

    /* Subtle env-map shimmer as wear/patina catches the light. */
    three.dieMat.envMapIntensity = three.baseEnvIntensity
      + Math.sin(elapsed * 2.0) * 0.1
      + (phase === "rolling" ? 0.14 : 0);

    three.renderer.render(three.scene, three.camera);
  }

  function startThreeLoop() {
    if (!three) return;
    three.running = true;
    const tick = () => {
      if (!three.running) { rafId = null; return; }
      const dt = three.clock.getDelta();
      const elapsed = three.clock.getElapsedTime();
      renderThree(dt, elapsed);
      rafId = requestAnimationFrame(tick);
    };
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function stopThreeLoop() {
    if (three) three.running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function teardownThree() {
    stopThreeLoop();
    if (!three) return;
    window.removeEventListener("resize", three.resize);
    try {
      three.die.geometry.dispose();
      three.dieMat.dispose();
      if (three.albedoMap) three.albedoMap.dispose();
      if (three.bumpMap) three.bumpMap.dispose();
      if (three.roughnessMap) three.roughnessMap.dispose();
      if (three.edges) {
        three.edges.geometry.dispose();
        three.edges.material.dispose();
      }
      if (three.edgeInst) {
        three.edgeInst.geometry.dispose();
        three.edgeInst.material.dispose();
      }
      three.envMap.dispose();
      three.renderer.dispose();
    } catch (_e) { /* ignore */ }
    if (els.canvasWrap) els.canvasWrap.innerHTML = "";
    three = null;
  }

  /* ── cinematic phases ─────────────────────────────────────────── */
  function setPhase(next) {
    phase = next;
    modal.dataset.phase = next;
  }

  function showEl(el, on) {
    if (!el) return;
    el.hidden = !on;
  }

  function openGate(contract) {
    buildModal();
    translateModal();
    activeContract = contract;
    modal.classList.add("is-open");
    modal.classList.remove("is-reopen", "is-legendary");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("oracle-open");
    setPhase("gate");
    els.gate.hidden = false;
    els.roll.hidden = true;
    els.result.hidden = true;
    els.holo.hidden = true;
    if (els.stage) els.stage.hidden = false;
    if (els.reopenNote) els.reopenNote.hidden = true;
    if (els.notice) els.notice.hidden = true;
    if (els.promoCode) els.promoCode.hidden = true;
    if (els.arcaneCode) els.arcaneCode.hidden = true;
    if (els.contact) els.contact.hidden = true;
    if (els.channels) els.channels.hidden = true;
    showEl(els.rolling, false);
  }

  function onProceed() {
    closeModal();
    const portal = document.getElementById("portal");
    if (portal) portal.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onPlay() {
    if (!activeContract) return;
    if (!canRoll(activeContract.key)) {
      const saved = getRecord(activeContract.key);
      if (saved && isRecordValid(saved)) showSavedResult(saved);
      return;
    }
    els.gate.hidden = true;
    els.roll.hidden = false;
    els.result.hidden = true;
    els.holo.hidden = true;
    if (els.stage) els.stage.hidden = false;
    if (els.reopenNote) els.reopenNote.hidden = true;
    if (els.notice) els.notice.hidden = true;
    if (els.promoCode) els.promoCode.hidden = true;
    if (els.arcaneCode) els.arcaneCode.hidden = true;
    if (els.contact) els.contact.hidden = true;
    showEl(els.rolling, false);
    setPhase("ready");
    preloadLevelUp();

    if (reducedMotion) {
      runReducedMotionRoll(activeContract);
      return;
    }

    bootstrapThree();
    startThreeLoop();
    if (three) {
      three.spin = 0.35;
      three.targetSpin = 0.35;
      three.wobble = 0;
      three.camTargetZ = isMobile ? 5.4 : 5.0;
      three.camZ = three.camTargetZ;
    }
    /* Auto-roll after a brief beat — no tap required. */
    setTimeout(() => beginRoll(), 400);
  }

  function beginRoll() {
    showEl(els.rolling, true);
    els.holo.hidden = false;
    setPhase("rolling");

    rollResult = rollD30();
    const reward = rewardFor(rollResult);

    if (three) three.targetSpin = isMobile ? 10 : 14;

    const start = performance.now();
    const spinDur = isMobile ? 2000 : 2600;

    const step = (now) => {
      const tt = (now - start) / spinDur;
      if (tt < 1) {
        if (now % 2 < 1.2 || tt > 0.7) {
          els.holoNum.textContent = String(1 + Math.floor(Math.random() * 30));
        }
        if (three) three.targetSpin = (isMobile ? 10 : 14) * Math.pow(1 - tt, 2.2) + 0.2;
        requestAnimationFrame(step);
      } else {
        els.holoNum.textContent = String(rollResult);
        if (three) {
          three.targetSpin = 0.25;
          three.wobble = 0.8;
        }
        showEl(els.rolling, false);
        setTimeout(() => revealResult(reward), 400);
      }
    };
    requestAnimationFrame(step);
  }

  function updateContactLinks(rec) {
    if (!rec || !els.wa || !els.email) return;
    els.wa.href = buildWhatsAppUrl(rec);
    els.email.href = buildMailto(rec);
  }

  function onContactClick() {
    if (!els.channels || !els.activeRecord) return;
    els.channels.hidden = !els.channels.hidden;
  }

  function onPromotionExpired(contractId) {
    removeRecord(contractId);
    removeContractBadge(contractId);
    els.activeRecord = null;
    if (modal && modal.classList.contains("is-open")
        && activeContract && activeContract.key === contractId) {
      closeModal();
    }
  }

  /* RPG-style "level up" moment for a legendary roll: the celebratory
     stinger + a burst overlay (rays, expanding rings, sparks, banner).
     Only fires on a FRESH discovery, never on reopen, so it stays special. */
  function celebrateLegendary() {
    playLevelUpSound();
    if (reducedMotion || !els.levelup) return;
    els.levelup.setAttribute("aria-hidden", "false");
    els.levelup.classList.remove("is-playing");
    /* Force reflow so re-adding the class restarts the animation. */
    void els.levelup.offsetWidth;
    els.levelup.classList.add("is-playing");
    window.clearTimeout(celebrateLegendary._t);
    celebrateLegendary._t = window.setTimeout(() => {
      if (els.levelup) {
        els.levelup.classList.remove("is-playing");
        els.levelup.setAttribute("aria-hidden", "true");
      }
    }, 3400);
  }

  function revealResult(reward) {
    setPhase("result");
    const record = persistReward(activeContract, reward);
    els.activeRecord = record;
    showResultPanel(reward, activeContract, record, { isReopen: false });
    if (reward.tipo === "legend") celebrateLegendary();
    if (three) three.targetSpin = 0.15;
  }

  function showResultPanel(reward, contract, record, opts) {
    const isReopen = opts && opts.isReopen;
    const isLegend = reward.tipo === "legend";
    modal.classList.toggle("is-legendary", isLegend);
    modal.classList.toggle("is-reopen", !!isReopen);
    els.result.hidden = false;
    els.resultNum.textContent = String(reward.roll);

    if (els.reopenNote) {
      els.reopenNote.hidden = !isReopen;
      if (isReopen) els.reopenNote.textContent = t("oracle.reopen.title");
    }
    if (els.notice) {
      els.notice.hidden = isReopen;
      if (!isReopen) els.notice.textContent = t("oracle.notice.registered");
    }

    if (isLegend) {
      const lk = reward.legendKey || (record && record.legendKey);
      els.resultTitle.textContent = t("oracle.legend.title");
      els.resultCopy.textContent = t("oracle.legend.intro") + " "
        + (lk ? t("oracle.legend." + lk + ".name") + " — " + t("oracle.legend." + lk + ".desc") : "")
        + " " + t("oracle.legend.note");
    } else {
      els.resultTitle.textContent = t("oracle.result.intro");
      els.resultCopy.textContent = t("oracle.result.discount", { valor: reward.valor });
    }
    els.resultContract.textContent = t("oracle.contract") + ": " + (contract ? contract.name : "");

    if (record && els.promoCode && els.promoVal) {
      els.promoCode.hidden = false;
      els.promoVal.textContent = record.promotionId || "—";
    }
    if (record && els.arcaneCode && els.arcaneVal) {
      els.arcaneCode.hidden = false;
      els.arcaneVal.textContent = ensureArcaneCode(record);
    }

    if (els.contact) els.contact.hidden = false;
    if (els.channels) els.channels.hidden = true;
    els.activeRecord = record || getRecord(contract && contract.key);
    updateContactLinks(els.activeRecord);
    highlightRewardRow(reward.roll);

    const expMs = record
      ? (record.expiresAtMs != null ? record.expiresAtMs : Date.parse(record.expiresAt))
      : Date.now() + (reward.expiresMs || BONUS_MS);
    startCountdown(expMs, contract ? contract.key : null);
  }

  function showSavedResult(record) {
    setPhase("saved");
    els.gate.hidden = true;
    els.roll.hidden = false;
    if (els.stage) els.stage.hidden = true;
    els.holo.hidden = true;
    showEl(els.rolling, false);
    stopThreeLoop();
    teardownThree();

    const contract = { key: record.contractId, name: record.contractName };
    els.activeRecord = record;
    showResultPanel(recordToReward(record), contract, record, { isReopen: true });
  }

  function runReducedMotionRoll(contract) {
    rollResult = rollD30();
    const reward = rewardFor(rollResult);
    setPhase("result");
    const record = persistReward(contract, reward);
    els.holo.hidden = false;
    els.holoNum.textContent = String(rollResult);
    showResultPanel(reward, contract, record, { isReopen: false });
    if (reward.tipo === "legend") celebrateLegendary();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open", "is-legendary", "is-reopen");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("oracle-open");
    setPhase("idle");
    stopThreeLoop();
    setTimeout(teardownThree, 300);
    if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
    if (els.channels) els.channels.hidden = true;
    if (els.levelup) {
      els.levelup.classList.remove("is-playing");
      els.levelup.setAttribute("aria-hidden", "true");
    }
    window.clearTimeout(celebrateLegendary._t);
    els.activeRecord = null;
  }

  /* ── countdown ────────────────────────────────────────────────── */
  function setCd(unit, val) {
    const n = modal && modal.querySelector('[data-cd="' + unit + '"]');
    if (n) n.textContent = String(val).padStart(2, "0");
  }

  function startCountdown(expiresAtMs, contractId) {
    if (cdTimer) clearInterval(cdTimer);
    const tick = () => {
      let ms = Math.max(0, expiresAtMs - Date.now());
      const d = Math.floor(ms / 86400000); ms -= d * 86400000;
      const h = Math.floor(ms / 3600000); ms -= h * 3600000;
      const m = Math.floor(ms / 60000); ms -= m * 60000;
      const s = Math.floor(ms / 1000);
      setCd("d", d); setCd("h", h); setCd("m", m); setCd("s", s);
      if (expiresAtMs - Date.now() <= 0) {
        if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
        if (contractId) onPromotionExpired(contractId);
      }
    };
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  /* ── triggers ─────────────────────────────────────────────────── */
  function bindContracts() {
    document.querySelectorAll("#contracts .contract__cta").forEach((cta) => {
      cta.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const contract = indexContractFromCta(cta);
        const saved = getRecord(contract.key);
        if (saved && isRecordValid(saved)) {
          activeContract = contract;
          buildModal();
          translateModal();
          modal.classList.add("is-open");
          modal.setAttribute("aria-hidden", "false");
          document.body.classList.add("oracle-open");
          showSavedResult(saved);
          return;
        }
        openGate(contract);
      });
    });
  }

  /* ── init ─────────────────────────────────────────────────────── */
  function init() {
    if (started) return;
    if (!document.getElementById("contracts")) return;
    started = true;

    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      window.matchMedia("(max-width: 767px)").matches;

    purgeExpired();
    bindContracts();
    restoreBadges();
    window.addEventListener("langchange", translateModal);
  }

  return { init, close: closeModal };
})();

window.OracleD30 = OracleD30;

/* Defensive auto-init: even if an earlier module in main.js throws and
   interrupts the bootstrap chain (so OracleD30.init() is never reached),
   the Fate Event must still bind to the contracts. The internal `started`
   guard makes this idempotent with the explicit main.js call. */
(function autoInitOracleD30() {
  const boot = () => { try { OracleD30.init(); } catch (_e) { /* ignore */ } };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
