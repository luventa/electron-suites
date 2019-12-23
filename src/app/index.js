import { app, ipcMain } from 'electron'
import { handleEvent } from '../util/shared'
import { registerEventHandlers, onReady, onActivated, onAllClosed } from './handlers'
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts'

export const initializeApp = ({ events, shortcuts } = {}) => {
  // regist events with default handler and customer handlers
  app.on('ready', launchInfo => {
    onReady()
    // regist global shortcuts
    registerGlobalShortcuts(shortcuts)
    handleEvent(events, 'ready', app, launchInfo)
  })
  app.on('activate', (event, hasVisibleWindows) => {
    onActivated()
    handleEvent(events, 'activate', app, event, hasVisibleWindows)
  })
  app.on('window-all-closed', () => {
    unregisterGlobalShortcuts()
    ipcMain.removeAllListeners()
    onAllClosed()
  })

  // register other customer handlers
  registerEventHandlers(events)
}
