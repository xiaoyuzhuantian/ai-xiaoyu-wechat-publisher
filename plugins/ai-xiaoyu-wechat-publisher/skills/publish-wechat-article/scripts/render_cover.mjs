import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { chromiumLaunchOptions } from "./launch_browser.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function value(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const outputDir = path.resolve(value("--output-dir", process.cwd()));
const slug = value("--slug", "公众号文章");
const htmlPath = path.join(outputDir, `${slug}-公众号横版封面.html`);
const pngPath = path.join(outputDir, `${slug}-公众号横版封面-1800x766.png`);
const chromePath = value("--chrome");
fs.mkdirSync(outputDir, { recursive: true });

const fields = {
  TITLE: value("--title", slug),
  META_LEFT: value("--meta-left", "AI EDITORIAL / 2026"),
  META_RIGHT: value("--meta-right", "KNOWLEDGE SYSTEM"),
  LINE1: value("--line1", "公众号文章"),
  LINE2_BEFORE: value("--line2-before", ""),
  HIGHLIGHT: value("--highlight", "AI"),
  LINE2_AFTER: value("--line2-after", "工作流"),
  SUBTITLE_BEFORE: value("--subtitle-before", "从"),
  SUBTITLE_HIGHLIGHT: value("--subtitle-highlight", "内容"),
  SUBTITLE_AFTER: value("--subtitle-after", "到排版，一步完成"),
  NOTE1: value("--note1", "CONTENT → DESIGN → PUBLISH"),
  NOTE2: value("--note2", "打开即可复制发布"),
  BRAND: value("--brand", "AI小愚"),
  TOOLKIT: value("--toolkit", "EDITORIAL TOOLKIT"),
  NUMBER: value("--number", "01"),
  SIDE_TITLE: value("--side-title", "WECHAT"),
  SIDE_SUB: value("--side-sub", "PUBLISH"),
  LABEL1: value("--label1", "INPUT"),
  LABEL2: value("--label2", "STYLE"),
  LABEL3: value("--label3", "PUBLISH"),
};

let template = fs.readFileSync(path.join(skillDir, "assets", "cover-template.html"), "utf8");
for (const [key, fieldValue] of Object.entries(fields)) {
  template = template.replaceAll(`{{${key}}}`, escapeHtml(fieldValue));
}
fs.writeFileSync(htmlPath, template);

const browser = await chromium.launch(chromiumLaunchOptions(chromePath));
const page = await browser.newPage({
  viewport: { width: 900, height: 383 },
  deviceScaleFactor: 2,
});
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
await page.locator("#poster").screenshot({ path: pngPath });
const metrics = await page.locator("#poster").evaluate(node => {
  const rect = node.getBoundingClientRect();
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    clientWidth: node.clientWidth,
    clientHeight: node.clientHeight,
  };
});
await browser.close();

console.log(JSON.stringify({ htmlPath, pngPath, metrics }));
if (metrics.width !== 900 || metrics.height !== 383) {
  process.exitCode = 1;
}
