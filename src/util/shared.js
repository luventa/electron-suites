import log4js from 'log4js'

const logger = log4js.getLogger('util')

/**
 * Call the handler of an event-handler dict with the given event name.
 * @param {Object} events event-handler dict.
 * @param {String} name event name.
 * @param {Object} context javascript context object.
 */
export function handleEvent (events, name, context) {
  if (!events || !name) return

  const handler = events[name]

  if (!handler) return

  if (!(handler instanceof Function)) {
    logger.warn(`Event handler of ${name} must be a function.`)
    logger.debug('Event handler is:', handler)
    return
  }
  logger.debug('Invoking event handler:', name, 'with context', context)
  handler.apply(context, [...arguments].splice(3))
}

/**
 * Send IPC message to renderer process.
 * @param {BrowserWindow} window instance of Electron BrowserWindow.
 * @param {String} topic message topic.
 * @param {String | Object} message message content.
 */
export const sendIpcMessage = (window, topic, message) => {
  if (!window || !topic || window.webContents) {
    logger.warn('Window, webContents of window or topic for sendIpcMessage cannot be empty.')
    return
  }

  webContents.send(topic, message)
}