/**
 * 对调输入框的发送与换行快捷键：Host 半边只负责把 client.js 送进页面。
 *
 * 子路径条目不能声明 dsh.client，所以借用 WebServer 的 index 注入表：
 * 每次渲染 index.html 时把 client.js 原文作为内联 <script> 放到 body 开头。
 * 注入行由页面渲染时现读，改完 client.js 刷新页面即可生效，不必重启 DSH。
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  ctx.on('webserver/index-inject', table => {
    table.push({
      kind: 'script',
      placement: 'body',
      text: readFileSync(join(import.meta.dirname, 'client.js'), 'utf8'),
    })
  })
}
