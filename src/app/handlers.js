import log4js from 'log4js'
import { app } from 'electron'

const logger = log4js.getLogger('app')
const excludeEvents = ['ready', 'window-all-closed']

/**
 * Register customer event handlers with the given event-handler dict.
 * @param {Object} events customer event-handler dict.
 */
export const registerEventHandlers = (events = {}) => {
  // Register customer event handlers
  Object.keys(events).forEach(name => {
    if (!excludeEvents.includes(name)) {
      logger.info('Registering event handler:', name)
      const handler = events[name]
      if (handler instanceof Function) {
        app.on(name, events[name])
      } else {
        logger.warn(`Handler for event [${name}] must be a function.`)
      }
    }
  })
}

/**
 * Install dev tools with electron-devtools-installer and the given name.
 * @see https://github.com/MarshallOfSound/electron-devtools-installer#what-extensions-can-i-use
 * @param {String} devToolName the name of devtools
 */
export const installDevTool = devToolName => {
  if (global.__prod) {
    return
  }

  const installExtension = require('electron-devtools-installer')
  installExtension.default(installExtension[devToolName]).then(name => {
    logger.info(`${name} is ready`)
  }).catch(e => {
    logger.warn('Unable to install vue-devtools: \n', e)
  })
}

/**
 * Default handler for event of all windows are closed.
 * @see https://electronjs.org/docs/api/app#event-window-all-closed
 */
export const onAllClosed = () => {
  logger.info('Window all closed, electron app is shutting down now.')
  log4js.shutdown(() => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
