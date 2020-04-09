const { dependencies } = require('./package.json')

const deps = [
  'lodash.merge',
  'lodash.debounce'
]

module.exports = {
  entry: ['./src/index.js'],
  output: {
    library: "ElectronSuites",
    libraryTarget: "commonjs2",
    filename: "esuites.js"
  },
  resolve: {
    extensions: ['.js', '.json', '.node']
  },
  externals: [
    ...Object.keys(dependencies).filter(dep => !deps.includes(dep))
  ],
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { esmodules: true }
              }]
            ]
          }
        }
      },
      {
        test: /\.node$/,
        loader: 'node-loader'
      }
    ]
  }
}
