# Umami 生产环境统计接入设计

- 日期：2026-07-30
- 状态：方案已确认

## 背景

主页即将部署到 Vercel，需要接入自托管 Umami。项目目前没有 Analytics 模块或统计插件，统一的全局 `<head>` 配置位于 `nuxt.config.ts`。统计只应出现在 Vercel Production 部署中，本地开发与 Preview 部署不得加载脚本，避免污染正式数据。

## 设计方案

- 在 `nuxt.config.ts` 中通过 `process.env.VERCEL_ENV === 'production'` 判断当前是否为 Vercel Production 构建。
- 仅在判断成立时，向现有 `app.head` 添加一条全局脚本配置：
  - `src`: `https://umami.shinya.click/script.js`
  - `defer`: `true`
  - `data-website-id`: `bfb9e9fd-8090-4c1e-816c-c90b3daa060f`
- 本地开发、普通本地构建和 Vercel Preview 构建均输出空脚本列表，不请求 Umami。
- 不引入 `nuxt-umami` 或其他依赖，也不增加运行时插件。Umami 自身负责初次访问与 Nuxt 客户端路由切换的页面浏览统计。
- Website ID 属于浏览器可见的公开配置，直接保留在代码中，不新增 Vercel 环境变量。
- 如果 Vercel 未提供 `VERCEL_ENV`，判断默认失败，站点仍可正常运行，只是不启用统计。

## 影响范围

- 仅修改 `nuxt.config.ts` 的全局 head 配置。
- 不改变页面 UI、路由、数据源或服务端接口。
- 脚本使用 `defer`，加载失败不会阻塞 HTML 解析或主页功能。

## 验收

- 不新增测试文件。
- ESLint 与 `git diff --check` 通过。
- 普通构建产物中不包含 Umami 脚本。
- `VERCEL_ENV=preview` 构建产物中不包含 Umami 脚本。
- `VERCEL_ENV=production` 构建产物中包含且只包含一次指定脚本和 Website ID。
- 三种构建均保持现有 Nuxt/Vercel 产物结构与成功状态。
