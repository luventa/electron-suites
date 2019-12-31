import path from 'path'
import log4js from 'log4js'

const logger = log4js.getLogger('setup')

// Default options for initializing electron logger.
const DEFAULT_CONFIG = {
  namespace: 'app',
  root: __dirname
}

// Default appenders for initializing electron logger.
const DEFAULT_LOG4JS_APPENDERS = {
  file: {
    type: 'file',
    filename: 'main_process.log',
    maxLogSize: 10 * 1024 * 1024, // = 10Mb
    backups: 3, // keep three backup files
    compress: true // compress the backups
  },
  console: { type: 'console' }
}

export const setupRuntimeEnv = env => {
  const config = env ? { ...DEFAULT_CONFIG, ...env } : DEFAULT_CONFIG

  // runtime flags
  global.__dev = config.mode === 'development'
  global.__prod = config.mode === 'production'

  // log4js config
  log4js.configure({
    appenders: DEFAULT_LOG4JS_APPENDERS,
    categories: {
      default: {
        appenders: global.__dev ? ['console'] : ['file', 'console'],
        level: global.__dev ? 'debug' : 'info'
      }
    },
    ...config.logger
  })
  global.$logger = log4js.getLogger('main')

  if (!config.port && global.__dev) {
    logger.error('Must provide an accessible network port for development mode.')
  }

  Object.keys(config).forEach(key => {
    logger.info(`Config ${key} has been set: ${config[key]}`)
  })

  global.__port = config.port // port
  global.__namespace = config.namespace // namespace
  global.__resources = ['app'] // available asar resources

  // folder for asar resources
  global.__root = global.__dev
    ? path.posix.normalize(config.cache)
    : path.posix.normalize(config.root.split(`${config.namespace}.asar`)[0])

  // baseUrl
  global.__baseUrl = global.__dev
    ? `http://localhost:${config.port}`
    : `file://${config.root}/index.html`

  // resource and devtools
  if (global.__dev) {
    require('electron-debug')({ showDevTools: false }) // hide devtools for development by default
  } else {
    global.__static = require('path').join(config.root, '/static').replace(/\\/g, '\\\\')
  }
}
