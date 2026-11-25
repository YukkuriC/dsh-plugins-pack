/**
 * 对调输入框的发送与换行快捷键：Enter 换行，Shift+Enter 发送。
 *
 * 这是内联注入页面的普通脚本，不是模块，拿不到 ctx 或 Harness 服务。
 *
 * composer 的键位写死在 @deepseek-ai/dsh-client-ui-conversation 的 Lexical keymap 里，
 * 没有插件扩展点，所以这里在 window 捕获阶段先一步拿到 Enter：
 *
 *   1. 拦下原事件（preventDefault + stopPropagation），编辑器收不到它；
 *   2. 向编辑器根元素补发一个 shiftKey 相反的合成 keydown；
 *   3. 编辑器自己的处理链照常运行，因此斜杠菜单、输入法组合、锁定态、
 *      发送中状态、忙碌时 Queue/Steer 的投递选择都保持原生行为。
 *
 * 目标元素是 composer 的 contenteditable（data-composer-input）。空白会话里它被
 * 渲染成不可编辑的 Workspace 触发器，此时不处理；读写锁定或发送中同样不处理。
 */
;(() => {
  const COMPOSER_INPUT = '[data-composer-input]'
  /** 本脚本处理过的事件（原事件与补发的合成事件），避免捕获监听重复处理。 */
  const handled = new WeakSet()

  window.addEventListener(
    'keydown',
    event => {
      if (handled.has(event)) return
      if (event.key !== 'Enter' || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.isComposing || event.keyCode === 229) return

      const target = event.target
      const root = target instanceof Element ? target.closest(COMPOSER_INPUT) : null
      if (root === null || !root.isContentEditable) return

      event.preventDefault()
      event.stopPropagation()

      const replayed = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        shiftKey: !event.shiftKey,
        repeat: event.repeat,
        bubbles: true,
        cancelable: true,
        composed: true,
      })
      handled.add(event)
      handled.add(replayed)
      root.dispatchEvent(replayed)
    },
    true,
  )
})()
