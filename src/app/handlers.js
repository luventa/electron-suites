import log4js from 'log4js'
import { app } from 'electron'
import { initializeMainWindows } from '../window'

const logger = log4js.getLogger('app')
const excludeEvents = ['ready', 'activate', 'window-all-closed']

/**
 * Register customer event handlers with the given event-handler dict.
 * @param {Object} events customer event-handler dict.
 */
export const registerEventHandlers = (events = {}) => {
  // Register customer event handlers
  Object.keys(events).forEach(name => {
    logger.info('Registering event handler:', name)
    if (!excludeEvents.includes(name)) {
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
 * Default handler for event of eletron has finished initializing.
 * @see https://electronjs.org/docs/api/app#event-ready
 * 1. Install install devtools for development mode.
 * 2. register shortcust for debugging under development & testing mode.
 * 3. restore all windows user opended last time.
 */
export const onReady = () => {
  if (!global.__prod) {
    const installExtension = require('electron-devtools-installer')
    installExtension.default(installExtension.VUEJS_DEVTOOLS).then(() => {
      logger.info('Vue devtool is ready')
    }).catch(e => {
      logger.warn('Unable to install vue-devtools: \n', e)
    })
  }

  initializeMainWindows()
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

/**
 * Default handler for event of application is activated
 * @kind macOs
 * @see https://electronjs.org/docs/api/app#event-activate-macos
 */
export const onActivated = () => {
  initializeMainWindows()
}
