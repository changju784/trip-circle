const path = require('path');

module.exports = {
    webpack: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        configure: (webpackConfig, { env, paths }) => {
            if (env === 'production') {
                // 1. Disable Source Maps to save massive amounts of RAM
                webpackConfig.devtool = false;

                // 2. Remove the heavy Type-Checking plugin during the build
                // This offloads memory but remember to run `tsc` separately!
                webpackConfig.plugins = webpackConfig.plugins.filter(
                    (plugin) => {
                        const name = plugin.constructor.name;
                        return name !== 'ForkTsCheckerWebpackPlugin' &&
                            name !== 'ESLintWebpackPlugin';
                    }
                );

                // 3. Optimize Terser (the minifier)
                const terserPlugin = webpackConfig.optimization.minimizer.find(
                    (m) => m.constructor.name === 'TerserPlugin'
                );
                if (terserPlugin) {
                    terserPlugin.options.parallel = true; // Use multi-core
                    terserPlugin.options.terserOptions = {
                        compress: {
                            drop_console: true,
                        },
                        mangle: true,
                    };
                }
            }
            return webpackConfig;
        },
    },
};