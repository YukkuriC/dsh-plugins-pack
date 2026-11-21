# dsh-plugins-pack

一组互相独立的小功能，装进同一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件包。每个功能是一个子目录、一个独立插件条目，可以单独启用、禁用和配置。

## 功能

| 功能 | 说明 | 状态 |
| --- | --- | --- |
| [新对话默认自动审查](auto-auto-permission/README.md) | 新会话自动选中「自动审查」权限，仅在实验性 Auto review 启用时生效。 | 已实现 |
| [固定原生脚本路径](fixed-native-script/README.md) | 把「打开方式」用的 PowerShell 脚本固定到可加入杀毒排除项的目录。 | 已实现 |

## 文档

- [安装、启停与配置](docs/usage.md)
- [开发与新增功能](docs/development.md)
