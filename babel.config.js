module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // Ensure react-native-reanimated babel plugin is enabled for testing
    'react-native-reanimated/plugin',
  ],
};
