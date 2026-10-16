# 博客项目指南

> 本文档记录本仓库的结构、内容分类设计、扩展点和已知问题。
> 基线：commit `7db6416`（2026-08-05），主题版本 TeXt v2.2.6。
> 本文档已在 `_config.yml` 的 `exclude` 中排除，不会被发布到线上。
>
> 📖 **想动手开发请看 [DEVELOPMENT.md](DEVELOPMENT.md)**（环境搭建、日常命令、Liquid 入门、常见坑）。
> 本文档侧重架构与设计决策。

---

## 0. 一句话现状

这是 `kitian616/jekyll-TeXt-theme` 的**完整源码拷贝**（不是 `remote_theme` 引用），
而不是一个"只有内容"的站点仓库。因此：

- 仓库里同时存在 **主题引擎代码**、**博客内容**、**上游的 demo/文档站点** 三类东西；
- 好处是：改主题源码完全自由，可以随意扩展功能；代价是：与上游同步需要手动 merge；
- `_posts/` 里目前仍有 2 篇上游示例文章（`2018-06-01-header-image.md`、`2018-07-01-welcome.md`），
  它们是"带封面文章"的语法参考，确认不需要后即可删除。

### 已完成的整理

**2026-10-15**

- [x] `_config.yml` 站点信息落地：`url` / `title` / `description` / `lang` / `timezone` / `author` / `repository`
- [x] 修正 `exclude` 列表，阻止 `Dockerfile.dev`、`docker/`、`tools/`、`screenshot.jpg` 等被发布到 gh-pages
- [x] 建立 `_posts/tech/`、`_posts/life/` 分类目录
- [x] 新增 `tech.html`、`life.html` 两个栏目页
- [x] `_data/navigation.yml` 改写为中文单语导航
- [x] 修正 `Dockerfile.dev`（原配置无法构建，详见 §6）

**2026-10-16**

- [x] 打通 Docker 本地预览环境，站点成功构建（`_site/` 产出验证通过）
- [x] 修正栏目分类机制：Jekyll 不从 `_posts/` 子目录推导 category，改用 `_config.yml` 的
      `defaults` 按路径注入（**详见 §4.2，这是我最初设计的一个错误假设**）
- [x] 选定 URL 方案 B：`permalink` 改为 `/:year/:month/:day/:title.html`，
      让 URL 与栏目解耦（**详见 §4.2，这是发现的第二处错误假设**）
- [x] 新增 [DEVELOPMENT.md](DEVELOPMENT.md) 开发指导文档
- [x] `Gemfile.lock` 已生成并提交（`.gitignore` 中对应行已移除）

### 仍需你确认的占位符

`_config.yml` 中标了 `# TODO` 的地方：站点标题、站点描述、昵称、头像、简介。

---

## 1. 目录地图

### 1.1 引擎层（主题代码，改动需谨慎）

| 路径 | 作用 |
| --- | --- |
| `_layouts/` | 布局继承链：`none` ← `base` ← `page` ← `article` / `home` / `landing` / `articles` / `archive` / `404` |
| `_includes/` | 按职责分目录的组件（见下） |
| `_sass/` | 样式：`skins/` `common/` `components/` `layout/` `additional/` `animate/` + `custom.scss` |
| `assets/css/main.scss` | 样式唯一入口，动态 `@import` 当前皮肤，**最后一行 import `custom`** |
| `_data/locale.yml` | i18n 文案表（READMORE、归档等界面字符串） |
| `_data/variables.yml` | 主题默认值（皮肤、路径、分页、各组件开关） |
| `_data/licenses.yml` | 文章底部协议文案 |
| `jekyll-text-theme.gemspec` / `Gemfile` | 本地构建依据（Gemfile 用 `gemspec` 直接加载本主题） |

`_includes/` 细分：

```
article/            文章头尾自定义位（footer/author-profile, license, subscribe, custom）
aside/              侧边目录 toc
scripts/            原生 JS（无打包、无框架）
  lib/              lazyload, throttle, affix, toc, swiper, modal, gallery, scroll-to
  components/       search, lightbox, sidebar（有状态 UI）
  utils/            imagesLoad, utils
  *.js              页面级：article / page / home / archieve
snippets/           Liquid 小工具（assign、get-lang、prepend-baseurl 等）
head/ footer/ sidebar/ main/       结构性插槽
*-providers/        可插拔第三方服务：comments / analytics / search / sharing / pageview
extensions/         站内嵌媒体：bilibili / youtube / codepen / netease-cloud-music / ted / slideshare / soundcloud
svg/                图标与 logo
```

### 1.2 内容层（日常写作只动这些）

| 路径 | 作用 |
| --- | --- |
| `_posts/tech/` | 技术类文章 |
| `_posts/life/` | 生活类文章 |
| `_data/navigation.yml` | 顶部导航 + 侧边栏多级导航 |
| `_data/authors.yml` | 多作者信息（当前为空文件） |
| `index.html` | 首页，`layout: home`，走分页 |
| `tech.html` / `life.html` | 栏目页，`layout: articles` |
| `archive.html` | 归档页，`layout: archive`，含标签云 + 标签筛选 |
| `about.md` | 关于页（内容仍是上游模板，待改写） |
| `404.html` | 404 页 |
| `assets/images/` | 站点图片（当前只有 `logo/logo.svg`） |

### 1.3 上游示例层（不影响发布，但占体积）

| 路径 | 说明 |
| --- | --- |
| `docs/` | 上游的**主题说明文档站 + demo**（含 `_docs/{en,zh}` 手册、`_posts` 示例、约 3.5MB 图片）。根 `_config.yml` 已 `exclude: /docs`，不参与博客构建。它本身就是这个主题最完整的使用手册，**建议保留**。 |
| `test/` | 上游的最小烟雾测试站点 |
| `screenshots/` | 上游 README 截图 |
| `docker/` `Dockerfile.dev` | 容器化开发环境（见 §7） |
| `tools/` | 上游构建辅助脚本 |
| `.travis.yml` | 已废弃（CI 实际走 GitHub Actions） |

---

## 2. 渲染链路

### 2.1 一次构建发生了什么

```
GitHub Actions (.github/workflows/gh-pages.yml)
  push to master
    → ruby/setup-ruby (3.3) + bundler-cache
    → JEKYLL_ENV=production bundle exec jekyll build      # 使用根目录 _config.yml
    → peaceiris/actions-gh-pages 把 ./_site 推到 gh-pages 分支
```

线上地址由 `url` + `baseurl` 决定：`url: https://joelsbridge.github.io` + `baseurl: /blog`
→ <https://joelsbridge.github.io/blog/>。

> 注意：本地预览地址是 `http://localhost:4000/blog/`，**必须带 `/blog` 前缀**，否则 404。

### 2.2 一篇博客的渲染路径

```
_posts/tech/2026-01-01-foo.md
  ↓ front matter: layout: article（由 _config.yml defaults 自动注入）
_layouts/article.html
  ├─ _includes/article-header.html    标题 / 封面 / 摘要
  ├─ _includes/article-info.html      日期 / 标签 / 作者 / 阅读量
  ├─ _includes/aside/toc.html         右侧目录（aside.toc: true）
  ├─ {{ content }}                    正文
  └─ _includes/article-footer.html
        ├─ article/footer/author-profile.html
        ├─ article/footer/license.html
        ├─ article/footer/subscribe.html
        └─ article/footer/custom.html   ← 自定义插槽
```

`_config.yml` 的 `defaults` 已为所有 post 注入：
`layout: article`、`sharing: true`、`license: true`、`aside.toc: true`、
`show_edit_on_github: true`、`show_subscribe: true`、`pageview: true`。

---

## 3. 内容分类机制现状

排查结论（很重要，决定了后面怎么设计）：

| 机制 | 主题是否支持 | 现状 |
| --- | --- | --- |
| **Tags** | ✅ 完整 | 文章页展示标签；`archive.html` 自动生成标签云（按文章数分 4 档字号）+ 客户端筛选，支持 `?tag=xxx` 直达；`_includes/tags.html` + `_includes/scripts/archieve.js` |
| **Categories** | ⚠️ 引擎不展示 | 全仓库 `_layouts`/`_includes`/`_sass` 中**搜不到 `categories`**。Jekyll 只从 front matter 或 `_posts` **上层**目录收集（**不从 `_posts` 子目录**，实测确认），主题也不做任何展示。本仓库用 `_config.yml` 的 `defaults` 注入 + `_layouts/articles.html` 的 `data_source` 能力补上了栏目页（见 §4.2） |
| **Collections** | ✅ 支持但未启用 | 仅在 `docs/_config.yml` 里用了（`_docs`、`_sample_*`），根配置没有 `collections`。这是实现"文档型栏目 + 多级侧边栏"的现成范式 |
| **导航** | ✅ 双层 | `_data/navigation.yml` 的 `header:` 是顶部导航；`docs-en:` / `docs-zh:` 这类 key 是页面上 `sidebar: nav: <key>` 引用的多级侧边栏 |

`archive.html` 的归档列表由 `_includes/article-list.html` 渲染，`group_by='year'` 按年份分组。

---

## 4. 内容分类设计

### 4.1 三层模型

| 层级 | 载体 | 语义 | 数量 |
| --- | --- | --- | --- |
| **栏目** | 目录 + `categories` | 技术 / 生活 这类大分区，对应独立落地页和导航项 | 固定 2–4 个 |
| **标签** | front matter `tags:` | 跨栏目的横向主题：`jekyll` `ruby` `linux` `读书` `摄影`… | 随写随加，靠归档页标签云收敛 |
| **系列** | front matter `series:` + `_data/series.yml` | 连载/专题（如"TeXt 主题改造记"） | 按需，一个系列 3 篇以上再建 |

核心原则：**栏目求稳（改了要动导航和 URL），标签求活**。

### 4.2 栏目用 `_posts/<栏目>/` 目录 + `defaults` 注入分类（已落地）

⚠️ **重要纠正**（2026-10-16 实测）：Jekyll **不会**从 `_posts/` 的**子目录**推导 categories。
它推导路径分类的规则是看 `_posts` 的**上层**目录（即 `tech/_posts/x.md` → `tech`），
而不是 `_posts/tech/x.md`。所以下面这种结构**本身不会**产生 `categories: tech`：

```
_posts/
├── tech/     ← 目录本身不产生 category！
└── life/
```

实测证据（在 `_posts/tech/` 放一篇文章后，用 Liquid 打印）：

```
Q[分类链路测试|cats=|path=_posts/tech/2026-10-16-category-test.md; ...]
                ↑ 空
S[cats=0]   ← site.categories 是空的
```

**正确做法**：保留 `_posts/tech/` 这个直观结构，改由 `_config.yml` 的 `defaults` 按路径注入：

```yaml
defaults:
  - scope:
      path: "_posts/tech"
      type: posts
    values:
      categories: tech
  - scope:
      path: "_posts/life"
      type: posts
    values:
      categories: life
```

这样写作时依然**不用手写** `categories`，而且目录结构保持直观。**新增栏目时必须同步加一段。**

> 备选方案是改用 Jekyll 的原生目录分类 `tech/_posts/x.md`，但那样内容目录会散在仓库根目录，
> 不如 `defaults` 注入清爽。

栏目页 `tech.html` 的内容（`life.html` 同理，只改 `tech` → `life`、标题改「生活」）：

```yaml
---
layout: articles
title: 技术
articles:
  data_source: site.categories.tech
  show_cover: false
  show_excerpt: true
  show_readmore: true
  show_info: true
---
```

> `_layouts/articles.html` 会把 `data_source` 按 `.` 拆开逐层取值，
> `site.categories.tech` 正好命中 `site` → `site['categories']` → `['tech']`，开箱可用。

**URL 策略**（⚠️ 2026-10-16 实测修正，改了两轮才定）：Jekyll 内置的 `permalink: date` 样式，
完整定义是：

```
date → /:categories/:year/:month/:day/:title.html
        ^^^^^^^^^^^ 分类在 URL 里！
```

也就是说，配上分类之后文章 URL 会变成 `/blog/tech/2026/10/16/foo.html`。
之前看不出来，是因为示例文章都没有分类，空片段被折叠成了 `/2018/07/01/welcome.html`。

| 方案 | 文章 URL 形态 | 优点 | 缺点 |
|---|---|---|---|
| A. 全局 `permalink: date` | `/blog/tech/2026/10/16/foo.html` | 分类进 URL，语义清晰 | **文章换栏目 = URL 变化 = 外链全部失效** |
| **B. 只在 posts defaults 里覆盖（当前采用）** | `/blog/2026/10/16/foo.html` | URL 与栏目解耦，随便挪栏目 | 丢失 URL 里的分类信息 |

选 B 的理由：A 的代价是**不可逆的静默损坏**——重新归类一篇文章就会断掉它所有外链和搜索收录，
且没有任何提示；B 的代价只是 URL 少一段信息。站点当时还没有正式对外内容，是零成本切换的时机。

**实现方式（这里有个坑，务必照抄）**：

```yaml
# 全局保持内置样式 —— 它决定【页面】的行为
permalink   : date

defaults:
  - scope:
      path: ""
      type: posts          # 只覆盖【文章】
    values:
      permalink: /:year/:month/:day/:title.html
```

⚠️ **不要把全局值直接写成 `/:year/:month/:day/:title.html`。** 我们第一轮就是这么干的，
结果发现：Jekyll 只把内置样式（`date`/`pretty`/`none`/`ordinal`）识别成符号，
全局写自定义字符串会让 `site.permalink_style` 变成 `nil`，于是**所有页面**的 `url` 都丢掉
`.html` 后缀（`page.url` 变成 `/tech`，而产物文件仍叫 `tech.html`），连锁后果是：

- **导航高亮失效**：`_includes/header.html` 拿 `page.url` 和导航项 URL 做字符串比较，
  `/tech` ≠ `/tech.html`，栏目页上对应的高亮项消失
- **sitemap 里的页面 URL** 变成无扩展名的 `/blog/tech`

下沉到 `defaults` 之后各归各位：页面走全局 `date`（保持 `.html`），文章走覆盖值（不含分类段）。

实测结果：页面为 `/blog/tech.html`、`/blog/about.html`；文章为 `/blog/2026/10/16/<slug>.html`；
技术 / 生活 / 归档 / 关于 四个页面的导航高亮全部正常。

### 4.3 写新文章的模板

在 `_posts/tech/` 或 `_posts/life/` 下建 `YYYY-MM-DD-slug.md`：

```markdown
---
title: 文章标题
tags: [jekyll, ruby]        # 标签，跨栏目
cover: /assets/images/xxx.jpg   # 可选，列表封面
mathjax: true               # 可选，按需开启
---

摘要写在这里，`<!--more-->` 之前的内容会作为列表页摘要。

<!--more-->

正文……
```

`layout`、`aside.toc`、`license`、`subscribe`、`pageview` 等已由 `_config.yml` 的 `defaults` 自动注入，
不需要每篇重复写。

### 4.4 备选方案：技术笔记用 Collection

如果"技术"那部分更像**文档/手册**（有层级、长期维护、需要侧边栏目录）而不是博客流水，
就改用集合，完全照抄 `docs/` 的做法：

```yaml
# _config.yml
collections:
  notes:
    output: true
defaults:
  - scope: { path: "", type: notes }
    values:
      layout: article
      sidebar: { nav: notes }
      show_date: false
      aside: { toc: true }
```

再在 `_data/navigation.yml` 加一个 `notes:` 多级导航。代价是失去分页、RSS 收录和标签云。

**取舍**：短文、随笔、教程 → `_posts` + category；成体系的长期文档 → collection。

---

## 5. 扩展点清单（想改源码时先看这里）

### 5.1 官方预留的插槽（改这里最安全，不会被上游覆盖）

| 文件 | 插入位置 |
| --- | --- |
| `_includes/head/custom.html` | `<head>` 内，放统计脚本、SEO meta、字体 |
| `_includes/article/top/custom.html` | 正文上方 |
| `_includes/article/footer/custom.html` | 正文下方（打赏、版权声明） |
| `_includes/main/top/custom.html` | 主体顶部 |
| `_includes/main/bottom/custom.html` | 主体底部 |
| `_sass/custom.scss` | 样式覆盖，在 `main.scss` 中**最后**被 import，优先级最高 |
| `_includes/comments-providers/custom.html` | 自定义评论系统 |
| `_includes/analytics-providers/custom.html` | 自定义统计 |
| `_includes/sharing-providers/custom.html` | 自定义分享 |
| `_includes/pageview-providers/custom/{home,post}.html` | 自定义阅读量 |
| `_includes/search-providers/custom/search.html` | 自定义搜索 |

### 5.2 常规改造方向

| 想做的事 | 改哪里 |
| --- | --- |
| 换配色/字体 | 新增 `_sass/skins/_xxx.scss`，`_config.yml` 里 `text_skin: xxx`；6 个内置皮肤可直接照抄 |
| 换代码高亮 | `highlight_theme`，可选 `tomorrow*` 5 套 |
| 加页面级样式 | 新组件放 `_sass/components/_xxx.scss` 并在 `assets/css/main.scss` 里加一行 import |
| 加交互脚本 | 放 `_includes/scripts/components/_xxx.js`，在 `base.html` 用 `{%- include scripts/xxx.js -%}` 引入；改完跑 `npm run eslint` |
| 给文章页加分类徽章 | 改 `_includes/article-info.html`（现在只渲染 tags，没有 categories） |
| 归档页加分类筛选 | 复制 `_includes/tags.html` + `_includes/scripts/archieve.js`，把 `data-tags` 换成 `data-categories` |
| 换 CDN 源 | `_config.yml` 的 `sources: bootcdn | unpkg`，或改 `_data/variables.yml` 里 `sources:` 下的 URL |

### 5.3 上游同步

本仓库没有配置 upstream remote。建议加上，方便日后对比合并：

```bash
git remote add upstream https://github.com/kitian616/jekyll-TeXt-theme.git
git fetch upstream
git diff upstream/master -- _layouts _includes _sass assets   # 只看引擎层偏离了多少
```

改引擎文件时，尽量**新增**而不是**原地修改**，能显著降低将来 merge 的成本。

---

## 6. 已知问题清单

### ✅ 已修复

1. **站点信息占位符**：`title` / `description` / `author` / `repository` 已填写（标题等仍留 `# TODO` 待你定稿）。
2. **`url` 为空导致 feed/sitemap 坏掉**：原先生成的是 `<loc>/blog/2018/07/01/welcome.html</loc>`
   这样的相对路径。已设为 `https://joelsbridge.github.io`。
3. **`lang` / `timezone` 为空**：已设 `zh-Hans` / `Asia/Shanghai`，归档、分页、日期格式等界面文案现在走中文。
4. **构建产物泄漏仓库文件**：`exclude` 已补上 `Dockerfile.dev`、`docker/`、`tools/`、`screenshot.jpg`、`eslint.config.mjs`。
5. **`Dockerfile.dev` 无法构建**，两个原因：
   - `COPY Gemfile Gemfile.lock jekyll-text-theme.gemspec ./` 中的 `Gemfile.lock` 不存在
     （被 `.gitignore` 忽略，从未提交），构建会直接报文件找不到；
   - `FROM ruby:2.7` 已 EOL，当前依赖树（jekyll 4.4.x + activesupport 7.x）在其上无法完成构建。
   已把基础镜像改为 `ruby:3.3`（与 CI 一致）；`Gemfile.lock` 需要先生成，见 §7 步骤 2。

### 待处理

6. **`_posts/` 仍有 2 篇上游示例文章**，与博客无关，建议删除或替换。
7. **`about.md` 仍是上游模板内容**，需要改写成个人介绍。
8. **`.travis.yml` 已废弃**，CI 实际由 `.github/workflows/gh-pages.yml` 承担，可删。
9. **`Gemfile.lock` 被 `.gitignore` 忽略**。对**主题 gem 仓库**这是对的，但本仓库是**站点**：
   提交 lockfile 才能让 CI 与本地构建完全可复现（`ruby/setup-ruby` 的 `bundler-cache` 也依赖它）。
   建议从 `.gitignore` 里移除 `Gemfile.lock` 并提交一份。
10. **评论 / 统计 / 阅读量均未启用**（`comments.provider: false`、`analytics.provider: false`、
    `pageview.provider: false`），按需开启。

---

## 7. 本地预览（Docker 方案）

> 📖 **完整的开发环境说明、日常命令、常见坑已经移到 [DEVELOPMENT.md](DEVELOPMENT.md) §5–§8**，
> 这里只留结论性要点，避免两处文档各自漂移。

**环境已就绪**（2026-10-16 打通），日常只需要一条命令：

```bash
cd /home/radxa/blog
sudo docker-compose -f ./docker/docker-compose.default.yml up
# → http://localhost:4000/blog/     （/blog 前缀不能省）
```

要点：

- 镜像 `ruby:3.3` 是从国内源 `docker.1ms.run/library/ruby:3.3` 拉的，并打了标准 tag。
  镜像拉取与加速器配置见 [DEVELOPMENT.md §8.6](DEVELOPMENT.md)。
- `Gemfile.lock` 已生成（一次性容器跑的 `bundle install`），目前仍被 `.gitignore` 忽略。
- 仓库目录以 volume 挂载进容器（`..:/usr/src/app`），改 Markdown / SCSS / Liquid 刷新浏览器即可，
  不需要重建镜像。**只有改了 `Gemfile` / `Gemfile.lock` / `Dockerfile.dev` 才需要重新构建镜像。**
- 容器以 root 运行，写进挂载目录的文件（`_site/`、`Gemfile.lock`）在宿主机上属主是 root。
- 本地 `feed.xml` / `sitemap.xml` 里出现 `http://0.0.0.0:4000/...` 是**正常的**，
  `jekyll serve` 会临时覆盖 `site.url`；线上 CI 用 `jekyll build`，会用 `_config.yml` 里的正式地址。

---

## 8. 提交规范

采用 Conventional Commits，规则定义在 `.commitlintrc.js`。允许的类型（共 11 个）：

| 类型 | 用途 |
|---|---|
| `content` | **博客内容**：新增/修改/删除文章、`about.md`、配图 |
| `docs` | **项目文档**：`README`、`DEVELOPMENT.md`、`PROJECT-GUIDE.md` |
| `feat` | 新功能：主题扩展、新页面、新栏目 |
| `fix` | 修复 bug |
| `style` | 样式与排版：SCSS、格式调整（非逻辑变更） |
| `refactor` | 重构：不改变行为的代码调整 |
| `perf` | 性能优化 |
| `build` | 构建系统与依赖：`Gemfile`、`Dockerfile`、`package.json` |
| `ci` | CI 配置：`.github/workflows` |
| `chore` | 杂项：`.gitignore`、编辑器配置 |
| `revert` | 回滚 |

其它约束：`header-max-length` 72 字符；scope 小写；subject 不能为空、不能以
ASCII 句号 `.` 结尾（中文句号 `。` 不受限制，因为该规则一次只能配一个字符）。

> 类型列表在 2026-10-16 修订过：删掉了 `improvement`（非标准，与 `feat` 语义重叠）、
> `release`（上游发版流程，博客用不上）、`test`（本仓库没有测试框架），
> 新增 `content`（把"改文章"和"改项目文档"区分开，便于用
> `git log --grep="^content"` 单独列出内容改动）。

### 8.1 关于钩子是否生效

`.husky/commit-msg` 会调用 `npx --no -- commitlint --edit "$1"` 校验提交信息，
但**它当前处于未激活状态**：

| 环节 | 状态 |
|---|---|
| `package.json` 的 `prepare: husky` | ✅ 已补（2026-10-16） |
| `node_modules/` | ❌ 不存在，commitlint CLI 未安装 |
| `core.hooksPath` | ❌ 未设置，husky 的 hook 未被 git 调用 |

也就是说**目前提交信息不会被拦截**，靠自觉遵守。想真正启用：

```bash
npm install          # 装上 eslint / stylelint / commitlint 全家桶（node_modules 约几百 MB）
git config core.hooksPath    # 确认已指向 .husky/_，没有则跑一次 npx husky
```

启用后提交信息不合规会被直接拒绝。

### 8.2 其它常用脚本

```bash
npm run eslint       # 检查 _includes/**/*.js
npm run stylelint    # 检查 _sass/**/*.scss
npm run build        # 生产构建（需要本地 Ruby 或容器）
```

---

## 9. 待办（Backlog）

- [x] ~~验证栏目分类链路~~ —— 2026-10-16 完成，`tech.html` 正确收到文章且未串到 `life.html`
- [x] ~~用 Docker 打通本地预览（§7）~~ —— 2026-10-16 完成
- [x] ~~把 `Gemfile.lock` 从 `.gitignore` 移出并提交~~ —— 2026-10-16 完成（commit `e0bcaa0`）
- [x] ~~确定 URL 策略~~ —— 2026-10-16 选定方案 B（§4.2）
- [ ] 定稿 `_config.yml` 里的 `# TODO` 占位（站点标题、描述、昵称、头像、简介）
- [ ] 改写 `about.md` 为个人介绍
- [ ] 删除 `_posts/` 下 2 篇上游示例文章（`2018-06-01-header-image.md`、`2018-07-01-welcome.md`）
- [ ] 配置 upstream remote 以便同步主题更新
- [ ] 决定是否启用评论 / 统计 / 阅读量
- [ ] 第一个源码扩展：文章页加分类徽章 + 归档页分类筛选
