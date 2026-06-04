/**
 * Verifies the IDENTITY_OVERRIDE for the "Praticando Clone Flappy Bird"
 * crystal — the surfaced project should now expose:
 *   title       = "Associação Arracada"
 *   url         = "https://www.arracadavds.org"
 *   githubUrl   = "https://www.arracadavds.org"
 *   caseUrl     = "https://www.arracadavds.org"
 *
 * We stub the GitHub fetch with a fixture that includes a
 * praticando-clone-flappy-bird repo, then read Crystals.projects
 * after fetch() resolves.
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, "..");
const out   = join(root, ".cursor", "relic-shots");
const log   = join(root, ".cursor", "crystal-override.log");
mkdirSync(out, { recursive: true });
writeFileSync(log, "", "utf8");
const w = (o) => appendFileSync(log, JSON.stringify(o) + "\n", "utf8");

const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

// Intercept the GitHub repos request and return a fixture that
// guarantees the flappy-bird repo exists in the result set.
await page.route("**/api.github.com/users/**/repos*", async (route) => {
  const fixture = [
    {
      id: 1, name: "praticando-clone-flappy-bird", html_url: "https://github.com/Zavsolrac/praticando-clone-flappy-bird",
      description: "Estudo: clone do Flappy Bird em JavaScript puro.", homepage: "",
      stargazers_count: 1, language: "JavaScript", topics: ["javascript", "game"], updated_at: "2026-04-12T10:00:00Z", fork: false, size: 200,
    },
    {
      id: 2, name: "arcane-architect", html_url: "https://github.com/Zavsolrac/arcane-architect",
      description: "Portfolio interativo.", homepage: "",
      stargazers_count: 12, language: "JavaScript", topics: ["portfolio"], updated_at: "2026-05-30T10:00:00Z", fork: false, size: 1000,
    },
    {
      id: 3, name: "ai-workflow-lab", html_url: "https://github.com/Zavsolrac/ai-workflow-lab",
      description: "Pipelines LLM.", homepage: "",
      stargazers_count: 5, language: "TypeScript", topics: ["ai", "llm"], updated_at: "2026-05-20T10:00:00Z", fork: false, size: 800,
    },
  ];
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture) });
});

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.querySelector(".welcome")?.remove());
await page.waitForTimeout(2500);

const probe = await page.evaluate(() => {
  const c = window.Crystals || {};
  const all = (c.projects || []).map((p) => ({
    name: p.name,
    title: p.title,
    url: p.url,
    githubUrl: p.githubUrl,
    caseUrl: p.caseUrl,
    description: p.description?.slice(0, 80),
  }));
  const bird = all.find((p) => /bird|flappy/i.test(p.name));
  return { projectCount: all.length, all, bird };
});
w({ kind: "probe", probe });

const verdict = {
  birdProjectExists: !!probe.bird,
  titleRewritten: probe.bird?.title === "Associação Arracada",
  urlRewritten: probe.bird?.url === "https://www.arracadavds.org",
  githubUrlRewritten: probe.bird?.githubUrl === "https://www.arracadavds.org",
  caseUrlRewritten: probe.bird?.caseUrl === "https://www.arracadavds.org",
  rawNamePreserved: probe.bird?.name === "praticando-clone-flappy-bird",
  otherProjectsUnaffected: probe.all
    .filter((p) => !/bird|flappy/i.test(p.name))
    .every((p) => p.url !== "https://www.arracadavds.org"),
};
w({ kind: "verdict", verdict });
console.log(JSON.stringify(verdict, null, 2));

await browser.close();
