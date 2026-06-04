/**
 * Mobile horizontal-overflow audit.
 * Loads index.html at several mobile widths and reports every element
 * whose box extends past the viewport's right edge (the cause of
 * sideways scrolling). Prints the worst offenders per width.
 */
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const widths = [320, 360, 390, 414, 480, 600, 767];

const browser = await chromium.launch({ headless: true });

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 2 });
  await page.route("**/api.github.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
  );
  await page.goto(url, { waitUntil: "domcontentloaded" });
  // Kill the welcome overlay + give layout a tick.
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await page.waitForTimeout(700);

  const result = await page.evaluate((vw) => {
    // Real test: can the user actually scroll sideways?
    window.scrollTo(2000, 0);
    const scrolledX = window.scrollX || window.pageXOffset || 0;
    window.scrollTo(0, 0);
    const docW = document.documentElement.scrollWidth;
    const offenders = [];
    const all = document.querySelectorAll("*");
    for (const el of all) {
      const r = el.getBoundingClientRect();
      // ignore invisible / zero-size
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0) continue;
      // element extends past the right viewport edge
      if (r.right > vw + 1) {
        offenders.push({
          right: Math.round(r.right),
          width: Math.round(r.width),
          left: Math.round(r.left),
          tag: el.tagName.toLowerCase(),
          cls: (el.className && typeof el.className === "string") ? el.className.slice(0, 60) : "",
          id: el.id || "",
          pos: cs.position,
        });
      }
    }
    // sort by furthest right edge, keep the worst 12
    offenders.sort((a, b) => b.right - a.right);
    return { docW, vw, scrolledX, offenders: offenders.slice(0, 12) };
  }, width);

  console.log(`\n===== viewport ${width}px =====`);
  console.log(`scrollWidth=${result.docW}  horizontalScroll=${result.scrolledX}px  ${result.scrolledX > 0 ? "*** USER CAN SCROLL SIDEWAYS ***" : "OK (no sideways scroll)"}`);
  if (result.offenders.length) {
    for (const o of result.offenders) {
      console.log(
        `  right=${o.right} w=${o.width} left=${o.left} [${o.pos}] <${o.tag}> ${o.id ? "#" + o.id : ""} .${o.cls}`
      );
    }
  } else {
    console.log("  no offenders past the right edge");
  }
  await page.close();
}

await browser.close();
