/**
 * 把 dsh-native-command 生成的临时 PowerShell 脚本固定到可加入杀毒白名单的目录。
 *
 * Windows 上查询「打开方式」时，dsh-native-command 会：
 *   mkdtemp(%TEMP%\dsh-native-command-xxxxxx) -> 写入 associations.ps1 -> powershell -File ...
 * 随机临时目录里的 .ps1 会被杀毒软件拦截或隔离，导致列表拿不到结果。
 *
 * 本插件替换 fs/promises 的 mkdtemp：前缀命中 dsh-native-command- 时返回固定目录，
 * 脚本因此写到固定路径；同时跳过上游对该目录的删除，让文件常驻。
 * syncBuiltinESMExports() 让已经加载的模块看到替换后的函数，不依赖插件加载顺序。
 *
 * 固定目录：本插件目录下的 native-scripts（相对插件目录，已加入 .gitignore）。
 */

import fsp from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { join } from 'node:path'

const PREFIX = 'dsh-native-command-'

const waiters = []
let busy = false

async function acquire() {
  if (!busy) {
    busy = true
    return
  }
  await new Promise(resolve => waiters.push(resolve))
}

function release() {
  const next = waiters.shift()
  if (next === undefined) busy = false
  else next()
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  if (process.platform !== 'win32') return

  const directory = join(import.meta.dirname, 'native-scripts')
  mkdirSync(directory, { recursive: true })

  const mkdtemp = fsp.mkdtemp
  const rm = fsp.rm

  fsp.mkdtemp = async (prefix, options) => {
    if (!prefix.endsWith(PREFIX)) return mkdtemp(prefix, options)
    await acquire()
    return directory
  }

  fsp.rm = async (target, options) => {
    if (target !== directory) return rm(target, options)
    release()
  }

  syncBuiltinESMExports()
  ctx.logger.info(`fixed-native-script: association scripts live in ${directory}`)

  ctx.effect(() => () => {
    fsp.mkdtemp = mkdtemp
    fsp.rm = rm
    syncBuiltinESMExports()
    for (const wake of waiters.splice(0)) wake()
    busy = false
  }, 'fixed-native-script: restore fs/promises')
}
