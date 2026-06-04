/**
 * Headless Visual Boundary Audit verification.
 * Writes NDJSON lines to .cursor/debug-bc6917.log for the debug session.
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

function isTransparent(value) {
  if (!value || value === "transparent") return true;
  const m = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
  );
  if (m && parseFloat(m[4] != null ? m[4] : "1") === 0) return true;
  return false;
}

function hasVisibleBorder(cs) {
  for (const s of ["Top", "Right", "Bottom", "Left"]) {
    const w = parseFloat(cs[`border${s}Width`]);
    const style = cs[`border${s}Style`];
    const color = cs[`border${s}Color`];
    if (w > 0 && style && style !== "none" && !isTransparent(color)) return true;
  }
  return false;
}

function classify(el) {
  const cs = getComputedStyle(el);
  const hits = [];
  if (!isTransparent(cs.backgroundColor)) hits.push("bg");
  const bdf = cs.backdropFilter || cs.webkitBackdropFilter;
  if (bdf && bdf !== "none") hits.push("backdrop");
  if (hasVisibleBorder(cs)) hits.push("border");
  if (cs.boxShadow && cs.boxShadow !== "none") hits.push("shadow");
  const ow = parseFloat(cs.outlineWidth);
  if (ow > 0 && cs.outlineStyle && cs.outlineStyle !== "none") hits.push("outline");
  return hits;
}

const TARGETS = [
  ".tree-vault__header",
  ".memories__head",
  ".portal .section-head",
  ".craft__plate",
];

writeFileSync(logPath, "", "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

const report = await page.evaluate(
  ({ targets }) => {
    function isTransparent(value) {
      if (!value || value === "transparent") return true;
      const m = value.match(
        /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
      );
      if (m && parseFloat(m[4] != null ? m[4] : "1") === 0) return true;
      return false;
    }
    function hasVisibleBorder(cs) {
      for (const s of ["Top", "Right", "Bottom", "Left"]) {
        const w = parseFloat(cs[`border${s}Width`]);
        const style = cs[`border${s}Style`];
        const color = cs[`border${s}Color`];
        if (w > 0 && style && style !== "none" && !isTransparent(color)) return true;
      }
      return false;
    }
    function classifyEl(el) {
      const cs = getComputedStyle(el);
      const hits = [];
      if (!isTransparent(cs.backgroundColor)) hits.push("bg");
      const bdf = cs.backdropFilter || cs.webkitBackdropFilter;
      if (bdf && bdf !== "none") hits.push("backdrop");
      if (hasVisibleBorder(cs)) hits.push("border");
      if (cs.boxShadow && cs.boxShadow !== "none") hits.push("shadow");
      return hits;
    }
    return targets.map((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { sel, missing: true };
      const cs = getComputedStyle(el);
      return {
        sel,
        hits: classifyEl(el),
        backgroundColor: cs.backgroundColor,
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
        borderTopWidth: cs.borderTopWidth,
        boxShadow: cs.boxShadow !== "none" ? "yes" : "none",
      };
    });
  },
  { targets: TARGETS }
);

const counts = { bg: 0, backdrop: 0, border: 0, shadow: 0, outline: 0, pseudo: 0 };
let total = 0;
const all = await page.evaluate(() => {
  const counts = { bg: 0, backdrop: 0, border: 0, shadow: 0 };
  let total = 0;
  const skip = new Set(["HTML", "HEAD", "META", "LINK", "STYLE", "SCRIPT", "TITLE", "BR"]);
  const els = document.body.getElementsByTagName("*");
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (skip.has(el.tagName)) continue;
    const cs = getComputedStyle(el);
    const hits = [];
    const isT = (v) => {
      if (!v || v === "transparent") return true;
      const m = v.match(/^rgba?\([^)]+\)$/i);
      if (m && v.includes(", 0)") ) return true;
      if (v === "rgba(0, 0, 0, 0)") return true;
      return false;
    };
    if (!isT(cs.backgroundColor)) hits.push("bg");
    const bdf = cs.backdropFilter || cs.webkitBackdropFilter;
    if (bdf && bdf !== "none") hits.push("backdrop");
    let border = false;
    for (const s of ["Top", "Right", "Bottom", "Left"]) {
      if (parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none" && !isT(cs[`border${s}Color`])) border = true;
    }
    if (border) hits.push("border");
    if (cs.boxShadow && cs.boxShadow !== "none") hits.push("shadow");
    if (!hits.length) continue;
    total++;
    hits.forEach((h) => counts[h]++);
  }
  return { total, counts };
});

logLine({
  sessionId: "bc6917",
  location: "scripts/vba-verify.mjs",
  message: "VBA headless target check (post-fix)",
  data: { report, runId: "post-fix-headless" },
  timestamp: Date.now(),
  hypothesisId: "VERIFY-HEADS",
});

logLine({
  sessionId: "bc6917",
  location: "scripts/vba-verify.mjs",
  message: "VBA headless full scan counts",
  data: { ...all, runId: "post-fix-headless" },
  timestamp: Date.now(),
  hypothesisId: "VERIFY-COUNTS",
});

console.log(JSON.stringify({ report, all }, null, 2));
await browser.close();
