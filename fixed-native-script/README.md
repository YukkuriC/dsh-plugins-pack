# fixed-native-script

把「打开方式」查询用的 PowerShell 脚本从随机临时目录固定到可加入杀毒排除项的目录。

## 问题

Windows 上 dsh-native-command 每次查询或打开文件关联都会：

1. `mkdtemp(%TEMP%\dsh-native-command-xxxxxx)`
2. 写入 `associations.ps1`（内嵌 C# 的 Shell 关联查询）
3. `powershell.exe -NoProfile -NonInteractive -STA -ExecutionPolicy Bypass -File <临时目录>\associations.ps1`
4. 删除临时目录

随机目录里的 `.ps1` 常被杀毒软件拦截或隔离，「打开方式」列表因此失败或为空。

## 劫持方式

不改 DSH 安装文件。插件激活时替换 `node:fs/promises` 的两个导出，再用 `syncBuiltinESMExports()` 让已加载模块的 ESM 绑定看到新函数：

- `mkdtemp`：前缀以 `dsh-native-command-` 结尾时返回固定目录，脚本于是写到 `<固定目录>\associations.ps1`；其他调用的参数原样透传。
- `rm`：目标是该固定目录时只释放并发锁，不删除目录，脚本保留。

固定目录（相对本插件目录）：

```
fixed-native-script/native-scripts
```

即本仓库的 `D:\Projects\AI\dsh-plugins-pack\fixed-native-script\native-scripts`。目录已加入 `.gitignore`，生成的脚本不会进版本库；仓库换位置后需要重新加排除项。

同一时间只允许一个调用占用脚本文件：后到的查询等前一个 `rm` 释放后再写，避免两个请求互相覆盖。

## 使用前配置

插件激活时会创建该目录。先把目录加入杀毒软件的排除/信任列表：

- Windows Defender：病毒和威胁防护 → 管理设置 → 排除项 → 添加文件夹，选 `D:\Projects\AI\dsh-plugins-pack\fixed-native-script\native-scripts`。
- 其他杀毒软件：在信任区或排除目录中添加同一路径。

然后重启 DSH，再打开一次「打开方式」。如果先启用了插件却还没排除目录，首次查询仍可能因为脚本被隔离而失败，排除后重试即可。

## 验证

- 打开「打开方式」菜单，列表能正常出现。
- `D:\Projects\AI\dsh-plugins-pack\fixed-native-script\native-scripts\associations.ps1` 存在，每次查询都会被覆盖为当次内容。
- 禁用插件后回到 DSH 原生行为（随机临时目录）。

## 限制

- 依赖上游的临时目录前缀 `dsh-native-command-` 和文件名 `associations.ps1`；上游改了这两个约定后插件不再命中，自动回落到原生行为。
- 固定的是路径，不是脚本内容：每次调用都会重写（内嵌当次文件路径），所以排除项必须是目录级，不能只信任单个文件哈希。
- 只处理 dsh-native-command 这一类脚本，不影响其他临时文件。
- 只支持 Windows。
