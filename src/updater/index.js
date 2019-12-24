import { initializeAppUpdater } from './app'

export const initializeUpdater = (updater = {}) => {
  initializeAppUpdater(updater.options || updater.feedUrl)
}
