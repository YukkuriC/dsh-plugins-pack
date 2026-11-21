# 安装与使用

## 安装

在仓库根目录执行，随后重启 DSH：

```powershell
dsh plugin --profile desktop add D:\Projects\AI\dsh-plugins-pack
```

- 其他 profile 换 `--profile` 参数（如 `web`、`tui`、`headless`）。
- 本仓库以本地目录 link 安装：修改 JavaScript 后需要重启 DSH 才会加载新模块。
- 卸载：`dsh plugin --profile desktop remove dsh-plugins-pack`。

## 单独启停与配置

插件管理页中每个功能一条，直接开关。也可以写在 profile 自己的 `cordis.patch.yml` 里按 id 覆盖：

```yaml
# 禁用单个功能
- id: auto-auto-permission
  disabled: true

# 覆盖单个功能的配置（config 整体替换，不与原值合并）
- id: auto-auto-permission
  config:
    someKey: value
```
