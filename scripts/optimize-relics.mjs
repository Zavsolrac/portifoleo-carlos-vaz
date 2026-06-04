/**
 * Optimise the 5 "Artefato Exemplar" relic miniatures.
 *
 * Each generated PNG ships at ~4MB which is absurd for a thumbnail
 * rendered at ~84px wide. We downscale to 480x320 (still ample for
 * retina) and re-encode as WebP at quality 78 — typically ~30-60KB.
 * The original PNGs are kept for any future high-res use.
 */
import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const dir = join(__dir, "..", "src", "assets", "contracts");

const files = (await readdir(dir)).filter((f) => /^relic-.+\.png$/i.test(f));
for (const f of files) {
  const inPath = join(dir, f);
  const outPath = join(dir, f.replace(/\.png$/i, ".webp"));
  const before = (await stat(inPath)).size;
  await sharp(inPath)
    .resize({ width: 480, height: 320, fit: "cover", position: "centre" })
    .webp({ quality: 78, effort: 5 })
    .toFile(outPath);
  const after = (await stat(outPath)).size;
  console.log(`${f} → ${f.replace(/\.png$/i, ".webp")}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`);
}
