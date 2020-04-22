import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { app, net } from 'electron'
import log4js from 'log4js'
import debounce from 'lodash.debounce'
import { spawn } from 'child_process'
import { sendRendererMessage, reloadAllWindows } from '../../window'

const logger = log4js.getLogger('asar')
const messages = {
  error: 'Error occurs while updating app:',
  checking: 'Checking for update...',
  force: 'Force updating resource...',
  download: 'New version is available, downloading...',
  update: 'Updating asar file...',
  completed: 'Current version is the latest.'
}

class Resource {
  constructor ({ name, url, auto, force }) {
    this.url = url
    this.name = name
    this.force = force
    this.topic = `${name}-asar-updater`
    this.storeKey = `resources.${name}`
    this.manifest = global.$store.get(this.storeKey)

    if (this.manifest) {
      logger.info(`[${name}] is an activated resource with version ${this.manifest.version} and md5 ${this.manifest.md5}`)
    } else {
      logger.info(`[${name}] is initialized as a new asar resource.`)
    }

    if (auto) {
      this.checkForUpdate()
    }
  }

  _createRequest (url, reject) {
    logger.info(`Resource [${this.name}] requesting ${url}`)
    let timer = null
    const request = net.request(url)
    request
      .on('finish', () => { timer = setTimeout(() => request.abort(), 5 * 60 * 1000) })
      .on('error', error => reject(error))
      .on('abort', () => reject(new Error('Timeout while requesting address', url)))
      .on('close', () => clearTimeout(timer))
    return request
  }

  async _fetchManifest () {
    const urlArray = this.url.split('/')
    urlArray[urlArray.length - 1] = 'manifest.json'

    return new Promise((resolve, reject) => {
      logger.info(`Fetching manifest of resource [${this.name}]`)
      const request = this._createRequest(urlArray.join('/'), reject)
      let manifest
      request.on('response', response => {
        response
          .on('error', error => reject(error))
          .on('data', chunk => { manifest ? manifest += chunk.toString() : (manifest = chunk.toString()) })
          .on('end', () => {
            try {
              logger.debug(`Got manifest data ${manifest} for resource [${this.name}]`)
              manifest = JSON.parse(manifest)
              logger.info(`Checking manifest of resource [${this.name}]`)
              if (!manifest) {
                throw new Error(`Resource [${this.name}] has invalid manifest info`)
              }
              if (this.force) {
                sendRendererMessage(this.topic, messages.force)
              } else if (this.manifest && manifest.md5 === this.manifest.md5) {
                throw new Error(`Resource [${this.name}] is at the latest version.`)
              }
              resolve(manifest)
            } catch (error) {
              reject(error)
            }
          })
      }).end()
    })
  }

  async _fetchResource () {
    const progress = { total: null, transferred: 0, percent: 0 }
    const tmpFile = path.resolve(global.__root, `${this.name}.tmp`)

    return new Promise((resolve, reject) => {
      this._createRequest(this.url, reject)
        .on('response', response => {
          logger.info(`Start to donwload resource [${this.name}] from ${this.url}`)
          progress.total = Number(response.headers['content-length'])

          response
            .on('error', error => reject(error))
            .on('end', () => logger.info(`Resource contains ${progress.total} total bytes, transferred ${progress.transferred}`))
            .on('data', debounce(chunk => {
              progress.transferred += chunk.length
              if (progress.total) {
                progress.percent = Math.min(progress.transferred, progress.total) / progress.total
                sendRendererMessage(`${this.topic}-progress`, { name: this.name, ...progress })
              }
            }, 1000, { leading: true }))
            .pipe(fs.createWriteStream(tmpFile))
            .once('close', () => {
              logger.info(`Resource [${this.name}] download completed`)
              resolve(tmpFile)
            })
        }).end()
    })
  }

  async _validateResource (tmpFile, manifest) {
    return new Promise((resolve, reject) => {
      logger.info(`Validating md5 of resource [${this.name}]`)
      const md5Hash = createHash('md5')
      fs.createReadStream(tmpFile)
        .on('data', data => md5Hash.update(data))
        .on('close', () => {
          if (md5Hash.digest('hex') !== manifest.md5) {
            return reject(new Error(`Tmp file of resource [${this.name}] is broken!`))
          }
          path.join(global.__root, `${this.name}.asar`)
          resolve()
        })
    })
  }

  async _updateResource (tmpFile, manifest) {
    return new Promise((resolve, reject) => {
      logger.info(`Updating resource [${this.name}]...`)
      const dest = path.join(global.__root, `${this.name}.asar`)

      fs.rename(tmpFile, dest, err => {
        if (err) {
          if (global.__dev) {
            return reject(new Error(`Unabled to rename tmp file of resource ${this.name}`))
          }
          const _startup = path.join(global.__root, 'asar-updater-startup.vbs')
          const _updater = path.join(global.__root, 'asar-updater.vbs')
          logger.info(`Resource ${this.name} will be ready after restart.`)
          spawn('cmd', ['/c', `${_startup} ${_updater} ${tmpFile} ${dest} ${process.execPath}`], {
            shell: false,
            detached: true,
            windowsVerbatimArguments: true,
            stdio: 'ignore',
            windowsHide: true
          }).unref()
          global.$store.set(this.storeKey, manifest)
          logger.info(`Relaunch electron app now...`)
          app.exit(0)
          return
        }

        logger.info(`Resource ${this.name} is ready at ${dest}`)
        this.manifest = manifest
        global.$store.set(this.storeKey, manifest)
        if (this.name === global.__namespace && !global.__dev) { reloadAllWindows() }
        resolve()
      })
    })
  }

  async checkForUpdate () {
    try {
      sendRendererMessage(this.topic, messages.checking)
      const manifest = await this._fetchManifest()
      sendRendererMessage(this.topic, messages.download)
      const tmpFile = await this._fetchResource()
      await this._validateResource(tmpFile, manifest)
      sendRendererMessage(this.topic, messages.update)
      await this._updateResource(tmpFile, manifest)
      sendRendererMessage(this.topic, messages.completed)
    } catch (error) {
      logger.error(error.message)
      sendRendererMessage(this.topic, `${messages.error} ${error.message}`)
    }
  }
}

export default Resource
