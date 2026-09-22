# Miyako Technical Blog

一个内容优先、静态优先的个人技术博客与开发者主页，面向机器人、计算机视觉、嵌入式系统和工程笔记。内容以 Markdown / MDX + Git 管理，构建结果是纯静态文件，可直接部署到 GitHub Pages。

> 当前仓库仍保留旧版静态主页和原有笔记目录。Astro 站点使用 `src/` 与 `public/`，不会覆盖 `robot_engineering/`、`study_note/`、`diary/` 等历史资料。

## 技术栈

- Astro 7 + TypeScript（Static Site Generation）
- Markdown / MDX Content Collections
- Tailwind CSS 4（Vite 插件）
- Shiki 代码高亮
- KaTeX 数学公式
- Mermaid 架构图（仅文章含图表时按需加载）
- Pagefind 静态全文搜索
- Astro Sitemap / RSS
- GitHub Actions + GitHub Pages

## 环境要求

- Node.js 22.12 或更高版本（GitHub Actions 使用 Node.js 24）
- npm 10 或更高版本
- Git

## 安装

```bash
npm install
```

请提交 `package-lock.json`，确保本地与 CI 使用相同依赖版本。

## 开发

```bash
npm run dev
```

然后访问 `http://localhost:4321`。开发模式下 Pagefind 索引尚未生成，完整搜索请使用构建预览。

## 检查与构建

```bash
npm run check
npm run test
npm run build
npm run preview
```

`npm run build` 会先运行 Astro SSG，再对 `dist/` 运行 Pagefind。完整检查也可使用：

```bash
npm run validate
```

## 添加 Blog

在 `src/content/blog/` 创建 `.md` 或 `.mdx` 文件：

```yaml
---
title: "RK3576 上部署 VINS-Fusion"
description: "记录 RK3576 平台上的 VINS-Fusion 部署过程"
date: 2026-09-23
tags:
  - VIO
  - RK3576
  - ROS2
featured: false
draft: false
---
```

文件名会成为 URL，例如 `rk3576-vins-fusion.md` 对应 `/blog/rk3576-vins-fusion/`。将 `draft` 设为 `true` 后，生产构建不会发布。

## 添加 Note

在 `src/content/notes/` 创建文件。Note 需要额外的 `category`：

```yaml
---
title: "ROS2 QoS Debug"
description: "排查 ROS2 发布订阅 QoS 不匹配"
date: 2026-09-23
tags: [ROS2, Debugging]
category: "ROS2"
draft: false
---
```

Note URL 为 `/notes/<文件名>/`，与 Blog 内容模型和列表保持独立。

## 添加 Project

在 `src/content/projects/` 创建文件：

```yaml
---
title: "Project Name"
description: "一句话项目描述"
date: 2026-09-23
tech: [ROS2, C++, OpenCV]
status: "Active" # Active | Completed | Archived
github: "https://github.com/username/repository"
documentation: "/projects/project-name/"
featured: true
draft: false
---
```

正文建议使用 `Overview`、`Architecture`、`Hardware`、`Software`、`Algorithms`、`Results`、`Related Blog Posts` 和 `Repository` 等二级标题。

## Markdown 能力

代码块由 Shiki 构建期高亮，并自动提供语言标识、复制按钮和横向滚动：

````markdown
```cpp
std::cout << "hello" << std::endl;
```
````

数学公式使用 KaTeX：

```markdown
行内公式 $E = mc^2$

$$
J \alpha + B \omega + C\operatorname{sign}(\omega) + G(\theta) = \tau
$$
```

Mermaid 使用普通代码围栏：

````markdown
```mermaid
flowchart LR
  Sensor --> Estimator --> Controller
```
````

## GitHub Pages 部署

目标地址是 `https://sam0619tj.github.io`，因此 `astro.config.mjs` 没有设置 `base`。要使用这个地址，仓库名必须是：

```text
SAM0619TJ.github.io
```

部署步骤：

1. 将仓库命名为 `SAM0619TJ.github.io`（当前远程仓库名是 `blog_prime`）。
2. 在 GitHub 仓库进入 **Settings → Pages**。
3. 将 **Source** 设为 **GitHub Actions**。
4. 将开发分支合并或推送到 `main`。
5. `.github/workflows/deploy.yml` 会自动安装依赖、构建 Astro、生成 Pagefind 索引并部署。

日常更新只需：

```bash
git add .
git commit -m "add new post"
git push
```

如果继续使用 `blog_prime` 仓库并发布为项目站点，则地址会是 `https://sam0619tj.github.io/blog_prime/`。此时需要在 `astro.config.mjs` 增加 `base: '/blog_prime'`，并统一处理站内链接。当前实现按最终的用户主页仓库方案配置。

## 自定义域名

1. 在域名服务商配置 DNS。
2. 新建 `public/CNAME`，内容仅为域名，例如 `blog.example.com`。
3. 将 `astro.config.mjs` 的 `site` 改为 `https://blog.example.com`，不要设置 `base`。
4. 在 GitHub Pages 设置中填写自定义域名并启用 HTTPS。

## 目录结构

```text
.
├── .github/workflows/deploy.yml
├── public/
│   ├── images/og-default.svg
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/       # Header、Footer、Cards、TOC、Search
│   ├── content/
│   │   ├── blog/
│   │   ├── notes/
│   │   └── projects/
│   ├── layouts/          # 全局与文章布局
│   ├── pages/            # 文件路由、RSS、404
│   ├── plugins/          # Mermaid Markdown 转换
│   ├── styles/
│   ├── utils/
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Astro 7 的 Content Layer 最佳实践使用根级 `src/content.config.ts`，而不是旧版的 `src/content/config.ts`；这是与建议目录唯一有意的结构差异。

## 原仓库内容迁移

旧版文件仍保留在原目录，并通过 `legacy` Content Collection 直接发布到 Notes，无需维护两份副本：

- `orgin.html`：旧版静态主页
- `robot_engineering/`：机器人 / 嵌入式记录
- `study_note/`：学习笔记
- `diary/`、`life_goals/`、`hobbies/`：其他历史内容

构建时会从正文首个一级标题提取标题，按目录推导分类和标签，并把旧的 `md.html?file=...` 链接改写为新 Notes 路由。旧 HTML 索引页不再发布，因为 `/notes/` 已提供统一分类索引。大写扩展名的 `robot_engineering/TODO.MD` 由 `src/content/notes/rm2027-tasks.md` 提供发布镜像。

如果希望给旧文档增加正式日期、描述或精选状态，可逐篇迁入 `src/content/notes/` 并添加 frontmatter；迁移完成后从 legacy collection 的 glob 范围中排除原文件即可。

外部仓库：

- [Tiny Rasterizer](https://github.com/SAM0619TJ/Tiny-rasterizer)
- [RoboMaster Vision 2026](https://github.com/SPR-Algorithm/spr_vision_26)
- [RoboMaster Vision 2025](https://github.com/SPR-Algorithm/SPR-Vision-2025)

## 常见问题

### 开发模式搜索不可用

Pagefind 在生产构建后生成索引。运行 `npm run build && npm run preview` 测试搜索。

### GitHub Pages 页面样式或链接 404

确认仓库是否名为 `SAM0619TJ.github.io`。如果是普通项目仓库，必须设置对应的 `base`，并确保所有站内资源路径包含 base。

### 新文章没有显示

检查文件是否位于正确 collection、frontmatter 是否通过 schema、`draft` 是否为 `false`，然后运行 `npm run check`。

### Mermaid 没有渲染

代码围栏语言必须是小写 `mermaid`。图表在浏览器端按需渲染，禁用 JavaScript 时会保留源代码文本。

### 如何修改姓名、GitHub 或网站地址

搜索 `Miyako`、`SAM0619TJ` 和 `sam0619tj.github.io`，重点修改 `Header.astro`、`Footer.astro`、`BaseLayout.astro`、`about.astro`、`astro.config.mjs` 与 `public/robots.txt`。
