const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const path = require('path')
const NodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin')

let cesiumSource = './node_modules/cesium/Source/'
let cesiumBuild = 'node_modules/cesium/Build/Cesium/'

module.exports = {
    //Cesium webpack settings
    publicPath: '',

    configureWebpack: {
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    { from: cesiumBuild + 'Workers', to: 'Workers' },
                    { from: cesiumSource + 'ThirdParty', to: 'ThirdParty' },
                    { from: cesiumSource + 'Assets', to: 'Assets' },
                    { from: cesiumSource + 'Widgets', to: 'Widgets' }
                ]
            }),
            new webpack.DefinePlugin({
                CESIUM_BASE_URL: JSON.stringify('./')
            }),
            new NodePolyfillWebpackPlugin(),
        ],
        module: {
            unknownContextRegExp: /\/cesium\/cesium\/Source\/Core\/buildModuleUrl\.js/,
            unknownContextCritical: false,
            rules: [{
                test: /\.js$/,
                include: path.resolve(__dirname, 'node_modules/cesium/Source'),
                use: { loader: require.resolve('@open-wc/webpack-import-meta-loader') }
            }
            ]
        }
    }
}

