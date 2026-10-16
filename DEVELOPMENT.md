# 开发指导

> 面向不熟悉 Ruby / 前端工具链的使用者。读完你应该能：独立写文章、改样式、改模板、排查常见问题。
> 架构与设计细节见 [PROJECT-GUIDE.md](PROJECT-GUIDE.md)。

---

## 目录

1. [这是个什么类型的项目](#1-这是个什么类型的项目)
2. [技术栈地图：Ruby 在这里扮演什么角色](#2-技术栈地图ruby-在这里扮演什么角色)
3. [构建流程：数据是怎么流动的](#3-构建流程数据是怎么流动的)
4. [Liquid 语法速成](#4-liquid-语法速成)
5. [开发环境](#5-开发环境)
6. [日常命令](#6-日常命令)
7. [开发工作流](#7-开发工作流)
8. [常见问题与坑](#8-常见问题与坑)
9. [文件速查表](#9-文件速查表)

---

## 1. 这是个什么类型的项目

### 1.1 静态站点生成器（SSG）

你这个博客属于**静态站点**。和 WordPress 那种"动态博客"的区别是根本性的：

| | 动态博客（WordPress） | 静态博客（本项目） |
|---|---|---|
| 访问一个页面时发生什么 | 服务器跑 PHP → 查 MySQL → 拼出 HTML → 返回 | 直接返回一个**早就生成好的** `.html` 文件 |
| HTML 什么时候生成 | 每次访问时 | **你写文章的时候**（本地或 CI 构建一次） |
| 需要数据库吗 | 需要 | 不需要 |
| 需要服务器吗 | 需要（要能跑 PHP+MySQL） | 不需要，任何能放文件的地方都行 |
| 编辑界面 | 有后台 | 没有，用编辑器写 Markdown |
| 评论 / 搜索 | 自带或装插件 | 得外挂第三方服务 |
| 部署 | 上传代码 + 配数据库 | 上传一堆 `.html` |

打个比方：动态博客像**餐厅现炒**（每次点单才做菜），静态博客像**预制菜**（提前全部做好，来了直接端走）。

**为什么 GitHub Pages 能免费托管你**：因为它只需要"存放并分发静态文件"，不需要执行任何服务端代码。这也是为什么它**只能**托管静态站点——这正是你项目能用它的原因。

### 1.2 这个模式的取舍

**好处**
- 极快：没有数据库查询，纯文件读取，还能全站 CDN 加速
- 极安全：没有后端逻辑可以被攻击，没有数据库可以被拖库
- 免费：GitHub Pages 白嫖
- 版本控制友好：所有内容都是纯文本，`git diff` 看得清清楚楚，改错了随时回滚

**代价**
- 没有可视化后台，写东西得用编辑器 + Git
- 评论、搜索、阅读量统计这些"动态功能"要接第三方服务（主题已经预留了接口）
- 每次改内容都要**重新构建**一次才能看到效果（本地预览时是自动的）

---

## 2. 技术栈地图：Ruby 在这里扮演什么角色

### 2.1 先说结论

**你几乎不需要写 Ruby。**

Ruby 在这个项目里的唯一作用，是**运行构建工具 Jekyll**。类比一下：

> 你装 Node.js，只是为了能跑 `npm run build`——你本身并不写 JavaScript。

同理，装 Ruby 只是为了跑 `jekyll build`。真正需要你写的是 **Markdown** 和 **YAML**。

### 2.2 五种"语言"的分工

看到项目里花花绿绿的文件别慌，各司其职：

| 文件类型 | 语言 | 你什么时候碰 | 难度 |
|---|---|---|---|
| `_posts/**.md` | **Markdown** | 写文章正文，天天用 | ⭐ |
| `.md` 开头的 `---` 之间<br>`_config.yml`<br>`_data/*.yml` | **YAML** | 填元数据、改配置 | ⭐ |
| `_layouts/*.html`<br>`_includes/**/*.html` | **Liquid + HTML** | 改页面结构、扩展功能时才碰 | ⭐⭐⭐ |
| `_sass/**/*.scss` | **SCSS** | 改配色、字体、间距 | ⭐⭐ |
| `_includes/scripts/**/*.js` | **JavaScript** | 加浏览器交互（搜索、灯箱） | ⭐⭐⭐ |

一个典型文章的 front matter（YAML）长这样，这就是你 95% 时间要写的东西：

```yaml
---
title: 用 Docker 跑 Jekyll
tags: [docker, jekyll]
---

正文用 Markdown 写……
```

### 2.3 名字对照表

Ruby 生态的名词和前端生态几乎一一对应，对照着理解最快：

| Ruby 世界 | Node 世界 | 这里的作用 |
|---|---|---|
| Ruby | Node.js | 语言运行时 |
| **Gem** | npm package | 一个依赖包 |
| **Gemfile** | package.json | 声明"我要哪些依赖"（版本范围） |
| **Gemfile.lock** | package-lock.json | 锁定"实际装了哪些精确版本" |
| **Bundler** (`bundle`) | npm | 依赖管理工具 |
| **Jekyll** | Next.js / Astro / Vite | 构建工具（把源文件变成网站） |
| `bundle install` | `npm install` | 安装依赖 |
| `bundle exec jekyll build` | `npm run build` | 执行构建 |

`bundle exec` 的意思是"用这个项目锁定的依赖版本来执行命令"，避免用到系统里别的版本——相当于 `npx` 的语境。

**Gemfile.lock 为什么重要**：它保证你本地、CI、半年后的你，装到的都是**同一套** gem 版本。没有它，每次构建都重新挑版本，某天可能毫无征兆地构建失败（详见 PROJECT-GUIDE.md §6）。

---

## 3. 构建流程：数据是怎么流动的

### 3.1 全景图

```
        你写的源文件                      Jekyll 构建                  输出
  ┌──────────────────────┐          ┌──────────────┐      ┌──────────────────┐
  │ _config.yml  全局配置 │          │              │      │  _site/          │
  │ _data/*.yml  数据表   │          │  读取所有源  │      │   index.html     │
  │ _layouts/*   页面骨架 │  ──────► │  套用布局    │ ───► │   tech.html      │
  │ _includes/** 可复用件 │          │  渲染 Liquid │      │   2026/10/16/... │
  │ _posts/**.md 文章     │          │  写文件      │      │   feed.xml       │
  │ _sass/**     样式     │          │              │      │   assets/main.css│
  │ assets/**    静态资源 │          └──────────────┘      └──────────────────┘
  └──────────────────────┘                                        │
                                                                  ▼
                                                          浏览器 / GitHub Pages
```

**关键认知**：`_site/` 是**产物**，不是你该编辑的东西。它是自动生成的，改它没用（下次构建就被覆盖），而且它已被 `.gitignore` 忽略。你只编辑左边那一列。

### 3.2 一次渲染发生了什么

以访问一篇文章为例：

```
_posts/tech/2026-10-16-hello.md
    │  ① front matter 说 layout: article
    ▼
_layouts/article.html          ② 文章类页面的骨架
    │
    ├─ _layouts/page.html      ③ article 继承自 page，page 继承自 base
    │     └─ _layouts/base.html ④ 最终骨架：<html><head>…<body>…
    │
    ├─ {% include article-header.html %}   ⑤ 标题区
    ├─ {% include article-info.html %}     ⑥ 日期 / 标签 / 作者
    ├─ {{ content }}                      ⑦ ← 你写的 Markdown 转成的 HTML
    └─ {% include article-footer.html %}   ⑧ 版权 / 订阅
```

**布局继承链**（这是理解主题结构的关键）：

```
none ← base ← page ←┬─ article    文章页
                    ├─ home       首页
                    ├─ articles   栏目页（tech.html / life.html）
                    ├─ archive    归档页
                    ├─ landing    落地页
                    └─ 404
```

`_includes/` 里的东西相当于"函数"：布局里用 `{% include xxx.html %}` 调用，可以传参数。

### 3.3 配置的优先级

同一个设置可能在多处出现，**越靠下优先级越高**：

```
_data/variables.yml    ← 主题默认值（最低）
        ↓
_config.yml            ← 站点全局配置
        ↓
_config.yml 的 defaults ← 按路径/类型批量注入
        ↓
布局的 front matter     ← _layouts/*.html 顶部的 ---
        ↓
页面的 front matter     ← 单篇文章/页面顶部（最高）
```

所以你**不需要**在每篇文章里重复写 `layout: article`——`_config.yml` 的 `defaults` 已经批量注入了。

---

## 4. Liquid 语法速成

Liquid 是 Jekyll 用的模板语言（用 Ruby 实现，但语法完全是另一回事）。你改模板时会遇到它，掌握这几条就能读懂 90% 的代码。

### 4.1 两种定界符

```liquid
{{ page.title }}          ← 双花括号：输出一个值
{% if page.tags %}        ← 单花括号+百分号：执行逻辑，不输出
```

### 4.2 三个命名空间

| 变量 | 含义 | 例子 |
|---|---|---|
| `site.*` | 全站数据 | `site.title`、`site.posts`、`site.categories` |
| `page.*` | 当前页面的 front matter | `page.title`、`page.tags` |
| `layout.*` | 当前所用布局的 front matter | `layout.show_date` |

### 4.3 常用语句

```liquid
{% assign x = "hello" %}              {# 定义变量 #}
{% assign parts = "a.b.c" | split: "." %}   {# 管道：把左边的结果传给右边的过滤器 #}

{% if page.tags %}…{% elsif %}…{% else %}…{% endif %}

{% for post in site.posts %}           {# 循环 #}
  {{ post.title }}
{% endfor %}

{% include article-info.html article=page %}   {# 调用"函数"并传参 #}
```

### 4.4 那个减号是干什么的

你会看到大量 `{%- ... -%}`：

```liquid
{% assign x = 1 %}       →  输出前后会残留换行和空格
{%- assign x = 1 -%}     →  减号表示"吃掉这侧的空白"
```

主题代码几乎全用带减号的写法，是为了让生成的 HTML 少一堆空行。**你写的时候用不用都行**，不影响功能。

### 4.5 过滤器（管道）

```liquid
{{ post.date | date: "%Y年%m月%d日" }}    {# 格式化日期 #}
{{ post.tags | join: ", " }}              {# 数组转字符串 #}
{{ page.title | default: "无标题" }}       {# 取默认值 #}
{{ "a.b.c" | split: "." }}                {# 字符串切数组 #}
```

主题的 `_layouts/articles.html` 就用 `split` 实现了"用点号路径取数据"——这就是 `data_source: site.categories.tech` 能工作的原理。

---

## 5. 开发环境

### 5.1 为什么要用 Docker

本机（Rock-3A / Debian 12 / aarch64）**没有安装 Ruby**，而且就算装了，还得让 Ruby 版本、gem 版本、系统编译工具链全部对齐——在 ARM 开发板上手工搭这套环境相当折腾。

Docker 的价值是：**把一个装好 Ruby 3.3 的 Linux 盒子整个搬过来**，你的宿主机保持干净，环境版本也和 CI 一致。

> 一句话理解 Docker：它是一个轻量的"虚拟机"，里面是一套独立的文件系统和进程，和宿主机隔离。`docker run` 就是"启动这个盒子并执行命令"。

### 5.2 当前环境是怎么搭起来的

```
① ruby:3.3 镜像
   └─ 从 docker.1ms.run/library/ruby:3.3 拉取（国内镜像源，绕开 Docker Hub 墙）
      并打上标准标签 ruby:3.3
      ⚠️ 这一步已手动完成，镜像现在本地就有

② Dockerfile.dev
   └─ 基于 ruby:3.3，把 Gemfile / Gemfile.lock / gemspec 复制进去
      执行 bundle install（gem 装进镜像里，不在宿主机）
      产出镜像 docker_jekyll-text-theme_dev

③ docker/docker-compose.default.yml
   └─ 定义怎么"跑"这个镜像：
      · 端口映射  4000:4000            宿主机 4000 → 容器 4000
      · 目录挂载  ..:/usr/src/app      宿主机仓库 ↔ 容器工作目录（双向实时同步）
      · 启动命令  bundle exec jekyll serve -H 0.0.0.0 -t
```

**目录挂载是最重要的一环**：容器里的 `/usr/src/app` 就是你宿主机的 `/home/radxa/blog`。你在宿主机用编辑器改文件，容器里**立刻**就能看到，Jekyll 检测到变化会自动重新构建——这就是"改完刷新浏览器就能看到效果"的原理。

**gem 装在哪**：装在容器镜像的 `/usr/local/bundle` 里，**不在**你的仓库目录。所以你 `ls` 仓库看不到一堆 gem 文件，这是对的。

### 5.3 环境是否已就绪

三个条件都满足就说明好了：

```bash
# 1) 镜像在不在
sudo docker images | grep ruby
#    应能看到 ruby:3.3 和/或 docker.1ms.run/library/ruby:3.3

# 2) 依赖锁文件在不在（它被 .gitignore 忽略，所以 git status 看不到）
ls -l ~/blog/Gemfile.lock

# 3) 开发镜像构建过没有
sudo docker images | grep jekyll-text-theme
```

---

## 6. 日常命令

> 下面都用 `sudo`。如果你已经把自己加进 `docker` 组并**重新登录过**，可以去掉 `sudo`。
> 更省事的做法是执行 `newgrp docker` 让当前终端临时获得权限。

### 6.1 最常用：启动本地预览

```bash
cd ~/blog
sudo docker-compose -f ./docker/docker-compose.default.yml up
```

- **前台运行**，这个终端会被占住，别按 Ctrl+C
- 看到 `Server address: http://0.0.0.0:4000/blog/` 就成功了
- 浏览器打开 **<http://localhost:4000/blog/>**（`/blog` 前缀不能省！）
- 改 Markdown / SCSS / Liquid，Jekyll 自动重建，刷新浏览器即可

按 **Ctrl+C** 停止。

### 6.2 后台运行（不占用终端）

```bash
# 启动
sudo docker-compose -f ./docker/docker-compose.default.yml up -d

# 看日志
sudo docker-compose -f ./docker/docker-compose.default.yml logs -f

# 停止
sudo docker-compose -f ./docker/docker-compose.default.yml down
```

### 6.3 只构建，不启动服务器

想确认"能不能构建成功"（比如 push 前自检）：

```bash
sudo docker run --rm -v "$PWD":/app -w /app ruby:3.3 \
  bash -c "bundle exec jekyll build"
```

产物在 `_site/`。

### 6.4 重新构建镜像

**只在改了 `Gemfile` / `Gemfile.lock` / `Dockerfile.dev` 时才需要。** 平时改文章、改样式、改模板都不需要。

```bash
sudo docker-compose -f ./docker/docker-compose.build-image.yml build
```

> 第一次构建会花几分钟：要在 ARM 板子上现场编译 6 个原生扩展（bigdecimal、json、prism、eventmachine、http_parser.rb、racc）。
> 之后再构建只要 `Gemfile.lock` 没变，会直接命中缓存，几秒钟完成。

### 6.5 进容器里看看

```bash
sudo docker-compose -f ./docker/docker-compose.default.yml run --rm jekyll-text-theme_dev bash
# 进去后可以执行 bundle list、jekyll --version 等
```

### 6.6 前端代码检查（可选）

这两个是纯 Node 工具，宿主机就能跑，不需要 Docker：

```bash
npm run eslint       # 检查 _includes/**/*.js
npm run stylelint    # 检查 _sass/**/*.scss
```

### 6.7 命令速查

| 我想…… | 命令 |
|---|---|
| 本地预览 | `sudo docker-compose -f ./docker/docker-compose.default.yml up` |
| 停止预览 | `Ctrl+C` |
| 后台跑 | 加 `-d` |
| 看日志 | `... logs -f` |
| 只构建 | `docker run --rm -v "$PWD":/app -w /app ruby:3.3 bash -c "bundle exec jekyll build"` |
| 重建镜像 | `sudo docker-compose -f ./docker/docker-compose.build-image.yml build` |
| 检查 JS | `npm run eslint` |
| 检查 SCSS | `npm run stylelint` |

---

## 7. 开发工作流

### 7.1 写一篇新文章

```bash
# 1) 在对应栏目目录下建文件，文件名必须是 年-月-日-标题.md
vim ~/blog/_posts/tech/2026-10-16-my-first-post.md
```

```markdown
---
title: 我的第一篇文章
tags: [jekyll, docker]
---

这里是摘要。`<!--more-->` 之前的内容会显示在列表页。

<!--more-->

## 正文开始

用 Markdown 随便写。
```

```bash
# 2) 浏览器刷新 http://localhost:4000/blog/tech.html 看效果
# 3) 满意后提交
git add _posts/tech/2026-10-16-my-first-post.md
git commit -m "docs: 新增文章《我的第一篇文章》"
git push
```

**文件名格式是硬性要求**：`年-月-日-标题.md`，日期必须是 `2026-10-16` 这种格式，否则 Jekyll 不会把它当文章，会静默忽略（不报错，但页面上就是没有——这是新手最容易踩的坑）。

**`layout`、目录、TOC、版权、订阅按钮这些都是自动注入的**，不用手写。

### 7.2 新增一个栏目

目前有「技术」「生活」两个栏目。加第三个（比如「读书」）需要改**三处**：

```bash
# ① _config.yml —— 让 _posts/books/ 下的文章自动获得 categories: books
#    找到 defaults，照抄一段：
#    - scope:
#        path: "_posts/books"
#        type: posts
#      values:
#        categories: books

# ② 新建栏目页 books.html（照抄 tech.html，把 tech 改成 books）
cp _posts/../tech.html books.html
#    然后把里面的 title: 技术 改成 title: 读书
#    把 data_source: site.categories.tech 改成 site.categories.books

# ③ _data/navigation.yml 里加一项导航
#    - title: 读书
#      url: /books.html

# ④ 建目录
mkdir -p _posts/books
```

改完 `_config.yml` **必须重启容器**（见 8.2）。

### 7.3 改样式

**推荐方式**：改 `_sass/custom.scss`。它在 `assets/css/main.scss` 里**最后**被引入，所以优先级最高，能覆盖主题所有默认样式，而且不会和上游代码冲突。

```scss
/* _sass/custom.scss */
.article__content {
  font-size: 17px;      /* 正文字号调大一点 */
  line-height: 1.9;
}
```

改配色则要新增/修改 `_sass/skins/_xxx.scss`，然后改 `_config.yml` 的 `text_skin`。

### 7.4 改模板 / 加功能

优先用主题预留的"插槽"文件（见 PROJECT-GUIDE.md §5.1），它们是专门给用户放自定义代码的，升级主题时不会被覆盖：

| 插槽文件 | 插入位置 |
|---|---|
| `_includes/head/custom.html` | `<head>` 里，放统计脚本、SEO meta、字体 |
| `_includes/article/footer/custom.html` | 文章正文下方 |
| `_includes/main/bottom/custom.html` | 页面底部 |
| `_sass/custom.scss` | 样式覆盖 |

真的需要改引擎文件时，尽量**新增**而不是**原地修改**，将来合并上游更新会轻松很多。

### 7.5 部署

**你不需要手动部署。** 流程是全自动的：

```
git push 到 master
    ↓
GitHub Actions 自动触发（.github/workflows/gh-pages.yml）
    ↓
在 ubuntu 机器上跑 ruby 3.3 + bundle install + jekyll build
    ↓
把 _site/ 推到 gh-pages 分支
    ↓
GitHub Pages 从 gh-pages 分支发布
    ↓
https://joelsbridge.github.io/blog/  更新（约 1-2 分钟）
```

所以你的工作流就是：**本地写 → 本地预览 → `git push` → 等两分钟 → 看线上**。

### 7.6 提交信息写什么类型

本仓库用 Conventional Commits，格式是 `类型(可选范围): 描述`。类型只能从下面 11 个里选
（定义在 `.commitlintrc.js`）：

| 类型 | 什么时候用 | 例子 |
|---|---|---|
| **`content`** | **写/改/删博客文章、about 页、配图** ← 你最常用 | `content: 新增《用 Docker 跑 Jekyll》` |
| `docs` | 改项目文档（README / DEVELOPMENT / PROJECT-GUIDE） | `docs: 补充常见问题` |
| `feat` | 给主题加新功能、新页面、新栏目 | `feat: 新增读书栏目` |
| `fix` | 修 bug | `fix: 修复栏目页导航不高亮` |
| `style` | 改 SCSS、调排版（不改逻辑） | `style: 正文字号调大到 17px` |
| `refactor` | 重构模板但不改行为 | `refactor: 抽出文章卡片组件` |
| `perf` | 性能优化 | `perf: 图片改用懒加载` |
| `build` | 改 Gemfile / Dockerfile / package.json | `build: 升级 jekyll 到 4.4` |
| `ci` | 改 `.github/workflows` | `ci: 部署失败时发通知` |
| `chore` | 杂项，如 `.gitignore` | `chore: 忽略 .DS_Store` |
| `revert` | 回滚某次提交 | `revert: 回滚栏目改动` |

**为什么"写文章"单独有个 `content` 类型**：这样你可以随时用
`git log --oneline --grep="^content"` 列出所有内容改动，和代码/文档改动分开看。
如果塞进 `docs`，就和"改项目文档"混在一起分不清了。

其它约束：描述不超过 72 字符；范围（括号里那个）要小写；描述别用 ASCII 句号 `.` 结尾。

**目前提交信息不会被自动校验**——husky 的 git 钩子还没激活（需要跑 `npm install`）。
所以全靠自觉。想启用的话见 [PROJECT-GUIDE.md §8.1](PROJECT-GUIDE.md)。

---

## 8. 常见问题与坑

### 8.1 访问 `http://localhost:4000/` 是 404

**必须带 `/blog` 前缀**：<http://localhost:4000/blog/>。

因为 `_config.yml` 里 `baseurl: "/blog"`，整站的 URL 都挂在这个前缀下。这不是 bug。

### 8.2 改了 `_config.yml` 没生效

`_config.yml` 是**启动时读取一次**的，Jekyll 不会热重载它（Jekyll 自己的注释也写了这一点）。

改完必须**重启容器**：`Ctrl+C` 然后重新 `up`。

### 8.3 `_site/` 里的文件属主是 root，删不掉

容器以 root 身份运行，它写进挂载目录的文件（`_site/`、`Gemfile.lock`）在宿主机上属主就是 root。

```bash
sudo chown -R "$(id -u):$(id -g)" _site
# 或者直接
sudo rm -rf _site
```

### 8.4 `feed.xml` / `sitemap.xml` 里写的是 `http://0.0.0.0:4000/...`

**本地预览时是正常的。** `jekyll serve` 会临时把 `site.url` 覆盖成服务器地址。

线上构建走的是 `jekyll build`（CI 里），此时用的是 `_config.yml` 里的 `url: https://joelsbridge.github.io`，生成的会是完整正确地址。

想本地验证线上效果，用 §6.3 的"只构建"命令，然后直接看 `_site/feed.xml`（注意 `jekyll build` 不会覆盖 url，但本地构建的 url 就是配置里的值）。

### 8.5 第一次构建/安装特别慢

正常现象。几个原生扩展要在 ARM CPU 上现场编译：`bigdecimal`、`json`、`prism`、`eventmachine`、`http_parser.rb`、`racc`。

**换 gem 源解决不了这个问题**（慢的是编译不是下载）。而且实测清华源只是把请求 302 跳回 rubygems.org，等于没镜像。

好消息：这是**一次性**成本。gem 装进镜像后，只要 `Gemfile.lock` 不变，以后的构建几秒就过。

### 8.6 拉镜像报 `registry-1.docker.io` 超时

国内直连 Docker Hub 不通。两个办法：

**办法一**：配置加速器（一劳永逸）

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.1panel.live"
  ]
}
EOF
python3 -m json.tool /etc/docker/daemon.json   # 校验 JSON，写错会导致 docker 起不来
sudo systemctl restart docker
docker info | grep -A4 "Registry Mirrors"      # 确认生效
```

**办法二**：手动加前缀拉取（不改配置）

```bash
sudo docker pull docker.1ms.run/library/ruby:3.3
sudo docker tag  docker.1ms.run/library/ruby:3.3 ruby:3.3
```

`library/` 是官方镜像的固定命名空间，不能省。

### 8.7 `fatal: detected dubious ownership in repository at '/app'`

**是无害警告**，可以忽略。

容器里以 root 跑，`/app` 挂载的却是你 uid 1000 的目录，git 出于安全拒绝操作。它来自 `jekyll-text-theme.gemspec` 里的 `` `git ls-files -z` ``，失败后 `spec.files` 为空——但**依赖声明不受影响**，`bundle install` 照常工作。只有将来要 `gem build` 打包主题时才需要处理。

### 8.8 文章写了但页面上没有

按顺序排查：

1. **文件名格式对不对**？必须 `年-月-日-标题.md`，比如 `2026-10-16-hello.md`。写成 `2026-10-16.md` 或 `hello.md` 都会被静默忽略。
2. **日期是不是未来的**？Jekyll 默认不发布未来日期的文章。
3. **栏目页没更新**？检查 `_config.yml` 的 `defaults` 里有没有对应 `_posts/<栏目>` 的 `categories` 注入（见 7.2）。
4. **改了 `_config.yml` 没重启**？（见 8.2）
5. 看容器日志有没有报错（`... logs -f`），Liquid 语法错误会在那里显示。

### 8.9 文章 URL 的形态（以及为什么换栏目不会断链）

Jekyll 内置的 `permalink: date` 样式其实等价于：

```
date → /:categories/:year/:month/:day/:title.html
```

**分类会进 URL**。如果用它，一篇文章从「技术」挪到「生活」，URL 就会从
`/blog/tech/2026/10/16/foo.html` 变成 `/blog/life/2026/10/16/foo.html`，
已有的外链和搜索引擎收录会**静默失效**（没有人会通知你）。

**本仓库已经做了规避**，但注意实现位置——**不是改全局 `permalink`，而是只在 posts 的
`defaults` 里覆盖**：

```yaml
# _config.yml
permalink   : date          # 全局：决定【页面】的行为，保持 .html 后缀

defaults:
  - scope:
      path: ""
      type: posts           # 只作用于【文章】
    values:
      permalink: /:year/:month/:day/:title.html
```

所以你的文章 URL 长这样，**换栏目不影响链接**：

```
https://joelsbridge.github.io/blog/2026/10/16/my-post.html
```

**这意味着你不能通过 URL 判断一篇文章属于哪个栏目**——这是刻意的取舍，不是 bug。
想知道文章属于哪个栏目，看页面本身或栏目页。

> ⚠️ **别图省事把全局 `permalink` 直接改成 `/:year/:month/:day/:title.html`。**
> 我们第一轮就是这么改的，结果踩了坑：Jekyll 只把内置样式（`date`/`pretty`/`none`/`ordinal`）
> 识别成符号，全局写自定义字符串会让 `site.permalink_style` 变成 `nil`，于是**所有页面**的
> url 都丢掉 `.html` 后缀（`page.url` 变 `/tech`，产物文件却仍叫 `tech.html`），连锁导致：
>
> - **导航高亮失效**：`_includes/header.html` 拿 `page.url` 和导航项 URL 做字符串比较，
>   `/tech` ≠ `/tech.html`，栏目页上对应的高亮项消失
> - **sitemap 里的页面 URL** 变成无扩展名的 `/blog/tech`
>
> 下沉到 `defaults` 之后各归各位：页面走全局 `date`，文章走覆盖值。

> 反过来，如果你哪天想改回"URL 里带分类"，改 `_config.yml` 的 `permalink` 为 `date` 即可，
> 但请先想清楚：**已经发布出去的文章 URL 会全部改变**，需要额外做重定向。

### 8.10 文章 URL 里凭空多了一段分类

如果你看到 `/blog/tech/2026/10/16/foo.html` 这种带栏目段的 URL，说明文章的 `permalink`
覆盖失效了——对照 8.9 检查 `_config.yml` 的 `defaults` 里 `type: posts` 那一段是否还在
（或被人改成了含 `:categories` 的写法）。

另外，分类的注入来源有三个，注意它们是**合并**而不是覆盖：

1. `_config.yml` 的 `defaults` 按 `_posts/<栏目>` 路径注入
2. 文章的 front matter 里手写 `categories: [xxx]`
3. 目录结构 `xxx/_posts/`（Jekyll 原生，但本项目**没用**这种方式）

如果 URL 里多出了意料之外的分类段，多半是某一层重复叠加了。

---

## 9. 文件速查表

### 9.1 "我想改 X，该去哪里"

| 我想改…… | 去这里 |
|---|---|
| 站点标题 / 描述 / 作者 | `_config.yml` |
| 顶部导航菜单 | `_data/navigation.yml` |
| 界面文案（"阅读更多"等） | `_data/locale.yml` |
| 配色 / 字体主题 | `_config.yml` 的 `text_skin` + `_sass/skins/` |
| 自定义样式 | `_sass/custom.scss` ← 首选 |
| 文章页结构 | `_layouts/article.html`、`_includes/article-*.html` |
| 首页布局 | `_layouts/home.html` |
| 归档页 | `_layouts/archive.html`、`_includes/tags.html` |
| 页脚 / 版权 | `_includes/footer.html` |
| 关于页内容 | `about.md` |
| 评论 / 统计 / 阅读量 | `_config.yml` 的 `comments` / `analytics` / `pageview` |
| 搜索 | `_config.yml` 的 `search`，默认已开启 |

### 9.2 目录职责一览

| 目录 | 是什么 | 你要动吗 |
|---|---|---|
| `_posts/` | 文章正文 | ✅ 天天动 |
| `_data/` | 导航、文案、作者等数据表 | ✅ 偶尔 |
| `assets/images/` | 图片 | ✅ 偶尔 |
| `_config.yml` | 全站配置 | ✅ 偶尔 |
| `_sass/` | 样式 | ⚠️ 建议只动 `custom.scss` |
| `_includes/` | 可复用组件（HTML+Liquid+JS） | ⚠️ 扩展功能时 |
| `_layouts/` | 页面骨架 | ⚠️ 扩展功能时 |
| `assets/css/main.scss` | 样式入口（决定引入哪些 scss） | ⚠️ 加新样式文件时 |
| `_site/` | **构建产物，自动生成** | ❌ 永远不要手改 |
| `docs/` | 上游主题的完整中文手册（不参与构建） | 📖 查资料时看 |
| `docker/` `Dockerfile.dev` | 开发环境定义 | ❌ 基本不动 |
| `test/` `screenshots/` `tools/` | 上游遗留物，不参与构建 | ❌ 不管 |

### 9.3 遇到问题去哪查

- **主题用法**：`docs/_docs/zh/` 下有完整中文手册（配置、布局、导航、扩展、Markdown 增强等）
- **Jekyll 本身**：<https://jekyllrb.com/docs/>
- **Liquid 语法**：<https://shopify.github.io/liquid/>
- **本项目架构与设计**：[PROJECT-GUIDE.md](PROJECT-GUIDE.md)
