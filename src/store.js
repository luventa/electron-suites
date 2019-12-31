import Store from 'electron-store'

// Default options for initializing electron store.
const DEFAULT_OPTIONS = {
  defaults: {
    windows: {
      main: { width: 340, height: 550 }
    },
    resources: {}
  }
}

export const initializeStore = config => {
  global.$store = new Store({ ...DEFAULT_OPTIONS, ...config })
}
