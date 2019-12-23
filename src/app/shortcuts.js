import log4js from 'log4js'
import { globalShortcut } from 'electron'
import { windows } from '../window'

const logger = log4js.getLogger('app')

const registerDebugShortcut = () => {
  globalShortcut.register('CommandOrControl+O', () => {
    if (!windows.current) return

    windows.current.webContents.isDevToolsOpened()
      ? windows.current.webContents.closeDevTools()
      : windows.current.webContents.openDevTools()
  })
}

/**
 * Register global shortcuts with the given customer shortcuts.
 * @param {Object} shortcuts customer shortcuts definition
 */
export const registerGlobalShortcuts = (shortcuts = {}) => {
  if (!global.__prod) {
    logger.info('Registering debug shortcut.')
    registerDebugShortcut()
  }

  // Register customer shortcuts
  Object.keys(shortcuts).forEach(shortcut => {
    logger.info('Registering shortcut:', shortcut)
    const shortcutContent = shortcuts[shortcut]
    if (shortcutContent instanceof Function) {
      // https://electronjs.org/docs/api/global-shortcut#globalshortcutisregisteredaccelerator
      globalShortcut.isRegistered(shortcut)
        ? globalShortcut.register(shortcut, shortcutContent)
        : logger.warn(`Shortcut [${shortcut}] is already taken by other applications.`)
    } else if (shortcutContent instanceof Object) {
      // https://electronjs.org/docs/api/global-shortcut#globalshortcutregisterallaccelerators-callback
      globalShortcut.registerAll(shortcutContent.accelerators, shortcutContent.callback)
    }
  })
}

/**
 * Unregister all global shortcuts.
 */
export const unregisterGlobalShortcuts = () => {
  logger.info('Unregistering all global shortcuts')
  globalShortcut.unregisterAll()
}
