import fs from "node:fs";
import path from "node:path";
function value(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const inputValue = value("--input");
if (!inputValue) {
  throw new Error("Missing --input <article.md>");
}

const inputPath = path.resolve(inputValue);
const outputDir = path.resolve(value("--output-dir", path.dirname(inputPath)));
const slug = value("--slug", path.basename(inputPath, path.extname(inputPath)));
const outputPath = path.join(outputDir, `${slug}-公众号精排版.html`);
const brand = value("--brand", "AI小愚");
const series = value("--series", "知识长文");
const kicker = value("--kicker", "AI EDITORIAL × KNOWLEDGE SYSTEM");

const source = fs.readFileSync(inputPath, "utf8").replace(/\r\n/g, "\n");
const articleTitle = source.match(/^#\s+(.+)$/m)?.[1] || slug;
fs.mkdirSync(outputDir, { recursive: true });

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inline(value) {
  let text = escapeHtml(value);
  const codeSlots = [];
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    const index = codeSlots.push(`<code>${code}</code>`) - 1;
    return `@@CODE${index}@@`;
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  text = text.replace(/@@CODE(\d+)@@/g, (_, index) => codeSlots[Number(index)]);
  return text;
}

function renderMarkdown(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let quote = [];
  let inCode = false;
  let codeLines = [];
  let codeIndex = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType) return;
    html.push(`<${listType}>${listItems.map(item => `<li>${inline(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  const flushQuote = () => {
    if (!quote.length) return;
    html.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
    quote = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  const parseCells = line => line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(cell => cell.trim());

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("```")) {
      flushAll();
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        codeIndex += 1;
        html.push(`
          <section class="prompt-card">
            <div class="prompt-bar">
              <span>PROMPT ${String(codeIndex).padStart(2, "0")} · 可直接复制</span>
              <button type="button" data-copy-prompt>复制</button>
            </div>
            <pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>
          </section>
        `);
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:|-]+\|[\s:|-]+/.test(lines[i + 1])
    ) {
      flushAll();
      const headers = parseCells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseCells(lines[i]));
        i += 1;
      }
      i -= 1;
      html.push(`
        <div class="table-wrap">
          <table>
            <thead><tr>${headers.map(cell => `<th>${inline(cell)}</th>`).join("")}</tr></thead>
            <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
        </div>
      `);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const title = level === 2 ? heading[2].replace(/^\d{2}\s+/, "") : heading[2];
      const appendixTitles = new Set(["参考资料", "公众号发布信息"]);
      const className = level === 2 && appendixTitles.has(title) ? ' class="appendix"' : "";
      html.push(`<h${level}${className}>${inline(title)}</h${level}>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushAll();
      html.push("<hr>");
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      quote.push(line.slice(2));
      continue;
    }

    const unordered = line.match(/^- (.+)$/);
    if (unordered) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(unordered[1]);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(ordered[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line);
  }

  flushAll();
  return html.join("\n");
}

const articleHtml = renderMarkdown(source);

const page = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(articleTitle)}</title>
  <style>
    :root{
      --paper:#fbfdff;
      --canvas:#dce5f3;
      --ink:#11120f;
      --muted:#59677e;
      --line:#cbdcf9;
      --accent:#0759ed;
      --accent-soft:#dfeaff;
      --accent-dark:#003ca8;
      --dark:#08142b;
      --max:820px;
    }
    *{box-sizing:border-box}
    html{scroll-behavior:smooth;overflow-x:hidden}
    body{
      margin:0;
      overflow-x:hidden;
      background:var(--canvas);
      color:var(--ink);
      font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;
      font-size:18px;
      line-height:1.9;
      text-rendering:optimizeLegibility;
    }
    .progress{
      position:fixed;z-index:20;left:0;top:0;width:100%;height:4px;
      background:transparent;
    }
    .progress i{display:block;width:0;height:100%;background:var(--accent)}
    .toolbar{
      position:fixed;z-index:10;right:28px;top:28px;
      display:flex;gap:8px;
    }
    button{
      appearance:none;border:1px solid #b8bbb1;background:rgba(255,255,255,.92);
      color:var(--ink);border-radius:999px;padding:9px 15px;
      font:700 13px/1 "PingFang SC",sans-serif;cursor:pointer;
      backdrop-filter:blur(8px);
    }
    button:hover{background:var(--accent);border-color:var(--accent);color:#fff}
    main{
      width:min(100%,960px);
      margin:32px auto;
      background-color:var(--paper);
      background-image:
        linear-gradient(#0759ed09 1px,transparent 1px),
        linear-gradient(90deg,#0759ed09 1px,transparent 1px);
      background-size:48px 48px;
      box-shadow:0 20px 70px rgba(22,27,15,.12);
      min-height:100vh;
    }
    .masthead{
      height:12px;background:var(--accent);
      border-bottom:1px solid var(--ink);
    }
    .publication{
      display:flex;justify-content:space-between;align-items:center;
      padding:22px 54px 18px;border-bottom:1px solid var(--line);
      font:800 12px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:.16em;text-transform:uppercase;color:var(--accent);
    }
    .publication b{font-size:14px;letter-spacing:.06em;color:var(--ink)}
    article{
      width:min(calc(100% - 64px),var(--max));
      margin:0 auto;
      padding:56px 0 90px;
      counter-reset:chapter;
    }
    h1{
      margin:0 0 25px;
      max-width:760px;
      font-family:"PingFang SC","Microsoft YaHei",sans-serif;
      font-size:clamp(48px,7vw,78px);
      line-height:1.04;
      letter-spacing:-.055em;
      font-weight:950;
    }
    h1::before{
      content:"${escapeHtml(kicker)}";
      display:block;margin-bottom:22px;
      font:800 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:.18em;color:var(--accent);
    }
    article>blockquote:first-of-type{
      margin:28px 0 46px;padding:22px 0 0;
      border:0;border-top:5px solid var(--accent);
      background:transparent;
      font-size:23px;line-height:1.6;font-weight:750;color:var(--ink);
    }
    article>blockquote:first-of-type p{margin:0}
    h2{
      counter-increment:chapter;
      position:relative;
      margin:82px 0 28px;
      padding:24px 0 0 78px;
      border-top:2px solid var(--accent);
      font-family:"PingFang SC","Microsoft YaHei",sans-serif;
      font-size:36px;line-height:1.25;letter-spacing:-.035em;font-weight:950;
    }
    h2::before{
      content:counter(chapter,decimal-leading-zero);
      position:absolute;left:0;top:25px;
      color:var(--accent);
      font:400 34px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:-.06em;
    }
    h3{
      margin:42px 0 14px;
      font-family:"PingFang SC","Microsoft YaHei",sans-serif;
      font-size:24px;line-height:1.35;font-weight:900;
    }
    p{margin:0 0 20px}
    strong{
      font-weight:900;
      background:linear-gradient(transparent 58%,var(--accent-soft) 58%);
    }
    a{color:var(--ink);text-decoration-thickness:1px;text-underline-offset:4px}
    a:hover{background:var(--accent-soft)}
    article p code,article li code{
      background:#edf3ff;border:1px solid #cbdcff;border-radius:5px;color:#003ca8;
      padding:.12em .4em;font:700 .86em/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;
    }
    ul,ol{margin:12px 0 28px;padding-left:1.45em}
    li{padding-left:.3em;margin:8px 0}
    li::marker{font-weight:900;color:var(--accent)}
    blockquote{
      margin:36px 0;padding:25px 30px;
      background:var(--accent);color:#fff;
      border-left:7px solid var(--ink);
      font-size:24px;line-height:1.55;font-weight:850;
    }
    blockquote p{margin:0}
    blockquote strong{background:none;color:#fff}
    hr{
      border:0;height:18px;margin:68px -24px 0;
      background:repeating-linear-gradient(135deg,var(--accent) 0 2px,transparent 2px 8px);
      opacity:.14;
    }
    .prompt-card{
      margin:30px 0 38px;
      background:var(--dark);color:#f7f9ff;
      border-radius:0;overflow:hidden;
      box-shadow:10px 10px 0 var(--accent-soft);
      border:1px solid var(--ink);
    }
    .prompt-bar{
      display:flex;align-items:center;justify-content:space-between;
      padding:13px 16px 12px 21px;
      color:#80adff;border-bottom:1px solid #27436f;
      font:800 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:.16em;
    }
    .prompt-bar button{
      padding:7px 12px;background:#142747;color:#fff;border-color:#365989;
    }
    .prompt-bar button:hover{background:var(--accent);color:#fff;border-color:#7faeff}
    pre{
      margin:0;padding:24px 24px 27px;overflow-x:auto;
      white-space:pre-wrap;word-break:break-word;
      font:500 14px/1.75 ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;
    }
    pre code{font:inherit}
    .table-wrap{
      width:100%;margin:28px 0 36px;overflow-x:auto;
      border:1px solid var(--ink);background:#fff;
      box-shadow:8px 8px 0 var(--accent-soft);
    }
    table{
      width:100%;border-collapse:collapse;
      font-size:14px;line-height:1.55;
    }
    th,td{
      padding:13px 11px;text-align:left;vertical-align:top;
      border-right:1px solid var(--line);border-bottom:1px solid var(--line);
    }
    th{
      color:#fff;background:var(--accent);
      font-weight:900;white-space:nowrap;
    }
    th:last-child,td:last-child{border-right:0}
    tbody tr:last-child td{border-bottom:0}
    h2.appendix{
      padding-left:0;color:#4e504b;font-size:29px;
    }
    h2.appendix::before{display:none}
    .closing{
      margin-top:70px;padding:27px 0 0;
      border-top:6px solid var(--accent);
      color:var(--muted);
      font-size:13px;
      font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:.06em;
    }
    @media (max-width:700px){
      body{font-size:17px;background:var(--paper)}
      main{margin:0;width:100%;box-shadow:none}
      .publication{padding:18px 22px}
      .publication span:last-child{display:none}
      article{width:calc(100% - 40px);padding:42px 0 70px}
      h1{font-size:48px}
      h2{margin-top:64px;padding-left:58px;font-size:30px}
      h2::before{font-size:25px}
      h3{font-size:22px}
      blockquote{margin-left:0;margin-right:0;padding:21px 22px;font-size:21px}
      .toolbar{right:14px;top:auto;bottom:14px}
      .toolbar button:first-child{display:none}
      pre{font-size:12px;padding:20px}
      .table-wrap{margin-left:-6px;width:calc(100% + 12px)}
      table{font-size:12px;min-width:680px}
      th,td{padding:11px 9px}
    }
    @media print{
      body{background:#fff;font-size:15px}
      main{margin:0;width:100%;box-shadow:none}
      .toolbar,.progress{display:none}
      article{width:760px;padding-top:35px}
      a{text-decoration:none}
      .prompt-card{break-inside:avoid}
      h2,h3{break-after:avoid}
    }
  </style>
</head>
<body>
  <div class="progress"><i></i></div>
  <div class="toolbar">
    <button type="button" onclick="window.print()">打印 / PDF</button>
    <button type="button" id="copyArticle">复制正文</button>
  </div>
  <main>
    <div class="masthead"></div>
    <header class="publication">
      <b>${escapeHtml(brand)} · ${escapeHtml(series)}</b>
      <span>${escapeHtml(kicker)}</span>
    </header>
    <article id="article">
      ${articleHtml}
      <div class="closing">${escapeHtml(brand)}｜公众号发布版</div>
    </article>
  </main>
  <script>
    const progress = document.querySelector(".progress i");
    addEventListener("scroll", () => {
      const total = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = (total > 0 ? scrollY / total * 100 : 0) + "%";
    }, {passive:true});

    document.querySelectorAll("[data-copy-prompt]").forEach(button => {
      button.addEventListener("click", async () => {
        const code = button.closest(".prompt-card").querySelector("code").innerText;
        await navigator.clipboard.writeText(code);
        button.textContent = "已复制";
        setTimeout(() => button.textContent = "复制", 1200);
      });
    });

    document.querySelector("#copyArticle").addEventListener("click", async event => {
      await navigator.clipboard.writeText(document.querySelector("#article").innerText);
      event.currentTarget.textContent = "正文已复制";
      setTimeout(() => event.currentTarget.textContent = "复制正文", 1400);
    });
  </script>
</body>
</html>`;

fs.writeFileSync(outputPath, page);
console.log(outputPath);
