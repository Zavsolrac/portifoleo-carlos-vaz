import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".cursor", "crystal-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const b = await chromium.launch({ headless: true });

async function heroShot(tag, theme) {
  const page = await b.newPage({ viewport: { width: 1440, height: 950 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  if (theme === "light") await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  // freeze drift so the gems sit mid-pose for a clean still
  await page.addStyleTag({ content: `.hero__crystal,.hero__crystal-glint{animation-play-state:paused!important}` });
  await page.waitForTimeout(500);
  await page.locator("#hero").screenshot({ path: join(out, `hero-${tag}.png`) });
  await page.close();
}

async function detailShot() {
  const page = await b.newPage({ viewport: { width: 700, height: 700 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  // isolate one crystal, blow it up and centre it on a dark stage
  await page.evaluate(() => {
    document.querySelector(".welcome")?.remove();
    document.body.innerHTML = "";
    document.body.style.background = "#0a0c16";
    const stage = document.createElement("div");
    stage.style.cssText = "position:fixed;inset:0;display:grid;place-items:center;";
    const gem = document.createElement("span");
    gem.className = "hero__crystal hero__crystal--1";
    gem.style.cssText = "position:relative;width:420px;height:420px;opacity:1;top:auto;left:auto;animation:none;";
    gem.innerHTML = '<i class="hero__crystal-glint" style="animation:none;opacity:.9;transform:scale(1.1)"></i>';
    stage.appendChild(gem);
    document.body.appendChild(stage);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, "crystal-detail.png") });
  await page.close();
}

await heroShot("dark", "dark");
await heroShot("light", "light");
await detailShot();
await b.close();
console.log("done");
