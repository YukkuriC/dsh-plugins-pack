/**
 * 新会话自动选中 Auto review 权限预设。
 *
 * 权限服务在 agent/created（prepend）里给新会话钉上默认预设，本监听在其后运行，
 * 把尚未开始的会话切到 auto。判断"尚未开始"用 Session 的 surface：没有任何
 * 用户/助手消息就是新对话，恢复出来的空会话同样适用。
 *
 * auto 只会在 @deepseek-ai/dsh-experimental-auto-review 加载时出现在进程目录里；
 * 未启用时目录中没有 auto，这里直接跳过，不报错也不打日志。
 */

export const inject = ['permissionPresets']

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  ctx.on('agent/created', ({ agent }) => {
    const { session } = agent
    const { header } = session

    if (header.isSeeded) return
    if (header.origin === 'subagent' || header.parentSession !== undefined) return
    if (session.surface.nodes.length > 0) return

    const auto = ctx.permissionPresets.catalog().options.some(option => option.value === 'auto')
    if (!auto) return

    ctx.permissionPresets.set(session, 'auto')
  })
}
