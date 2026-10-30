/**
 * Image pipeline: design-assets/originals/*.jpg → public/images/*.jpg (resized, progressive, metadata stripped).
 *
 *   npm run images:optimize
 *
 * Also derives `demo-before.jpg` — a digitally dulled copy of `cat-colour.jpg` used ONLY for the
 * clearly-labelled illustrative before/after slider (never presented as a real client result).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(root, "design-assets/originals");
const outDir = path.join(root, "public/images");
fs.mkdirSync(outDir, { recursive: true });

const maxWidth: Record<string, number> = { "hero-desktop": 1920, "hero-mobile": 1100 };

async function main() {
  for (const file of fs.readdirSync(srcDir).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
    const name = path.parse(file).name;
    let img = sharp(path.join(srcDir, file)).rotate();
    const meta = await img.metadata();
    // the mobile hero has a thin dark film border baked in — trim 1.6% from every edge
    if (name === "hero-mobile" && meta.width && meta.height) {
      const dx = Math.round(meta.width * 0.016), dy = Math.round(meta.height * 0.016);
      img = img.extract({ left: dx, top: dy, width: meta.width - dx * 2, height: meta.height - dy * 2 });
    }
    const target = maxWidth[name] ?? 1400;
    const out = path.join(outDir, `${name}.jpg`);
    await img.resize({ width: target, withoutEnlargement: name !== "hero-desktop" }).jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(out);
    const { width, height } = await sharp(out).metadata();
    console.log(`${name.padEnd(24)} ${width}x${height}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  }

  // Illustrative "before": desaturated, flatter, slightly softer — derived from the colour image.
  const beforeSrc = path.join(srcDir, "cat-colour.jpg");
  if (fs.existsSync(beforeSrc)) {
    const out = path.join(outDir, "demo-before.jpg");
    await sharp(beforeSrc).resize({ width: 1400 }).modulate({ saturation: 0.3, brightness: 0.92 }).linear(0.86, 14).blur(0.8).jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(out);
    console.log(`demo-before              (derived)  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
