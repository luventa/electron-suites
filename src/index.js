import { setupRuntimeEnv } from './setup'
import { initializeStore } from './store'
import { initializeApp } from './app'
import { initializeIpc } from './ipc'
import { initializeUpdater } from './updater'
export { windows } from './window'

export const initializeElectron = (config = {}) => {
  const { app, ipcEvents, store, env, updater } = config

  setupRuntimeEnv(env)
  initializeStore(store)
  initializeApp(app)
  initializeIpc(ipcEvents)
  initializeUpdater(updater)
}
