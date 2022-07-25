const webpack = require("webpack")

module.exports = function override(config, env) {
  config.resolve.fallback = Object.assign(config.resolve.fallback || {}, {
    crypto: require.resolve("crypto-browserify"),
    buffer: require.resolve("buffer"),
    stream: require.resolve("stream-browserify"),
    assert: require.resolve("assert"),
    http: require.resolve("stream-http"),
    url: require.resolve("url"),
    https: require.resolve("https-browserify"),
    os: require.resolve("os-browserify/browser"),
  })

  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false,
    },
  })

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ])

  return config
}
