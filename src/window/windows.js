import { BrowserWindow } from 'electron'
import { handleEvent } from '../util/shared'
import log4js from 'log4js'
import { debounce } from 'lodash'

const logger = log4js.getLogger('window')

// Default options for creating new window
const DEFAULT_OPTIONS = {
  height: 768,
  width: 1024,
  webPreferences: {
    nodeIntegration: true,
    webSecurity: false
  }
}

/**
 * Collection of Electron BrowserWindow instances.
 * This class is defined as singleton. Use WindowCollection.getInstance.
 */
export default class Windows {
  static getInstance () {
    logger.info('Create instance of class Windows.')
    if (Windows.__instance === undefined) {
      Windows.__instance = new Windows()
    }

    return Windows.__instance
  }

  constructor () {
    this.collection = Object.create(null)
    this.urlCache = Object.create(null)
    /** @type {BrowserWindow} */
    this.current = null
  }

  /** @type {BrowserWindow} */
  get main () {
    return this.collection.main
  }

  set main (window) {
    logger.warn('Cannot set main window in windows manually.')
  }

  /**
   * Find the window instance with the given url
   * @param {String} url the url that window loads
   * @returns {BrowserWindow} window instance
   */
  findWindowByUrl (url) {
    const name = this.nameUrlMapper[url]

    if (!name) {
      logger.info(`Window with name ${name} does not exist.`)
      return null
    }

    return this.collection[name]
  }

  /**
 * Create window instance by using giving options
 * @param {Object} options
 * @returns {BrowserWindow} instance
 */
  createWindow (options) {
    logger.debug('Creating new BrowserWindow with options:', options)
    const { name, url, category, width, height, events, x, y } = options
    /** @type {BrowserWindow} */
    const existWindow = this.collection[name]

    if (existWindow) {
      logger.info('Restore exist window:', name)
      existWindow.restore()
      existWindow.focus()
      return existWindow
    }

    const opts = { ...DEFAULT_OPTIONS, width, height, x, y }
    logger.info(`Creating new BrowserWindow [${name}] with url: ${url}`)
    const window = this.collection[name] = new BrowserWindow(opts)

    window._name = name
    window._url = url
    window._category = category
    this.urlCache[url] = name
    window.loadURL(url)
    this.registerEventHandlers(window, events)

    return window
  }

  /**
   * Register event handlers for the given window with customer event-handler dict.
   * @param {BrowserWindow} window instance of Electron BrowserWindow
   * @param {Object} events customer event-handler dict.
   */
  registerEventHandlers (window, events) {
    window.once('ready-to-show', () => {
      window.show()
      handleEvent(events, 'ready-to-show', window)
    })

    window.on('focus', () => {
      this.current = window
      handleEvent(events, 'focus', window)
    })

    window.on('closed', () => {
      this.removeWindow(window._name)
      handleEvent(events, 'closed', window)
    })

    window.on('resize', debounce(() => {
      if (window.isDestroyed() || !window.isVisible()) return
      logger.debug(`Window ${window._name} has been resized. Save new position to store.`)
      const storeKey = window._category ? `windows.${window._category}` : `windows.${window._name}`
      global.$store.set(storeKey, window.getBounds())
      handleEvent(events, 'resize', window)
    }, 3000, { leading: true }))

    window.on('move', debounce(() => {
      if (window.isDestroyed() || !window.isVisible()) return
      logger.debug(`Window ${window._name} has been moved. Save new position to store.`)
      global.$store.set(`windows.${window._name}`, window.getBounds())
      handleEvent(events, 'move', window)
    }, 3000, { leading: true }))
  }

  /**
   * Close all open windows and destory BrowserWindow instances.
   * @see https://electronjs.org/docs/api/browser-window-proxy#winclose
   */
  closeAllWindow () {
    for (const name in this.collection) {
      const instance = this.collection[name]
      if (instance && !instance.isDestroyed()) {
        instance.close()
      }
    }
    this.collection = Object.create(null)
    this.urlCache = Object.create(null)
  }

  /**
   * Remove a closed window with the given name.
   * @param {*} name the name of closed window.
   */
  removeWindow (name) {
    delete this.collection[name]
    if (name === 'main') {
      this.closeAllWindow()
    }
  }
}
