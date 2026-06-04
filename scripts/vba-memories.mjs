/**
 * Lower the size threshold to surface small framed elements
 * (crystal captions, rarity pills) inside #memories.
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const logPath = join(root, ".cursor", "debug-bc6917.log");
const indexUrl = "file:///" + join(root, "index.html").replace(/\\/g, "/");
function logLine(o) { appendFileSync(logPath, JSON.stringify(o) + "\n", "utf8"); }

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page.evaluate(() => document.getElementById("memories")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(1500);

const probe = await page.evaluate(() => {
  const isT = (v) => !v || v === "transparent" || /rgba?\([^)]*,\s*0\s*\)/.test(v);
  function selector(el) {
    if (el.id) return "#" + el.id;
    const tag = el.tagName.toLowerCase();
    const cls = (typeof el.className === "string" ? el.className : "").trim().split(/\s+/).slice(0, 2).join(".");
    return cls ? `${tag}.${cls}` : tag;
  }
  function edges(cs) {
    const out = [];
    for (const s of ["Top", "Right", "Bottom", "Left"]) {
      const w = parseFloat(cs[`border${s}Width`]);
      const st = cs[`border${s}Style`];
      const col = cs[`border${s}Color`];
      if (w > 0 && st !== "none" && !isT(col)) out.push(`${s.toLowerCase()}:${w}px`);
    }
    return out.length ? out.join(",") : null;
  }

  // Scan the entire DOCUMENT, not just #memories,
  // because crystal captions and the tree-wall canvas live
  // outside the section element.
  const all = document.body.getElementsByTagName("*");
  const hits = [];
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const cs = getComputedStyle(el);
    const b = edges(cs);
    const sh = cs.boxShadow && cs.boxShadow !== "none" ? cs.boxShadow : null;
    if (!b && !sh) continue;
    const r = el.getBoundingClientRect();
    // Only items visible in the current viewport (memories scrolled into view)
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    if (r.width < 40 || r.height < 18) continue;
    hits.push({
      sel: selector(el),
      parent: el.parentElement ? selector(el.parentElement) : null,
      w: Math.round(r.width),
      h: Math.round(r.height),
      y: Math.round(r.top),
      border: b,
      shadow: sh ? sh.slice(0, 90) : null,
      borderRadius: cs.borderRadius,
      bg: isT(cs.backgroundColor) ? null : cs.backgroundColor,
    });
  }
  hits.sort((a, b) => (b.w * b.h) - (a.w * a.h));
  return { viewport: window.innerHeight, count: hits.length, top: hits.slice(0, 18) };
});

logLine({ sessionId: "bc6917", location: "scripts/vba-memories.mjs", message: "Memories viewport scan", data: probe, timestamp: Date.now(), hypothesisId: "MEM-VIEWPORT" });
console.log(JSON.stringify(probe, null, 2));
await browser.close();
