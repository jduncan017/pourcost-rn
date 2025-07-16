const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default Metro config
const config = getDefaultConfig(__dirname);

// Add NativeWind v4 support (stable)
// When migrating to v5, this will change to include CSS imports
module.exports = withNativeWind(config, {
  input: './global.css',
});