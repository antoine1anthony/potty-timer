module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
  collectCoverageFrom: [
    'App.tsx',
    'AnimatedEmoji.tsx',
    '!**/node_modules/**',
    '!**/.expo/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated|expo|@expo|expo-haptics|expo-device|expo-notifications|expo-modules-core|react-native-safe-area-context|react-native-gesture-handler)/)',
  ],
  testEnvironment: 'node',
};
