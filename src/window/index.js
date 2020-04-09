import log4js from 'log4js'
import Windows from './windows'
import { resolveUrl, switchBaseUrl } from '../util/url'

/** @type {Windows} */
export const windows = Windows.getInstance()
const logger = log4js.getLogger('window')

/**
 * Create child window with the given config
 * @param {Object} config configure object for child window
 * @returns {BrowserWindow} window instance
 */
export const createChildWindow = config => {
  const { name, url, href, category, options } = config
  const rect = category && global.$store.get(`windows.${category}`)
  const location = global.$store.get(`windows.${name}`)

  return windows.createWindow({
    name,
    url: url || resolveUrl(href),
    ...options,
    ...rect,
    ...location
  })
}

/**
 * Send IPC message to renderer process.
 * @param {String} topic message topic.
 * @param {String | Object} message message content.
 * @param {String} identifier name or url of the window which will send ipc message. Default to 'main'
 */
export const sendRendererMessage = (topic, message, identifier = 'main') => {
  if (!windows) return
  logger.debug('Sending message to window with identifier', identifier, 'and topic', topic)
  const window = windows.collection[identifier] || windows.findWindowByUrl(identifier)
  if (!window || !topic || !window.webContents) {
    logger.warn('Window, webContents of window or topic for sendRendererMessage cannot be empty.')
    return
  }
  window.webContents.send(topic, message)
}

/**
 * Switch asar resources with the given namespace string, and close all child windows.
 * @param {String} namespace the namespace about to switch to.
 */
export const switchNamespace = namespace => {
  if (!global.__resources.includes(namespace)) {
    logger.error(`Namespace ${namespace} is not available.`)
    return
  }
  for (const name in windows.collection) {
    const instance = windows.collection[name]
    if (instance && instance !== windows.main && !instance.isDestroyed()) {
      instance.close()
    }
  }
  switchBaseUrl(namespace)
  logger.info(`Reload main window with ${global.__baseUrl}`)
  windows.main.loadURL(global.__baseUrl)
}

/**
 * Reload a specified window with the given identifer
 * @param {*} identifier name or url of the window which will send ipc message. Default to 'main'
 */
export const reloadWindow = (identifier = 'main') => {
  if (!windows) return
  const window = windows.collection[identifier] || windows.findWindowByUrl(identifier)
  logger.info(`Reload window ${window._name} with url ${window._url}`)
  !window.isDestroyed() && window.reload()
}

/**
 * Reload all windows for resource update
 */
export const reloadAllWindows = () => {
  for (const name in windows.collection) {
    reloadWindow(name)
  }
}


/**
 * Restore all window instances
 */
export const initializeMainWindows = () => {
  const { width, height } = global.$store.get('windows.main')
  return windows.createWindow({ name: 'main', url: global.__baseUrl, width, height })
}
