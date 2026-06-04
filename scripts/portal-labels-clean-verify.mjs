/* Verify the portal cards now display ONLY the channel name. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector(".welcome")?.remove());
await page.evaluate(() => document.querySelectorAll(".merlin")?.forEach((n) => n.remove()));
await page.evaluate(() => document.getElementById("portal")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(700);
await page.evaluate(() =>
  document.querySelector(".portal__stage")?.classList.add("is-visible")
);
await page.waitForTimeout(900);

const probe = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll(".portal__link"));
  return cards.map((a) => {
    const label = a.querySelector(".portal__link-label")?.textContent.trim();
    const handle = a.querySelector(".portal__link-handle");
    const visibleText = a.innerText.trim().replace(/\s+/g, " ");
    return {
      channel: a.dataset.channel,
      href: a.getAttribute("href"),
      aria: a.getAttribute("aria-label"),
      label,
      handlePresent: !!handle,
      visibleText,
    };
  });
});
console.log(JSON.stringify(probe, null, 2));

// Scroll the cards into view and capture them
await page.evaluate(() =>
  document.querySelector(".portal__links")?.scrollIntoView({ block: "center" })
);
await page.waitForTimeout(700);
const box = await page.evaluate(() => {
  const list = document.querySelector(".portal__links");
  const r = list.getBoundingClientRect();
  const pad = 40;
  return {
    x: Math.max(0, Math.round(r.x - pad)),
    y: Math.max(0, Math.round(r.y - pad)),
    width: Math.min(window.innerWidth, Math.round(r.width + pad * 2)),
    height: Math.min(window.innerHeight, Math.round(r.height + pad * 2)),
  };
});
if (box.width > 0 && box.height > 0) {
  await page.screenshot({ path: join(out, "portal-clean-labels.png"), clip: box });
}

// Verdict
const verdict = {
  count: probe.length === 6,
  allLabelsAreChannelOnly: probe.every((c) =>
    ["GitHub", "LinkedIn", "WhatsApp", "Email"].includes(c.label)
  ),
  noHandleElement: probe.every((c) => !c.handlePresent),
  noLeakedContactData: probe.every((c) =>
    !/[\d@./]|wishmastergm|raquelce|carlos-vaz-1a9a51274|Zavsolrac/i.test(c.visibleText)
  ),
  hrefsIntact: {
    github: probe.find((c) => c.channel === "github")?.href === "https://github.com/Zavsolrac",
    linkedin: probe.find((c) => c.channel === "linkedin")?.href === "https://www.linkedin.com/in/carlos-vaz-1a9a51274/",
    waPt: probe.some((c) => c.href === "https://wa.me/351910562698"),
    waEs: probe.some((c) => c.href === "https://wa.me/34617193035"),
    mailWish: probe.some((c) => c.href === "mailto:wishmastergm@gmail.com"),
    mailRaquel: probe.some((c) => c.href === "mailto:raquelce.rce@gmail.com"),
  },
  ariaDistinguishesDuplicates:
    probe.find((c) => c.href.endsWith("351910562698"))?.aria !== probe.find((c) => c.href.endsWith("34617193035"))?.aria &&
    probe.find((c) => c.href.endsWith("wishmastergm@gmail.com"))?.aria !== probe.find((c) => c.href.endsWith("raquelce.rce@gmail.com"))?.aria,
};
console.log("VERDICT", JSON.stringify(verdict, null, 2));
await browser.close();
