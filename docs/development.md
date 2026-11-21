# 开发

## 设计

一个包、多个子路径插件，而不是一个功能一个包：安装点只有一个，功能共享版本号，但每个功能仍是独立的 Cordis 插件，启停互不影响。代价是子路径插件只有 Host 半边，见文末「限制」。

- 一次安装，一个 bundle 包；新增功能只改仓库，不需要重新安装。
- 每个功能一个子目录，子目录本身就是插件组件：一个导出 `apply(ctx, config)` 的 Cordis 插件。
- 每个功能在 `cordis.patch.yml` 中占一行，以 `dsh-plugins-pack/<目录名>` 的子路径形式加载，因此在插件管理页或 profile 的 `cordis.patch.yml` 中可以按 id 单独开关。
- 无构建步骤：纯 ESM JavaScript，改完重启 DSH 即生效。
- 每个功能自带显示元数据（`locale/en.json`、`locale/zh.json`、`icon.svg`）。

## 目录结构

```
dsh-plugins-pack/
├─ package.json                 包清单：exports 暴露每个功能、locale 与 icon
├─ cordis.patch.yml             bundle 补丁：每个功能一行 insert
├─ icon.png                     包图标
├─ locale/en.json               包本身的显示标题与描述
├─ locale/zh.json
├─ docs/usage.md                安装、启停与配置
├─ docs/development.md          本文档
├─ auto-auto-permission/        一个功能 = 一个子目录（示例）
│  ├─ index.js                  插件组件（Host 侧 Cordis 插件）
│  ├─ locale/en.json            显示标题与描述
│  ├─ locale/zh.json
│  ├─ icon.svg                  功能条目图标
│  └─ README.md                 功能行为、依赖与验证步骤
├─ fixed-native-script/         另一个功能，目录结构相同
└─ README.md                    简要说明与功能列表
```

## 工作原理

1. profile 加载 bundle 时读取 `package.json` 中的 `dsh.bundle.patch`，应用 `cordis.patch.yml`。
2. 每个 `insert` 行的 `name` 是包内子路径（如 `dsh-plugins-pack/auto-auto-permission`），Loader 通过 `exports` 找到对应模块，当作普通 Cordis 插件挂载。
3. 子路径插件不读取 `package.json`：它的 locale 与图标通过 `exports` 中的 `./<目录>/locale/*.json` 与 `./<目录>/icon` 暴露。
4. `apply(ctx, config)` 是入口。在其中注册的一切都挂在 `ctx` 上（`ctx.effect`、`ctx.on` 等），插件卸载或配置变更时由 Cordis 释放。

## 新增一个功能

以 `<name>` 为功能目录名（kebab-case，同时用作条目 id）。

1. 建目录与文件：

```
<name>/index.js
<name>/locale/en.json
<name>/locale/zh.json
<name>/icon.svg
<name>/README.md
```

功能图标固定放在子目录的 `icon.svg`（元信息读取的就是这个文件）；包图标由根 `package.json` 的 `icon` 字段指定，支持 SVG、PNG、JPEG、WebP，单文件不超过 256 KiB。

`index.js`：

```js
export function apply(ctx, config) {
  // 在这里注册资源；返回清理函数，或用 ctx.effect / ctx.on 托管。
}
```

2. 在 `package.json` 的 `exports` 加三项、`files` 加四项（`<name>` 替换为目录名）：

```json
"./<name>": "./<name>/index.js",
"./<name>/locale/*.json": "./<name>/locale/*.json",
"./<name>/icon": "./<name>/icon.svg"
```

3. 在 `cordis.patch.yml` 的 `insert` 列表加一行：

```yaml
- id: <name>
  name: dsh-plugins-pack/<name>
```

4. 重启 DSH，确认插件管理页出现新条目并可启停。

> 自查：目录名、`exports` 子路径、patch 中的 `name` 三处必须一致。

## 约定

- 一个功能一个目录，功能之间不互相 import；需要共享代码时单独建目录并补充 `exports`。
- 目录名与条目 id 一致，使用 kebab-case。
- `index.js` 保持纯 ESM、无编译步骤。需要第三方依赖时在根 `package.json` 声明，并在仓库内安装：本地 link 安装的包从仓库自身的 `node_modules` 解析依赖，不会装进 profile。
- 英文标题用句首大写；描述写清能力，不写实现方式。功能实现后同步更新 `locale/*.json`，去掉占位文案。
- 每个功能在自己的 `README.md` 里写清行为、依赖和验证步骤（参考 `auto-auto-permission/README.md`）。
- 功能需要可调参数时导出 `Config`，用户配置写在 profile 的 `cordis.patch.yml` 中按 id 覆盖。

## 限制

- 当前框架只承载 Host 侧插件。子路径插件不读 `package.json`，无法声明 `dsh.client`，因此没有 Web UI 半边；需要页面或面板的功能应单独做成一个 bundle 包。
- 每个功能是一个独立条目，启停、配置、卸载互不影响。
