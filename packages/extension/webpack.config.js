const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");
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
  plugins: [
    new Dotenv({
      path: "./.env",
      // Do not require an example file during local dev builds
      safe: false,
      allowEmptyValues: true,
      systemvars: true,
      silent: true,
      defaults: false,
    }),
    // Ensure reasonable defaults if env vars are missing so build-time
    // replacements always produce a string in the bundle
    new webpack.DefinePlugin({
      "process.env.WEB_APP_URL": JSON.stringify(
        process.env.WEB_APP_URL || "https://hireall.app"
      ),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "manifest.json",
          to: "manifest.json",
          transform(content) {
            return content.toString().replace(
              /"OAUTH_CLIENT_ID_PLACEHOLDER"/g,
              JSON.stringify(process.env.OAUTH_CLIENT_ID || "575119663017-s0bf9hfbc4suitbnp12kuvne4gsnkedr.apps.googleusercontent.com")
            );
          },
        },
        { from: "src/popup.html", to: "popup.html" },
        { from: "public", to: ".", noErrorOnMissing: true },
        { from: "src/styles.css", to: "styles.css", noErrorOnMissing: true },
      ],
    }),
  ],
};
