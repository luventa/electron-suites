import log4js from 'log4js'
import { ipcMain } from 'electron'
import sha1 from 'hash.js/lib/hash/sha/1'
import { handleEvent } from '../util/shared'
import { createChildWindow, switchNamespace } from '../window'

const logger = log4js.getLogger('ipc')
const availableMethods = ['on', 'once', 'handle', 'handleOnce']
const excludeEvents = ['open-window', 'ready', 'activate', 'window-all-closed']

/**
 * Register customer IPC event handlers with the given event-handler dict.
 * @param {Object} events customer event-handler dict.
 */
export const registerEventHandlers = (events = {}) => {
  // Combine Default handler with customer handler for open-window event.
  ipcMain.on('open-window', (event, config) => {
    logger.debug('Process IPC event [open-window] with context:', config)
    const winHash = sha1().update(config.url).digest('hex')
    const instance = createChildWindow({
      ...config,
      name: `${config.name}-${winHash}`
    })
    handleEvent(events, 'open-window', instance, config)
  })

  ipcMain.on('switch-namespace', (evnet, namespace) => {
    logger.debug('Trying to switch namespace from', global.__namespace, 'to', namespace)
    switchNamespace(namespace)
  })

  // Register customer event handlers
  Object.keys(events).forEach(name => {
    if (!excludeEvents.includes(name)) {
      logger.info('Registering IPC event handler:', name)
      const content = events[name]
      if (content instanceof Function) {
        ipcMain.on(name, content)
      } else if (content instanceof Object &&
        availableMethods.includes(content.method) &&
        content.handler instanceof Function) {
        ipcMain[content.method](name, content.handler)
      } else {
        logger.warn(`Content of IPC event ${name} must be a function or object contains available methods and handler.`)
        logger.debug(`Content of event ${name} is:`, content)
      }
    }
  })
}
