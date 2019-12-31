# Electron Suites

> 这是个集成了一些比较实用的Electron相关工具的套件，能大幅度（大概吧）降低直接使用Electron和一些工具的成本。

在实际项目开发的过程中，我遇到了如下几个宏观需求：
- 多个项目需要前端开发人员基于Electron和前端技术开发桌面端和网页，但希望前端开发专注于前端页面的代码。
- 桌面端和网页上要有交互差异，主要是指桌面端上希望能使用一些桌面端特性，比如打开子窗口而非浏览器页面或浮层。
- 桌面端需要自动更新，而且又不太想每次都通过electron-updater和发版来解决。
- 多个项目最终会一个统一桌面端，需要这个桌面端能够切换工作区（项目）和热更新各项目的资源。
- 桌面端的日志希望能保留到用户本地，未来用于上传协助开发定位和解决一些用户在使用时的问题。

除了上述的需求，考虑到我还要避免每个项目的主进程代码过于繁重，或在底层实现上有所差异，就干脆把与主进程相关的代码和配套工具都抽取到这么一个套件中。
另外也受到了一些spring-boot-starter的影响，我希望能用这个套件能够做到让每个项目在主线程代码中只写一些配置或者事件响应就好。

## 安装

```
$ npm install electron-suites
```

## 基础用法

在Electron主进程入口文件中

```js
import path from 'path'
import { initializeElectron } from 'electron-suites'

initializeElectron({
  env: {
    root: __dirname,
    mode: 'development',
    port: 3000,
    cache: path.resolve(__dirname, '../../cache')
  },
  app: {
    devTool: 'VUEJS_DEVTOOLS'
  },
  updater: {
    resources: {
      pms:'http://localhost:8018/pms/PeopleManageSystem.asar'
    }
  }
})
```

## 全局对象

为了使用方便（其实就是懒和能力有限），在global上定义了一些全局对象，可以在主线程中`initializeElectron`配置项的回调中使用。

### global.$store

类型：`Store`

来自工具[electron-store](https://github.com/sindresorhus/electron-store)中`Store`的实例化对象，可以直接使用相关的API如`.get(key, [defaultValue])`等

### global.$logger

类型：`Logger`

来自工具[log4js-node](https://github.com/log4js-node/log4js-node)中通过API`.getLogger([category])`获取到的日志实例，可以直接使用相关的日志API如`.info(message, ...args)`等

## API

为了简单方便（粗暴），其实主要就暴露了一个方法

### initializeElectron(config?)

 根据用户定义的配置项，初始化Electron主进程。虽然说配置项目前是可选值，但是目前如果真的不传配置项是启动不了的。

### config

类型：`object`

初始化主进程的配置项，主要包含：

|    配置项字段   |    说明    |
|:--------------:|----------:|
|env|Electron主进程的运行环境配置项|
|app|应用配置项：开发工具和事件响应|
|ipcEvents|进程间通信相关的配置项：事件和响应|
|updater|升级程序配置项：主程序升级地址和资源说明|

#### env

类型：`object`

Electron主进程的运行环境配置项，主要包含：

|    配置项字段   | 类型 |   说明    |
|:--------------:|:----:|---------:|
|mode|string|运行环境，可选值为`development`,`testing`和`production`|
|root|string|资源根目录，主要用于确定`BrowserWindow`的访问地址和静态资源寻址|
|cache|string|开发环境下的资源文件缓存地址，用于在项目间资源切换时使用|
|port|number|开发环境下的本机端口地址|

*cache定义的路径建议设置到`gitignore`文件，因为开发环境下会将其他项目的asar资源下载并解压到该目录。*

#### app

类型：`object`

Electron应用配置项，主要包含：

 root: __dirname,
    mode: process.env.NODE_ENV,
    port: process.env.DEV_PORT,
    cache: path.posix.resolve(__dirname, '../../cache')

|    配置项字段   | 类型 |   说明    |
|:--------------:|:----:|---------:|
|devTool|string|指定开发环境下`electron-devtools-installer`的安装项，可选值参考[这里](https://github.com/MarshallOfSound/electron-devtools-installer#what-extensions-can-i-use)|
|events|object|Electron中`app`模块的事件响应，参考[这里](https://electronjs.org/docs/api/app#%E4%BA%8B%E4%BB%B6)|

```js
// app config demo
app: {
  devTool: 'VUEJS_DEVTOOLS',
  events: {
    activate: (event, hasVisibleWindows) => {
      global.$logger.info('event', event)
      global.$logger.info('hasVisibleWindows', hasVisibleWindows)
    }
  }
}
```

#### ipcEvents

类型：`object`

Electron进程间通信相关的配置项，主要是在主进程这边定义事件响应，可以参考[这里](https://electronjs.org/docs/api/ipc-main)

```js
// ipcEvents demo, in electron/main.js
import { windows } from 'electron-suites'

ipcEvents: {
  'task-saved': (event, task) => {
    global.$logger.info('Task saved:', task)
    // send message to renderer process
    windows.main.webContents.send('refresh-task-list', 'haha')
  },
  'reload': {
    method: 'once',
    handler: () => {
      windows.current.reload()
    }
  }
}
```

#### updater


TBD...