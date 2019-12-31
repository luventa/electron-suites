import { ipcMain } from 'electron'
import { each, isEmpty, isPlainObject, isString } from 'lodash'
import log4js from 'log4js'
import { sendRendererMessage } from '../../window'
import Resource from './resource'

const logger = log4js.getLogger('updater')

const topic = 'asar-updater'
const resourceCache = Object.create(null)

export const initializeAsarUpdater = resources => {
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
