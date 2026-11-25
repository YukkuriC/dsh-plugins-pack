# composer-key-swap

对调输入框的发送与换行快捷键：启用后 Enter 换行，Shift+Enter 发送消息。

## 行为

- 只处理 composer 的 contenteditable（`data-composer-input`），不影响用户提问框、队列编辑框等其他输入框。
- 普通 Enter 换行，Shift+Enter 发送。
- 斜杠/引用菜单打开时，Enter 只换行，Shift+Enter 和原生 Enter 一样确认当前项。
- Ctrl/Cmd+Enter（互补投递）与 Alt+Enter 保持原生行为。
- 输入法组合期间（`isComposing` / `keyCode === 229`）不处理，Enter 仍用于确认候选词。
- 空白会话的 Workspace 触发器、只读或发送中的输入框不处理。
- 补发的合成 keydown 让编辑器原生处理链继续运行，所以斜杠菜单、上传等待、忙碌时 Queue/Steer 的投递选择都不变。

## 实现

`index.js` 监听 `webserver/index-inject`，把 `client.js` 原文作为 `{ kind: 'script', placement: 'body' }` 注入 index.html。`client.js` 在页面加载时注册捕获阶段的 keydown：拦下 Enter，向编辑器根元素补发一个 `shiftKey` 相反的合成 keydown。编辑器收到的是「另一个键」，发送和换行因此完全走原生路径。

## 依赖

- 页面由 DSH 的 WebServer 渲染（Web / 桌面）。TUI 与 headless 没有这个页面，注入不会发生。
- 依赖 `@deepseek-ai/dsh-client-ui-conversation` 的 `data-composer-input` 标记与 Lexical 键位链，属于该包的内部约定。

## 启用

插件管理页里开启 `composer-key-swap` 条目，然后刷新页面（注入发生在页面加载时）。禁用后同样刷新页面才会恢复原生键位。

## 验证

1. 启用条目并刷新，聚焦输入框：按 Enter 光标换行，不发送。
2. 按 Shift+Enter 消息发送。
3. 输入法组合中按 Enter 只确认候选词，不换行也不发送。
4. 斜杠菜单打开时按 Enter 换行，菜单保持打开。
5. 禁用条目并刷新：恢复原生行为（Enter 发送、Shift+Enter 换行）。

## 限制

- `设置 → 快捷键` 里的「发送 / 换行」两行由 conversation 插件固定注册，插件无法改写，因此那里仍显示 Enter 发送、Shift+Enter 换行。
- 换行方向依赖 Chromium/Electron 的 Lexical 键位链；Safari 的 KEY_ENTER 走原生 beforeinput，换行不生效（发送方向正常）。DSH 桌面与 Chrome 系浏览器正常。
- 内联脚本在页面加载时执行且没有卸载钩子：启停或修改 `client.js` 后必须刷新页面。
- 上游若改动 `data-composer-input` 或 Enter 的键位链，插件会失效并退化为原生键位，不报错。
