---
name: publish-wechat-article
description: "Convert a Markdown article into a polished WeChat Official Account publishing package: blue-white Swiss editorial HTML, an inline-style one-click copy version, an editable 900×383 cover, a 1800×766 PNG cover, and a mobile QA preview. Use when the user asks for 公众号排版、公众号精排、可直接复制粘贴公众号、公众号兼容版、公众号封面、横版封面，or wants a complete Markdown-to-WeChat publishing workflow."
---

# Publish WeChat Article

Turn a finished Markdown manuscript into a publication-ready WeChat package. Preserve the article's meaning and wording unless the user explicitly requests editing or rewriting.

## Required output

Produce all five artifacts:

1. `*-公众号精排版.html` — browser-readable editorial version.
2. `*-公众号粘贴兼容版.html` — inline-styled version with a one-click copy button.
3. `*-公众号横版封面.html` — editable 900×383 cover source.
4. `*-公众号横版封面-1800x766.png` — 2× high-resolution cover.
5. `*-公众号手机预览.png` — 390 px mobile QA capture.

Read [references/design-system.md](references/design-system.md) before generating or modifying output.

## Gather inputs

Infer sensible defaults from the manuscript and nearby files. Ask only when a missing choice would materially alter the result.

Required:

- Markdown source path
- Cover first line (`--cover-line1`)

Recommended:

- Output directory
- Short filename slug
- Brand, default `AI小愚`
- Series label
- Small English kicker
- Cover headline split into normal and highlighted segments
- Cover subtitle and side label

Use the first Markdown H1 as the article title. Keep all Chinese wording exact after the user confirms it.

## Run the complete workflow

First call `codex_app.load_workspace_dependencies` to locate the bundled Node.js runtime and module directory. Use those exact paths; do not install new packages.

From this skill directory, run:

```bash
NODE_PATH="<bundled-node-modules>" "<bundled-node>" scripts/publish_all.mjs \
  --input "/absolute/path/article.md" \
  --output-dir "/absolute/path/output" \
  --slug "article-slug" \
  --brand "AI小愚" \
  --series "AI求职 SKILL" \
  --kicker "AI JOB SKILL × CAREER SYSTEM" \
  --cover-line1 "我做了一个" \
  --cover-line2-before "“找工作”" \
  --cover-highlight "AI" \
  --cover-line2-after " Skill" \
  --cover-subtitle-before "从" \
  --cover-subtitle-highlight "定位" \
  --cover-subtitle-after "到投递复盘，一步一步带着做" \
  --cover-side-title "JOB SKILL"
```

Pass `--chrome "<path>"` only when the bundled browser cannot launch. Browser rendering may require user approval in a restricted environment.

The orchestrator runs these scripts in order:

- `scripts/build_article.mjs`
- `scripts/build_compatible.mjs`
- `scripts/render_cover.mjs`
- `scripts/qa_publish.mjs`

Prefer changing the Markdown, template, or scripts and regenerating. Do not hand-edit generated output unless the change is intentionally output-specific.

## Preserve publishing compatibility

The copyable article must:

- Put all article presentation styles inline.
- Keep scripts and controls outside `#copy-area`.
- Avoid external stylesheets, fonts, icons, and image dependencies.
- Avoid layout-critical CSS Grid, fixed positioning, or JavaScript.
- Use semantic headings, paragraphs, lists, blockquotes, tables, and prompt cards.
- Remove download notes, appendices, and other browser-only controls from the copied body.
- Let the copy button write rich HTML and plain text to the clipboard.

The source Markdown may include fenced code blocks. Render them as readable prompt cards, not developer-terminal code blocks, when the content is instructional copy.

## Verify before delivery

Treat the workflow as failed until all gates pass:

- Mobile `scrollWidth` equals `viewportWidth`.
- `scriptsInsideCopyArea` equals `0`.
- Copy-button test returns success text.
- Cover viewport is exactly 900×383.
- PNG is exactly 1800×766.
- H2 chapter numbers do not appear twice.
- Tables and prompt cards match the source.
- No clipped title, broken Chinese punctuation, unintended English labels, or large dead space.

Open and visually inspect both the cover PNG and mobile preview. If the title wraps badly, adjust the cover text split or font sizing and rerun.

## Adapt the style only when requested

The default is a blue-white Swiss/structural editorial system. If the user supplies a different reference, inspect it and adapt the templates while retaining the compatibility and QA requirements. Do not force the default palette onto an explicit reference.

For a text-led cover, prefer the deterministic HTML renderer. Use image generation only when the user requests illustration, photography, character IP, or a non-deterministic visual.

## Deliver

Return clickable absolute links to all five artifacts. Embed the cover PNG in the final response so the user can inspect it immediately. Explain that the user should:

1. Open the compatible HTML.
2. Click “一键复制公众号正文”.
3. Paste into the WeChat Official Account editor.
4. Upload the PNG as the cover.
5. Preview on mobile before publishing.

If validation cannot pass, state the exact failing gate rather than claiming the package is ready.
