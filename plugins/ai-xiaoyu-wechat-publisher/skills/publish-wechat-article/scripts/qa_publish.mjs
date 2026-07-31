import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { chromiumLaunchOptions } from "./launch_browser.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

function value(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const inputValue = value("--input");
if (!inputValue) {
  throw new Error("Missing --input <公众号粘贴兼容版.html>");
}

const input = path.resolve(inputValue);
const outputDir = path.resolve(value("--output-dir", path.dirname(input)));
const slug = value("--slug", path.basename(input).replace(/-公众号粘贴兼容版\.html$/, ""));
const previewPath = path.join(outputDir, `${slug}-公众号手机预览.png`);
const chromePath = value("--chrome");

const browser = await chromium.launch(chromiumLaunchOptions(chromePath));

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(pathToFileURL(input).href, { waitUntil: "load" });

const report = await page.evaluate(() => ({
  viewportWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  headings: document.querySelectorAll(".wechat-content h1,.wechat-content h2,.wechat-content h3").length,
  promptCards: document.querySelectorAll(".wechat-content section").length,
  tables: document.querySelectorAll(".wechat-content table").length,
  scriptsInsideCopyArea: document.querySelectorAll(".wechat-content script").length,
  styledElements: [...document.querySelectorAll(".wechat-content *")].filter(node => node.hasAttribute("style")).length,
  totalElements: document.querySelectorAll(".wechat-content *").length,
}));

await page.screenshot({
  path: previewPath,
  fullPage: false,
});

await page.locator("#copyRich").click();
const buttonText = await page.locator("#copyRich").innerText();

const result = { ...report, buttonText, previewPath };
console.log(JSON.stringify(result));
await browser.close();

if (
  report.scrollWidth !== report.viewportWidth ||
  report.scriptsInsideCopyArea !== 0 ||
  !buttonText.includes("已复制")
) {
  process.exitCode = 1;
}
