const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const fs = require("fs");
const dotenv = require("dotenv");
const webpack = require("webpack");

module.exports = {
  entry: {
    background: "./src/background.ts",
    content: "./src/content.ts",
    popup: "./src/popup.ts",
    "webapp-content": "./src/webapp-content.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: (() => {
    // Manually load .env once to avoid duplicate DefinePlugin warnings
    const envPath = path.resolve(__dirname, ".env");
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.config({ path: envPath }).parsed || {};
      // Merge parsed into process.env without overwriting existing explicit vars
      for (const [k, v] of Object.entries(parsed)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }
    }
    const envKeys = [
      "WEB_APP_URL",
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ];

    const defined = envKeys.reduce((acc, key) => {
      const full = `process.env.${key}`;
      acc[full] = JSON.stringify(process.env[key] || (key === 'WEB_APP_URL' ? 'https://hireall.app' : ''));
      return acc;
    }, {});

    return [
      new webpack.DefinePlugin(defined),
      new CopyPlugin({
        patterns: [
          {
            from: "manifest.json",
            to: "manifest.json",
            transform(content) {
              return content
                .toString()
                .replace(
                  /"OAUTH_CLIENT_ID_PLACEHOLDER"/g,
                  JSON.stringify(
                    process.env.OAUTH_CLIENT_ID ||
                      "575119663017-s0bf9hfbc4suitbnp12kuvne4gsnkedr.apps.googleusercontent.com"
                  )
                );
            },
          },
          { from: "src/popup.html", to: "popup.html" },
          { from: "public", to: ".", noErrorOnMissing: true },
          { from: "src/styles.css", to: "styles.css", noErrorOnMissing: true },
        ],
      }),
    ];
  })(),
};
