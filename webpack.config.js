const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: './src/lazyframe.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'lazyframe.min.js'
    },
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                exclude: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ],
            },
        ],

    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'lazyframe.css',
            // chunkFilename: '[id].css'
        }),
    ]
};
