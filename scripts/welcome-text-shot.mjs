/* Force the welcome overlay open and capture it in each locale to
   verify the longer text fits the panel without breaking layout. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out  = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });

async function shoot(locale) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto(url + (locale ? `?lang=${locale}` : ""), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  await page.evaluate((l) => {
    if (l && window.I18n?.setLang) window.I18n.setLang(l);
    document.getElementById("arcane-welcome")?.classList.add("is-open");
    document.getElementById("arcane-welcome")?.setAttribute("aria-hidden", "false");
    document
      .querySelectorAll(".welcome__line")
      .forEach((n) => { n.style.opacity = "1"; n.style.transform = "none"; });
  }, locale);
  await page.waitForTimeout(700);
  await page
    .locator(".welcome__panel")
    .screenshot({ path: join(out, `welcome-${locale || "pt"}.png`) });
  const text = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".welcome__line")).map(
      (n) => n.innerText.replace(/\s+/g, " ").trim()
    );
  });
  console.log(locale || "pt", JSON.stringify(text));
  await page.close();
}

for (const l of ["pt", "gl", "es", "en"]) await shoot(l);
await browser.close();
