const path = require('path');
const _ = require('lodash');
const webpack = require('webpack');
const merge = require('webpack-merge');
const autoprefixer = require('autoprefixer');
const eslintFormatter = require('eslint-friendly-formatter');

const Extract = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TranslationPlugin = require('./plugins/translationPlugin');

const languagesConfig = require('../src/config/languages').languages;

const BASE_BUILD_PATH = '.';
const BUILD_FOLDER = 'build';
const LIB_FOLDER = 'libs';

const NODE_ENV = process.env.NODE_ENV;

const PATHS = {
    app: path.join(__dirname, '..', 'src/index.jsx'),
    build: path.join(__dirname, '..', BASE_BUILD_PATH, BUILD_FOLDER),
    public: path.posix.join('/', BUILD_FOLDER, '/'),
    libs: path.posix.join(LIB_FOLDER, '/'),
};

const FILENAMES = {
    build: 'js/[name].bundle.js',
    vendor: 'js/[name].bundle.js',
    css: 'css/[name].css',
    sass: 'css/[name].sass.css',
    font: 'fonts/[hash].[ext]',
    image: 'images/[hash].[ext]',
    template: 'webpack/template.html',
    html: '../index.html',
};

const extractCSS = new Extract({
    filename: FILENAMES.css,
});
const extractSass = new Extract({
    filename: FILENAMES.sass,
});

function isExternalModule(module) {
    const context = module.context;

    if (typeof context !== 'string') {
        return false;
    }

    return context.indexOf('node_modules') !== -1;
}

let config = {
    entry: {
        app: PATHS.app,
    },
    output: {
        path: PATHS.build,
        filename: FILENAMES.build,
        publicPath: PATHS.public,
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        modules: [PATHS.libs, 'node_modules'],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components|libs)/,
                use: [
                    {
                        loader: 'babel-loader',
                        // options from .babelrc
                    },
                    // {
                    //     loader: 'eslint-loader',
                    //     options: {
                    //         formatter: eslintFormatter,
                    //     },
                    // },
                ],
            },
            {
                test: /\.(ttf|otf|eot|woff[2]?|svg)(\?(v=)?[\d.]*)?$/,
                loader: `file-loader?name=${FILENAMES.font}`,
            },
            {
                test: /\.md$/,
                loader: 'ignore-loader',
            },
            {
                test: /\.(jpe?g|png|gif|ico)$/i,
                loader: `url-loader?name=${FILENAMES.image}&limit=10000/`,
            },
            {
                test: /\.yml$/,
                loader: 'json-loader!yaml-loader',
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
            },
        ],
    },
    plugins: [
        // generate translation files
        new TranslationPlugin({
            languages: _.keys(languagesConfig),
            output: './src/services/translations/intl',
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: FILENAMES.vendor,
            minChunks: (module) => (isExternalModule(module)),
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'development',
        }),
    ],
    node: {
        net: 'empty',
        tls: 'empty',
        dns: 'empty',
    },
};

const devConfig = {
    devServer: {
        historyApiFallback: true,
        contentBase: BASE_BUILD_PATH,
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    },
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [autoprefixer({ browsers: ['last 2 versions'] })],
                        },
                    },
                    {
                        loader: 'sass-loader',
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: FILENAMES.html,
            template: FILENAMES.template,
            inject: 'body',
            alwaysWriteToDisk: true,
        }),
        new HtmlWebpackHarddiskPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            DEBUG: true,
        }),
    ],
    watchOptions: {
        poll: 1000,
        aggregateTimeout: 1000,
    },
    devtool: 'eval',
};

const stageConfig = {
    devtool: 'source-map',
};

const prodConfig = {
    module: {
        rules: [
            {
                test: /\.css$/,
                loader: extractCSS.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                        },
                    ],
                }),
            },
            {
                test: /\.scss/,
                loader: extractSass.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: [autoprefixer({ browsers: ['last 2 versions'] })],
                            },
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ],
                }),
            },
        ],
    },
    plugins: [
        extractCSS,
        extractSass,
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
            DEBUG: false,
        }),
        new UglifyJsPlugin({
            parallel: true,
            sourceMap: true,
        }),
    ],
    devtool: 'source-map',
};

console.warn(`Building with NODE_ENV = ${NODE_ENV}`); // eslint-disable-line no-console

switch (NODE_ENV) {
    case 'development':
        config = merge(config, devConfig);
        break;
    case 'stage':
        config = merge(config, stageConfig);
        break;
    case 'production':
        config = merge(config, prodConfig);
        break;
    default:
        // eslint-disable-next-line no-console
        console.warn(`Unspecified config for NODE ENV = ${NODE_ENV}`);
        // eslint-disable-next-line no-throw-literal
        throw 'Unspecified NODE ENV';
}

module.exports = config;
