/**
 * Phantom-border probe.
 * Targets #memories and #contracts plus every descendant ≤ 2 levels deep
 * and dumps every styling vector that could draw a rectangle:
 *   background-color, background-image, backdrop-filter,
 *   border-*, outline-*, box-shadow,
 *   plus ::before / ::after computed style.
 *
 * Output is written as NDJSON to .cursor/debug-bc6917.log so the
 * debug session can read it as runtime evidence.
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const logPath = join(root, ".cursor", "debug-bc6917.log");
const indexUrl = "file:///" + join(root, "index.html").replace(/\\/g, "/");

function logLine(obj) {
  appendFileSync(logPath, JSON.stringify(obj) + "\n", "utf8");
}
writeFileSync(logPath, "", "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

// Capture console errors / failed CSS in case something is theme-related
page.on("console", (m) => {
  if (m.type() === "error") logLine({ sessionId: "bc6917", location: "console", message: "page error", data: { text: m.text() }, timestamp: Date.now() });
});

await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

// Scroll each target into view so narrative entry classes fire
for (const id of ["memories", "contracts"]) {
  await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: "center" }), id);
  await page.waitForTimeout(900);
}

const probe = await page.evaluate(() => {
  const TARGETS = ["#memories", "#contracts"];

  function isTransparent(v) {
    if (!v || v === "transparent") return true;
    const m = v.match(/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (m && parseFloat(m[1] != null ? m[1] : "1") === 0) return true;
    return false;
  }
  function borderSummary(cs) {
    const out = {};
    let any = false;
    for (const s of ["Top", "Right", "Bottom", "Left"]) {
      const w = parseFloat(cs[`border${s}Width`]);
      const style = cs[`border${s}Style`];
      const color = cs[`border${s}Color`];
      if (w > 0 && style !== "none" && !isTransparent(color)) {
        out[s.toLowerCase()] = `${w}px ${style} ${color}`;
        any = true;
      }
    }
    return any ? out : null;
  }
  function shadowOf(cs) { return cs.boxShadow && cs.boxShadow !== "none" ? cs.boxShadow : null; }
  function outlineOf(cs) {
    const w = parseFloat(cs.outlineWidth);
    return w > 0 && cs.outlineStyle && cs.outlineStyle !== "none" && !isTransparent(cs.outlineColor)
      ? `${w}px ${cs.outlineStyle} ${cs.outlineColor}` : null;
  }

  function describe(el, label) {
    const cs = getComputedStyle(el);
    const before = getComputedStyle(el, "::before");
    const after  = getComputedStyle(el, "::after");
    function pseudo(p) {
      if (!p.content || p.content === "none" || p.content === "normal") return null;
      return {
        content: p.content,
        position: p.position,
        inset: `${p.top} ${p.right} ${p.bottom} ${p.left}`,
        size: `${p.width} x ${p.height}`,
        backgroundColor: isTransparent(p.backgroundColor) ? null : p.backgroundColor,
        backgroundImage: p.backgroundImage === "none" ? null : p.backgroundImage.slice(0, 80),
        border: borderSummary(p),
        boxShadow: shadowOf(p),
        outline: outlineOf(p),
        opacity: p.opacity,
        zIndex: p.zIndex,
      };
    }
    const rect = el.getBoundingClientRect();
    return {
      label,
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: el.className && typeof el.className === "string" ? el.className.slice(0, 90) : null,
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
      backgroundColor: isTransparent(cs.backgroundColor) ? null : cs.backgroundColor,
      backgroundImage: cs.backgroundImage === "none" ? null : cs.backgroundImage.slice(0, 80),
      backdropFilter: (cs.backdropFilter && cs.backdropFilter !== "none") ? cs.backdropFilter : null,
      border: borderSummary(cs),
      boxShadow: shadowOf(cs),
      outline: outlineOf(cs),
      opacity: cs.opacity,
      before: pseudo(before),
      after: pseudo(after),
    };
  }

  const out = {};
  for (const sel of TARGETS) {
    const root = document.querySelector(sel);
    if (!root) { out[sel] = { missing: true }; continue; }

    const findings = [];
    findings.push(describe(root, "self"));
    // Direct children
    Array.from(root.children).forEach((c, i) => findings.push(describe(c, `child[${i}]`)));
    // 2nd-level: only first 3 grandchildren per child to avoid spam
    Array.from(root.children).forEach((c, ci) => {
      Array.from(c.children).slice(0, 3).forEach((g, gi) => findings.push(describe(g, `grand[${ci}][${gi}]`)));
    });

    // Filter to those that actually project a rectangle
    const filtered = findings.filter(f =>
      f.backgroundColor || f.backgroundImage || f.backdropFilter ||
      f.border || f.boxShadow || f.outline ||
      (f.before && (f.before.backgroundColor || f.before.backgroundImage || f.before.border || f.before.boxShadow || f.before.outline)) ||
      (f.after  && (f.after.backgroundColor  || f.after.backgroundImage  || f.after.border  || f.after.boxShadow  || f.after.outline))
    );

    out[sel] = {
      narrativeAct: document.documentElement.getAttribute("data-narrative-act"),
      narrativeEntered: root.getAttribute("data-narrative-entered"),
      total: findings.length,
      offenders: filtered,
    };
  }
  return out;
});

logLine({
  sessionId: "bc6917",
  location: "scripts/vba-phantom.mjs",
  message: "Phantom border probe",
  data: probe,
  timestamp: Date.now(),
  hypothesisId: "PHANTOM",
});

console.log(JSON.stringify(probe, null, 2));
await browser.close();
