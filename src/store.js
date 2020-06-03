import Store from 'electron-store'
import merge from 'lodash.merge'

// Default options for initializing electron store.
const DEFAULT_OPTIONS = {
  defaults: {
    windows: {
      main: { width: 1366, height: 768 }
    },
    resources: {}
  }
}

/** Need to catch exception for some reason... */
const _write = Store.prototype._write
Store.prototype._write = function (value) {
  try {
    _write.call(this, value)
  } catch (e) {
    global.$logger.error(e)
  }
}

export const initializeStore = config => {
  global.$store = new Store(merge({}, DEFAULT_OPTIONS, config))
}
