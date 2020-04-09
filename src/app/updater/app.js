import { ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log4js from 'log4js'
import { isEmpty } from '../../util/shared'
import { sendRendererMessage } from '../../window'

const logger = log4js.getLogger('updater')

const topic = 'app-updater'
const messages = {
  error: 'Error occurs while updating app:',
  checking: 'Checking for update...',
  download: 'New version is available, downloading...',
  completed: 'Current version is the latest.'
}

/**
 * Initialize autoUpdater for Electron app with the given feedUrl
 * @param {String | Object} options config for the update provider.
 * @see https://www.electron.build/auto-update#module_electron-updater.AppUpdater+setFeedURL
 * 
 * App updater will use webContents.send to send asyn messages to 
 *  reneder process of main window via channels below:
 * 1. app-updater: content is text message.
 * 2. app-updater-progress: content is an object contains fields:
 *      progress, bytesPerSecond, percent, total, transferred.
 * 3. app-updater-ready: without content.
 * 
 * Also main process will listen on channels below:
 * 1. app-updater-check: trigger autoUpdater to check for updates.
 * 2. app-updater-install: trigger autoUpdater to quit and update the app.
 */
export const initializeAppUpdater = options => {
  if (isEmpty(options)) {
    logger.warn('Options for app updater is empty.')
    return
  }

  autoUpdater.setFeedURL(options)

  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for update in app-updater')
    sendRendererMessage(topic, messages.checking)
  })

  autoUpdater.on('update-available', () => {
    logger.info('New version is available, downloading electron app')
    sendRendererMessage(topic, messages.download)
  })

  autoUpdater.on('update-not-available', () => {
    logger.info('Current app is the latest version. Auto update is completed.')
    sendRendererMessage(topic, messages.completed)
  })

  autoUpdater.on('download-progress', (progress, bytesPerSecond, percent, total, transferred) => {
    sendRendererMessage(`${topic}-progress`, { progress, bytesPerSecond, percent, total, transferred })
  })

  autoUpdater.on('update-downloaded', () => {
    // register ipc handler especially for auto updater.
    ipcMain.on(`${topic}-install`, () => {
      logger.info('The latest version is ready. Restart and update the app now.')
      autoUpdater.quitAndInstall()
    })

    sendRendererMessage(`${topic}-ready`)
  })

  ipcMain.on(`${topic}-check`, () => {
    autoUpdater.checkForUpdates()
  })

  autoUpdater.on('error', err => {
    sendRendererMessage(topic, `${messages.error} ${err}`)
  })
}
