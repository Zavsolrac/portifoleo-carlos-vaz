import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const browser = await chromium.launch({ headless: true });
for (const w of [1366, 1100]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await page.locator("#hero-cta-crystals").click({ force: true });
  await page.waitForTimeout(600);
  const data = await page.evaluate(() => {
    const stage = document.querySelector(".crystal-vault__stage");
    const prev = document.getElementById("vault-tour-prev");
    const next = document.getElementById("vault-tour-next");
    return {
      vw: window.innerWidth,
      stage: stage.getBoundingClientRect(),
      prev:  prev.getBoundingClientRect(),
      next:  next.getBoundingClientRect(),
    };
  });
  console.log(`viewport=${w}px`, JSON.stringify(data, null, 2));
  await page.close();
}
await browser.close();
