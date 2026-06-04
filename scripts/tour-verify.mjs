/**
 * End-to-end verification for the Crystal Vault GUIDED TOUR opened
 * via the hero "Ver Cristais" CTA.
 *
 * What we check:
 *  1. Clicking "Ver Cristais" opens the vault (no #memories scroll).
 *  2. The vault enters tour mode (data-tour="true" on the stage).
 *  3. The FIRST project surfaced is Arracada IA, pointing to
 *     https://zavsolrac.github.io/novo-arracadavds/.
 *  4. Clicking the next-arrow advances through the curated order:
 *        I)   Arracada IA          → novo-arracadavds/
 *        II)  Associação Arracada  → www.arracadavds.org/
 *        III) Studio Allariz       → projeto-allariz/
 *        IV)  Alchemical Archive   → exemplo-porfifoleo/
 *  5. The "Abrir Artefato" CTA href matches the current project URL.
 *  6. ArrowLeft / ArrowRight keys also navigate.
 *  7. Wrap-around: pressing next on IV goes back to I.
 *  8. Closing the vault clears tour state.
 *
 * Captures one screenshot per tour step (4 total) for visual review.
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, "..");
const out   = join(root, ".cursor", "relic-shots");
const logp  = join(root, ".cursor", "tour-verify.log");
mkdirSync(out, { recursive: true });
writeFileSync(logp, "", "utf8");
const w = (o) => appendFileSync(logp, JSON.stringify(o) + "\n", "utf8");

const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

page.on("pageerror",  (e) => w({ kind: "pageerror", msg: String(e).slice(0, 240) }));
page.on("console",    (m) => { if (m.type() === "error") w({ kind: "console.error", msg: m.text() }); });

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector(".welcome")?.remove());

// Capture probe of current tour state
async function snap(stepTag) {
  const data = await page.evaluate(() => {
    const stage  = document.querySelector(".crystal-vault__stage");
    const title  = document.getElementById("vault-title")?.textContent?.trim();
    const desc   = document.getElementById("vault-desc")?.textContent?.trim()?.slice(0, 60);
    const cta    = document.getElementById("vault-github");
    const counterCur = document.getElementById("vault-tour-counter-current")?.textContent;
    const counterTot = document.getElementById("vault-tour-counter-total")?.textContent;
    const navPrev = document.getElementById("vault-tour-prev");
    const navNext = document.getElementById("vault-tour-next");
    return {
      vaultOpen: document.getElementById("crystal-vault")?.classList.contains("is-open"),
      tourActive: stage?.dataset?.tour === "true",
      tourIndex: window.Crystals?._tourIndex,
      title, desc,
      ctaHref: cta?.getAttribute("href"),
      counter: `${counterCur} / ${counterTot}`,
      navPrevVisible: !!(navPrev && getComputedStyle(navPrev).display !== "none"),
      navNextVisible: !!(navNext && getComputedStyle(navNext).display !== "none"),
      stageRarity: stage?.dataset?.rarity,
    };
  });
  w({ step: stepTag, data });
  return data;
}

async function shoot(stepTag) {
  try {
    await page.locator(".crystal-vault__stage").screenshot({
      path: join(out, `tour-${stepTag}.png`),
      timeout: 6000,
    });
  } catch (e) { w({ step: stepTag, kind: "shot-err", msg: String(e).slice(0, 150) }); }
}

// --- 1. Click "Ver Cristais" -------------------------------------------------
await page.locator("#hero-cta-crystals").click({ force: true });
await page.waitForTimeout(800);
const step1 = await snap("01-arracada-ia");
await shoot("01-arracada-ia");

// --- 2. Advance to project II (next-arrow click) -----------------------------
await page.locator("#vault-tour-next").click({ force: true });
await page.waitForTimeout(600);
const step2 = await snap("02-arracada");
await shoot("02-arracada");

// --- 3. Advance to project III (ArrowRight key) ------------------------------
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(600);
const step3 = await snap("03-allariz");
await shoot("03-allariz");

// --- 4. Advance to project IV (next-arrow click) -----------------------------
await page.locator("#vault-tour-next").click({ force: true });
await page.waitForTimeout(600);
const step4 = await snap("04-portfolio");
await shoot("04-portfolio");

// --- 5. Wrap-around: next on IV → back to I ----------------------------------
await page.locator("#vault-tour-next").click({ force: true });
await page.waitForTimeout(600);
const step5 = await snap("05-wrap");

// --- 6. Backwards: ArrowLeft from I → IV (wrap-around) -----------------------
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(600);
const step6 = await snap("06-back-wrap");

// --- 7. Close vault and confirm tour state clears ----------------------------
await page.locator("#crystal-vault-close").click({ force: true });
await page.waitForTimeout(400);
const step7 = await snap("07-closed");

await browser.close();

const verdict = {
  arracadaIA_first: step1.tourActive && step1.tourIndex === 0
    && step1.ctaHref === "https://zavsolrac.github.io/novo-arracadavds/"
    && /Arracada/i.test(step1.title || "")
    && step1.counter === "I / IV"
    && step1.navPrevVisible && step1.navNextVisible,
  arracadaVDS_second: step2.tourIndex === 1
    && step2.ctaHref === "https://www.arracadavds.org/"
    && step2.counter === "II / IV",
  allariz_third: step3.tourIndex === 2
    && step3.ctaHref === "https://zavsolrac.github.io/projeto-allariz/"
    && step3.counter === "III / IV"
    && /Allariz/i.test(step3.title || ""),
  portfolio_fourth: step4.tourIndex === 3
    && step4.ctaHref === "https://zavsolrac.github.io/exemplo-porfifoleo/"
    && step4.counter === "IV / IV",
  wrapForward: step5.tourIndex === 0 && step5.counter === "I / IV",
  wrapBackward: step6.tourIndex === 3 && step6.counter === "IV / IV",
  closeClearsTour: !step7.vaultOpen && !step7.tourActive,
};
w({ kind: "verdict", verdict });
console.log(JSON.stringify(verdict, null, 2));
