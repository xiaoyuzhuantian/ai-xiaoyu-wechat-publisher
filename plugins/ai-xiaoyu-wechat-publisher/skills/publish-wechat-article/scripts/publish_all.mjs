import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

function value(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function run(script, args) {
  const result = spawnSync(process.execPath, [path.join(scriptsDir, script), ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${script} failed with exit code ${result.status}`);
  }
}

const inputValue = value("--input");
const coverLine1 = value("--cover-line1");
if (!inputValue || !coverLine1) {
  throw new Error("Required: --input <article.md> --cover-line1 <text>");
}

const input = path.resolve(inputValue);
const outputDir = path.resolve(value("--output-dir", path.dirname(input)));
const slug = value("--slug", path.basename(input, path.extname(input)));
const brand = value("--brand", "AI小愚");
const series = value("--series", "知识长文");
const kicker = value("--kicker", "AI EDITORIAL × KNOWLEDGE SYSTEM");
const chrome = value("--chrome");
const source = fs.readFileSync(input, "utf8");
const title = source.match(/^#\s+(.+)$/m)?.[1] || slug;
fs.mkdirSync(outputDir, { recursive: true });

run("build_article.mjs", [
  "--input", input,
  "--output-dir", outputDir,
  "--slug", slug,
  "--brand", brand,
  "--series", series,
  "--kicker", kicker,
]);

const editorialPath = path.join(outputDir, `${slug}-公众号精排版.html`);
run("build_compatible.mjs", [
  "--input", editorialPath,
  "--output-dir", outputDir,
  "--slug", slug,
  "--kicker", kicker,
  "--chrome", chrome,
]);

run("render_cover.mjs", [
  "--output-dir", outputDir,
  "--slug", slug,
  "--title", title,
  "--line1", coverLine1,
  "--line2-before", value("--cover-line2-before"),
  "--highlight", value("--cover-highlight", "AI"),
  "--line2-after", value("--cover-line2-after"),
  "--subtitle-before", value("--cover-subtitle-before", "从"),
  "--subtitle-highlight", value("--cover-subtitle-highlight", "内容"),
  "--subtitle-after", value("--cover-subtitle-after", "到发布，一步完成"),
  "--side-title", value("--cover-side-title", "WECHAT"),
  "--side-sub", value("--cover-side-sub", "PUBLISH"),
  "--brand", brand,
  "--toolkit", value("--cover-toolkit", "EDITORIAL TOOLKIT"),
  "--number", value("--cover-number", "01"),
  "--note1", value("--cover-note1", "CONTENT → DESIGN → PUBLISH"),
  "--note2", value("--cover-note2", "打开即可复制发布"),
  "--label1", value("--cover-label1", "INPUT"),
  "--label2", value("--cover-label2", "STYLE"),
  "--label3", value("--cover-label3", "PUBLISH"),
  "--meta-left", value("--cover-meta-left", "AI EDITORIAL / 2026"),
  "--meta-right", value("--cover-meta-right", "KNOWLEDGE SYSTEM"),
  "--chrome", chrome,
]);

const compatiblePath = path.join(outputDir, `${slug}-公众号粘贴兼容版.html`);
run("qa_publish.mjs", [
  "--input", compatiblePath,
  "--output-dir", outputDir,
  "--slug", slug,
  "--chrome", chrome,
]);

console.log(JSON.stringify({
  editorialPath,
  compatiblePath,
  coverHtml: path.join(outputDir, `${slug}-公众号横版封面.html`),
  coverPng: path.join(outputDir, `${slug}-公众号横版封面-1800x766.png`),
  mobilePreview: path.join(outputDir, `${slug}-公众号手机预览.png`),
}));
