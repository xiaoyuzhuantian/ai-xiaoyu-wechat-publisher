# AI小愚 · 公众号文章发布 Plugin

把一篇完成的 Markdown 稿件转换为可以直接发布到微信公众号的完整内容包。

## 能生成什么

- 公众号精排版 HTML
- 一键复制粘贴兼容版
- 900×383 可编辑横版封面
- 1800×766 高清封面 PNG
- 390 px 手机端排版预览
- 自动检查横向溢出、复制区域脚本、封面尺寸和复制按钮

默认采用蓝白结构主义编辑风格，也可以根据用户提供的参考图调整。

## 安装

在 Codex CLI 中添加这个 GitHub Marketplace：

```bash
codex plugin marketplace add xiaoyuzhuantian/ai-xiaoyu-wechat-publisher
```

然后在 ChatGPT/Codex 桌面端打开 **Plugins**，从 **AI小愚 Plugins** 安装  
`AI小愚 · 公众号文章发布`。

也可以在 Codex CLI 中输入：

```text
/plugins
```

完成安装后，请新建一个任务再使用。

## 使用

```text
使用 $publish-wechat-article，
把这篇 Markdown 制作成可直接复制发布的公众号文章和横版封面。
品牌使用 AI小愚，封面标题是……
```

如需参考其他视觉风格：

```text
使用 $publish-wechat-article，
参考这张图片的颜色、字体和信息结构重新排版，
但保留公众号复制兼容和手机端验收。
```

## 运行要求

- ChatGPT/Codex 桌面端或 Codex CLI
- Node.js 与 Playwright；在 Codex 桌面端优先使用自带工作区运行环境
- Chrome、Edge、Chromium或 Playwright 自带 Chromium

脚本会自动寻找常见浏览器路径。特殊环境可以传入：

```bash
--chrome "/absolute/path/to/browser"
```

或设置：

```bash
CHROME_PATH="/absolute/path/to/browser"
```

## 隐私

文章内容、封面和预览默认只在本机生成。Plugin 不包含 MCP 服务，不上传文章，也不要求 API Key。

## License

MIT
