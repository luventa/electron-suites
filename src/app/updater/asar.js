import { app, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { each, isEmpty, isPlainObject, isString } from 'lodash'
import log4js from 'log4js'
import { sendRendererMessage } from '../../window'
import Resource from './resource'

const logger = log4js.getLogger('updater')

const topic = 'asar-updater'
const resourceCache = Object.create(null)

const _startupContent = [
  'CreateObject("WScript.Shell").Run ',
  'WScript.Arguments(0) + " "',
  ' + WScript.Arguments(1) + " "',
  ' + WScript.Arguments(2) + " "',
  ' + WScript.Arguments(3), 0'
]

const _updaterContent = [
  'On Error Resume Next',
  'Set WsShell = CreateObject("WScript.Shell")',
  'Set Fso = CreateObject("Scripting.FileSystemObject")',
  `WsShell.Popup "Updating resources...", 2, "${app.getName()}"`,
  'Fso.CopyFile WScript.Arguments(0), WScript.Arguments(1), true',
  'Fso.DeleteFile WScript.Arguments(0)',
  'WsShell.Run WScript.Arguments(2)',
  'Err.clear()'
]

const _prepareUpdater = () => {
  const _startup = path.join(global.__root, 'asar-updater-startup.vbs')
  fs.open(_startup, 'wx', (err, fd) => {
    if (err) return
    fs.write(fd, Buffer.from(_startupContent.join(''), 'utf-8'), () => {
      fs.closeSync(fd)
    })
  })

  const _updater = path.join(global.__root, 'asar-updater.vbs')
  fs.open(_updater, 'wx', (err, fd) => {
    if (err) return
    fs.write(fd, Buffer.from(_updaterContent.join('\n'), 'utf-8'), () => {
      fs.closeSync(fd)
    })
  })
}

export const initializeAsarUpdater = resources => {
  _prepareUpdater()

  if (isEmpty(resources)) {
    logger.warn('There is no resource for app updater.')
    return
  }

  each(resources, (content, name) => {
    const config = isString(content) ? { name, url: content } : content
    if (!isPlainObject(config) || !isString(config.url)) {
      logger.warn(`Content of resource [${name}] is invalid, skipping...`)
      return true
    }
    config.force = global.__dev || config.force
    resourceCache[name] = new Resource(config)
    !global.__resources.includes(name) && global.__resources.push(name)
  })

  ipcMain.on(`${topic}-check`, (event, name) => {
    const resource = resourceCache[name]

    if (isEmpty(resource)) {
      const message = `Resource [${name}] is undefined. Please check updater.resources section of electron/main.js.`
      logger.warn(message)
      sendRendererMessage(topic, message)
      return
    }
    resource.checkForUpdate()
  })
}
