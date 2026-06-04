/* Quick single shot — light theme of the portal columns */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out  = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });

async function shot(tag, theme) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await page.evaluate(() => document.querySelectorAll(".merlin")?.forEach((n) => n.remove()));
  if (theme === "light") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await page.waitForTimeout(350);
  }
  await page.evaluate(() => document.getElementById("portal")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    document.querySelector(".portal__stage")?.classList.add("is-visible");
    document.getElementById("portal")?.setAttribute("data-narrative-entered", "true");
    document.querySelectorAll(".portal__column-head, .portal__link").forEach((el) => {
      el.style.animation = "none";
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector(".portal__columns")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(400);
  await page.locator(".portal__columns").screenshot({ path: join(out, `portal-${tag}.png`), timeout: 6000 });
  await page.close();
}

await shot("light-theme", "light");
await shot("dark-theme", "dark");
await browser.close();
console.log("done");
