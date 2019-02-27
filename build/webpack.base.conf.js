var path = require('path')
var webpack=require('webpack')
var utils = require('./utils')
var config = require('../config')
var vueLoaderConfig = require('./vue-loader.conf')
const vuxLoader = require('vux-loader')
function resolve (dir) {
  return path.join(__dirname, '..', dir)
}
let publicUrl
switch (process.env.NODE_ENV){
    case 'dev':
        publicUrl= config.dev.assetsPublicPath;
        break;
    case 'test':
        publicUrl= config.test.assetsPublicPath;
        break;
    case 'prod':
        publicUrl= config.build.assetsPublicPath;
        break;
    case 'develop':
        publicUrl= config.develop.assetsPublicPath;
        break;
}

var originalConfig = module.exports = {
  entry: {
    app: './src/main.js'
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath:publicUrl
      //   process.env.NODE_ENV === 'production'
      // ? config.build.assetsPublicPath
      // : config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [resolve('src'), resolve('test')],
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('test')],
        query: {presets: ['es2015', 'stage-0']}
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 8,
          name: utils.assetsPath('img/[name].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  },
    // plugins: [
    //     new webpack.LoaderOptionsPlugin({
    //         // test: /\.xxx$/, // may apply this only for some modules
    //         test: /\.css$/,
    //         loader: "style-loadernpm install postcss-loader!css-loader!postcss-loader",
    //         options: {
    //             postcss: function() {
    //                 return [px2rem({remUnit: 75})];
    //             }
    //         }
    //     })
    // ]
}
const webpackConfig = originalConfig // 原来的 module.exports 代码赋值给变量 webpackConfig

module.exports = vuxLoader.merge(webpackConfig, {
    plugins: ['vux-ui']
})
