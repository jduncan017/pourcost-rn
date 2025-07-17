const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default Metro config
const config = getDefaultConfig(__dirname);

// Add NativeWind v4 support (stable)
module.exports = withNativeWind(config, {
  input: './global.css',
});