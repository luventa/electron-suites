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

#### updater.feedUrl

类型：`PublishConfiguration | String | GithubOptions | S3Options | SpacesOptions | GenericServerOptions | BintrayOptions`

Electron升级程序的配置项，这一项是`electron-builder`模块的配套组件`electron-updater`的简单配置项，

```js
// electron-updater config demo, in electron/main.js
updater: {
  // resource latest.yml and *.exe shall be available
  feedUrl: "https://www.your-app-update.com/"
  ...
}
```

该配置项在套件中是用于调用以下代码初始化`auto-updater`所使用，关于该模块的具体使用方法可以参考[electron-updater](https://www.electron.build/auto-update)

```js
import { autoUpdater } from 'electron-updater'

...

// options here is updater.feedUrl
autoUpdater.setFeedURL(options)

```

#### updater.resources

类型：`string | object`

Electron升级程序的配置项，这一项是自建的内置模块asar-updater的配置项

```js
// asar-updater config demo, in electron/main.js
updater: {
  ...
  // manifest.json shall be available
  resources: {
    app: 'http://localhost:8018/app/app.asar',
    pms: {
      name: 'pms',
      url: 'http://localhost:8018/pms/PeopleManageSystem.asar',
      auto: true,
      force: true
    },
    ucs: 'http://localhost:8018/ucs/UniqueClientSystem.asar'
  }
}
```

当资源的配置项为`string`时，最终资源文件将会被命名为`${key}.asar`；例如上面例子中，`UniqueClientSystem.asar`最终将会被命名为`usc.asar`，而该资源的`namespace`也会被定义为`ucs`。

当资源的配置项为`object`时，字段说明如下

|    配置项字段   | 类型 |   说明    |
|:--------------:|:----:|---------:|
|name|string|资源的`namespace`，最终资源文件也将会被命名为`${name}.asar`|
|url|string|资源文件的远端地址|
|auto|boolean|是否自动更新|
|force|boolean|是否强制更新|

### IPC Main Events

套件中内置了一些由主进程中`ipcMain`监听的渲染进程事件，所以在渲染进程中可以使用`ipcRenderer`发送以下消息触发一些功能。


#### app-updater

|    channel   | 数据类型 |   数据说明    |
|:--------------:|:----:|---------:|
|app-updater-check|void|由渲染进程发出事件，触发`auto-updater`检查更新|
|app-updater-install|void|由渲染进程发出事件，触发应用重启更新，仅在新版本应用下载完毕后生效|


```js
// trigger autoUpdater.checkForUpdates()
ipcRenderer.send('app-updater-check')

// trigger autoUpdater.quitAndInstall()
ipcRenderer.send('app-updater-install')
```

#### asar-updater

|    channel   | 数据类型 |   数据说明    |
|:--------------:|:----:|---------:|
|asar-updater-check|string|由渲染进程发出事件，触发`asar-updater`检查指定名称的资源进行更新检查|

```js
// trigger resource.checkForUpdate(). resource.name === 'pms'
ipcRenderer.send('asar-updater-check', 'pms')
```


#### Open child window

桌面端的一个优势在于可以打开多个窗口，并根据用户对窗口的大小和位置调整，将这些布局信息存储到用户本地。
所以这里提供了一个主进程的事件监听，供渲染线程触发并打开子窗体使用：

```js
// trigger main process create new instance of BrowserWindow with the given config.
ipcRenderer.send('open-window', config)
```

子窗口传参说明：

|    配置项字段   | 类型 |   说明    |
|:--------------:|:----:|---------:|
|name|string|新开子窗口的名称，建议是前端路由的名称|
|url|string（可选）|子窗口访问地址的全路径|
|href|string（可选）|子窗口访问地址的相对路径|
|category|string（可选）|子窗口的类别，比如同一类子窗口在布局上希望能复用时使用|
|options|object（可选）|实例化`BrowserWindow`的其他配置项，参考[这里](https://electronjs.org/docs/api/browser-window#new-browserwindowoptions)|

TODO: 子窗口事件响应events的支持

#### Switch working namespace

如开篇所述，在实际应用中会将多个项目的前端资源分别打包成`.asar`文件然后在一个桌面端程序内使用，所以在使用时需要在这些资源文件之间进行切换。

```js
// trigger main process switch working namespace.
// will close all child windows and reload content of main window.
ipcRender.send('switch-namespace', name)
```

*当资源文件不存在时，主进程会记录错误信息，后续考虑优化成发送事件*

### IPC Renederer Events

套件中内置了一些由主进程中`ipcMain`发送到渲染进程的事件，所以在渲染进程中可以通过`ipcRenderer`监听以下`channel`来获取信息数据。

#### app-updater

*这部分在想怎么优化*

|    channel   | 数据类型 |   数据说明    |
|:--------------:|:----:|---------:|
|app-updater|string|`auto-updater`进行更新时的状态消息|
|app-updater-progress|object|`auto-updater`进行更新下载时的进度：`{ progress, bytesPerSecond, percent, total, transferred }`|
|app-updater|void|`auto-updater`更新文件下载完成，准备就绪的信号|

#### asar-updater

下表中`name`指代资源名称，等同于资源的`namespace`

*这部分在想怎么优化*

|    channel   | 数据类型 |   数据说明    |
|:--------------:|:----:|---------:|
|`asar-updater`|string|`asar-updater`准备进行更新时的状态消息|
|`${name}-asar-updater`|string|`asar-updater`对某个资源进行更新时的状态消息|
|`${name}-asar-updater-progress`|object|`auto-updater`对某个资源进行更新下载时的进度：`{ name, total, transferred, percent }`|

### 工作原理

#### namespace

TBD...
