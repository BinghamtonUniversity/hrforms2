const path = require("path");
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const dist = "dist/htdocs";

const PACKAGE = require('./package.json');

module.exports = (env, argv) => {
  return {
    entry: './src/js/main.js',
    output: {
      path: path.resolve(__dirname, dist, 'js'),
      publicPath: '/js/',
      filename: 'hrforms2.min.js',
      chunkFilename: '[chunkhash].min.js'
    },
    resolve: {
      extensions: [".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components)/,
          loader: "babel-loader",
          options: {
            plugins: ["lodash"],
            presets: ["@babel/preset-env"]
          }
        },
        {
          test: /\.(css|scss)$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: '/css/'
              }
            },
            "css-loader",
            "sass-loader"
          ]
        },
        {
          test:/\.(png|jp(e?)g|svg|gif)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'images/[hash].[ext]',
                outputPath:'../',
                publicPath:'/'
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '../css/styles.min.css',
        chunkFilename: '../css/[chunkhash].min.css'
      }),
      new LodashModuleReplacementPlugin({
        'collections': true,
        'paths': true,
        'shorthands': true,
        'caching': true,
        'cloning': true
      }),
      new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(PACKAGE.version),
        __REVISION__: JSON.stringify(PACKAGE.revision),
        __BUILD_DATE__: JSON.stringify(new Date().toLocaleString()),
        __BUILD_TIME__:JSON.stringify(Date.now()),
        __ENV_TEST__: JSON.stringify(env.test),
      }),
    ],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 2017,
            warnings: false,
            parse: {},
            compress: {},
            mangle: true
          }
        }),
        new CssMinimizerPlugin()
      ]
    },
    devtool: (argv.mode == 'production') ? '' : 'eval-source-map'
  };
};
/*  const common = {
    entry:{
      main:"./src/js/main.js",
    },
    output: {
      path: path.resolve(__dirname, "dist/htdocs/js/"),
      publicPath: "/js/",
      filename: '[name].min.js',
      chunkFilename:'[chunkhash].min.js',
    },
    module: {
      rules: [
        {
            test: /\.(js|jsx)$/,
            exclude: /(node_modules|bower_components)/,
            loader: "babel-loader",
            options: {
                presets: ["@babel/preset-env"]
            }
        },
        {
            test: /\.(css|scss)$/,
            use:[
                {
                    loader:MiniCssExtractPlugin.loader,
                    options:{
                        publicPath:'/css/'
                    }
                },
                "css-loader",
                "sass-loader"
            ]
        },
      ]
    },
    resolve: { extensions: ["*", ".js", ".jsx"] },
    plugins: [
        new MiniCssExtractPlugin({
            filename:'../css/main.css',
            chunkFilename:'[chunkhash].css'
        })
    ],
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({
        terserOptions:{
          ecma:2017,
          warnings:false,
          parse:{},
          compress:{},
          mangle:true
        }
      })],
    }
  };
  if (argv.mode !== 'production') {
    return Object.assign(common,{devtool:'eval-source-map'});
  } else {
    return common;
  }*/
