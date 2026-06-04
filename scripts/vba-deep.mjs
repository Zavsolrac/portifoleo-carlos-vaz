/**
 * Deep border scan inside #memories and #contracts.
 * Walks the FULL descendant tree and reports every element whose
 * border is visible AND its computed size is >= 120x80 px (i.e. a
 * real rectangle, not a tag/badge).
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
writeFileSync(logPath, "", "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);

for (const id of ["memories", "contracts"]) {
  await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: "center" }), id);
  await page.waitForTimeout(700);
}

const probe = await page.evaluate(() => {
  const isT = (v) => !v || v === "transparent" || /rgba?\([^)]*,\s*0\s*\)/.test(v);
  function borderEdges(cs) {
    const out = {};
    let any = false;
    for (const s of ["Top", "Right", "Bottom", "Left"]) {
      const w = parseFloat(cs[`border${s}Width`]);
      const st = cs[`border${s}Style`];
      const col = cs[`border${s}Color`];
      if (w > 0 && st && st !== "none" && !isT(col)) { out[s.toLowerCase()] = `${w}px ${st} ${col}`; any = true; }
    }
    return any ? out : null;
  }
  function selector(el) {
    if (el.id) return "#" + el.id;
    const tag = el.tagName.toLowerCase();
    const cls = (typeof el.className === "string" ? el.className : "").trim().split(/\s+/).slice(0, 2).join(".");
    return cls ? `${tag}.${cls}` : tag;
  }
  function probeRoot(id) {
    const root = document.getElementById(id);
    if (!root) return { missing: true };
    const all = root.getElementsByTagName("*");
    const hits = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const cs = getComputedStyle(el);
      const b = borderEdges(cs);
      const sh = cs.boxShadow && cs.boxShadow !== "none" ? cs.boxShadow : null;
      const ol = parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== "none" && !isT(cs.outlineColor)
        ? `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : null;
      if (!b && !sh && !ol) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 60) continue; // skip tags / icons / pills
      hits.push({
        sel: selector(el),
        path: ((el.parentElement && selector(el.parentElement)) || "") + " > " + selector(el),
        w: Math.round(r.width),
        h: Math.round(r.height),
        border: b,
        shadow: sh ? sh.slice(0, 110) : null,
        outline: ol,
        borderRadius: cs.borderRadius,
      });
    }
    hits.sort((a, b) => (b.w * b.h) - (a.w * a.h));
    return { count: hits.length, top: hits.slice(0, 20) };
  }
  return { memories: probeRoot("memories"), contracts: probeRoot("contracts") };
});

logLine({ sessionId: "bc6917", location: "scripts/vba-deep.mjs", message: "Deep border scan", data: probe, timestamp: Date.now(), hypothesisId: "DEEP" });
console.log(JSON.stringify(probe, null, 2));
await browser.close();
