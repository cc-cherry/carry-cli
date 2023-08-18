const path = require('node:path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpackNodeExternals = require('webpack-node-externals')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  target: 'node',
  externals: [webpackNodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node', // 要添加的文本内容
      raw: true, // 告诉webpack以原始内容注入
      entryOnly: true, // 仅在入口文件中添加
    }),
    new CopyWebpackPlugin({
      patterns: [
      // 指定要拷贝的文件和目标路径
        { from: 'src/config/config.json', to: 'config' },
      ],
    }),
  ],
}
