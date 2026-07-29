# shinya 的个人主页

基于 [L33Z22L11/homepage-v5](https://github.com/L33Z22L11/homepage-v5) 改造，Nuxt.js + SSG。

## 数据源

三个页面的内容都来自自建服务，但取数方式不同：

| 页面 | 源 | 取数方式 |
|---|---|---|
| 项目 | `bonsai.shinya.click/api/projects` —— 项目聚合，不暴露仓库地址 | 客户端取数，内容实时 |
| 文章 | `blog.shinya.click/atom.xml`，经 `/api/feed/blog` 转成 JSON | **构建期快照**——`/api/feed/blog` 在构建时预渲染成静态 JSON 并烘进 HTML，博客发了新文章要重新部署主页才会更新 |
| 碎语 | `memos.shinya.click/api/v1/memos` | 客户端取数，内容实时；**只取首页 20 条**，更早的引去博客 |

碎语所在的 memos 服务用 Origin 白名单做 CORS，本站域名须在白名单内，否则该页为空。开发时若用 `--host` 起局域网地址访问，那个 `http://<局域网 IP>:3000` 也得在白名单里——Origin 是 IP 而不是 localhost。

## 部署

站点部署在 **Vercel**。

**构建命令必须是 `pnpm build`，不能是 `pnpm generate`。** 碎语的链接预览卡要读外链的 Open Graph，而浏览器直接 fetch 别人的站必被 CORS 拦下，只能由服务端代取，于是有了 `server/api/og.get.ts` —— 这是全站唯一需要运行时的地方。`generate` 会强制 static preset 把整个服务端丢掉，该端点线上就是 404（不会报错，预览卡自动退回「域名 + favicon」的打底态，容易看不出来）。

页面仍然是静态的：`nuxt.config.ts` 里显式开了 `nitro.prerender.crawlLinks`，构建产物是「全部页面静态 + 一个函数」。**这行不能删** —— `nuxt build` 默认不爬站，删掉后所有页面会从 CDN 静态文件退化成按请求 SSR 的函数调用。

## 开发

```sh
pnpm i
pnpm dev
```

## 构建

```sh
pnpm build
pnpm preview
```

Vercel 会自动识别 Nuxt 并按 `pnpm build` 走，一般不必额外配置。要在本地看线上那份产物的形态：

```sh
NITRO_PRESET=vercel pnpm build
# .vercel/output/static/    ← 预渲染好的页面，走 CDN
# .vercel/output/functions/ ← 唯一的函数，只服务 /api/og
```

## 许可证

项目本体 [MIT](LICENSE)。
