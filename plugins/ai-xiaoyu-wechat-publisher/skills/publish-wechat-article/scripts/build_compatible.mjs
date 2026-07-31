import fs from "node:fs";
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
  throw new Error("Missing --input <精排版.html>");
}

const inputPath = path.resolve(inputValue);
const outputDir = path.resolve(value("--output-dir", path.dirname(inputPath)));
const defaultSlug = path.basename(inputPath).replace(/-公众号精排版\.html$/, "");
const slug = value("--slug", defaultSlug);
const outputPath = path.join(outputDir, `${slug}-公众号粘贴兼容版.html`);
const kickerText = value("--kicker", "AI EDITORIAL × KNOWLEDGE SYSTEM");
const chromePath = value("--chrome");
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch(chromiumLaunchOptions(chromePath));

const page = await browser.newPage({ viewport: { width: 980, height: 900 } });
await page.goto(pathToFileURL(inputPath).href, { waitUntil: "load" });
const documentTitle = await page.title();

const compatibleBody = await page.evaluate(kickerText => {
  const article = document.querySelector("#article").cloneNode(true);

  const firstAppendix = article.querySelector("h2.appendix");
  if (firstAppendix) {
    let node = firstAppendix;
    while (node) {
      const next = node.nextSibling;
      node.remove();
      node = next;
    }
  }

  article.querySelectorAll("button,.closing,script").forEach(node => node.remove());
  article.removeAttribute("id");
  article.removeAttribute("class");

  const style = (node, rules) => Object.assign(node.style, rules);
  const all = (selector, rules) => article.querySelectorAll(selector).forEach(node => style(node, rules));

  style(article, {
    maxWidth: "677px",
    margin: "0 auto",
    padding: "12px 6px 42px",
    color: "#11120f",
    backgroundColor: "#ffffff",
    fontFamily: "-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif",
    fontSize: "16px",
    lineHeight: "1.9",
    wordBreak: "break-word",
  });

  const title = article.querySelector("h1");
  if (title) {
    const kicker = document.createElement("p");
    kicker.textContent = kickerText;
    style(kicker, {
      margin: "0 0 15px",
      color: "#0759ed",
      fontSize: "12px",
      lineHeight: "1.3",
      fontWeight: "800",
      letterSpacing: "2px",
      fontFamily: "Arial,sans-serif",
    });
    title.before(kicker);
    style(title, {
      margin: "0 0 24px",
      padding: "0 0 22px",
      color: "#0a0c10",
      borderBottom: "5px solid #0759ed",
      fontSize: "38px",
      lineHeight: "1.18",
      fontWeight: "900",
      letterSpacing: "-1.8px",
    });
  }

  all("p", {
    margin: "0 0 18px",
    color: "#22252b",
    fontSize: "16px",
    lineHeight: "1.9",
  });

  let chapter = 0;
  article.querySelectorAll("h2").forEach(heading => {
    chapter += 1;
    const label = document.createElement("span");
    label.textContent = String(chapter).padStart(2, "0");
    style(label, {
      display: "inline-block",
      width: "48px",
      marginRight: "8px",
      color: "#0759ed",
      fontFamily: "Arial,sans-serif",
      fontSize: "22px",
      fontWeight: "800",
      verticalAlign: "baseline",
    });
    const text = document.createElement("span");
    text.innerHTML = heading.innerHTML;
    heading.replaceChildren(label, text);
    style(heading, {
      margin: "54px 0 24px",
      padding: "18px 0 0",
      color: "#101217",
      borderTop: "2px solid #0759ed",
      fontSize: "27px",
      lineHeight: "1.35",
      fontWeight: "900",
      letterSpacing: "-0.8px",
    });
  });

  all("h3", {
    margin: "34px 0 13px",
    color: "#111319",
    fontSize: "21px",
    lineHeight: "1.45",
    fontWeight: "900",
  });

  all("ul,ol", {
    margin: "12px 0 25px",
    paddingLeft: "24px",
    color: "#22252b",
  });

  all("li", {
    margin: "7px 0",
    paddingLeft: "2px",
    color: "#22252b",
    fontSize: "16px",
    lineHeight: "1.85",
  });

  all("strong", {
    padding: "1px 3px",
    color: "#003ca8",
    backgroundColor: "#dfeaff",
    fontWeight: "900",
  });

  all("a", {
    color: "#0759ed",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  });

  all("p code,li code", {
    padding: "2px 5px",
    color: "#003ca8",
    backgroundColor: "#edf3ff",
    border: "1px solid #cbdcff",
    borderRadius: "4px",
    fontFamily: "Menlo,Consolas,monospace",
    fontSize: "14px",
  });

  article.querySelectorAll("blockquote").forEach((quote, index) => {
    if (index === 0) {
      style(quote, {
        margin: "0 0 38px",
        padding: "0",
        color: "#11120f",
        backgroundColor: "#ffffff",
        borderTop: "0",
        borderLeft: "0",
        fontSize: "20px",
        lineHeight: "1.7",
        fontWeight: "800",
      });
      quote.querySelectorAll("p").forEach(p => style(p, {
        margin: "0",
        color: "#11120f",
        fontSize: "20px",
        lineHeight: "1.7",
        fontWeight: "800",
      }));
    } else {
      style(quote, {
        margin: "30px 0",
        padding: "21px 23px",
        color: "#ffffff",
        backgroundColor: "#0759ed",
        borderLeft: "6px solid #101217",
        borderRadius: "2px",
        fontSize: "20px",
        lineHeight: "1.65",
        fontWeight: "850",
      });
      quote.querySelectorAll("p,strong").forEach(child => style(child, {
        margin: "0",
        padding: "0",
        color: "#ffffff",
        backgroundColor: "transparent",
        fontSize: "20px",
        lineHeight: "1.65",
        fontWeight: "850",
      }));
    }
  });

  article.querySelectorAll(".prompt-card").forEach(card => {
    style(card, {
      margin: "26px 0 32px",
      padding: "0",
      color: "#f7f9ff",
      backgroundColor: "#08142b",
      border: "1px solid #27436f",
      borderRadius: "8px",
      overflow: "hidden",
    });
    const bar = card.querySelector(".prompt-bar");
    if (bar) {
      style(bar, {
        display: "block",
        margin: "0",
        padding: "11px 17px",
        color: "#92baff",
        backgroundColor: "#102343",
        borderBottom: "1px solid #27436f",
        fontFamily: "Menlo,Consolas,monospace",
        fontSize: "11px",
        lineHeight: "1.4",
        fontWeight: "800",
        letterSpacing: "1.2px",
      });
    }
    const pre = card.querySelector("pre");
    if (pre) {
      style(pre, {
        margin: "0",
        padding: "19px 18px 22px",
        color: "#f7f9ff",
        backgroundColor: "#08142b",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "Menlo,Consolas,monospace",
        fontSize: "13px",
        lineHeight: "1.75",
      });
    }
    card.querySelectorAll("code").forEach(code => style(code, {
      color: "#f7f9ff",
      backgroundColor: "transparent",
      fontFamily: "Menlo,Consolas,monospace",
      fontSize: "13px",
      lineHeight: "1.75",
    }));
  });

  all("hr", {
    height: "1px",
    margin: "48px 0",
    padding: "0",
    backgroundColor: "#cbdcf9",
    border: "0",
  });

  article.querySelectorAll(".table-wrap").forEach(wrapper => {
    style(wrapper, {
      width: "100%",
      margin: "26px 0 32px",
      overflowX: "auto",
      border: "1px solid #101217",
      backgroundColor: "#ffffff",
    });
  });

  all("table", {
    width: "100%",
    borderCollapse: "collapse",
    color: "#22252b",
    backgroundColor: "#ffffff",
    fontSize: "12px",
    lineHeight: "1.55",
  });

  all("th,td", {
    padding: "10px 8px",
    textAlign: "left",
    verticalAlign: "top",
    borderRight: "1px solid #cbdcf9",
    borderBottom: "1px solid #cbdcf9",
  });

  all("th", {
    color: "#ffffff",
    backgroundColor: "#0759ed",
    fontWeight: "900",
  });

  article.querySelectorAll("*").forEach(node => {
    node.removeAttribute("class");
    node.removeAttribute("id");
    node.removeAttribute("data-copy-prompt");
  });

  return article.outerHTML;
}, kickerText);

await browser.close();

const output = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${documentTitle}｜公众号粘贴兼容版</title>
  <style>
    *{box-sizing:border-box}
    body{
      margin:0;
      color:#11120f;
      background:#dce5f3;
      font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
    }
    .guide{
      position:sticky;z-index:10;top:0;
      display:flex;align-items:center;justify-content:center;gap:16px;
      padding:13px 18px;color:#fff;background:#0759ed;
      box-shadow:0 6px 20px #003ca833;
    }
    .guide span{font-size:14px;font-weight:700}
    .guide button{
      appearance:none;border:1px solid #fff;background:#fff;color:#0759ed;
      border-radius:999px;padding:9px 17px;font-weight:900;cursor:pointer;
    }
    .guide button:hover{background:#dfeaff}
    .sheet{
      width:min(100%,760px);
      margin:28px auto;
      padding:34px 35px;
      background:#fff;
      box-shadow:0 18px 60px #102a5d1f;
    }
    .note{
      width:min(calc(100% - 32px),760px);
      margin:18px auto 0;
      padding:12px 16px;
      color:#46546b;background:#f7faff;border:1px solid #bcd2fa;
      font-size:13px;line-height:1.65;
    }
    @media(max-width:700px){
      .guide{justify-content:space-between;gap:8px}
      .guide span{font-size:12px}
      .guide button{padding:8px 12px;font-size:12px}
      .sheet{width:100%;margin:0;padding:28px 18px;box-shadow:none}
      .note{margin:12px auto}
    }
  </style>
</head>
<body>
  <div class="guide">
    <span>公众号兼容版｜点击复制后，用普通粘贴 Command + V</span>
    <button type="button" id="copyRich">复制兼容版正文</button>
  </div>
  <div class="note">
    已移除脚本、网格背景、悬浮按钮和编辑附录；正文中的关键样式均已转为行内样式。粘贴后请在公众号后台发送一次手机预览。
  </div>
  <main class="sheet">
    <div class="wechat-content">${compatibleBody}</div>
  </main>
  <script>
    const button = document.querySelector("#copyRich");
    button.addEventListener("click", () => {
      const content = document.querySelector(".wechat-content");
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(content);
      selection.removeAllRanges();
      selection.addRange(range);
      const ok = document.execCommand("copy");
      selection.removeAllRanges();
      button.textContent = ok ? "已复制，去公众号粘贴" : "请手动全选正文复制";
      setTimeout(() => button.textContent = "复制兼容版正文", 1800);
    });
  </script>
</body>
</html>`;

fs.writeFileSync(outputPath, output);
console.log(outputPath);
