/**
 * Crystals · Memory Crystals (Three.js WebGL)
 *
 * Each GitHub repository becomes a real 3D translucent crystal floating
 * in depth over the skill-tree wallpaper. Click opens the Memory Vault.
 */
const Crystals = {
  GITHUB_USER: "Zavsolrac",
  projects: [],
  active: null,

  /* ------------------------------------------------------------------ *
   *  RARITY SYSTEM
   * ------------------------------------------------------------------ */
  RARITIES: {
    common: {
      label: "Comum",
      depth: 3,
      scale: 0.5,
      halo: 0.5,
      transmission: 0.68,
      thickness: 0.7,
      iridescence: 0.12,
      variants: [
        { light: "#A9F2C7", mid: "#3FD68B", dark: "#0E5A3C" },
        { light: "#9CECD2", mid: "#3CB89A", dark: "#114F46" },
        { light: "#B6E8B0", mid: "#5BC07A", dark: "#1F5E2B" },
      ],
    },
    rare: {
      label: "Raro",
      depth: 6,
      scale: 0.85,
      halo: 0.95,
      transmission: 0.76,
      thickness: 1.0,
      iridescence: 0.32,
      variants: [
        { light: "#A4D8F2", mid: "#3F9CD6", dark: "#13355C" },
        { light: "#9DD2E8", mid: "#4D7FB8", dark: "#1B3052" },
        { light: "#B0CDE4", mid: "#5C7CA1", dark: "#1F2D44" },
      ],
    },
    epic: {
      label: "Épico",
      depth: 11,
      scale: 1.18,
      halo: 1.4,
      transmission: 0.84,
      thickness: 1.2,
      iridescence: 0.55,
      variants: [
        { light: "#D9B4F2", mid: "#9B5CD9", dark: "#3F1A6B" },
        { light: "#E1B8E8", mid: "#B262C9", dark: "#5A2280" },
        { light: "#C5A5F5", mid: "#7B5CE0", dark: "#2E1A75" },
      ],
    },
    legendary: {
      label: "Lendário",
      depth: 16,
      scale: 1.6,
      halo: 1.85,
      transmission: 0.88,
      thickness: 1.4,
      iridescence: 0.75,
      variants: [
        { light: "#F4E1A6", mid: "#E5BEAE", dark: "#A13E1E" },
        { light: "#F2D2A4", mid: "#D6A06B", dark: "#8C5A2C" },
        { light: "#F5E8B7", mid: "#D9C16B", dark: "#7A5C1A" },
      ],
    },
  },

  /* Three.js runtime state */
  _three: null,
  _uid: 0,
  _hovered: null,
  _burstId: null,
  _crystalPointerActive: false,
  _lastCrystalInteract: 0,
  _mouse: { x: 0, y: 0, tx: 0, ty: 0 },
  _raycaster: null,
  _pointer: null,
  _visible: false,
  _reducedMotion: false,

  hash(str = "") {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  },

  pickShape(p) {
    if (p.rarity === "legendary") return "obelisk";
    if (p.rarity === "epic") return "octa";
    if (p.rarity === "rare") return "hex";
    return "shard";
  },

  pickVariant(p) {
    const tier = this.RARITIES[p.rarity];
    return tier.variants[this.hash(p.name) % tier.variants.length];
  },

  detectType(repo) {
    const topics = (repo.topics || []).map((t) => t.toLowerCase());
    const lang = (repo.language || "").toLowerCase();
    const name = (repo.name || "").toLowerCase();

    if (
      topics.some((t) => ["ai", "ml", "llm", "openai", "rag", "agent", "ia"].includes(t)) ||
      /\b(ai|llm|agent|gpt)\b/.test(name)
    )
      return "Aplicação IA";
    if (topics.includes("dashboard") || /dash|metric/.test(name)) return "Dashboard";
    if (topics.includes("opensource") || topics.includes("open-source")) return "Projeto Open Source";
    if (topics.includes("landing") || /landing/.test(name)) return "Landing Page";
    if (topics.includes("portfolio") || /portif|portfo/.test(name)) return "Portfólio";
    if (topics.some((t) => ["automation", "n8n", "scraper", "bot"].includes(t))) return "Ferramenta Interna";
    if (lang === "html" || lang === "css") return "Landing Page";
    if (lang === "python") return "Ferramenta Interna";
    if (["javascript", "typescript", "vue", "astro"].includes(lang)) return "Sistema Web";
    return "Sistema Web";
  },

  assignRarity(repo) {
    const stars = repo.stargazers_count || repo.stars || 0;
    const size = repo.size || 0;
    const topics = (repo.topics || []).length;
    const desc = repo.description ? 1 : 0;
    let score = stars * 6 + topics * 2 + desc + Math.min(8, Math.floor(size / 200));
    if (/portif|portfo/i.test(repo.name)) score += 6;
    if ((repo.topics || []).some((t) => /ai|llm|agent/i.test(t))) score += 4;
    return score;
  },

  detectCaseStudy(repo) {
    if (repo.homepage && /carlosvaz|notion|medium|vercel|gitbook/.test(repo.homepage)) return repo.homepage;
    return repo.html_url + "#readme";
  },

  /* ------------------------------------------------------------------ *
   *  INIT
   * ------------------------------------------------------------------ */
  init() {
    this.canvas = document.getElementById("crystal-canvas");
    this.overlay = document.getElementById("crystal-overlay");
    this.loader = document.getElementById("crystal-loader");
    this.section = document.getElementById("memories");

    /* Unified wallpaper plane.
       The crystal canvas now lives inside .tree-wall and shares the
       same fixed full-viewport plane as the skill-tree canvases. We
       use the parent (the tree-wall) as the sizing reference for the
       Three.js renderer and as the rect for raycasting / parallax. */
    this.field = this.canvas?.parentElement || document.getElementById("tree-wall");

    this.vault = document.getElementById("crystal-vault");
    this.vaultStage = this.vault?.querySelector(".crystal-vault__stage");
    this.vaultBackdrop = document.getElementById("crystal-vault-backdrop");
    this.vaultClose = document.getElementById("crystal-vault-close");
    /* `vault-gem` is the cinematic 3D crystal (Three.js mini-scene) in
       the left column. Kept across the relic-card refactor. */
    this.vaultGem = document.getElementById("vault-gem");
    this.vaultParticles = document.getElementById("vault-particles");
    this.vaultTags = document.getElementById("vault-tags");
    this.vaultTitle = document.getElementById("vault-title");
    this.vaultType = document.getElementById("vault-type");
    this.vaultRarity = document.getElementById("vault-rarity");
    this.vaultDesc = document.getElementById("vault-desc");
    this.vaultShot = document.getElementById("vault-shot");
    /* `vault-visit` and `vault-case` were removed by the relic-card
       refactor (single "Open Artifact" CTA → GitHub). Lookups stay
       null-safe so existing `if (this.vaultVisit)` guards are no-ops. */
    this.vaultVisit = document.getElementById("vault-visit");
    this.vaultGithub = document.getElementById("vault-github");
    this.vaultCase = document.getElementById("vault-case");

    if (!this.canvas || !this.field || !this.vault) return;

    this._reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* GUIDED TOUR · lookups + arrow-key navigation */
    this.vaultTourPrev = document.getElementById("vault-tour-prev");
    this.vaultTourNext = document.getElementById("vault-tour-next");
    this.vaultTourCounterCurrent = document.getElementById("vault-tour-counter-current");
    this.vaultTourCounterTotal   = document.getElementById("vault-tour-counter-total");

    this.vaultClose?.addEventListener("click", () => this.close());
    this.vaultBackdrop?.addEventListener("click", () => this.close());
    this.vaultTourPrev?.addEventListener("click", () => this.tourPrev());
    this.vaultTourNext?.addEventListener("click", () => this.tourNext());
    document.addEventListener("keydown", (e) => {
      if (!this.vault.classList.contains("is-open")) return;
      if (e.key === "Escape") this.close();
      if (!this._tourActive) return;
      if (e.key === "ArrowRight") { e.preventDefault(); this.tourNext(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); this.tourPrev(); }
    });

    /* Any element flagged with [data-open-tour] (the "Explorar Relíquias"
       button in the Memory Crystals section, plus the legacy hero
       "Ver Cristais" CTA) opens the guided relic-card tour instead of the
       default anchor-scroll. The href stays as a graceful no-JS fallback.
       Bound by attribute so the trigger can never be orphaned again by a
       button rename/id change. */
    const tourTriggers = document.querySelectorAll(
      "[data-open-tour], #hero-cta-crystals"
    );
    tourTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        this.openTour();
      });
    });

    window.addEventListener("langchange", () => this.updateCaptions());

    /* Starfield removed: the skill-tree wallpaper already paints the
       cosmic backdrop. There is no separate ambient layer behind the
       crystals — they sit directly on the tree. */
    this.bindParallax();
    this.bindVisibility();
    this.bindSingularity();
    this.fetch();
  },

  /* ------------------------------------------------------------------ *
   *  ACT III · SINGULARITY (Big Bang) controller
   * ------------------------------------------------------------------
   *  Wired to narrative.js via a MutationObserver on the #memories
   *  section: whenever the visitor enters that act, narrative.js
   *  flips data-narrative-entered="true" and we trigger the
   *  three-phase singularity sequence:
   *
   *     A · IMPLOSION  (1.1s, easeInQuad)
   *         every crystal lerps from its home position toward
   *         (0,0,0) — gravity collapses the whole field.
   *     B · BIG BANG   (0.6s)
   *         a spin boost and brief hold at the singularity,
   *         followed by a CSS-driven flash flooding the
   *         memories section.
   *     C · EXPANSION  (1.8s, easeOutQuart)
   *         each crystal flies back to its home with a
   *         cinematic deceleration. A 0.1 overshoot near the
   *         end of the curve adds the "fresh constellation"
   *         feel.
   *
   *  Implementation note: the actual position lerp happens inside
   *  animateCrystal() — this method only manages a small state
   *  object (this._singularity) that animateCrystal reads each
   *  frame. That keeps the per-frame work O(1) extra per crystal.
   * ------------------------------------------------------------------ */
  bindSingularity() {
    if (!this.section) return;
    if (this._reducedMotion) return;
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type !== "attributes") continue;
        if (r.attributeName !== "data-narrative-entered") continue;
        if (this.section.dataset.narrativeEntered === "true") {
          this.triggerSingularity();
        }
      }
    });
    observer.observe(this.section, {
      attributes: true,
      attributeFilter: ["data-narrative-entered"],
    });
  },

  triggerSingularity() {
    /* Skip if another singularity is already in flight, otherwise
       overlapping invocations would create position glitches. */
    if (this._singularity && this._singularity.running) return;
    /* Need a live three.js scene with at least one crystal. */
    if (!this._three || !this._three.crystals || !this._three.crystals.length) {
      /* Try again shortly — crystals may not have loaded yet
         when the section first enters the viewport. */
      window.setTimeout(() => this.triggerSingularity(), 250);
      return;
    }

    const sg = {
      running:   true,
      start:     performance.now(),
      away:      1,   // 1 = at home, 0 = at singularity (driven by lerp)
      spinBoost: 0,   // extra rotation per frame during the Big Bang
      /* Phase boundaries in milliseconds: */
      implode:   1100,
      hold:      300,
      expand:    1800,
    };
    sg.total = sg.implode + sg.hold + sg.expand;
    this._singularity = sg;

    /* Trigger the CSS-side flash (Big Bang halo + section glow). */
    this.section.classList.add("memories--big-bang");

    const tick = () => {
      const now = performance.now();
      const t   = now - sg.start;

      if (t < sg.implode) {
        /* PHASE A · IMPLOSION
           Smooth easeInQuad pulls every crystal toward the singularity.
           away goes from 1 to 0 across the implosion. */
        const p = t / sg.implode;
        const eased = p * p;                   // easeInQuad
        sg.away = 1 - eased;
        sg.spinBoost = eased * 0.04;           // gentle spin-up
      } else if (t < sg.implode + sg.hold) {
        /* PHASE B · BIG BANG
           Crystals are at the singularity point. Spin boost peaks. */
        sg.away = 0;
        sg.spinBoost = 0.12;
      } else if (t < sg.total) {
        /* PHASE C · EXPANSION
           easeOutQuart sends every crystal back home with a
           cinematic deceleration. away ramps 0 → 1 + slight
           overshoot (1.04) → 1. */
        const p = (t - sg.implode - sg.hold) / sg.expand;
        const eased = 1 - Math.pow(1 - p, 4);  // easeOutQuart
        /* Overshoot kicker: a 1.06 peak around 75% then settles. */
        const overshoot = Math.sin(p * Math.PI) * 0.06;
        sg.away = Math.min(1.08, eased + overshoot * (1 - p * 0.4));
        sg.spinBoost = (1 - p) * 0.08;
      } else {
        /* Done — release control, normal drift resumes next frame. */
        sg.away = 1;
        sg.spinBoost = 0;
        this._singularity = null;
        this.section.classList.remove("memories--big-bang");
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  bindVisibility() {
    /* The crystal scene is now part of the global wallpaper, so it
       must keep rendering at every scroll position. We only pause
       when the browser tab is hidden (perf optimisation). */
    this._visible = true;
    document.addEventListener("visibilitychange", () => {
      const v = !document.hidden;
      this._visible = v;
      if (this._three) this._three.running = v;
    });
  },

  bindParallax() {
    /* Parallax now tracks the cursor across the ENTIRE viewport.
       Previously it was scoped to the rectangular .memories section
       (the old stage). Now that crystals live globally on the tree
       wallpaper, the parallax must respond wherever the cursor is. */
    const target = this.section;
    if (!target || this._reducedMotion) return;
    const isTouchWallpaper = window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      window.matchMedia("(max-width: 767px)").matches;
    if (isTouchWallpaper) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e) => {
      if (document.querySelector(".crystal-vault.is-open")) return;
      if (document.body.classList.contains("ktree-open")) return;
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      tx = (e.clientX / w - 0.5) * 2;
      ty = (e.clientY / h - 0.5) * 2;
      this._mouse.tx = tx;
      this._mouse.ty = ty;
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      target.style.setProperty("--mx", cx.toFixed(3));
      target.style.setProperty("--my", cy.toFixed(3));
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    window.addEventListener("pointermove", onMove);
  },

  /** Always true — the crystal field now spans the entire viewport.
   *  Skill-tree input blocking still gates on `_hovered` (a real
   *  3D crystal must be under the cursor). */
  isInCrystalField(_clientX, _clientY) {
    return !!this.field;
  },

  /** Panels that should block skill-tree interaction. */
  isOverMemoriesUI(target) {
    if (!target || !(target instanceof Element)) return false;
    return !!target.closest(
      ".memories__head, .crystal-caption, .crystal-loader, .crystal-vault"
    );
  },

  updateCrystalPointer(clientX, clientY) {
    if (!this._raycaster) return;
    /* Use viewport coordinates directly — the canvas is fullscreen. */
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    this._pointer.x = (clientX / w) * 2 - 1;
    this._pointer.y = -(clientY / h) * 2 + 1;
  },

  spawnStarfield() {
    /* No-op. The starfield container was part of the old rectangular
       stage and was removed. The skill-tree wallpaper paints its own
       cosmic backdrop behind the crystals. */
  },

  /* ------------------------------------------------------------------ *
   *  FETCH GITHUB
   * ------------------------------------------------------------------ */
  async fetch() {
    try {
      const res = await fetch(
        `https://api.github.com/users/${this.GITHUB_USER}/repos?sort=updated&per_page=24`
      );
      if (!res.ok) throw new Error("GitHub API error");
      const data = await res.json();
      const repos = data
        .filter((r) => !r.fork || r.stargazers_count > 0)
        .sort((a, b) => (b.stargazers_count - a.stargazers_count) || b.size - a.size)
        .slice(0, 9);
      this.projects = repos.length ? repos.map((r) => this.mapRepo(r)) : this.fallback();
    } catch {
      this.projects = this.fallback();
    }
    /* Apply manual identity rewrites BEFORE rarity distribution so
       overridden titles/links propagate to every downstream layer
       (captions, modal, ARIA, search, etc.). */
    this.projects.forEach((p) => this.applyIdentityOverride(p));
    this.distributeRarity();
    this.bootstrapScene();
  },

  distributeRarity() {
    this.projects.forEach((p) => {
      if (typeof p.score !== "number") {
        p.score = this.assignRarity({
          name: p.name,
          stargazers_count: p.stars,
          topics: p.topics,
          size: 0,
          description: p.description,
        });
      }
    });
    this.projects.sort((a, b) => b.score - a.score);

    const tiers = ["legendary", "epic", "epic", "rare", "rare", "rare"];
    this.projects.forEach((p, i) => {
      p.rarity = tiers[i] || "common";
      p.shape = this.pickShape(p);
      const v = this.pickVariant(p);
      p.colors = {
        light: v.light,
        mid: v.mid,
        dark: v.dark,
        glow: this.toGlow(v.mid),
      };
    });
  },

  toGlow(hex) {
    const m = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || "");
    if (!m) return "rgba(229,190,174,0.6)";
    const [r, g, b] = [m[1], m[2], m[3]].map((v) => parseInt(v, 16));
    return `rgba(${r}, ${g}, ${b}, 0.55)`;
  },

  /* ================================================================== *
   *  GUIDED TOUR · curated 4-project sequence opened from the hero
   *  "Ver Cristais" CTA. The visitor lands on the FIRST project and
   *  navigates with arrow buttons (or ←/→ keys). Tour projects are
   *  declared declaratively here so they don't depend on the GitHub
   *  API being reachable — they always render in the exact order
   *  curated below, with hand-tuned palette + thumbnail.
   *
   *  Each entry mirrors the shape produced by mapRepo() so it can be
   *  fed straight into Crystals.open(). Thumbnails point to the
   *  manuscript-style relics already used in the Codex of Contracts.
   * ================================================================== */
  TOUR_PROJECTS: [
    {
      id: "tour-1-arracada-ia",
      name: "novo-arracadavds",
      title: "Arracada VDS · IA",
      description:
        "Memória viva do linho galego cristalizada em IA, RAG e arquivo dixital. Plataforma cultural que une intelixencia artificial e patrimônio rural.",
      url:        "https://zavsolrac.github.io/novo-arracadavds/",
      githubUrl:  "https://zavsolrac.github.io/novo-arracadavds/",
      caseUrl:    "https://zavsolrac.github.io/novo-arracadavds/",
      stars: 0, language: "JavaScript",
      topics: ["ai", "rag", "cultural-heritage"],
      type: "AI · Cultural Platform",
      score: 100,
      tech: ["IA", "RAG", "OpenAI", "HTML", "CSS", "JS"],
      updated: "2026",
      rarity: "legendary",
      shape: "obelisk",
      colors: {
        light: "#FFD876", mid: "#C2882B", dark: "#5A3210",
        glow: "rgba(255, 216, 118, 0.60)",
      },
      localShot: "src/assets/contracts/relic-arracada-ia.webp",
    },
    {
      id: "tour-2-arracada",
      name: "arracada-vds",
      title: "Associação Arracada",
      description:
        "Portal institucional da Associação de Mulleres Rurais Arracada — preservação do linho galego e tradições ancestrais de Vilar de Santos.",
      url:        "https://www.arracadavds.org/",
      githubUrl:  "https://www.arracadavds.org/",
      caseUrl:    "https://www.arracadavds.org/",
      stars: 0, language: "HTML",
      topics: ["cultural", "institutional", "heritage"],
      type: "Portal Institucional",
      score: 85,
      tech: ["HTML", "CSS", "JavaScript"],
      updated: "2024",
      rarity: "epic",
      shape: "hex",
      colors: {
        light: "#B6D1FF", mid: "#5878C8", dark: "#1F2D5A",
        glow: "rgba(182, 209, 255, 0.55)",
      },
      localShot: "src/assets/contracts/relic-arracada.webp",
    },
    {
      id: "tour-3-allariz",
      name: "projeto-allariz",
      title: "Studio Allariz",
      description:
        "Landing page premium para estudio de design de interiores galego — narrativa visual sóbria, identidade temática e experiência responsiva.",
      url:        "https://zavsolrac.github.io/projeto-allariz/",
      githubUrl:  "https://zavsolrac.github.io/projeto-allariz/",
      caseUrl:    "https://zavsolrac.github.io/projeto-allariz/",
      stars: 0, language: "HTML",
      topics: ["landing-page", "design", "interior"],
      type: "Landing Page",
      score: 70,
      tech: ["HTML", "CSS", "JS"],
      updated: "2026",
      rarity: "rare",
      shape: "octa",
      colors: {
        light: "#D7A988", mid: "#8C5A2F", dark: "#3A1F0E",
        glow: "rgba(215, 169, 136, 0.55)",
      },
      localShot: "src/assets/contracts/relic-allariz.webp",
    },
    {
      id: "tour-4-portfolio",
      name: "exemplo-porfifoleo",
      title: "The Alchemical Archive",
      description:
        "Portfólio profissional em formato grimório alquímico — narrativa RPG aplicada ao desenvolvimento web, com integração GitHub e storytelling visual.",
      url:        "https://zavsolrac.github.io/exemplo-porfifoleo/",
      githubUrl:  "https://zavsolrac.github.io/exemplo-porfifoleo/",
      caseUrl:    "https://zavsolrac.github.io/exemplo-porfifoleo/",
      stars: 0, language: "JavaScript",
      topics: ["portfolio", "rpg", "alchemy"],
      type: "Portfólio Pessoal",
      score: 65,
      tech: ["HTML", "CSS", "JS", "GSAP"],
      updated: "2026",
      rarity: "rare",
      shape: "shard",
      colors: {
        light: "#8FE3FF", mid: "#3E8BC0", dark: "#0E2D4A",
        glow: "rgba(143, 227, 255, 0.55)",
      },
      localShot: "src/assets/contracts/relic-portfolio.webp",
    },
  ],

  /* Internal tour state */
  _tourActive: false,
  _tourIndex:  0,

  /* Pretty Roman numerals for the tour counter (I, II, III, IV…). */
  toRoman(n) {
    const map = [
      [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
      [100,  "C"], [90,  "XC"], [50,  "L"], [40,  "XL"],
      [10,   "X"], [9,   "IX"], [5,   "V"], [4,   "IV"], [1, "I"],
    ];
    let s = "", x = Math.max(1, Math.floor(n));
    for (const [v, sym] of map) { while (x >= v) { s += sym; x -= v; } }
    return s;
  },

  /* Enter tour mode and surface the first curated project. */
  openTour() {
    if (!this.TOUR_PROJECTS?.length) return;
    this._tourActive = true;
    this._tourIndex  = 0;
    this.open(this.TOUR_PROJECTS[0]);
    this.updateTourUI();
  },
  tourNext() {
    if (!this._tourActive) return;
    const len = this.TOUR_PROJECTS.length;
    this._tourIndex = (this._tourIndex + 1) % len;
    this.open(this.TOUR_PROJECTS[this._tourIndex]);
    this.updateTourUI();
  },
  tourPrev() {
    if (!this._tourActive) return;
    const len = this.TOUR_PROJECTS.length;
    this._tourIndex = (this._tourIndex - 1 + len) % len;
    this.open(this.TOUR_PROJECTS[this._tourIndex]);
    this.updateTourUI();
  },
  updateTourUI() {
    if (!this.vaultStage) return;
    if (this._tourActive) {
      this.vaultStage.dataset.tour = "true";
      if (this.vaultTourCounterCurrent)
        this.vaultTourCounterCurrent.textContent = this.toRoman(this._tourIndex + 1);
      if (this.vaultTourCounterTotal)
        this.vaultTourCounterTotal.textContent   = this.toRoman(this.TOUR_PROJECTS.length);
    } else {
      delete this.vaultStage.dataset.tour;
    }
  },

  /* ------------------------------------------------------------------ *
   *  IDENTITY OVERRIDES
   *  -----------------------------------------------------------------
   *  Some GitHub repos are practice clones whose surfaced identity in
   *  the Memory Crystals should redirect to the live institutional
   *  project they ended up powering. Each rule matches against the
   *  normalised repo slug (lowercase, hyphens/underscores → spaces)
   *  and may rewrite the title, description, and the three link
   *  fields (url / githubUrl / caseUrl). Only the FIRST matching
   *  rule per project fires.
   *
   *  Crystal placement (NAME_OVERRIDES, below) and rarity scoring
   *  remain unaffected — those still operate on the raw repo name.
   * ------------------------------------------------------------------ */
  IDENTITY_OVERRIDES: [
    {
      /* "praticando-clone-flappy-bird" → surface Associação Arracada,
         the institutional Galician linen-craft portal. The original
         repo is a Flappy Bird study clone; the crystal now leads
         visitors to the public-facing work it inspired. */
      test: (n) => /\bbird\b|\bflappy\b/i.test(n),
      apply: (p) => {
        p.title       = "Associação Arracada";
        p.description = "Portal institucional da Associação Arracada — preservação do linho galego e tradições rurais.";
        p.url         = "https://www.arracadavds.org";
        p.githubUrl   = "https://www.arracadavds.org";
        p.caseUrl     = "https://www.arracadavds.org";
      },
    },
  ],

  applyIdentityOverride(p) {
    if (!p || !p.name) return p;
    const norm = String(p.name).toLowerCase().replace(/[-_]+/g, " ");
    for (const rule of this.IDENTITY_OVERRIDES) {
      if (rule.test(norm)) {
        rule.apply(p);
        break;
      }
    }
    return p;
  },

  mapRepo(r) {
    const score = this.assignRarity(r);
    return {
      id: r.id,
      name: r.name,
      title: this.prettifyName(r.name),
      description:
        r.description ||
        "Memória cristalizada de uma incursão real. Conhecimento absorvido pela árvore.",
      url: r.homepage || r.html_url,
      githubUrl: r.html_url,
      caseUrl: this.detectCaseStudy(r),
      stars: r.stargazers_count || 0,
      language: r.language || "Code",
      topics: (r.topics || []).slice(0, 6),
      type: this.detectType(r),
      score,
      tech: this.collectTech(r),
      updated: new Date(r.updated_at || Date.now()).toLocaleDateString(),
    };
  },

  prettifyName(name) {
    return name
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/Ai\b/g, "AI")
      .trim();
  },

  collectTech(r) {
    const tech = new Set();
    if (r.language) tech.add(r.language);
    (r.topics || []).forEach((t) => {
      const map = {
        react: "React", nextjs: "Next.js", vue: "Vue", astro: "Astro",
        node: "Node.js", nodejs: "Node.js", python: "Python",
        typescript: "TypeScript", javascript: "JavaScript",
        html: "HTML", css: "CSS", tailwindcss: "Tailwind", tailwind: "Tailwind",
        openai: "OpenAI", llm: "LLM", rag: "RAG", ai: "AI", ml: "ML",
        docker: "Docker", threejs: "Three.js", "three-js": "Three.js",
        framer: "Framer Motion", glsl: "GLSL", r3f: "R3F",
      };
      const k = t.toLowerCase();
      if (map[k]) tech.add(map[k]);
      else tech.add(t.toUpperCase());
    });
    return Array.from(tech).slice(0, 6);
  },

  fallback() {
    const seed = (s, lang, topics, stars, desc) => ({
      id: "fallback-" + s,
      name: s,
      title: this.prettifyName(s),
      description: desc,
      url: "https://github.com/Zavsolrac",
      githubUrl: "https://github.com/Zavsolrac",
      caseUrl: "https://github.com/Zavsolrac#readme",
      stars,
      language: lang,
      topics,
      type: this.detectType({ name: s, language: lang, topics }),
      score: stars * 6 + topics.length * 2 + (desc ? 1 : 0),
      tech: this.collectTech({ language: lang, topics }),
      updated: "2026",
    });
    return [
      seed("arcane-architect", "JavaScript", ["portfolio", "canvas", "ai"], 12,
        "Portfólio interativo com árvore de habilidades viva, cristais de memória e narrativa cinematográfica."),
      seed("ai-workflow-lab", "TypeScript", ["ai", "llm", "rag"], 5,
        "Laboratório de pipelines com LLMs, prompt engineering, agentes e RAG."),
      seed("design-system-forge", "CSS", ["design-system", "tokens"], 2,
        "Sistema de design tokenizado para produtos digitais premium, com documentação viva."),
      seed("n8n-orchestrator", "Python", ["automation", "n8n"], 0,
        "Orquestrador de automações com n8n e webhooks personalizados."),
      seed("rag-vault", "Python", ["rag", "embeddings"], 1,
        "Vault de embeddings com retrieval augmented generation e re-ranking."),
      seed("micro-saas-kit", "TypeScript", ["nextjs", "stripe"], 0,
        "Boilerplate completo para micro-SaaS com Next.js, Stripe e Postgres."),
      seed("react-rune-ui", "JavaScript", ["react", "ui"], 0,
        "Biblioteca de componentes inspirada em iconografia rúnica."),
    ];
  },

  /* ================================================================== *
   *  THREE.JS · WebGL crystal field
   * ================================================================== */

  bootstrapScene() {
    if (typeof THREE === "undefined") {
      console.warn("[Crystals] Three.js not loaded — retrying…");
      setTimeout(() => this.bootstrapScene(), 200);
      return;
    }

    if (this.loader) this.loader.style.display = "none";

    const t = {
      running: true,
      crystals: [],
      captions: [],
      clock: new THREE.Clock(),
      envMap: this.createEnvMap(),
      // Mobile: render only long enough for the nebula/crystals to appear
      // and settle, then STOP the rAF loop. A WebGL canvas keeps showing
      // its last frame, so the backdrop stays visible at zero ongoing GPU
      // cost. Re-armed briefly on resize / ktree-close.
      _settleUntil: performance.now() + 3000,
    };

    const scene = new THREE.Scene();
    // Subtle scene fog: only affects rendered geometry (not the clear
    // colour) — distant crystals/nebula fade into the void, reinforcing
    // depth without darkening the canvas as a whole.
    scene.fog = new THREE.Fog(0x040714, 18, 42);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 0, 22);

    const isMobileWallpaper = window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      window.matchMedia("(max-width: 767px)").matches;
    this._mobileWallpaper = isMobileWallpaper;

    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: !isMobileWallpaper,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(isMobileWallpaper ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Lighting — multi-layer: weak ambient + colored directional key/fill
    // + bottom rim (dramatic underglow on legendary crystals).
    scene.add(new THREE.AmbientLight(0x1a2840, 0.30));
    const keyLight = new THREE.DirectionalLight(0xc2d4ff, 0.55);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x4060a0, 0.25);
    fillLight.position.set(-6, -4, 8);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xff7ec7, 0.20); // magenta rim from below
    rimLight.position.set(0, -10, 4);
    scene.add(rimLight);
    const topLight = new THREE.DirectionalLight(0x6bd6ff, 0.18); // cyan crown
    topLight.position.set(0, 14, -2);
    scene.add(topLight);

    // (Arcane Core nucleus removed — visual anomaly per user feedback.
    //  Light comes from the directional rig + crystal emissives only.)

    // ------------------------------------------------------------------
    //  NEBULAE · three layers at different depths (back / mid / front)
    //  All additive-blended so they only LIGHTEN — they can never tint
    //  the canvas darker than what's behind it.
    // ------------------------------------------------------------------
    const buildNebulaLayer = (count, depthRange, sizeRange, hueRange, opacity) => {
      const positions = new Float32Array(count * 3);
      const colors    = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 32;
        positions[i * 3 + 2] = depthRange[0] + Math.random() * (depthRange[1] - depthRange[0]);
        const hue = hueRange[0] + Math.random() * (hueRange[1] - hueRange[0]);
        const c = new THREE.Color().setHSL(hue, 0.55, 0.55);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: sizeRange[1],
        vertexColors: true,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        map: this.createRadialTexture(),
        alphaTest: 0.001,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      return points;
    };

    const baseN = this._reducedMotion ? 0.4 : 1;
    const nebulaBack  = buildNebulaLayer(Math.round(120 * baseN), [-15, -8], [0.04, 0.10], [0.6, 0.8],  0.40);
    const nebulaMid   = buildNebulaLayer(Math.round(70 * baseN),  [-3, 3],   [0.05, 0.12], [0.55, 0.7], 0.32);
    const nebulaFront = buildNebulaLayer(Math.round(40 * baseN),  [4, 9],    [0.06, 0.14], [0.5, 0.65], 0.25);
    const nebula = nebulaMid;

    // Build crystals
    const positions = this.computePositions(this.projects.length);
    this.projects.forEach((p, i) => {
      const pos = positions[i];
      const crystal = this.buildCrystal(p, pos, t.envMap, scene);
      t.crystals.push(crystal);
      const caption = this.createCaption(p, crystal);
      t.captions.push(caption);
      this.overlay?.appendChild(caption.el);
    });

    // Curved 3D tubes connecting nearest crystals (organic constellation)
    t.tubes = this.buildConnections(scene, t.crystals) || [];

    // Raycaster — window-level so the canvas can stay pointer-events:none
    // and the skill tree remains interactive in empty areas.
    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();

    const onWindowPointerMove = (e) => {
      if (document.body.classList.contains("ktree-open")) return;
      // Mobile wallpaper: no hover/raycast. Tracking the pointer here kept
      // `_crystalPointerActive` true during finger-scroll, which defeated
      // the scroll-freeze and idle throttle → WebGL re-rendered (up to
      // 123ms/frame) on every scroll frame. The "Explorar Relíquias"
      // button is the mobile entry point, so direct hover isn't needed.
      if (this._mobileWallpaper) return;
      if (!this.isInCrystalField(e.clientX, e.clientY) || this.isOverMemoriesUI(e.target)) {
        if (this._hovered) {
          const prev = this._hovered;
          this._hovered = null;
          this.setHover(prev, false);
        }
        if (this._crystalPointerActive) {
          this._crystalPointerActive = false;
          if (!document.querySelector(".crystal-vault.is-open")) {
            document.body.style.cursor = "";
          }
        }
        return;
      }
      this._crystalPointerActive = true;
      this._lastCrystalInteract = performance.now();
      this.updateCrystalPointer(e.clientX, e.clientY);
    };

    const onWindowClick = (e) => {
      if (document.body.classList.contains("ktree-open")) return;
      if (!this._hovered) return;
      if (!this.isInCrystalField(e.clientX, e.clientY) || this.isOverMemoriesUI(e.target)) return;
      const proj = this._hovered.userData.project;
      if (proj) this.open(proj, this._hovered);
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("click", onWindowClick);
    this._onWindowPointerMove = onWindowPointerMove;
    this._onWindowClick = onWindowClick;

    const resize = () => {
      const w = this.field.clientWidth;
      const h = this.field.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      // Mobile: a fresh size needs one more render burst, then re-settle.
      if (this._mobileWallpaper && this._three) {
        this._three._settleUntil = performance.now() + 1200;
        this._three._resumeWallpaper?.();
      }
    };
    resize();
    window.addEventListener("resize", resize);

    t.scene = scene;
    t.camera = camera;
    t.renderer = renderer;
    t.nebula = nebula;
    this._three = t;

    const animate = () => {
      /* Do not keep an idle RAF while paused — frees the GPU/CPU for
         the Knowledge Tree overlay. Restart via _resumeWallpaper(). */
      if (!t.running) return;
      // #region agent log
      const __dbgC0 = performance.now();
      window.__crCalls = (window.__crCalls || 0) + 1;
      // #endregion

      const vaultOpen = !!document.querySelector(".crystal-vault.is-open");
      const ktreeOpen = document.body.classList.contains("ktree-open");
      if (vaultOpen || ktreeOpen) return;

      t._frame = (t._frame || 0) + 1;
      const crystalIdle = !this._hovered && !this._crystalPointerActive &&
        performance.now() - (this._lastCrystalInteract || 0) > 2000;
      if (crystalIdle && (t._frame & 1) === 1) {
        requestAnimationFrame(animate);
        return;
      }

      // Freeze the WebGL render while the page is being scrolled (unless
      // the pointer is over the crystal field). The fixed canvas then
      // composites from its cached texture, removing the per-frame draw
      // that competed with scroll compositing.
      if (window.__cvScrolling && !this._hovered && !this._crystalPointerActive) {
        requestAnimationFrame(animate);
        return;
      }

      const dt = t.clock.getDelta();
      const elapsed = t.clock.getElapsedTime();

      // Camera parallax from mouse (smooth easing on dolly + truck)
      if (!this._mobileWallpaper) {
        const mx = parseFloat(this.section?.style.getPropertyValue("--mx") || "0");
        const my = parseFloat(this.section?.style.getPropertyValue("--my") || "0");
        camera.position.x += (mx * 3.0 - camera.position.x) * 0.04;
        camera.position.y += (-my * 1.8 - camera.position.y) * 0.04;
        camera.position.z += ((22 - my * 0.8) - camera.position.z) * 0.03;
        camera.lookAt(0, 0, 0);
      }

      // (Nucleus pulse removed — Arcane Core sphere was a visual anomaly)

      // Nebula slow drift — different speeds per layer for parallax depth
      nebula.rotation.y = elapsed * 0.015;
      nebula.rotation.x = Math.sin(elapsed * 0.08) * 0.05;
      if (nebulaBack)  nebulaBack.rotation.y  = elapsed *  0.008;
      if (nebulaFront) nebulaFront.rotation.y = elapsed * -0.022;

      // Pulse connection tubes (subtle breath)
      if (t.tubes) {
        t.tubes.forEach((tube) => {
          const op = 0.12 + Math.sin(elapsed * 0.8 + tube.userData.aZ * 0.4) * 0.06;
          tube.material.opacity = op;
        });
      }

      // Update each crystal
      t.crystals.forEach((group) => {
        this.animateCrystal(group, elapsed, dt);
        // Update shader uniforms (time + hover)
        const sh = group.userData.material?.userData?.shader;
        if (sh) {
          sh.uniforms.uTime.value = elapsed;
          sh.uniforms.uHover.value = group.userData.hoverEase || 0;
        }
        // Back-to-front sort for correct transparency
        group.renderOrder = -group.position.z * 10;
      });

      // Raycast hover (only while pointer is over the crystal field)
      if (this._crystalPointerActive && !document.querySelector(".crystal-vault.is-open")) {
        this._raycaster.setFromCamera(this._pointer, camera);
        const meshes = t.crystals.map((g) => g.userData.mesh).filter(Boolean);
        const hits = this._raycaster.intersectObjects(meshes, false);
        const prev = this._hovered;
        this._hovered = hits.length ? hits[0].object.parent : null;
        if (prev !== this._hovered) {
          if (prev) this.setHover(prev, false);
          if (this._hovered) this.setHover(this._hovered, true);
        }
        document.body.style.cursor = this._hovered ? "pointer" : "";
      }

      renderer.render(scene, camera);
      this.updateCaptionPositions(t);

      // #region agent log
      window.__crHeavy = (window.__crHeavy || 0) + 1;
      window.__crTime = (window.__crTime || 0) + (performance.now() - __dbgC0);
      window.__dbgCR = (window.__dbgCR || 0) + 1;
      window.__dbgCRms = (window.__dbgCRms || 0) + (performance.now() - __dbgC0);
      window.__dbgCRtouch = this._mobileWallpaper;
      if (!window.__crLast || performance.now() - window.__crLast > 1000) {
        const dt = window.__crLast ? (performance.now() - window.__crLast) / 1000 : 1;
        const info = renderer.info ? renderer.info.render : null;
        fetch('http://127.0.0.1:7279/ingest/89c13b11-4c60-49a0-81e3-64782c804124',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bc6917'},body:JSON.stringify({sessionId:'bc6917',runId:'run1',hypothesisId:'H2',location:'crystals.js:animate',message:'crystals webgl per-sec',data:{rafFps:Math.round((window.__crCalls||0)/dt),heavyFps:Math.round((window.__crHeavy||0)/dt),avgHeavyMs:+((window.__crTime||0)/Math.max(1,window.__crHeavy)).toFixed(2),crystals:t.crystals.length,drawCalls:info?info.calls:-1,triangles:info?info.triangles:-1,innerW:window.innerWidth,dpr:Math.min(window.devicePixelRatio||1,2)},timestamp:Date.now()})}).catch(()=>{});
        window.__crLast = performance.now(); window.__crCalls = 0; window.__crHeavy = 0; window.__crTime = 0;
      }
      // #endregion

      // Mobile: once settled, stop the loop entirely (static backdrop).
      if (this._mobileWallpaper && performance.now() > t._settleUntil &&
          !document.querySelector(".crystal-vault.is-open")) {
        return;
      }

      requestAnimationFrame(animate);
    };
    t._resumeWallpaper = () => {
      if (!t.running) return;
      if (document.querySelector(".crystal-vault.is-open")) return;
      if (document.body.classList.contains("ktree-open")) return;
      requestAnimationFrame(animate);
    };
    animate();
    if (!this._ktreeWallpaperObs) {
      this._ktreeWallpaperObs = new MutationObserver(() => {
        if (!document.body.classList.contains("ktree-open")) t._resumeWallpaper?.();
      });
      this._ktreeWallpaperObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
  },

  createEnvMap() {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "#2a4060");
    grad.addColorStop(0.4, "#0a1428");
    grad.addColorStop(0.7, "#050a18");
    grad.addColorStop(1, "#020408");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    // Add subtle stars
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(200,220,255,${0.2 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  },

  computePositions(count) {
    /* ------------------------------------------------------------------
     *  WANDERING ARTIFACTS · two-phase distribution
     *  ------------------------------------------------------------------
     *  Phase A — VISIBLE BRANCH ANCHORS
     *    5 to 8 crystals are pinned at world-coord anchors that map to
     *    the major skill-tree clusters (Front-End, Back-End, AI, Cloud,
     *    Automação, plus 2 extension anchors). These crystals are the
     *    "discovery seeds": always present in the first viewport, never
     *    inside the Hero exclusion zone, near meaningful skill branches.
     *
     *  Phase B — EXPLORATION SCATTER
     *    The remaining crystals follow the side-biased peripheral
     *    distribution from the previous step (30% mid / 70% periphery,
     *    hero-zone free, no grid / radial / circular patterns).
     *
     *  Phase C — RELAXATION
     *    Mutual repulsion + center-band push + hero repulsion + boundary
     *    pull. Anchored crystals are pinned with a spring back to their
     *    target so they wander only slightly during relaxation.
     * ------------------------------------------------------------------ */
    const positions   = new Array(count);
    const anchorTarget = new Array(count).fill(null);
    const isAnchored  = new Array(count).fill(false);

    const widthSpread  = 13;
    const heightSpread = 6.5;
    const depthSpread  = 9;

    /* Hero exclusion zone (ellipse) — never breached, even after
     * relaxation. */
    const HERO = {
      cx: 0,
      cy: 0.5,
      rx: 5.0,
      ry: 6.5,
    };

    const inHeroZone = (x, y) => {
      const dx = (x - HERO.cx) / HERO.rx;
      const dy = (y - HERO.cy) / HERO.ry;
      return (dx * dx + dy * dy) < 1.0;
    };

    /* ------------------------------------------------------------------
     *  PHASE A · BRANCH ANCHORS
     *
     *  Anchor coordinates were chosen so that, with the camera at
     *  (0, 0, 22) and a 50° FOV, each anchor sits visually next to its
     *  matching skill-tree cluster keystone:
     *
     *      Front-End    (fe)   →  top-right      ( +9.5,  +5.2)
     *      Back-End     (be)   →  right edge     (+12.5,   0.0)
     *      AI           (ai)   →  bottom-right   ( +9.5,  -5.0)
     *      Cloud        (cl)   →  left edge      (-12.5,  +1.6)
     *      Automação    (au)   →  bottom-left    ( -9.5,  -5.0)
     *      Soft Skills  (sk)   →  top-left       (-10.5,  +5.2)
     *      Fundamentos  (fd)   →  far-top corner ( -2.5,  +7.0) (extension)
     *
     *  Z is biased toward the camera (+1) so these crystals sit in the
     *  front layer and read first. The tier-z bias is added later. */
    const ANCHORS = [
      { id: "fe", x:  +9.5, y:  +5.2, z: +1.0 },
      { id: "be", x: +12.5, y:   0.0, z: +1.0 },
      { id: "ai", x:  +9.5, y:  -5.0, z: +1.0 },
      { id: "cl", x: -12.5, y:  +1.6, z: +1.0 },
      { id: "au", x:  -9.5, y:  -5.0, z: +1.0 },
      { id: "sk", x: -10.5, y:  +5.2, z: +1.0 },
      { id: "fd", x:  -2.5, y:  +7.0, z: +1.5 },
    ];

    /* How many crystals to anchor: between 5 and 8, scaled by total
     * count so small portfolios don't end up with everything pinned. */
    const visibleCount = Math.max(
      0,
      Math.min(count, Math.min(8, Math.max(5, Math.ceil(count * 0.55))))
    );

    /* Pick which crystals get anchored — prefer Legendary > Epic > Rare
     * > Common so the visible set advertises rarity at first glance.
     * Stable order: rarity desc, then original index for determinism. */
    const rarityRank = { legendary: 4, epic: 3, rare: 2, common: 1 };
    const indexed = this.projects.map((p, i) => ({
      i,
      p,
      r: rarityRank[p.rarity] || 0,
    }));
    indexed.sort((a, b) => (b.r - a.r) || (a.i - b.i));

    for (let k = 0; k < visibleCount; k++) {
      const { i, p } = indexed[k];
      const a = ANCHORS[k % ANCHORS.length];
      const h = this.hash(p.name);
      let seed = h >>> 0;
      const rng = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      /* Jitter so multiple crystals pinned to the same anchor don't
       * sit on top of each other, and they feel scattered along the
       * branch rather than stuck on a node. */
      const jitterX = (rng() - 0.5) * 3.0;   // ±1.5
      const jitterY = (rng() - 0.5) * 2.0;   // ±1.0
      const jitterZ = (rng() - 0.5) * 1.0;   // ±0.5

      let x = a.x + jitterX;
      let y = a.y + jitterY;
      let z = a.z + jitterZ;

      const tierZ = {
        legendary: -3.5,
        epic:      -1.0,
        rare:       1.0,
        common:     3.5,
      }[p.rarity] || 0;
      z += tierZ;

      /* Safety: anchors are well outside hero zone, but keep the
       * guarantee in case future anchor edits drift inward. */
      if (inHeroZone(x, y)) {
        const sgn = x === 0 ? 1 : Math.sign(x);
        x = sgn * (HERO.rx + 1.4);
      }

      positions[i] = { x, y, z };
      anchorTarget[i] = { x: a.x, y: a.y, z: a.z + tierZ };
      isAnchored[i] = true;
    }

    /* ------------------------------------------------------------------
     *  PHASE B · EXPLORATION SCATTER (unchanged behaviour)
     *
     *  Side-biased X sampler + 30/70 mid-vs-peripheral quota + rejection
     *  sampling against the hero zone. Used for every crystal that did
     *  NOT receive a branch anchor.
     * ------------------------------------------------------------------ */
    const sideBiasedX = (u01, sign) => {
      const u = Math.abs(u01 * 2 - 1);
      const biased = Math.pow(u, 0.55);
      return biased * (sign >= 0.5 ? 1 : -1);
    };

    for (let i = 0; i < count; i++) {
      if (isAnchored[i]) continue;
      const p = this.projects[i];
      const h = this.hash(p.name);
      let seed = h >>> 0;
      const rng = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      const wantPeripheral = rng() > 0.30;

      let x = 0, y = 0, z = 0;
      let attempts = 0;
      const MAX_ATTEMPTS = 14;

      while (attempts < MAX_ATTEMPTS) {
        const u    = rng();
        const sign = rng();
        let baseX  = sideBiasedX(u, sign);

        if (wantPeripheral && Math.abs(baseX) < 0.55) {
          baseX = (baseX < 0 ? -1 : 1) * (0.55 + rng() * 0.45);
        }

        x = baseX * widthSpread + (rng() - 0.5) * 1.6;

        const yBias = wantPeripheral ? -0.18 : 0;
        y = ((rng() * 2 - 1) + yBias) * heightSpread;

        z = (rng() * 2 - 1) * depthSpread + ((h >> 8) % 200 - 100) * 0.018;

        if (!inHeroZone(x, y)) break;

        attempts++;
        if (attempts >= 6) {
          const sgn = x === 0 ? (rng() < 0.5 ? -1 : 1) : Math.sign(x);
          x = sgn * (HERO.rx + 0.6 + rng() * 3.5);
        }
      }

      if (inHeroZone(x, y)) {
        const sgn = x === 0 ? 1 : Math.sign(x);
        x = sgn * (HERO.rx + 1.2);
      }

      const tierZ = {
        legendary: -3.5,
        epic:      -1.0,
        rare:       1.0,
        common:     3.5,
      }[p.rarity] || 0;
      z += tierZ;

      positions[i] = { x, y, z };
    }

    /* ------------------------------------------------------------------
     *  PHASE C · RELAXATION
     *  Anchored crystals get a strong spring back to their target.
     *  Non-anchored crystals get the existing peripheral force field.
     * ------------------------------------------------------------------ */
    const ITER             = 70;
    const REPULSION        = 9.0;
    const STEP             = 0.06;
    const MIN_D2           = 0.05;
    const HERO_REPULSION   = 26.0;
    const CENTER_BAND      = widthSpread * 0.35;
    const CENTER_PUSH      = 0.085;
    const BOUND_X          = widthSpread * 1.05;
    const BOUND_Y          = heightSpread * 1.10;
    const BOUND_PULL       = 0.040;
    const Z_DAMP           = 0.006;
    const ANCHOR_SPRING_XY = 0.22;   // strong pull toward anchor target
    const ANCHOR_SPRING_Z  = 0.10;

    for (let iter = 0; iter < ITER; iter++) {
      const fx = new Float32Array(count);
      const fy = new Float32Array(count);
      const fz = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          let dx = positions[i].x - positions[j].x;
          let dy = positions[i].y - positions[j].y;
          let dz = positions[i].z - positions[j].z;
          const d2 = Math.max(MIN_D2, dx * dx + dy * dy + dz * dz);
          const d = Math.sqrt(d2);
          const f = REPULSION / d2;
          dx /= d; dy /= d; dz /= d;
          fx[i] += dx * f; fy[i] += dy * f; fz[i] += dz * f;
          fx[j] -= dx * f; fy[j] -= dy * f; fz[j] -= dz * f;
        }

        if (isAnchored[i]) {
          /* Anchored crystals: spring back to target, ignore the
           * peripheral / center-band forces. They still feel mutual
           * repulsion above so two anchored crystals near the same
           * branch maintain spacing. */
          const t = anchorTarget[i];
          fx[i] += (t.x - positions[i].x) * ANCHOR_SPRING_XY;
          fy[i] += (t.y - positions[i].y) * ANCHOR_SPRING_XY;
          fz[i] += (t.z - positions[i].z) * ANCHOR_SPRING_Z;
          continue;
        }

        /* Non-anchored crystals: hero repulsion + centre-band push +
         * boundary pull (existing exploration field). */
        const hdx = (positions[i].x - HERO.cx) / HERO.rx;
        const hdy = (positions[i].y - HERO.cy) / HERO.ry;
        const hd2 = hdx * hdx + hdy * hdy;
        if (hd2 < 1.8) {
          const hd = Math.sqrt(Math.max(hd2, 1e-4));
          const f  = HERO_REPULSION / Math.max(0.04, hd2);
          fx[i] += (hdx / hd) * f;
          fy[i] += (hdy / hd) * f;
        }

        const ax = Math.abs(positions[i].x);
        if (ax < CENTER_BAND) {
          const t = 1 - (ax / CENTER_BAND);
          const dir = positions[i].x === 0
            ? ((i & 1) ? 1 : -1)
            : Math.sign(positions[i].x);
          fx[i] += dir * t * CENTER_PUSH * 10;
        }

        if (Math.abs(positions[i].x) > BOUND_X) {
          fx[i] -= positions[i].x * BOUND_PULL;
        }
        if (Math.abs(positions[i].y) > BOUND_Y) {
          fy[i] -= positions[i].y * BOUND_PULL;
        }
        fz[i] -= positions[i].z * Z_DAMP;
      }

      for (let i = 0; i < count; i++) {
        positions[i].x += fx[i] * STEP;
        positions[i].y += fy[i] * STEP;
        positions[i].z += fz[i] * STEP;
      }
    }

    /* Final hero-zone safety pass. */
    for (let i = 0; i < count; i++) {
      if (inHeroZone(positions[i].x, positions[i].y)) {
        const sgn = positions[i].x === 0 ? 1 : Math.sign(positions[i].x);
        positions[i].x = sgn * (HERO.rx + 1.0);
      }
    }

    /* ------------------------------------------------------------------
     *  PHASE D · MANUAL POSITION OVERRIDES
     *  Some projects need to sit in a precise spot regardless of the
     *  algorithmic placement — typically to dodge UI elements that the
     *  generic hero exclusion zone doesn't cover (e.g. the post-refactor
     *  upper-left profile panel). Match is case-insensitive and runs
     *  against the normalised project name (hyphens/underscores → spaces).
     *
     *  Each rule fires at most ONCE per page-load, so if you happen to
     *  have multiple repos that satisfy the pattern, only the first one
     *  in iteration order is repositioned.
     *
     *  Coordinate reminder:
     *    +x = right · +y = up · +z = closer to camera
     *    Camera at (0, 0, 22), FOV 50° → ~36u wide / ~20.5u tall at z=0.
     * ------------------------------------------------------------------ */
    const NAME_OVERRIDES = [
      {
        /* "Praticando Clone Flappy Bird" (or any *-bird / *-flappy repo).
         * Park it to the right of the Hero portrait and just below its
         * vertical centre — well outside the upper-left panel and away
         * from the photo it was previously sitting behind. */
        test: (n) => /\bbird\b|\bflappy\b/i.test(n),
        pos:  { x: -5.0, y: +1.6, z: +1.5 },
        applied: false,
      },
    ];

    for (let i = 0; i < count; i++) {
      const rawName = (this.projects[i] && this.projects[i].name) || "";
      const norm    = rawName.replace(/[-_]+/g, " ");
      for (const rule of NAME_OVERRIDES) {
        if (!rule.applied && rule.test(norm)) {
          positions[i] = { x: rule.pos.x, y: rule.pos.y, z: rule.pos.z };
          rule.applied = true;
          break;
        }
      }
    }

    return positions;
  },

  /* ------------------------------------------------------------------ *
   *  CONNECTIONS · curved 3D tubes between each crystal and its 1-2
   *  nearest neighbours. Catmull-Rom curves with a randomised mid-point
   *  give every link a unique organic arc through space.
   * ------------------------------------------------------------------ */
  buildConnections(scene, crystals) {
    if (crystals.length < 2) return;
    const tubes = [];
    const limit = 6.5; // max distance for a connection

    for (let i = 0; i < crystals.length; i++) {
      // Find up to 2 nearest neighbours within range
      const dists = [];
      for (let j = 0; j < crystals.length; j++) {
        if (i === j) continue;
        const d = crystals[i].position.distanceTo(crystals[j].position);
        if (d < limit) dists.push({ j, d });
      }
      dists.sort((a, b) => a.d - b.d);
      const neighbours = dists.slice(0, 2);

      neighbours.forEach(({ j }) => {
        if (j < i) return; // avoid duplicate links
        const a = crystals[i].position;
        const b = crystals[j].position;
        const h = (this.hash(crystals[i].userData.project.name) ^
                   this.hash(crystals[j].userData.project.name)) >>> 0;
        const seedRnd = () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296);

        // Two control points to arc the curve through 3D space
        const c1 = new THREE.Vector3(
          a.x * 0.66 + b.x * 0.34 + (seedRnd() - 0.5) * 1.4,
          a.y * 0.66 + b.y * 0.34 + (seedRnd() - 0.5) * 1.0,
          a.z * 0.66 + b.z * 0.34 + (seedRnd() - 0.5) * 2.0
        );
        const c2 = new THREE.Vector3(
          a.x * 0.34 + b.x * 0.66 + (seedRnd() - 0.5) * 1.4,
          a.y * 0.34 + b.y * 0.66 + (seedRnd() - 0.5) * 1.0,
          a.z * 0.34 + b.z * 0.66 + (seedRnd() - 0.5) * 2.0
        );
        const curve = new THREE.CatmullRomCurve3([a, c1, c2, b]);

        const geo = new THREE.TubeGeometry(curve, 24, 0.012, 4, false);
        const colA = new THREE.Color(crystals[i].userData.project.colors.light);
        const colB = new THREE.Color(crystals[j].userData.project.colors.light);
        const mid = colA.clone().lerp(colB, 0.5);
        const mat = new THREE.MeshBasicMaterial({
          color: mid,
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const tube = new THREE.Mesh(geo, mat);
        tube.userData.aZ = (a.z + b.z) * 0.5;
        scene.add(tube);
        tubes.push(tube);
      });
    }
    return tubes;
  },

  /* ------------------------------------------------------------------ *
   *  VOLUMETRIC HALO SPRITES · adds soft additive light puffs around
   *  each crystal so they read as glowing "things in space" rather
   *  than flat objects. Legendary/Epic get larger halos.
   * ------------------------------------------------------------------ */
  buildVolumetricHalo(group, project, tier) {
    /* Rarity-aware visibility boost: Rare / Epic / Legendary halos are
     * pushed further out and brighter so the user spots them from a
     * distance, even when they sit in the peripheral exploration band.
     * tier.halo is left untouched (it still drives audio gain and
     * emissive intensity) — the boost lives only in the sprite. */
    const visibilityScale = (
      project.rarity === "legendary" ? 1.65 :
      project.rarity === "epic"      ? 1.40 :
      project.rarity === "rare"      ? 1.25 :
                                       1.00
    );
    const visibilityOpacity = (
      project.rarity === "legendary" ? 0.10 :
      project.rarity === "epic"      ? 0.07 :
      project.rarity === "rare"      ? 0.04 :
                                       0.00
    );

    const tex = this.createRadialTexture();
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: new THREE.Color(project.colors.light),
      transparent: true,
      opacity: 0.18 + tier.halo * 0.12 + visibilityOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
    const sprite = new THREE.Sprite(mat);
    const baseScale = (1.6 + tier.scale * 1.4) * visibilityScale;
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.position.set(0, 0, 0);
    group.add(sprite);
    group.userData.haloSprite = sprite;
    group.userData.haloBaseOpacity = mat.opacity;
    group.userData.haloBaseScale = baseScale;
  },



  buildCrystal(project, pos, envMap, scene) {
    const tier = this.RARITIES[project.rarity];
    const h = this.hash(project.name);
    const group = new THREE.Group();
    group.position.set(pos.x, pos.y, pos.z);
    group.userData.project = project;
    /* Home position used by the gentle 3D drift (see animation loop). */
    group.userData.baseX = pos.x;
    group.userData.baseY = pos.y;
    group.userData.baseZ = pos.z;
    /* Per-crystal drift orbit — small radius, deterministic per hash so
     * each artifact wanders around its home in a unique magical pattern. */
    group.userData.driftAmpX   = 0.32 + ((h >> 2)  % 50) * 0.006;   // ~0.32–0.62
    group.userData.driftAmpZ   = 0.28 + ((h >> 5)  % 50) * 0.006;   // ~0.28–0.58
    group.userData.driftSpeedX = 0.22 + ((h >> 8)  % 40) * 0.0045;  // ~0.22–0.40
    group.userData.driftSpeedZ = 0.18 + ((h >> 11) % 40) * 0.005;   // ~0.18–0.38
    group.userData.driftPhaseX = ((h >> 14) % 628) / 100;
    group.userData.driftPhaseZ = ((h >> 17) % 628) / 100;
    group.userData.baseScale = tier.scale;

    const color = new THREE.Color(project.colors.mid);
    const emissive = new THREE.Color(project.colors.light);

    const mat = new THREE.MeshPhysicalMaterial({
      color,
      emissive,
      emissiveIntensity: 0.18 + tier.halo * 0.08,
      metalness: 0.05,
      roughness: 0.08,
      transmission: tier.transmission,
      thickness: tier.thickness,
      ior: 1.52,
      iridescence: tier.iridescence,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [100, 400],
      transparent: true,
      opacity: 0.92,
      envMap,
      envMapIntensity: 0.95,
      clearcoat: 0.7,
      clearcoatRoughness: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      flatShading: true,
    });

    // Inject custom shader: fractal noise, caustics, fresnel rim
    this.injectCrystalShader(mat, h, tier.halo);

    const geo = this.createIrregularCrystal(project.shape, tier.scale, h);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
    group.userData.mesh = mesh;
    group.userData.material = mat;

    /* ── INNER MEMORY CRYSTAL ──────────────────────────────────────────
     * A tiny faceted shard suspended at the very centre of the orb — the
     * "crystallised memory" encapsulated inside the light. It is ~20% of
     * the main crystal, deeply translucent with a soft inner glow, and
     * kept at very low opacity so the visitor reads the luminous sphere
     * first and only then notices something is held within. Its spin is
     * counter-rotated against the group each frame (see animation loop)
     * so it turns extremely slowly and independently of the sphere.
     * Opacity/emissive ramp up on hover (≈10% → ≈30% presence), creating
     * a small visual discovery without competing with glow/particles. */
    const innerSeed = (h ^ 0x9e3779b9) >>> 0;
    const innerGeo = this.createIrregularCrystal(project.shape, tier.scale * 0.2, innerSeed);
    const innerLight = new THREE.Color(project.colors.light);
    /* Lightweight translucent shard: a low-opacity, emissive faceted gem.
     * No transmission/envMap on purpose — the soft inner glow comes from
     * emissive + low opacity, which avoids the extra refraction render
     * pass (cheaper across many orbs) and keeps the silhouette reading
     * as a fragment "held in light" rather than a hard second crystal. */
    const innerMat = new THREE.MeshStandardMaterial({
      color: innerLight,
      emissive: innerLight,
      emissiveIntensity: 0.55,
      metalness: 0.0,
      roughness: 0.22,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      flatShading: true,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.renderOrder = (mesh.renderOrder || 0) + 2; // draw within the orb
    group.add(innerMesh);
    group.userData.innerCrystal = innerMesh;
    group.userData.innerMaterial = innerMat;
    group.userData.innerBaseOpacity = 0.12;   // ~10% presence at rest
    group.userData.innerBaseEmissive = 0.55;
    group.userData.innerSpin = (h % 628) / 100; // unique starting phase

    // Unique rotation speeds per crystal — Y dominant, light X & Z
    // (constant continuous spin, with deterministic per-crystal variation)
    const rndA = ((h >>> 3) % 100) / 100;     // 0..1
    const rndB = ((h >>> 11) % 100) / 100;
    const rndC = ((h >>> 17) % 100) / 100;
    group.userData.rotSpeed = {
      // X & Z are subtle wobbles (slow)
      x: 0.0015 + rndA * 0.0025,                       // ~0.0015..0.004
      y: 0.012 + rndB * 0.014,                         // ~0.012..0.026  (dominant)
      z: 0.0010 + rndC * 0.0020,                       // ~0.001..0.003
      // Random direction so half rotate the other way around X/Z
      xDir: (h & 1) ? 1 : -1,
      zDir: (h & 2) ? 1 : -1,
    };

    // Float amplitude (levitation) — small, noticeable
    group.userData.floatAmp = 0.12 + tier.scale * 0.08;
    group.userData.floatSpeed = 0.7 + (h % 40) * 0.01;
    group.userData.floatPhase = (h % 628) / 100;

    // Cache base material values so hover can swing them up & ease back
    group.userData.baseTransmission = mat.transmission;
    group.userData.baseThickness = mat.thickness;
    group.userData.baseIridescence = mat.iridescence;
    group.userData.baseEmissive = 0.18 + tier.halo * 0.08;

    // Orbiting particles — every crystal gets some, even common ones, so
    // they all read as "alive". Count + orbit size scale with rarity.
    const orbitCount =
      project.rarity === "legendary" ? 14 :
      project.rarity === "epic"      ? 10 :
      project.rarity === "rare"      ? 7  :
                                       4;
    const orbitGroup = new THREE.Group();
    for (let i = 0; i < orbitCount; i++) {
      const baseRadius = 0.55 + tier.scale * 0.35;
      const pGeo = new THREE.SphereGeometry(0.022 + Math.random() * 0.022, 6, 6);
      const pMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(project.colors.light),
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      });
      const particle = new THREE.Mesh(pGeo, pMat);
      // Elliptical orbit: rx ≠ ry (squash) + random tilt of the orbit plane
      particle.userData.rx = baseRadius + Math.random() * 0.18;
      particle.userData.ry = (baseRadius + Math.random() * 0.18) * (0.45 + Math.random() * 0.55);
      particle.userData.orbitSpeed = (0.45 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1);
      particle.userData.orbitPhase = (i / orbitCount) * Math.PI * 2 + Math.random() * 0.4;
      particle.userData.tiltX = (Math.random() - 0.5) * 1.0; // tilt of plane around X
      particle.userData.tiltZ = (Math.random() - 0.5) * 0.6; // tilt around Z
      particle.userData.baseOpacity = 0.72 + Math.random() * 0.18;
      particle.userData.twinkle = 0.5 + Math.random() * 1.8;
      orbitGroup.add(particle);
    }
    group.add(orbitGroup);
    group.userData.orbitGroup = orbitGroup;

    // Point light per crystal (colored glow)
    const glowLight = new THREE.PointLight(
      new THREE.Color(project.colors.mid),
      0.3 + tier.halo * 0.15,
      3 + tier.scale
    );
    group.add(glowLight);
    group.userData.glowLight = glowLight;

    // Volumetric halo sprite — soft additive light puff around the gem
    this.buildVolumetricHalo(group, project, tier);

    scene.add(group);
    return group;
  },

  /* ------------------------------------------------------------------ *
   *  CUSTOM SHADER · Inject fractal noise (FBM) + caustics + fresnel
   *  edge dispersion into MeshPhysicalMaterial. The crystal stops
   *  reading as a flat icon: every face shows internal imperfections
   *  (FBM volumetric noise), moving caustic streaks, and soft glowing
   *  edges (fresnel) so the silhouette never looks like a 2D outline.
   * ------------------------------------------------------------------ */
  injectCrystalShader(material, hashSeed, haloStrength = 1) {
    const seed = ((hashSeed >>> 0) % 1000) / 1000;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime           = { value: 0 };
      shader.uniforms.uSeed           = { value: seed };
      shader.uniforms.uCausticStrength = { value: 1.1 };
      shader.uniforms.uFresnelStrength = { value: 0.65 + haloStrength * 0.15 };
      shader.uniforms.uHover          = { value: 0 };

      // --- Vertex: pass world position + view direction to fragment ---
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `
          #include <common>
          varying vec3 vWorldPos;
          varying vec3 vViewDir;
          `
        )
        .replace(
          "#include <project_vertex>",
          `
          #include <project_vertex>
          vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
          vViewDir  = normalize(cameraPosition - vWorldPos);
          `
        );

      // --- Fragment: declare uniforms + FBM noise functions ---
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `
          #include <common>
          uniform float uTime;
          uniform float uSeed;
          uniform float uCausticStrength;
          uniform float uFresnelStrength;
          uniform float uHover;
          varying vec3 vWorldPos;
          varying vec3 vViewDir;

          float hash3(vec3 p) {
            return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
          }
          float noise3(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float n000 = hash3(i + vec3(0.0));
            float n100 = hash3(i + vec3(1.0, 0.0, 0.0));
            float n010 = hash3(i + vec3(0.0, 1.0, 0.0));
            float n110 = hash3(i + vec3(1.0, 1.0, 0.0));
            float n001 = hash3(i + vec3(0.0, 0.0, 1.0));
            float n101 = hash3(i + vec3(1.0, 0.0, 1.0));
            float n011 = hash3(i + vec3(0.0, 1.0, 1.0));
            float n111 = hash3(i + vec3(1.0, 1.0, 1.0));
            return mix(
              mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
              mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
              f.z
            );
          }
          float fbm(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
              v += a * noise3(p);
              p *= 2.02;
              a *= 0.5;
            }
            return v;
          }
          `
        )
        .replace(
          "#include <emissivemap_fragment>",
          `
          #include <emissivemap_fragment>

          // Fractal volumetric noise — gives the gem an irregular,
          // crystalline interior instead of a flat colour.
          float n = fbm(vWorldPos * 1.4 + vec3(uSeed * 9.0, uTime * 0.06, 0.0));

          // Moving caustic streaks (light scattering on faces)
          float caustic =
              pow(abs(sin(vWorldPos.y * 7.0 + uTime * 0.55 + n * 4.0)), 8.0) * 0.55
            + pow(abs(sin(vWorldPos.x * 5.0 - uTime * 0.42 + n * 3.0)), 10.0) * 0.45
            + pow(abs(sin(vWorldPos.z * 6.0 + uTime * 0.33 + n * 2.5)), 9.0)  * 0.30;

          // Fresnel rim — edges glow with the gem's emissive colour
          // so the silhouette dissolves into light instead of a hard line.
          float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), vViewDir), 0.0, 1.0), 2.6);

          // Internal sparkle pinpoints (rare bright noise peaks)
          float spark = smoothstep(0.78, 0.96, n);

          // Mix it all into emissive output. Hover now reads as a clear
          // "discovery" — the crystal flares: rim light and inner caustics
          // surge so a project never feels like just another node.
          totalEmissiveRadiance += emissive * caustic * uCausticStrength * (1.0 + uHover * 1.15);
          totalEmissiveRadiance += emissive * fresnel * uFresnelStrength * (1.0 + uHover * 1.9);
          totalEmissiveRadiance += emissive * spark * (0.6 + uHover * 0.5);

          // Modulate diffuse by noise (interior imperfections darken/lighten)
          diffuseColor.rgb *= mix(0.82, 1.20, n);
          // Hover lifts overall brightness for stronger contrast against
          // the resting field.
          diffuseColor.rgb *= (1.0 + uHover * 0.3);
          `
        );

      material.userData.shader = shader;
    };
  },

  /* ------------------------------------------------------------------ *
   *  RADIAL GRADIENT TEXTURE · used by sprite halos & nebula points
   * ------------------------------------------------------------------ */
  _radialTextureCache: null,
  createRadialTexture() {
    if (this._radialTextureCache) return this._radialTextureCache;
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0.0, "rgba(255,255,255,1.0)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
    grad.addColorStop(0.7,  "rgba(255,255,255,0.12)");
    grad.addColorStop(1.0,  "rgba(255,255,255,0.0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    this._radialTextureCache = tex;
    return tex;
  },

  /* ------------------------------------------------------------------ *
   *  HOVER CHIME · subtle synth tone played when entering a crystal.
   *  Each crystal has a unique pitch derived from its hash so the
   *  field "sings" different notes as you sweep across it.
   * ------------------------------------------------------------------ */
  _audioCtx: null,
  playHoverChime(group) {
    try {
      if (!this._audioCtx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        this._audioCtx = new Ctor();
      }
      const ctx = this._audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      const project = group.userData.project;
      const tier = this.RARITIES[project.rarity];
      const h = this.hash(project.name);

      // Pentatonic scale steps; legendary leans low (rich), common high (sparkly)
      const scale = [220, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
      const tierBias = { legendary: 0, epic: 1, rare: 2, common: 4 }[project.rarity] || 0;
      const idx = (tierBias + (h % 4)) % scale.length;
      const freq = scale[idx];

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0;
      master.gain.linearRampToValueAtTime(0.12 * tier.halo, now + 0.02);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      master.connect(ctx.destination);

      // Two oscillators (sine + slight detuned sine) for chime body
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = freq;
      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = freq * 2.005;

      const detuneGain = ctx.createGain();
      detuneGain.gain.value = 0.35;
      osc2.connect(detuneGain).connect(master);
      osc1.connect(master);

      osc1.start(now); osc1.stop(now + 0.6);
      osc2.start(now); osc2.stop(now + 0.6);
    } catch (_) { /* ignore */ }
  },

  /* ------------------------------------------------------------------ *
   *  IRREGULAR CRYSTAL GEOMETRY · custom BufferGeometry with multiple
   *  jagged facets, asymmetric vertices and flat-shaded faces. Each
   *  shape is seeded by a deterministic hash so the same project always
   *  yields the same crystal silhouette across renders.
   * ------------------------------------------------------------------ */
  createIrregularCrystal(shape, scale, seedHash) {
    let s = (seedHash >>> 0) || 1;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };

    // Each shape preset: list of horizontal rings (relative height + radius
    // factor + segment count). First/last entries are apex points (single
    // vertex). The body has 3-5 jittered rings so faces look natural.
    const presets = {
      // legendary — tall sharp obelisk with broad mid section
      obelisk: {
        height: 2.7,
        rings: [
          { y:  1.00, r: 0.00, segs: 1 },
          { y:  0.78, r: 0.28, segs: 7 },
          { y:  0.42, r: 0.55, segs: 7 },
          { y:  0.05, r: 0.62, segs: 7 },
          { y: -0.32, r: 0.55, segs: 7 },
          { y: -0.66, r: 0.30, segs: 7 },
          { y: -1.00, r: 0.00, segs: 1 },
        ],
        jitter: 0.18,
        twist: 0.25,
      },
      // epic — wide bipyramid with strong waist
      octa: {
        height: 1.95,
        rings: [
          { y:  1.00, r: 0.00, segs: 1 },
          { y:  0.55, r: 0.40, segs: 6 },
          { y:  0.10, r: 0.72, segs: 6 },
          { y: -0.30, r: 0.60, segs: 6 },
          { y: -0.70, r: 0.32, segs: 6 },
          { y: -1.00, r: 0.00, segs: 1 },
        ],
        jitter: 0.22,
        twist: 0.32,
      },
      // rare — chunky multi-ring prism
      hex: {
        height: 1.7,
        rings: [
          { y:  1.00, r: 0.00, segs: 1 },
          { y:  0.62, r: 0.35, segs: 6 },
          { y:  0.18, r: 0.62, segs: 6 },
          { y: -0.20, r: 0.65, segs: 6 },
          { y: -0.55, r: 0.50, segs: 6 },
          { y: -0.82, r: 0.25, segs: 6 },
          { y: -1.00, r: 0.00, segs: 1 },
        ],
        jitter: 0.18,
        twist: 0.22,
      },
      // common — small skewed shard
      shard: {
        height: 1.35,
        rings: [
          { y:  1.00, r: 0.00, segs: 1 },
          { y:  0.55, r: 0.32, segs: 5 },
          { y:  0.10, r: 0.52, segs: 5 },
          { y: -0.45, r: 0.38, segs: 5 },
          { y: -1.00, r: 0.00, segs: 1 },
        ],
        jitter: 0.28,
        twist: 0.40,
      },
    };

    const p = presets[shape] || presets.hex;
    const positions = [];
    const ringStart = [];
    const ringSegs = [];

    // Build vertices for every ring
    for (let r = 0; r < p.rings.length; r++) {
      const ring = p.rings[r];
      ringStart.push(positions.length / 3);
      ringSegs.push(ring.segs);

      if (ring.segs === 1) {
        // Apex point (with subtle off-axis nudge so the tip looks chiseled)
        const xJ = (rnd() - 0.5) * p.jitter * 0.4 * scale;
        const zJ = (rnd() - 0.5) * p.jitter * 0.4 * scale;
        positions.push(xJ, ring.y * p.height * scale, zJ);
      } else {
        const yBase = ring.y * p.height * scale;
        const baseRadius = ring.r * scale;
        // Per-ring twist so consecutive rings don't align (more facets visible)
        const ringTwist = (rnd() - 0.5) * p.twist;
        for (let i = 0; i < ring.segs; i++) {
          // Angular jitter (uneven spacing)
          const baseAngle = (i / ring.segs) * Math.PI * 2 + ringTwist;
          const angleJitter = (rnd() - 0.5) * (Math.PI * 2 / ring.segs) * 0.45;
          const angle = baseAngle + angleJitter;
          // Radial jitter (irregular profile)
          const rJ = baseRadius * (0.78 + rnd() * 0.42);
          // Vertical jitter (faces aren't horizontal)
          const yJ = yBase + (rnd() - 0.5) * p.jitter * scale * 0.7;
          positions.push(Math.cos(angle) * rJ, yJ, Math.sin(angle) * rJ);
        }
      }
    }

    // Triangulate ring-to-ring bands
    const indices = [];
    for (let r = 0; r < p.rings.length - 1; r++) {
      const top = ringStart[r];
      const bot = ringStart[r + 1];
      const topSegs = ringSegs[r];
      const botSegs = ringSegs[r + 1];

      if (topSegs === 1 && botSegs > 1) {
        // Fan from top apex down
        for (let i = 0; i < botSegs; i++) {
          const a = bot + i;
          const b = bot + ((i + 1) % botSegs);
          indices.push(top, b, a);
        }
      } else if (botSegs === 1 && topSegs > 1) {
        // Fan up to bottom apex
        for (let i = 0; i < topSegs; i++) {
          const a = top + i;
          const b = top + ((i + 1) % topSegs);
          indices.push(a, b, bot);
        }
      } else if (topSegs === botSegs) {
        // Standard ring band (two tris per quad — different diagonals
        // alternated to break up regularity)
        for (let i = 0; i < topSegs; i++) {
          const a = top + i;
          const b = top + ((i + 1) % topSegs);
          const c = bot + ((i + 1) % topSegs);
          const d = bot + i;
          if (i % 2 === 0) {
            indices.push(a, b, c);
            indices.push(a, c, d);
          } else {
            indices.push(a, b, d);
            indices.push(b, c, d);
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  },

  animateCrystal(group, elapsed, dt) {
    const ud = group.userData;

    // Hover state — eased so brightness/refraction swell smoothly
    const targetHover = ud.hovered ? 1 : 0;
    ud.hoverEase = (ud.hoverEase || 0) + (targetHover - (ud.hoverEase || 0)) * 0.12;
    const hv = ud.hoverEase;

    if (!this._reducedMotion) {
      // --- Continuous 3-axis rotation (Y dominant + slight X & Z) ---
      // Spin is BOOSTED dramatically during the Big Bang phase of
      // the Act III singularity so the crystals feel like ignited
      // matter, not just translated objects.
      const sg = this._singularity;
      const spinBoost = (sg && sg.spinBoost) ? sg.spinBoost : 0;
      const spin = 1 + hv * 0.6 + spinBoost;
      group.rotation.x += ud.rotSpeed.x * ud.rotSpeed.xDir * spin;
      group.rotation.y += ud.rotSpeed.y * spin;
      group.rotation.z += ud.rotSpeed.z * ud.rotSpeed.zDir * spin;
    }

    /* --- Gentle 3D drift around the home position ---
     * Each crystal wanders within a small radius defined by its
     * driftAmp* userData. X and Z use independent low-frequency
     * sines (Lissajous-like); Y keeps the existing levitation
     * float. Crystals never leave their neighbourhood, but they
     * never sit perfectly still either.
     *
     * SINGULARITY OVERRIDE (Act III)
     * ──────────────────────────────
     * When this._singularity is active the normal drift is
     * temporarily replaced by a global lerp between the
     * crystal's home position (baseX/Y/Z) and the singularity
     * point (0,0,0). The crystal-wide easing factor
     * `_singularity.away` lives in [0,1]:
     *    away = 0  → at home (normal drift on top)
     *    away = 1  → fully collapsed into the singularity
     * triggerSingularity() animates `away` 0 → 1 → 0 across
     * the implosion / hold / expansion phases. */
    const sg = this._singularity;
    if (sg) {
      const home = sg.away;                 // 1 = at home, 0 = at singularity
      const driftX = Math.sin(elapsed * ud.driftSpeedX + ud.driftPhaseX) * ud.driftAmpX;
      const driftY = Math.sin(elapsed * ud.floatSpeed   + ud.floatPhase)  * ud.floatAmp;
      const driftZ = Math.cos(elapsed * ud.driftSpeedZ + ud.driftPhaseZ) * ud.driftAmpZ;
      group.position.x = (ud.baseX + driftX) * home;
      group.position.y = (ud.baseY + driftY) * home;
      group.position.z = (ud.baseZ + driftZ) * home;
    } else {
      group.position.x =
        ud.baseX + Math.sin(elapsed * ud.driftSpeedX + ud.driftPhaseX) * ud.driftAmpX;
      group.position.y =
        ud.baseY + Math.sin(elapsed * ud.floatSpeed + ud.floatPhase) * ud.floatAmp;
      group.position.z =
        ud.baseZ + Math.cos(elapsed * ud.driftSpeedZ + ud.driftPhaseZ) * ud.driftAmpZ;
    }

    // --- Depth-of-field fake: distant crystals dim & shrink slightly ---
    // Camera sits around z=22 looking toward origin. Crystals can be
    // anywhere in z=[-8 .. 12]. The closer they are, the brighter and
    // sharper they read.
    const camZ = this._three?.camera?.position.z ?? 22;
    const dist = Math.abs(camZ - group.position.z);
    // distNorm = 0 at camera, 1 at far edge of fog (z=42 from camera)
    const distNorm = THREE.MathUtils?.clamp
      ? THREE.MathUtils.clamp((dist - 14) / 24, 0, 1)
      : Math.min(1, Math.max(0, (dist - 14) / 24));
    const depthFade = 1 - distNorm * 0.55; // far → 0.45, near → 1.0

    // --- Inner light pulse (emissive breath) + hover boost ---
    if (ud.material) {
      const breathe = ud.baseEmissive + Math.sin(elapsed * 2.4 + ud.floatPhase) * 0.08;
      ud.material.emissiveIntensity = breathe * (1 + hv * 1.4) * depthFade;
      // Hover ramps refraction (transmission/thickness/iridescence)
      ud.material.transmission = ud.baseTransmission + hv * 0.10;
      ud.material.thickness    = ud.baseThickness    + hv * 0.55;
      ud.material.iridescence  = Math.min(1, ud.baseIridescence + hv * 0.35);
      ud.material.envMapIntensity = (0.95 + hv * 0.55) * depthFade;
      // Far crystals fade slightly toward translucency (atmospheric perspective)
      ud.material.opacity = 0.55 + depthFade * 0.4;
    }

    // --- Inner memory crystal: independent slow spin + hover reveal ---
    if (ud.innerCrystal) {
      const inner = ud.innerCrystal;
      // Extremely slow, ever-advancing Y rotation + near-imperceptible
      // X/Z oscillation — a fragment quietly turning inside the energy.
      ud.innerSpin += 0.0016;
      const ie = this._innerEuler || (this._innerEuler = new THREE.Euler());
      ie.set(
        Math.sin(elapsed * 0.17 + ud.floatPhase) * 0.10,
        ud.innerSpin,
        Math.sin(elapsed * 0.12 + ud.floatPhase) * 0.05
      );
      // Counter the group's own (faster) spin so the shard's world
      // orientation follows ONLY the slow independent target above.
      const qDes = this._innerQ || (this._innerQ = new THREE.Quaternion());
      qDes.setFromEuler(ie);
      const qInv = this._innerQInv || (this._innerQInv = new THREE.Quaternion());
      qInv.copy(group.quaternion).invert();
      inner.quaternion.copy(qInv.multiply(qDes));
      // Reveal on approach: ~10% presence at rest → ~30% on hover. Folded
      // into depthFade so distant orbs keep the shard subtle too.
      inner.material.opacity = (ud.innerBaseOpacity + hv * 0.22) * depthFade;
      inner.material.emissiveIntensity = (ud.innerBaseEmissive + hv * 0.75) * depthFade;
      // Barely-there breathing so it feels alive, not rigid.
      inner.scale.setScalar(1 + Math.sin(elapsed * 0.5 + ud.floatPhase) * 0.015);
    }

    // --- Orbiting particles (elliptical, tilted plane) ---
    if (ud.orbitGroup) {
      const speedBoost = 1 + hv * 1.2;
      const sizeBoost  = 1 + hv * 0.6;
      ud.orbitGroup.children.forEach((p) => {
        const pd = p.userData;
        const t = elapsed * pd.orbitSpeed * speedBoost + pd.orbitPhase;
        const ex = Math.cos(t) * pd.rx;
        const ez = Math.sin(t) * pd.ry;
        const cx = Math.cos(pd.tiltX), sx = Math.sin(pd.tiltX);
        const y1 = ez * sx;
        const z1 = ez * cx;
        const cz = Math.cos(pd.tiltZ), sz = Math.sin(pd.tiltZ);
        const x2 = ex * cz - y1 * sz;
        const y2 = ex * sz + y1 * cz;
        p.position.set(x2, y2, z1);
        const tw = pd.baseOpacity * (0.6 + 0.4 * Math.sin(elapsed * pd.twinkle + pd.orbitPhase));
        p.material.opacity = Math.min(1, tw + hv * 0.25) * depthFade;
        p.scale.setScalar(sizeBoost * (0.85 + 0.3 * Math.sin(elapsed * pd.twinkle * 1.3)));
      });
      ud.orbitGroup.rotation.y = elapsed * 0.12;
    }

    // --- Per-crystal point light pulses with hover ---
    if (ud.glowLight) {
      ud.glowLight.intensity =
        (0.28 + Math.sin(elapsed * 2 + ud.floatPhase) * 0.14) * (1 + hv * 1.6) * depthFade;
    }

    // --- Volumetric halo sprite breathes & responds to hover ---
    if (ud.haloSprite) {
      const breath = 1 + Math.sin(elapsed * 1.4 + ud.floatPhase) * 0.08;
      const target = ud.haloBaseScale * breath * (1 + hv * 0.45);
      ud.haloSprite.scale.set(target, target, 1);
      ud.haloSprite.material.opacity =
        (ud.haloBaseOpacity + hv * 0.35) * depthFade;
    }

    // --- Hover scale (depth-aware: distant crystals stay smaller) ---
    const targetScale = ud.baseScale * (1 + hv * 0.14) * (0.65 + 0.35 * depthFade);
    const current = group.scale.x;
    group.scale.setScalar(current + (targetScale - current) * 0.12);
  },

  setHover(group, on) {
    const wasHovered = group.userData.hovered;
    group.userData.hovered = on;
    const caption = this._three?.captions.find((c) => c.group === group);
    if (caption) caption.el.classList.toggle("is-hovered", on);
    // Hover sound chime — only when entering, not on every pointer-move
    if (on && !wasHovered) this.playHoverChime(group);
  },

  createCaption(project, group) {
    const el = document.createElement("div");
    el.className = `crystal-caption crystal-caption--${project.rarity}`;
    el.dataset.id = String(project.id);
    el.style.setProperty("--c-light", project.colors.light);
    el.style.setProperty("--c-mid", project.colors.mid);
    el.style.setProperty("--c-glow", project.colors.glow);
    el.innerHTML = `
      <span class="crystal-caption__rarity">${this.escape(this.rarityLabel(project.rarity))}</span>
      <span class="crystal-caption__name">${this.escape(project.title)}</span>
      <span class="crystal-caption__type">${this.escape(project.type)}</span>
    `;
    el.setAttribute("role", "button");
    // tabindex=-1 keeps the element programmatically focusable without
    // adding it to the natural Tab order — prevents the browser from
    // drawing its inspection-style focus ring on click.
    el.setAttribute("tabindex", "-1");
    el.setAttribute("aria-label", `Abrir cristal: ${project.title}`);
    el.addEventListener("click", () => this.open(project, group));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.open(project, group);
      }
    });
    // Strip any inline focus indicators set by the browser on click
    el.addEventListener("mousedown", (e) => e.preventDefault());
    return { el, group, project };
  },

  updateCaptions() {
    if (!this._three) return;
    this._three.captions.forEach((c) => {
      c.el.querySelector(".crystal-caption__rarity").textContent = this.rarityLabel(c.project.rarity);
    });
  },

  updateCaptionPositions(t) {
    if (!t || !this.overlay) return;
    const w = this.field.clientWidth;
    const h = this.field.clientHeight;
    const vector = new THREE.Vector3();

    t.captions.forEach(({ el, group }) => {
      vector.setFromMatrixPosition(group.matrixWorld);
      vector.y -= 0.9 * group.scale.x;
      vector.project(t.camera);

      const x = (vector.x * 0.5 + 0.5) * w;
      const y = (-vector.y * 0.5 + 0.5) * h;
      const behind = vector.z > 1;

      if (behind || x < -50 || x > w + 50 || y < -50 || y > h + 50) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      } else {
        el.style.opacity = String(Math.min(1, 1.2 - vector.z * 0.3));
        el.style.pointerEvents = "";
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      }
    });
  },

  rarityLabel(rarity) {
    const map = {
      common: window.I18n?.t("crystal.rarity.common") || "Comum",
      rare: window.I18n?.t("crystal.rarity.rare") || "Raro",
      epic: window.I18n?.t("crystal.rarity.epic") || "Épico",
      legendary: window.I18n?.t("crystal.rarity.legendary") || "Lendário",
    };
    return map[rarity] || rarity.toUpperCase();
  },

  /* ------------------------------------------------------------------ *
   *  CRYSTAL ACTIVATION SOUND
   *  Plays the holy-magic seal-activation sample whenever a crystal
   *  is opened (click). Created lazily so we don't hit autoplay
   *  policies before user gesture.
   * ------------------------------------------------------------------ */
  _crystalAudio: null,
  playCrystalActivate(volume = 0.7) {
    try {
      if (!this._crystalAudio) {
        this._crystalAudio = new Audio("src/assets/sounds/crystal-activate.mp3");
        this._crystalAudio.preload = "auto";
        this._crystalAudio.volume = volume;
      }
      const a = this._crystalAudio.cloneNode();
      a.volume = volume;
      a.play().catch(() => { /* autoplay blocked */ });
    } catch { /* ignore */ }
  },

  /* ------------------------------------------------------------------ *
   *  OPEN MEMORY VAULT
   * ------------------------------------------------------------------ */
  open(project, sourceEl) {
    if (!this.vault || !this.vaultStage) return;
    this.active = project;
    this.playCrystalActivate(0.7);
    const c = project.colors || {
      light: "#E5BEAE", mid: "#C2A46B", dark: "#A13E1E", glow: "rgba(229, 190, 174, 0.6)",
    };

    this.vaultStage.dataset.rarity = project.rarity;
    this.vaultStage.style.setProperty("--c-light", c.light);
    this.vaultStage.style.setProperty("--c-mid", c.mid);
    this.vaultStage.style.setProperty("--c-dark", c.dark);
    this.vaultStage.style.setProperty("--c-glow", c.glow);

    /* Tech sigils — inline pill list inside the card's vellum textbox.
       Each pill gets a CSS --i index so the fade-in cascades after the
       card materializes (see .relic-card__tag in style.css). */
    if (this.vaultTags) {
      const N = Math.min(project.tech.length, 6);
      this.vaultTags.innerHTML = project.tech
        .slice(0, N)
        .map((t, i) => `<li class="relic-card__tag" style="--i:${i}">${this.escape(t)}</li>`)
        .join("");
    }

    if (this.vaultTitle) this.vaultTitle.textContent = project.title;
    if (this.vaultType) this.vaultType.textContent = project.type;
    if (this.vaultRarity) this.vaultRarity.textContent = this.rarityLabel(project.rarity);
    if (this.vaultDesc) this.vaultDesc.textContent = project.description;
    if (this.vaultShot) this.vaultShot.innerHTML = this.shotMarkup(project);
    /* Legacy "VISIT PROJECT" / "CASE STUDY" buttons were removed from
       the relic-card layout. Lookups stay null-safe so the guards below
       are no-ops on the new DOM. */
    if (this.vaultVisit) {
      this.vaultVisit.href = project.url;
      this.vaultVisit.style.display = project.url ? "" : "none";
    }
    if (this.vaultGithub) this.vaultGithub.href = project.githubUrl;
    if (this.vaultCase) this.vaultCase.href = project.caseUrl;

    // Render the same project crystal (3D) inside the vault — much bigger
    if (this._vaultThree) this._vaultThree.running = true;
    this.renderVaultGem(project);

    /* Orbital particles — magical motes drifting around the cinematic
       3D crystal in the left column (.crystal-vault__core). Container
       is inset: 0 inside the core, so radii land near the gem's halo. */
    if (this.vaultParticles) {
      const N = 24;
      this.vaultParticles.innerHTML = Array.from({ length: N })
        .map((_, i) => {
          const angle = (i / N) * 360;
          const radius = 110 + Math.random() * 80;
          const dur = 6 + Math.random() * 6;
          const delay = -Math.random() * dur;
          const size = 2 + Math.random() * 3;
          return `<span class="crystal-vault__particle"
                        style="--a:${angle}deg;--r:${radius}px;--dur:${dur}s;--delay:${delay}s;--s:${size}px;"></span>`;
        })
        .join("");
    }

    // Burst effect on source crystal in 3D
    if (sourceEl && sourceEl.userData) {
      this._burstId = sourceEl.userData.project?.id;
      sourceEl.scale.setScalar(sourceEl.userData.baseScale * 1.3);
      setTimeout(() => {
        if (sourceEl.userData) sourceEl.scale.setScalar(sourceEl.userData.baseScale);
      }, 600);
    }

    this.vault.classList.add("is-open");
    this.vault.setAttribute("aria-hidden", "false");
    document.body.classList.add("vault-open");
  },

  /* ------------------------------------------------------------------ *
   *  VAULT GEM · dedicated mini Three.js scene rendering the same
   *  irregular crystal much bigger, slowly tumbling.
   * ------------------------------------------------------------------ */
  renderVaultGem(project) {
    if (!this.vaultGem || typeof THREE === "undefined") return;

    // Lazy bootstrap
    if (!this._vaultThree) {
      const canvas = document.createElement("canvas");
      canvas.className = "crystal-vault__gem-canvas";
      this.vaultGem.innerHTML = "";
      this.vaultGem.appendChild(canvas);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
      /* Camera pulled back slightly (was z=6) so even the legendary
         obelisk fits inside .crystal-vault__core with breathing room. */
      camera.position.set(0, 0, 7);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0x445080, 0.5));
      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(3, 5, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xa6c8ff, 0.45);
      rim.position.set(-4, 2, -3);
      scene.add(rim);

      const envMap = this.createEnvMap();
      const group = new THREE.Group();
      scene.add(group);

      // Inner glow point light
      const glow = new THREE.PointLight(0xffffff, 1.2, 6);
      group.add(glow);

      this._vaultThree = {
        canvas, renderer, scene, camera, group, envMap, glow,
        clock: new THREE.Clock(),
        running: true,
      };

      const animate = () => {
        if (!this._vaultThree) return;
        const v = this._vaultThree;
        const dt = v.clock.getDelta();
        const elapsed = v.clock.getElapsedTime();
        if (v.running) {
          v.group.rotation.y += dt * 0.45;
          v.group.rotation.x = Math.sin(elapsed * 0.4) * 0.18;
          v.group.rotation.z = Math.sin(elapsed * 0.3) * 0.08;
          v.group.position.y = Math.sin(elapsed * 0.7) * 0.06;
          if (v.material) {
            v.material.emissiveIntensity = 0.32 + Math.sin(elapsed * 2.4) * 0.16;
          }
          if (v.glow) {
            v.glow.intensity = 1.4 + Math.sin(elapsed * 2.8) * 0.5;
          }
          v.renderer.render(v.scene, v.camera);
        }
        requestAnimationFrame(animate);
      };
      animate();

      const resize = () => {
        const w = this.vaultGem.clientWidth;
        const h = this.vaultGem.clientHeight;
        if (!w || !h) return;
        this._vaultThree.camera.aspect = w / h;
        this._vaultThree.camera.updateProjectionMatrix();
        this._vaultThree.renderer.setSize(w, h, false);
      };
      this._vaultThree.resize = resize;
      window.addEventListener("resize", resize);
      requestAnimationFrame(resize);
    }

    const v = this._vaultThree;
    // Clear previous mesh
    if (v.mesh) {
      v.group.remove(v.mesh);
      v.mesh.geometry?.dispose();
      v.material?.dispose();
    }

    const tier = this.RARITIES[project.rarity];
    const h = this.hash(project.name);
    const color = new THREE.Color(project.colors.mid);
    const emissive = new THREE.Color(project.colors.light);

    const material = new THREE.MeshPhysicalMaterial({
      color,
      emissive,
      emissiveIntensity: 0.32,
      metalness: 0.05,
      roughness: 0.06,
      transmission: Math.min(1, tier.transmission + 0.05),
      thickness: tier.thickness * 1.3,
      ior: 1.55,
      iridescence: tier.iridescence + 0.15,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [120, 480],
      transparent: true,
      opacity: 0.95,
      envMap: v.envMap,
      envMapIntensity: 1.2,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
      flatShading: true,
    });

    /* Geometry scale reduced from 1.2 → 0.95 so every shape (obelisk,
       octa, hex, shard) fits comfortably inside the vault core frame.
       The visible halo + glow read better with extra surrounding space. */
    const geo = this.createIrregularCrystal(project.shape, 0.95, h);
    const mesh = new THREE.Mesh(geo, material);
    v.group.add(mesh);
    v.mesh = mesh;
    v.material = material;
    v.glow.color = new THREE.Color(project.colors.light);

    requestAnimationFrame(() => v.resize?.());
  },

  shotMarkup(p) {
    const safeAlt = this.escape(p.title);
    /* Curated tour projects ship with a hand-painted local thumbnail
       (`localShot`) — manuscript illuminations matching the codex.
       Regular GitHub crystals fall back to the OpenGraph card. */
    if (p.localShot) {
      return `<img src="${p.localShot}" alt="${safeAlt}" loading="eager" decoding="async" />`;
    }
    const og = `https://opengraph.githubassets.com/1/${this.GITHUB_USER}/${p.name}`;
    return `
      <img src="${og}" alt="${safeAlt}"
           onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'crystal-vault__shot-fallback',textContent:'${safeAlt.replace(/'/g, "\\'")}'}))" />
    `;
  },

  close() {
    if (!this.vault) return;
    this.vault.classList.remove("is-open");
    this.vault.setAttribute("aria-hidden", "true");
    document.body.classList.remove("vault-open");
    this.active = null;
    /* Always leave tour mode when the vault closes so the next time
       a regular crystal is clicked it opens in its normal single-
       project flow (no leftover prev/next arrows). */
    this._tourActive = false;
    if (this.vaultStage) delete this.vaultStage.dataset.tour;
    if (this._vaultThree) this._vaultThree.running = false;
    this._three?._resumeWallpaper?.();
  },

  /* ------------------------------------------------------------------ *
   *  VAULT GEM SVG (kept for overlay panel)
   * ------------------------------------------------------------------ */
  gemSVG(shape = "hex", uid) {
    const u = uid != null ? uid : ++this._uid;
    if (shape === "obelisk") return this.gemObelisk(u);
    if (shape === "octa") return this.gemOcta(u);
    if (shape === "shard") return this.gemShard(u);
    return this.gemHex(u);
  },

  gemObelisk(u) {
    return `<svg class="gem gem--obelisk" viewBox="0 0 200 360" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="og-core-${u}" cx="50%" cy="55%" r="55%">
        <stop offset="0%" stop-color="var(--c-light)" stop-opacity="0.55"/>
        <stop offset="55%" stop-color="var(--c-mid)" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient></defs>
      <ellipse cx="100" cy="200" rx="78" ry="170" fill="url(#og-core-${u})"/>
      <polygon points="100,40 138,90 138,300 100,340 62,300 62,90"
        fill="var(--c-light)" fill-opacity="0.16" stroke="var(--c-light)" stroke-opacity="0.85" stroke-width="1.6"/>
      <circle cx="100" cy="190" r="6" fill="var(--c-light)"/>
    </svg>`;
  },

  gemOcta(u) {
    return `<svg class="gem gem--octa" viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="oc-core-${u}" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="var(--c-light)" stop-opacity="0.5"/>
        <stop offset="60%" stop-color="var(--c-mid)" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient></defs>
      <ellipse cx="100" cy="140" rx="92" ry="125" fill="url(#oc-core-${u})"/>
      <polygon points="100,30 178,140 100,250 22,140"
        fill="var(--c-light)" fill-opacity="0.14" stroke="var(--c-light)" stroke-opacity="0.85" stroke-width="1.5"/>
      <circle cx="100" cy="140" r="7" fill="var(--c-light)"/>
    </svg>`;
  },

  gemHex(u) {
    return `<svg class="gem gem--hex" viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="hx-core-${u}" cx="50%" cy="55%" r="55%">
        <stop offset="0%" stop-color="var(--c-light)" stop-opacity="0.5"/>
        <stop offset="60%" stop-color="var(--c-mid)" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient></defs>
      <ellipse cx="100" cy="170" rx="92" ry="155" fill="url(#hx-core-${u})"/>
      <polygon points="100,38 162,108 154,252 100,300 46,252 38,108"
        fill="var(--c-light)" fill-opacity="0.13" stroke="var(--c-light)" stroke-opacity="0.8" stroke-width="1.4"/>
      <circle cx="100" cy="178" r="7" fill="var(--c-light)"/>
    </svg>`;
  },

  gemShard(u) {
    return `<svg class="gem gem--shard" viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="sh-core-${u}" cx="55%" cy="50%" r="50%">
        <stop offset="0%" stop-color="var(--c-light)" stop-opacity="0.42"/>
        <stop offset="60%" stop-color="var(--c-mid)" stop-opacity="0.14"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient></defs>
      <ellipse cx="100" cy="140" rx="78" ry="120" fill="url(#sh-core-${u})"/>
      <polygon points="116,18 156,90 138,210 96,260 64,212 50,108 90,52"
        fill="var(--c-light)" fill-opacity="0.13" stroke="var(--c-light)" stroke-opacity="0.85" stroke-width="1.3"/>
      <circle cx="100" cy="150" r="6" fill="var(--c-light)"/>
    </svg>`;
  },

  escape(str) {
    const div = document.createElement("div");
    div.textContent = String(str ?? "");
    return div.innerHTML;
  },
};

window.Crystals = Crystals;
