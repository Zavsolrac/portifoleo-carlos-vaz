/**
 * Craft Constellation · controller
 * --------------------------------
 *  Six crystals orbit a central "core" node in #craft-stage. Each
 *  crystal is keyed by data-key (story, ux, direction, theme,
 *  identity, ambience) and visually tiered via data-tier
 *  ("primary" → storytelling, ux, art direction;
 *   "secondary" → theme, identity, ambience). The tier sizing is
 *  pure CSS — this controller only manages state and i18n.
 *
 *  Hovering or focusing a crystal:
 *
 *    1. Tags #craft-stage via [data-active="<key>"] so the matched
 *       connection line and the crystal itself can light up via
 *       pure-CSS rules (see .craft__line / .craft__node in
 *       src/css/style.css).
 *    2. Tags the document root via [data-craft-active="<key>"] so
 *       global elements (notably the body-wide .tree-wall canvas)
 *       can subtly dim — the wallpaper never disappears, it just
 *       loses a touch of contrast so the eye anchors on the
 *       constellation.
 *    3. Updates the description plate (.craft__plate) with the
 *       crystal's translated name + a poetic body string drawn
 *       from the active i18n pack (craft.<key>.name + .desc).
 *    4. Populates the four "knowledge echo" chips inside the
 *       plate (#craft-plate-echo) with the allied disciplines
 *       declared in i18n (craft.<key>.echo1..echo4). The chips
 *       fade in with a staggered transition driven entirely by CSS.
 *
 *  On pointer-leave / blur, the plate restores its default copy
 *  and the echo chips dissolve. Touch users keep state via a
 *  click toggle (stage.dataset.stuck), so a tap holds the reveal
 *  until tapped again or another crystal is chosen.
 *
 *  Re-applies plate translations whenever the user switches
 *  language (langchange event) so the active hover state stays
 *  in sync — chips included.
 */
window.Craft = (() => {
  const KEYS = ["story", "ux", "direction", "theme", "identity", "ambience"];

  let stage, plate, plateKey, plateBody, echoList, echoTags;
  let active = null; /* currently hovered/focused key, or null */

  function init() {
    stage     = document.getElementById("craft-stage");
    if (!stage) return;
    plate     = stage.parentElement.querySelector(".craft__plate");
    plateKey  = plate?.querySelector("#craft-plate-key");
    plateBody = plate?.querySelector("#craft-plate-body");
    echoList  = plate?.querySelector("#craft-plate-echo");
    echoTags  = echoList
      ? Array.from(echoList.querySelectorAll(".craft__echo-tag"))
      : [];

    stage.querySelectorAll(".craft__node").forEach((node) => {
      const key = node.dataset.key;
      if (!KEYS.includes(key)) return;

      const enter = () => setActive(key);
      const leave = () => clearActive(key);

      /* Pointer + keyboard parity — focus mirrors hover so keyboard
         users get the same reveal. */
      node.addEventListener("pointerenter", enter);
      node.addEventListener("pointerleave", leave);
      node.addEventListener("focus", enter);
      node.addEventListener("blur",  leave);

      /* Click toggles "stuck" state on touch / tap so the plate
         description stays visible after a touch interaction. */
      node.addEventListener("click", (e) => {
        e.preventDefault();
        if (stage.dataset.stuck === key) {
          delete stage.dataset.stuck;
          clearActive(key);
        } else {
          stage.dataset.stuck = key;
          setActive(key);
        }
      });
    });

    /* When the stage loses pointer entirely, clear any sticky state
       only if it was stuck on a key the user has now moved away from
       (we keep stuck state through click + tap, so this is mostly a
       safety net for edge cases). */
    stage.addEventListener("pointerleave", () => {
      if (!stage.dataset.stuck) {
        active = null;
        delete stage.dataset.active;
        clearGlobalFocus();
        renderPlate(null);
      }
    });

    /* React to language changes — refresh whatever the plate is
       currently displaying so the visible copy follows the locale.
       Crucially this also re-renders the echo chips so they switch
       to the new locale without requiring a re-hover. */
    window.addEventListener("langchange", () => renderPlate(active));

    /* Initial paint of the default plate copy (in case i18n applied
       before this script ran, the textContent is already correct). */
    renderPlate(null);
  }

  function setActive(key) {
    active = key;
    stage.dataset.active = key;
    setGlobalFocus(key);
    renderPlate(key);
  }

  function clearActive(key) {
    /* Don't clear if pointer left this node but stuck on another. */
    if (stage.dataset.stuck && stage.dataset.stuck !== key) return;
    if (stage.dataset.stuck === key) return; /* keep visible */
    active = null;
    delete stage.dataset.active;
    clearGlobalFocus();
    renderPlate(null);
  }

  /* Tag the document root so global layers (notably .tree-wall)
     can react with a subtle CSS filter. We intentionally use the
     root element (not body) so theme-aware selectors that already
     live on <html data-theme="…"> can compose without conflict. */
  function setGlobalFocus(key) {
    document.documentElement.dataset.craftActive = key;
  }
  function clearGlobalFocus() {
    delete document.documentElement.dataset.craftActive;
  }

  function renderPlate(key) {
    if (!plateKey || !plateBody) return;
    const t = (k) => (window.I18n ? window.I18n.t(k) : null);
    if (key) {
      const name = t(`craft.${key}.name`) || "";
      const desc = t(`craft.${key}.desc`) || "";
      plateKey.textContent  = name.toUpperCase();
      plateBody.textContent = desc;
      renderEcho(key, t);
      plate?.classList.add("is-active");
    } else {
      plateKey.textContent  = t("craft.plate.default.key")  || plateKey.textContent;
      plateBody.textContent = t("craft.plate.default.body") || plateBody.textContent;
      clearEcho();
      plate?.classList.remove("is-active");
    }
  }

  /* Populate the four echo chips with the allied disciplines for
     the active key. We deliberately read the chips out of the DOM
     instead of recreating them so the CSS stagger
     (.craft__plate.is-active .craft__echo-tag:nth-child(n)
      { transition-delay: … })
     keeps working with stable element identity. */
  function renderEcho(key, t) {
    if (!echoTags.length) return;
    for (let i = 0; i < echoTags.length; i++) {
      const label = t(`craft.${key}.echo${i + 1}`) || "";
      echoTags[i].textContent = label;
    }
  }
  /* Intentionally a no-op: we DON'T blank the chips on clearActive.
     Visibility is owned by the parent .craft__echo opacity (driven
     by the .is-active class on the plate). Keeping the previous
     labels in the DOM means that when the user moves between two
     crystals quickly, the chips crossfade smoothly to the new
     labels instead of briefly collapsing to empty pills.
     The chips only stay truly empty on first paint, before any
     crystal has been hovered — at which point `:empty { display:
     none }` keeps them out of the layout. */
  function clearEcho() { /* keep labels in place */ }

  return { init };
})();
