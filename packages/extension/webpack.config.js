const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const fs = require("fs");
const dotenv = require("dotenv");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      background: "./src/background.ts",
      "hireall-content": "./src/content.ts",
      popup: "./src/popup.ts",
      "hireall-webapp-content": "./src/webapp-content.ts",
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: "ts-loader",
            options: {
              transpileOnly: true, // Only transpile, skip type checking for production
            },
          },
          exclude: /node_modules/,
        },
        // Add CSS handling
        {
          test: /\.css$/,
          use: [isProduction ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      filename: "[name].js",
      chunkFilename: "[name].chunk.js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "",
      clean: true,
    },
    optimization: {
      minimize: isProduction,
      minimizer: isProduction ? [
        new TerserPlugin({
          terserOptions: {
            compress: {
              // Remove console.log, console.debug, console.info, console.warn in production
              // Keep console.error for debugging production issues
              drop_console: false,
              pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn', 'console.time', 'console.timeEnd', 'console.group', 'console.groupEnd', 'console.groupCollapsed'],
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ] : [],
      splitChunks: {
        chunks: "all",
        name: false,
      },
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 1000000, // 1MB
      maxEntrypointSize: 1000000, // 1MB
    },
    devtool: isProduction ? false : 'inline-source-map',

    plugins: (() => {
      // Manually load .env and .env.local
      // Load .env.local first so it takes precedence over .env (since dotenv doesn't overwrite by default)
      [".env.local", ".env"].forEach((filename) => {
        const envPath = path.resolve(__dirname, filename);
        if (fs.existsSync(envPath)) {
          const parsed = dotenv.config({ path: envPath }).parsed || {};
          // Merge parsed into process.env without overwriting existing explicit vars
          for (const [k, v] of Object.entries(parsed)) {
            if (process.env[k] === undefined) process.env[k] = v;
          }
        }
      });
      const REQUIRED_ENV_KEYS = [
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_APP_ID",
      ];

      const OPTIONAL_DEFAULTS = {
        WEB_APP_URL: "https://hireall.app",
        NEXT_PUBLIC_CONVEX_URL: "",
        NEXT_PUBLIC_FIREBASE_CUSTOM_AUTH_DOMAIN: "",
        GOOGLE_WEB_APP_CLIENT_ID: "",
        GOOGLE_WEB_CLIENT_ID: "",
        NEXT_PUBLIC_GOOGLE_WEB_APP_CLIENT_ID: "",
        NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID: "",
        // PostHog Analytics
        NEXT_PUBLIC_POSTHOG_KEY: "",
        NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
      };

      const missingRequired = REQUIRED_ENV_KEYS.filter((key) => {
        const value = process.env[key];
        return !value || value.trim().length === 0;
      });

      if (missingRequired.length) {
        throw new Error(
          `Missing required extension environment variables: ${missingRequired.join(", ")}`
        );
      }

      const allKeys = new Set([
        ...REQUIRED_ENV_KEYS,
        ...Object.keys(OPTIONAL_DEFAULTS),
      ]);

      const envValues = {};
      for (const key of allKeys) {
        const raw = process.env[key];
        const fallback = OPTIONAL_DEFAULTS[key];
        const value = raw && raw.trim().length > 0 ? raw : fallback ?? "";
        envValues[key] = value;
      }

      return [
        new webpack.DefinePlugin({
          "process.env": JSON.stringify(envValues),
          __EXTENSION_BUILD_ENV__: JSON.stringify(envValues),
        }),
        new CopyPlugin({
          patterns: [
            {
              from: "manifest.json",
              to: "manifest.json",
              transform: (content) => {
                if (!isProduction) return content;

                // For production builds, remove localhost URLs
                const manifest = JSON.parse(content.toString());

                // Filter out localhost from host_permissions
                if (manifest.host_permissions) {
                  manifest.host_permissions = manifest.host_permissions.filter(
                    url => !url.includes('localhost') && !url.includes('127.0.0.1')
                  );
                }

                // Filter out localhost from content_scripts matches
                if (manifest.content_scripts) {
                  manifest.content_scripts = manifest.content_scripts
                    .map(script => ({
                      ...script,
                      matches: script.matches.filter(
                        url => !url.includes('localhost') && !url.includes('127.0.0.1')
                      )
                    }))
                    .filter(script => script.matches.length > 0);
                }

                return JSON.stringify(manifest, null, 2);
              }
            },
            { from: "src/popup.html", to: "popup.html" },
            { from: "src/animations.css", to: "animations.css", noErrorOnMissing: true },
            { from: "public", to: ".", noErrorOnMissing: true },
            { from: "src/styles.css", to: "styles.css", noErrorOnMissing: true },
          ],
        }),
        ...(isProduction ? [new MiniCssExtractPlugin({
          filename: "[name].css",
        })] : []),
      ];
    })(),
  };
};
