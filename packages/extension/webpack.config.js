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
      "process.env.CONVEX_URL": JSON.stringify(
        process.env.CONVEX_URL || "https://rare-chihuahua-615.convex.cloud"
      ),
      "process.env.WEB_APP_URL": JSON.stringify(
        process.env.WEB_APP_URL || "http://localhost:3000"
      ),
      "process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": JSON.stringify(
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ""
      ),
      "process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL": JSON.stringify(
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in"
      ),
      "process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL": JSON.stringify(
        process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up"
      ),
      "process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL": JSON.stringify(
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard"
      ),
      "process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL": JSON.stringify(
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/dashboard"
      ),
    }),
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "src/popup.html", to: "popup.html" },
        { from: "public", to: ".", noErrorOnMissing: true },
        { from: "src/styles.css", to: "styles.css", noErrorOnMissing: true },
      ],
    }),
  ],
};
