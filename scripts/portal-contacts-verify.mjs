/**
 * Portal contacts verification (June 2026)
 *  1. Confirms every contact card renders with the correct href.
 *  2. Confirms 6 cards layout into a 2-column grid (desktop) and
 *     a single column (mobile).
 *  3. Captures dark + light + mobile screenshots.
 *  4. Hover-probes one card per channel type to confirm the
 *     mystical glow + zoom kick in (transform + ::before opacity).
 *  5. Calls wa.me/<num> twice to verify the WhatsApp landing page
 *     accepts both numbers (no "número compartilhado por este link
 *     não tem WhatsApp" error string).
 *
 * NOTE: This script CANNOT send a real WhatsApp message — Meta
 * requires a logged-in WhatsApp account on the client device.
 * What it can verify is whether wa.me recognises the number and
 * shows the "Continue to chat" page (which means the number is
 * dial-able as a valid international format).
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, ".cursor", "relic-shots");
const logPath = join(root, ".cursor", "portal-contacts.log");
mkdirSync(outDir, { recursive: true });
writeFileSync(logPath, "", "utf8");
const w = (o) => appendFileSync(logPath, JSON.stringify(o) + "\n", "utf8");

const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const browser = await chromium.launch({ headless: true });

/* ---------- 1. Render + hover probes ---------- */
async function checkPortal(tag, { width, height, theme }) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  if (theme === "light") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => document.getElementById("portal")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(600);

  const summary = await page.evaluate(() => {
    const list = document.querySelector(".portal__links");
    const links = Array.from(document.querySelectorAll(".portal__link"));
    const grid = list ? getComputedStyle(list).gridTemplateColumns : null;
    return {
      cardCount: links.length,
      gridColumns: grid,
      items: links.map((a) => ({
        channel: a.dataset.channel,
        href: a.getAttribute("href"),
        label: a.querySelector(".portal__link-label")?.textContent.trim(),
        handle: a.querySelector(".portal__link-handle")?.textContent.trim(),
      })),
    };
  });
  w({ tag, kind: "portal-summary", summary });

  // Hover probes — one per channel type (mouse parked away between
  // probes so the previous card's :hover state fully releases).
  const probeChannels = ["github", "linkedin", "whatsapp", "email"];
  const hoverResults = {};
  for (const ch of probeChannels) {
    await page.mouse.move(0, 0);
    await page.waitForTimeout(250);
    const sel = `.portal__link[data-channel="${ch}"]`;
    const card = page.locator(sel).first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await card.hover({ force: true });
    await page.waitForTimeout(900);
    const probe = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const before = getComputedStyle(el, "::before");
      const r = el.getBoundingClientRect();
      // Robust scale parser — works for matrix(), matrix3d(), and "none"
      let scale = 1;
      const t = cs.transform;
      const mm = t && t.match(/^matrix\(\s*([\d.-]+)/);
      const m3 = t && t.match(/^matrix3d\(\s*([\d.-]+)/);
      if (mm) scale = parseFloat(mm[1]);
      else if (m3) scale = parseFloat(m3[1]);
      return {
        transform: t,
        scaleRead: scale,
        scaleCss: cs.scale,                 /* the individual CSS prop */
        boxShadow: cs.boxShadow.slice(0, 140),
        beforeOpacity: parseFloat(before.opacity),
        beforeTransform: before.transform,
        beforeAnimation: before.animationName,
        channelGlow: cs.getPropertyValue("--channel-glow").trim(),
        scaled: scale > 1.01,
        widthPx: Math.round(r.width),
        rect: { x: Math.round(r.x), y: Math.round(r.y) },
      };
    }, sel);
    hoverResults[ch] = probe;
  }
  w({ tag, kind: "hover-probes", hoverResults });

  // Screenshot the portal section
  try {
    await page.locator("#portal").screenshot({
      path: join(outDir, `portal-${tag}.png`),
      timeout: 8000,
    });
  } catch (e) {
    w({ tag, kind: "shot-err", msg: String(e).slice(0, 200) });
  }

  // Hover-state shot of one card
  try {
    await page.locator(`.portal__link[data-channel="whatsapp"]`).first().hover({ force: true });
    await page.waitForTimeout(700);
    await page.locator(`.portal__link[data-channel="whatsapp"]`).first().screenshot({
      path: join(outDir, `portal-${tag}-whatsapp-hover.png`),
      timeout: 6000,
    });
  } catch (e) {
    w({ tag, kind: "hover-shot-err", msg: String(e).slice(0, 200) });
  }

  await page.close();
  return { summary, hoverResults };
}

const dark    = await checkPortal("dark",   { width: 1366, height: 900, theme: "dark"  });
const light   = await checkPortal("light",  { width: 1366, height: 900, theme: "light" });
const mobile  = await checkPortal("mobile", { width: 414,  height: 800, theme: "dark"  });

/* ---------- 2. WhatsApp number verification ---------- */
async function probeWa(num) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  });
  const target = `https://wa.me/${num}`;
  let httpStatus = null;
  let finalUrl = null;
  let bodySnippet = null;
  let acceptsNumber = null;
  try {
    const resp = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 25000 });
    httpStatus = resp?.status() ?? null;
    finalUrl = page.url();
    await page.waitForTimeout(1500);
    bodySnippet = (await page.evaluate(() => document.body.innerText.slice(0, 600))) || "";
    // Heuristic: wa.me shows "número de telefone compartilhado via link não existe no WhatsApp"
    // when the number is invalid. Valid numbers reach a "Continue to chat / Use WhatsApp Web" page.
    const lower = bodySnippet.toLowerCase();
    const rejection = /n[uú]mero.*n[aã]o.*existe|phone number.*shared.*doesn'?t.*whatsapp|isn'?t on whatsapp|n[uú]mero compartilhado.*n[aã]o tem|invalid/.test(lower);
    const accept = /continue to chat|continuar.*conversa|use whatsapp web|chat on whatsapp|conversar/.test(lower);
    acceptsNumber = accept && !rejection;
  } catch (e) {
    bodySnippet = "fetch-error: " + String(e).slice(0, 200);
  }
  await page.close();
  return { number: num, target, httpStatus, finalUrl, acceptsNumber, snippet: bodySnippet.slice(0, 280) };
}

const wa1 = await probeWa("351910562698");
const wa2 = await probeWa("34617193035");
w({ kind: "wa-probe", wa1, wa2 });

await browser.close();

/* ---------- 3. Final verdict ---------- */
const verdict = {
  cardCount: dark.summary.cardCount === 6,
  desktopGrid2Cols: /\s/.test(dark.summary.gridColumns || ""),
  mobileGrid1Col: !/(\s|,)/.test(mobile.summary.gridColumns?.trim().replace(/\(.*?\)/g, "") || ""),
  linkedinHrefCorrect: dark.summary.items.find((i) => i.channel === "linkedin")?.href === "https://www.linkedin.com/in/carlos-vaz-1a9a51274/",
  whatsappPt: dark.summary.items.some((i) => i.href === "https://wa.me/351910562698"),
  whatsappEs: dark.summary.items.some((i) => i.href === "https://wa.me/34617193035"),
  emailWishmaster: dark.summary.items.some((i) => i.href === "mailto:wishmastergm@gmail.com"),
  emailRaquel:    dark.summary.items.some((i) => i.href === "mailto:raquelce.rce@gmail.com"),
  hoverScaledGithub:   dark.hoverResults.github?.scaled,
  hoverScaledLinkedin: dark.hoverResults.linkedin?.scaled,
  hoverScaledWhatsapp: dark.hoverResults.whatsapp?.scaled,
  hoverScaledEmail:    dark.hoverResults.email?.scaled,
  glowKickedInGithub:   (dark.hoverResults.github?.beforeOpacity ?? 0)   > 0.5,
  glowKickedInLinkedin: (dark.hoverResults.linkedin?.beforeOpacity ?? 0) > 0.5,
  glowKickedInWhatsapp: (dark.hoverResults.whatsapp?.beforeOpacity ?? 0) > 0.5,
  glowKickedInEmail:    (dark.hoverResults.email?.beforeOpacity ?? 0)    > 0.5,
  waPtReachable: wa1.acceptsNumber === true,
  waEsReachable: wa2.acceptsNumber === true,
  waPtStatus: wa1.httpStatus,
  waEsStatus: wa2.httpStatus,
};
w({ kind: "verdict", verdict });
console.log(JSON.stringify(verdict, null, 2));
