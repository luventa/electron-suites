import { setupRuntimeEnv } from './setup'
import { initializeStore } from './store'
import { initializeApp } from './app'
import { initializeIpc } from './ipc'
export { windows } from './window'

export const initializeElectron = (config = {}) => {
  const { app, ipcEvents, store, env } = config

  setupRuntimeEnv(env)
  initializeStore(store)
  initializeApp(app)
  initializeIpc(ipcEvents)
  // initializeUpdater(updater)
}
