# shinya 的个人主页

基于 [L33Z22L11/homepage-v5](https://github.com/L33Z22L11/homepage-v5) 改造，Nuxt.js + SSG。

## 数据源

三个页面的内容都来自自建服务，全部客户端取数：

| 页面 | 源 |
|---|---|
| 项目 | `bonsai.shinya.click/api/projects` —— 项目聚合，不暴露仓库地址 |
| 文章 | `blog.shinya.click/atom.xml`，经 `/api/feed/blog` 转成 JSON |
| 碎语 | `memos.shinya.click/api/v1/memos` |

碎语所在的 memos 服务用 Origin 白名单做 CORS，本站域名须在白名单内，否则该页为空。

## 开发

```sh
pnpm i
pnpm dev
```

## 构建

```sh
pnpm generate
pnpm preview
```

- 构建命令：`pnpm generate`
- 输出目录：`dist`

## 许可证

项目本体 [MIT](LICENSE)。
