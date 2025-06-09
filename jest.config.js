module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/dist/',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'App.tsx',
    'AnimatedEmoji.tsx',
    'CountdownTimer.tsx',
    '!**/node_modules/**',
    '!**/.expo/**',
    '!**/dist/**',
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx}',
    '!**/_layout.tsx', // Layout files are typically harder to test in isolation
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated|expo|@expo|expo-haptics|expo-device|expo-notifications|expo-modules-core|react-native-safe-area-context|react-native-gesture-handler|expo-sqlite|expo-audio|expo-router|expo/virtual|expo-asset|expo-av)/)',
  ],
  testEnvironment: 'jsdom', // Default for React components
  projects: [
    {
      displayName: 'React Components',
      testMatch: [
        '<rootDir>/**/*.test.{ts,tsx}',
        '!<rootDir>/app/api/**/*.test.{ts,tsx}',
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-reanimated|expo|@expo|expo-haptics|expo-device|expo-notifications|expo-modules-core|react-native-safe-area-context|react-native-gesture-handler|expo-sqlite|expo-audio|expo-router|expo/virtual|expo-asset|expo-av)/)',
      ],
    },
    {
      displayName: 'API Routes',
      testMatch: ['<rootDir>/app/api/**/*.test.{ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-reanimated|expo|@expo|expo-haptics|expo-device|expo-notifications|expo-modules-core|react-native-safe-area-context|react-native-gesture-handler|expo-sqlite|expo-audio|expo-router|expo/virtual|expo-asset|expo-av)/)',
      ],
    },
  ],
};
