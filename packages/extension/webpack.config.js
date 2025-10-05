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
      NEXT_PUBLIC_FIREBASE_CUSTOM_AUTH_DOMAIN: "",
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
          { from: "manifest.json", to: "manifest.json" },
          { from: "src/popup.html", to: "popup.html" },
          { from: "public", to: ".", noErrorOnMissing: true },
          { from: "src/styles.css", to: "styles.css", noErrorOnMissing: true },
        ],
      }),
    ];
  })(),
};
