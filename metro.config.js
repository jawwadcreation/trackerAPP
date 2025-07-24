const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Custom resolver to handle react-native-maps on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/'))) {
    return {
      filePath: require.resolve('./metro-web-mock.js'),
      type: 'sourceFile',
    };
  }
  
  // Fall back to the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;