/**
 * Atmospheric effects: dust particles + scroll reveal
 */
const Effects = {
  init() {
    this.initDust();
    this.initReveal();
    this.initNavScroll();
    this.initMobileNav();
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

    function dustVisible() {
      /* Dust is a hero atmosphere — stop repainting once the visitor
         has scrolled past the first viewport. Saves a full-screen
         canvas layer on every downstream section. */
      return window.scrollY < window.innerHeight * 1.15;
    }

    function scheduleDraw() {
      if (animId != null) return;
      animId = requestAnimationFrame(draw);
    }

    function draw() {
      animId = null;
      if (document.hidden) return;
      if (document.body.classList.contains("ktree-open")) return;
      if (!dustVisible()) return;
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
      scheduleDraw();
    }

    resize();
    initParticles();
    scheduleDraw();

    const ktreeObs = new MutationObserver(() => {
      if (!document.body.classList.contains("ktree-open") && animId == null && dustVisible()) scheduleDraw();
    });
    ktreeObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && animId == null && dustVisible()) scheduleDraw();
    });

    window.addEventListener("scroll", () => {
      if (dustVisible() && animId == null && !document.hidden &&
          !document.body.classList.contains("ktree-open")) scheduleDraw();
    }, { passive: true });

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

    /* The nav carries a backdrop-filter blur. Mutating its inline
       `background` on EVERY scroll event forced a style recalc +
       re-blur of the backdrop each frame. We now only flip a class
       when the 60px threshold is actually crossed, so 99% of scroll
       events do zero work. The colour itself lives in CSS. */
    let scrolled = null; // unknown → force first apply
    const onScroll = () => {
      const next = window.scrollY > 60;
      if (next === scrolled) return;
      scrolled = next;
      nav.classList.toggle("is-scrolled", next);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  },

  /* Mobile navigation: the burger toggles the collapsed .nav__links
     drop-down (<768px). Closes on link tap, outside click, Escape, or
     when the viewport grows back to desktop width. */
  initMobileNav() {
    const burger = document.getElementById("nav-burger");
    const links = document.getElementById("nav-links");
    if (!burger || !links) return;

    const isOpen = () => burger.getAttribute("aria-expanded") === "true";
    const close = () => {
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Abrir menu");
      links.classList.remove("is-open");
    };
    const open = () => {
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Fechar menu");
      links.classList.add("is-open");
    };

    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isOpen()) close(); else open();
    });

    // Tapping a destination navigates, then collapses the panel.
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) close();
    });

    // Any click outside the open panel dismisses it.
    document.addEventListener("click", (e) => {
      if (isOpen() && !links.contains(e.target) && !burger.contains(e.target)) {
        close();
      }
    });

    // Escape closes and returns focus to the trigger.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) {
        close();
        burger.focus();
      }
    });

    // Growing back to desktop reveals the inline links — reset state.
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768 && isOpen()) close();
    }, { passive: true });
  },
};

window.Effects = Effects;

/* ============================================================
   GLOBAL SCROLL-ACTIVITY SIGNAL  (registered immediately)
   ------------------------------------------------------------
   The skill-tree wallpaper, the WebGL crystal field and the
   narrative-particle field are all `position: fixed`, full-
   viewport canvases behind the page. The wallpaper no longer
   parallaxes with scroll (it is a calm fixed backdrop), so we
   can safely FREEZE these canvases' redraws while a scroll is in
   flight: their pixels don't change, the compositor reuses the
   cached GPU texture, and the page scrolls glass-smooth. Because
   nothing moves with scroll anymore, freezing produces NO visible
   jump (unlike the earlier parallax-coupled attempt). Ambient
   animation resumes ~120 ms after the last scroll event.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;
  window.__cvScrolling = false;
  let releaseTimer = null;
  window.addEventListener(
    "scroll",
    () => {
      window.__cvScrolling = true;
      if (releaseTimer) clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        window.__cvScrolling = false;
        /* Mobile: after scroll settles, wake the wallpaper layers once.
           Resize from the URL bar and iOS compositor drops can leave
           on-demand canvases blank until the next touch — this keeps
           the background from "blinking out" mid-scroll. */
        try {
          window.dispatchEvent(new CustomEvent("cv-scroll-end"));
        } catch (_e) { /* ignore */ }
      }, 120);
    },
    { passive: true }
  );
})();
