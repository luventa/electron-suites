import { initializeAppUpdater } from './app'
import { initializeAsarUpdater } from './asar'

export const initializeUpdater = (updater = {}) => {
  initializeAppUpdater(updater.options || updater.feedUrl)
  initializeAsarUpdater(updater.resources)
}
