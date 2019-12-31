const { dependencies } = require('./package.json')

module.exports = {
  mode: process.env.NODE_ENV,
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
    ...Object.keys(dependencies)
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
