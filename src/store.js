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

export const initializeStore = config => {
  global.$store = new Store(merge({}, DEFAULT_OPTIONS, config))
}
