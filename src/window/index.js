import Windows from './windows'
import { resolveUrl } from '../util/url'

/** @type {Windows} */
export const windows = Windows.getInstance()

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
 * Restore all window instances
 */
export const initializeMainWindows = () => {
  const { width, height } = global.$store.get('windows.main')
  return windows.createWindow({ name: 'main', url: global.__baseUrl, width, height })
}
