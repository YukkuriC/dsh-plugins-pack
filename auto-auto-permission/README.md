# auto-auto-permission

新会话自动选中「自动审查」权限预设，替代默认的「工作区内修改」。

## 行为

- 监听 Host 的 `agent/created`。权限服务用 `prepend` 先把新会话钉到默认预设，本插件在其后把会话切到 `auto`。
- 只处理「尚未开始」的会话：Session surface 中没有任何消息。已有对话、恢复的历史会话、从有内容的对话 fork 出的会话都不改动。
- 跳过 subagent 会话（`origin: subagent` / `parentSession`）和 seeded 会话。
- `auto` 只由 `@deepseek-ai/dsh-experimental-auto-review` 注册，因此仅在它启用时出现在进程目录中；未启用时插件静默跳过，不报错也不打日志。
- 选中 `auto` 即采用它的固定组合：完全权限 sandbox + `ask` 审批策略。逐调用的模型审查由 auto-review 自己负责，本插件不改变工具定义。
- 切换会写入会话日志（`permission/preset`），所以刷新页面或恢复会话后仍是「自动审查」。
- 不弹实验性风险确认：该确认只属于用户手动选择，这里由插件直接选定。

## 依赖

- 必需：`permissionPresets` 服务（未组合时插件不激活）。
- 可选：`@deepseek-ai/dsh-experimental-auto-review` 提供 `auto` 预设。

## 限制

- `auto` 被权限服务明确排除在「未来默认」之外（General settings 只列配置预设），所以只能在新会话创建后按会话切换；这也是本插件存在的理由。
- 插件加载时已经存在 live agent 的空会话不会立即切换；重启 DSH 或新建空会话后生效。
- auto-review 关闭后，已记录 `auto` 的空会话在它重新启用前无法发布（auto-review 自身的既有约束，本插件不介入）。

## 验证

1. 启用 `@deepseek-ai/dsh-experimental-auto-review`，重启 DSH。
2. 新建工作区或对话：输入框左下角应显示「自动审查」。
3. 禁用 auto-review 后新建对话：应显示默认的「工作区内修改」，且没有报错。
