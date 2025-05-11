module.exports = {
    transformer: {
      assetPlugins: ['react-native-svg-transformer'],
    },
  };
  // metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = getDefaultConfig(__dirname);
