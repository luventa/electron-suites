import { app, ipcMain } from 'electron'
import { initializeMainWindows } from '../window'
import { handleEvent } from '../util/shared'
import { installDevTool, registerEventHandlers, onAllClosed } from './handlers'
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts'

export const initializeApp = ({ events, shortcuts, devTool } = {}) => {
  // regist events with default handler and customer handlers
  app.on('ready', launchInfo => {
    installDevTool(devTool)
    initializeMainWindows()
    // regist global shortcuts
    registerGlobalShortcuts(shortcuts)
    handleEvent(events, 'ready', app, launchInfo)
  })
  app.on('activate', (event, hasVisibleWindows) => {
    initializeMainWindows()
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
