var webpack = require('webpack')

module.exports = {
  entry: [
    //'webpack-dev-server/client?http://127.0.0.1:3000', // WebpackDevServer host and port
    //'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
    './main.js' // Точка входа приложения
    //'./src/test.js'
  ],
  output: {
    path: './public',
    filename: 'bundle.js'       
  },
  module: {
    loaders: [
      { test: /\.js?$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.less$/, loader: "style!css!less" },
      //{ test: /\.(png|jpg)$/, loader: 'url-loader' },
      { test: /\.png$/, loader: 'url-loader?limit=100000' },
      { test: /\.jpg$/, loader: 'file-loader' },
    ]
  },
  plugins: [
    //new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({ "process.env": { NODE_ENV: JSON.stringify("production") } })
  ],
  resolve: {
    extensions: ['', '.js', '.json'] 
  }
}


