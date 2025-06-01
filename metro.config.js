const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Temporarily disable exports field resolution to fix React 19 issues
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
