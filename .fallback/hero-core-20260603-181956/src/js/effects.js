/**
 * Atmospheric effects: dust particles + scroll reveal
 */
const Effects = {
  init() {
    this.initDust();
    this.initReveal();
    this.initNavScroll();
  },

  initDust() {
    const canvas = document.getElementById("dust-canvas");
    if (!canvas) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let w, h, animId;

    const COUNT = 80;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.25 + 0.05),
        alpha: Math.random() * 0.4 + 0.1,
        hue: Math.random() > 0.5 ? "194,164,107" : "214,195,189",
      };
    }

    function initParticles() {
      particles = Array.from({ length: COUNT }, createParticle);
    }

    function draw() {
      if (document.hidden) { animId = null; return; }
      if (document.body.classList.contains("ktree-open")) { animId = null; return; }
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue}, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    draw();

    const ktreeObs = new MutationObserver(() => {
      if (!document.body.classList.contains("ktree-open") && animId == null) draw();
    });
    ktreeObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && animId == null) draw();
    });

    window.addEventListener("resize", () => {
      resize();
      initParticles();
    });

    return () => cancelAnimationFrame(animId);
  },

  initReveal() {
    const targets = document.querySelectorAll(
      ".tree-vault__header, .memories__head, .portal__stage, .hero__copy, .contracts__head, .contract"
    );

    targets.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  },

  initNavScroll() {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      nav.style.background =
        y > 60
          ? "rgba(15, 42, 34, 0.82)"
          : "rgba(15, 42, 34, 0.45)";
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  },
};

window.Effects = Effects;
