/* Capture the now-aligned portal columns in dark + light theme. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out  = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });
const viewports = {
  dark:   { width: 1366, height: 900 },
  light:  { width: 1366, height: 900 },
  mobile: { width: 414,  height: 850 },
};
for (const theme of ["dark", "light", "mobile"]) {
  const page = await browser.newPage({ viewport: viewports[theme] });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await page.evaluate(() => document.querySelectorAll(".merlin")?.forEach((n) => n.remove()));
  if (theme === "light") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => {
    document.getElementById("portal")?.setAttribute("data-narrative-entered", "true");
    document
      .querySelectorAll("#portal .reveal, #portal .portal__link")
      .forEach((n) => {
        n.classList.add("is-visible");
        n.style.animation = "none";
        n.style.opacity = "1";
      });
  });
  await page.evaluate(() =>
    document.getElementById("portal")?.scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(700);
  await page
    .locator(".portal__columns")
    .screenshot({ path: join(out, `portal-aligned-${theme}.png`) });
  await page.close();
}
await browser.close();
