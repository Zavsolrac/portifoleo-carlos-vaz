/**
 * Conselho de Merlin
 * ------------------
 * Microevento narrativo entre o ritual do Codex (Um Anel) e a abertura
 * do perfil profissional. Merlin oferece uma perola de sabedoria antes
 * de revelar o Arquivo do Programador Arcano.
 *
 * Exposes: window.MerlinCouncil = { play }.
 */
const MerlinCouncil = (() => {
  "use strict";

  const PHRASES = [
    ["Muitos buscam ferramentas.", "Poucos procuram o artesão."],
    ["Há quem escreva linhas de código.", "Há quem construa mundos."],
    ["Os melhores projetos não começam com tecnologia.", "Começam com visão."],
    ["Uma boa solução resolve problemas.", "Uma grande solução evita que eles existam."],
    ["Nem todo tesouro está escondido.", "Alguns aguardam ser descobertos."],
    ["Os reinos mais prósperos raramente são erguidos pela sorte."],
    ["Todo castelo possui muralhas.", "Os melhores possuem arquitetos."],
    ["Grandes jornadas exigem mais do que coragem.", "Exigem direção."],
    ["Poucos dominam a magia.", "Menos ainda dominam a experiência."],
    ["Todo aventureiro deseja uma espada.", "Os sábios procuram quem a forjou."],
    ["A ambientação é a arte de fazer alguém", "esquecer que está diante de uma tela."],
    ["Um botão pode levar a um destino.", "Uma história faz alguém desejar clicar."],
    ["Programar é ensinar uma máquina.", "Criar experiências é compreender pessoas."],
    ["Toda interface conta uma história.", "Algumas apenas esqueceram de escrevê-la."],
    ["A beleza chama a atenção.", "A clareza conquista a confiança."],
    ["Os usuários raramente se lembram de cada detalhe.", "Mas sempre se lembram de como se sentiram."],
    ["Código é apenas a linguagem.", "O verdadeiro feitiço está na intenção."],
    ["Mundos memoráveis raramente", "são construídos por acaso."],
    ["A diferença entre navegar e explorar é a mesma", "diferença entre visitar e viver uma aventura."],
  ];

  const SEALS = [
    "📜 Arquivo do Programador Arcano",
    "📖 Registros do Programador Arcano",
  ];

  const INTRO_TEXT = "Merlin consulta os antigos registros...";

  let root, canvas, ctx, titleEl, introEl, phraseEl, sealEl;
  let raf = null;
  let particles = [];
  let playing = false;
  let finishResolve = null;
  let timers = [];
  let originRef = null;
  let intensity = 1;

  function wait(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(() => {
        timers = timers.filter((t) => t !== id);
        resolve();
      }, ms);
      timers.push(id);
    });
  }

  function typewriter(el, text, speed = 36) {
    return new Promise((resolve) => {
      el.textContent = "";
      el.classList.add("is-typing");
      let i = 0;
      function tick() {
        if (!playing) {
          el.classList.remove("is-typing");
          resolve();
          return;
        }
        if (i < text.length) {
          el.textContent += text[i++];
          const id = setTimeout(tick, speed);
          timers.push(id);
        } else {
          el.classList.remove("is-typing");
          resolve();
        }
      }
      tick();
    });
  }

  function initParticles(origin, count) {
    particles = [];
    const cx = origin?.x ?? window.innerWidth / 2;
    const cy = origin?.y ?? window.innerHeight / 2;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 120;
      particles.push({
        x: cx + Math.cos(ang) * dist * 0.35,
        y: cy + Math.sin(ang) * dist * 0.35,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -0.12 - Math.random() * 0.38,
        size: 0.7 + Math.random() * 1.6,
        alpha: 0.12 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = originRef?.x ?? window.innerWidth / 2;
    const cy = originRef?.y ?? window.innerHeight / 2;

    const glowR = 80 + intensity * 50;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    grad.addColorStop(0, `rgba(255, 235, 190, ${0.2 * intensity})`);
    grad.addColorStop(0.55, `rgba(229, 190, 174, ${0.07 * intensity})`);
    grad.addColorStop(1, "rgba(229, 190, 174, 0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    for (const p of particles) {
      p.x += p.vx * intensity;
      p.y += p.vy * intensity;
      p.phase += 0.018;
      const a = p.alpha * (0.65 + Math.sin(p.phase) * 0.35);
      ctx.fillStyle = `rgba(255, 220, 160, ${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      if (p.y < cy - 130) p.y = cy + 90 + Math.random() * 30;
      if (p.x < cx - 180) p.x = cx + 160;
      if (p.x > cx + 180) p.x = cx - 160;
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function loop() {
    if (!playing) return;
    drawParticles();
    raf = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function resetDom() {
    if (titleEl) titleEl.textContent = "✦ Conselho de Merlin ✦";
    if (introEl) {
      introEl.textContent = "";
      introEl.classList.remove("is-typing");
    }
    if (phraseEl) phraseEl.innerHTML = "";
    if (sealEl) sealEl.textContent = "";
  }

  function cleanup() {
    playing = false;
    clearTimers();
    stopLoop();
    window.removeEventListener("resize", resizeCanvas);
    document.removeEventListener("keydown", onKeyDown);
    root?.removeEventListener("click", onSkip);
    root?.classList.remove(
      "is-active",
      "is-show-title",
      "is-show-intro",
      "is-show-phrase",
      "is-phrase-glow",
      "is-show-seal",
      "is-fading-out"
    );
    root?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-merlin-council");
    resetDom();
    particles = [];
    intensity = 1;
  }

  function finish() {
    const resolve = finishResolve;
    finishResolve = null;
    cleanup();
    resolve?.();
  }

  function onKeyDown(e) {
    if ((e.key === "Escape" || e.key === "Enter" || e.key === " ") && playing) {
      e.preventDefault();
      finish();
    }
  }

  function onSkip() {
    if (playing) finish();
  }

  async function runSequence(reduced) {
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    const seal = SEALS[Math.floor(Math.random() * SEALS.length)];

    root.classList.add("is-show-title");
    await wait(reduced ? 350 : 850);
    if (!playing) return;

    root.classList.add("is-show-intro");
    if (reduced) {
      introEl.textContent = INTRO_TEXT;
      await wait(450);
    } else {
      await typewriter(introEl, INTRO_TEXT);
      await wait(350);
    }
    if (!playing) return;

    root.classList.remove("is-show-title");
    root.classList.add("is-show-phrase");
    phraseEl.innerHTML = phrase
      .filter((line) => typeof line === "string" && line.length)
      .map((line) => `<span class="council__line">${line}</span>`)
      .join("");
    await wait(reduced ? 480 : 1850);
    if (!playing) return;

    intensity = 1.65;
    root.classList.add("is-phrase-glow");
    await wait(reduced ? 550 : 2050);
    if (!playing) return;

    root.classList.remove("is-show-phrase", "is-phrase-glow", "is-show-intro");
    root.classList.add("is-show-seal");
    sealEl.textContent = seal;
    await wait(reduced ? 480 : 1000);
    if (!playing) return;

    root.classList.add("is-fading-out");
    await wait(reduced ? 280 : 550);
  }

  function play({ origin } = {}) {
    if (playing) return Promise.resolve();

    root = document.getElementById("merlin-council");
    canvas = document.getElementById("council-canvas");
    if (!root) return Promise.resolve();

    titleEl = root.querySelector(".council__title");
    introEl = root.querySelector(".council__intro");
    phraseEl = root.querySelector(".council__phrase");
    sealEl = root.querySelector(".council__seal");
    ctx = canvas?.getContext("2d") ?? null;

    originRef = origin || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    intensity = 1;
    playing = true;
    resetDom();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.setAttribute("aria-hidden", "false");
    root.classList.add("is-active");
    document.body.classList.add("is-merlin-council");
    resizeCanvas();
    initParticles(originRef, reduced ? 0 : 44);

    if (!reduced && canvas && ctx) {
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("keydown", onKeyDown);
    root.addEventListener("click", onSkip);

    return new Promise((resolve) => {
      finishResolve = resolve;
      runSequence(reduced).then(() => {
        if (playing) finish();
      });
    });
  }

  return { play };
})();

window.MerlinCouncil = MerlinCouncil;
