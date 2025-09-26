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
      safe: false,
      allowEmptyValues: true,
      systemvars: false, // avoid pulling in CI/system env duplicates that cause DefinePlugin conflicts
      silent: true,
      defaults: false,
    }),
    // Define only a minimal set of variables for the extension runtime to reduce conflicts.
    // If these vars already injected by Dotenv/system, we rely on process.env at runtime (DefinePlugin stringifies at build time).
    new webpack.DefinePlugin(
      Object.fromEntries(
        [
          ["process.env.WEB_APP_URL", process.env.WEB_APP_URL || "https://hireall.app"],
          ["process.env.NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ""],
          ["process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ""],
          ["process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""],
          ["process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""],
          ["process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""],
          ["process.env.NEXT_PUBLIC_FIREBASE_APP_ID", process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""],
        ].map(([k, v]) => [k, JSON.stringify(v)])
      )
    ),
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
  ],
};
