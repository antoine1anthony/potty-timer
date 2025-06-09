// Setup environment variables
global.__DEV__ = true;
global.alert = jest.fn();

// Mock environment variables for testing
process.env.EXPO_PUBLIC_ENV = 'development';

// Mock expo/virtual/env to fix ES module issue
jest.mock('expo/virtual/env', () => ({
  env: process.env,
}));

// Setup jest-json-schema for API testing
import { matchers } from 'jest-json-schema';
expect.extend(matchers);

// Following the user's request to use real libraries as much as possible
// We'll use the minimum mocks needed to make tests work without loading native modules

// Mock the main react-native package with only what we need
jest.mock('react-native', () => {
  const React = require('react');

  // Create proper React component mocks with displayName for Reanimated
  const createMockComponent = (name) => {
    const Component = React.forwardRef((props, ref) => {
      // Special handling for Text component to render children as text content
      if (name === 'Text') {
        // Create a mock Text component that RN Testing Library can understand
        const element = React.createElement(
          'Text',
          {
            ...props,
            ref,
            'data-testid': name,
          },
          props.children,
        );
        // Add the necessary properties for React Native Testing Library
        if (element && element.props) {
          element.type = 'Text';
        }
        return element;
      }
      // Special handling for Modal component to respect visible prop
      if (name === 'Modal') {
        if (!props.visible) {
          return null;
        }
        return React.createElement(
          'div',
          { ...props, ref, 'data-testid': name },
          props.children,
        );
      }
      return React.createElement('div', { ...props, ref, 'data-testid': name });
    });
    Component.displayName = name;
    return Component;
  };

  return {
    // Our specific overrides for testing
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn((type, handler) => ({
        remove: jest.fn(),
      })),
    },
    useWindowDimensions: jest.fn(() => ({ width: 375, height: 667 })),

    // Essential React Native APIs and components
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((style) => {
        if (Array.isArray(style)) {
          return style.reduce((acc, current) => {
            if (current) {
              return { ...acc, ...current };
            }
            return acc;
          }, {});
        }
        return style || {};
      }),
    },
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    // TurboModuleRegistry for React Native Reanimated
    TurboModuleRegistry: {
      get: jest.fn(() => null),
      getEnforcing: jest.fn(() => ({})),
    },
    // Proper component mocks with displayName for Reanimated
    View: createMockComponent('View'),
    Text: createMockComponent('Text'),
    Image: createMockComponent('Image'),
    TouchableWithoutFeedback: createMockComponent('TouchableWithoutFeedback'),
    TouchableOpacity: createMockComponent('TouchableOpacity'),
    SafeAreaView: createMockComponent('SafeAreaView'),
    FlatList: createMockComponent('FlatList'),
    ScrollView: createMockComponent('ScrollView'),
    Modal: createMockComponent('Modal'),
    TextInput: createMockComponent('TextInput'),
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Create a simple React Native Reanimated mock instead of using the complex built-in one
// This follows the principle of minimal mocking
jest.mock('react-native-reanimated', () => {
  const React = require('react');

  const AnimatedText = React.forwardRef((props, ref) => {
    // Create a mock Text component that RN Testing Library can understand
    const element = React.createElement(
      'Text',
      {
        ...props,
        ref,
        'data-testid': 'Animated.Text',
      },
      props.children,
    );
    // Add the necessary properties for React Native Testing Library
    if (element && element.props) {
      element.type = 'Text';
    }
    return element;
  });
  AnimatedText.displayName = 'Animated.Text';

  const AnimatedView = React.forwardRef((props, ref) =>
    React.createElement('div', {
      ...props,
      ref,
      'data-testid': 'Animated.View',
    }),
  );
  AnimatedView.displayName = 'Animated.View';

  const Animated = {
    Text: AnimatedText,
    View: AnimatedView,
  };

  return {
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((toValue) => toValue),
    withSpring: jest.fn((toValue) => toValue),
    withSequence: jest.fn((...values) => values[values.length - 1]),
    runOnJS: jest.fn((fn) => fn),
    // Add Easing API that AnimatedEmoji uses
    Easing: {
      out: jest.fn((easingFunction) => easingFunction),
      exp: jest.fn((value) => value),
      linear: jest.fn((value) => value),
      ease: jest.fn((value) => value),
      quad: jest.fn((value) => value),
      cubic: jest.fn((value) => value),
    },
    default: Animated, // Default export
    ...Animated, // Named exports
  };
});

// Mock only the native bridges for Expo, keeping the same API
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-device', () => {
  const mockDevice = {
    isDevice: true,
  };
  return mockDevice;
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({
      data: 'ExponentPushToken[mock-token]',
    }),
  ),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
  },
}));

// Mock expo-audio for audio functionality
jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    remove: jest.fn(),
    volume: 1.0,
    loop: false,
    playing: false,
    muted: false,
    replace: jest.fn(),
  })),
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));

// Mock expo-sqlite for database functionality
// Note: Database tests have their own specific mocks that will override this
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(() => Promise.resolve()),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      getFirstAsync: jest.fn(() => Promise.resolve(null)),
      runAsync: jest.fn(() =>
        Promise.resolve({
          lastInsertRowId: 1,
          changes: 1,
        }),
      ),
      closeAsync: jest.fn(() => Promise.resolve()),
    }),
  ),
  openDatabase: jest.fn(() => ({
    transaction: jest.fn((callback, errorCallback, successCallback) => {
      // Simple mock that lets individual tests override it
      const mockTx = {
        executeSql: jest.fn((sql, params, successCallback, errorCallback) => {
          // Basic mock - individual tests can override this behavior
          if (successCallback) {
            const mockResult = {
              rows: {
                length: 0,
                item: jest.fn(),
              },
              insertId: 1,
              rowsAffected: 1,
            };
            successCallback(mockTx, mockResult);
          }
        }),
      };

      try {
        callback(mockTx);
        if (successCallback) successCallback();
      } catch (error) {
        if (errorCallback) errorCallback(error);
      }
    }),
    close: jest.fn(),
  })),
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    getAllSync: jest.fn(),
    getFirstSync: jest.fn(),
    runSync: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock expo-asset to prevent ES module issues
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(() => Promise.resolve()),
      localUri: 'mock-asset-uri',
    })),
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  return {
    SafeAreaProvider: ({ children }) =>
      React.createElement('div', {}, children),
    SafeAreaView: ({ children, style, testID }) =>
      React.createElement('div', { style, testID }, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock Math.random for predictable tests
const mockMath = Object.create(global.Math);
mockMath.random = jest.fn(() => 0.5);
global.Math = mockMath;

// Mock our CountdownTimer component
jest.mock('./CountdownTimer', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return function MockCountdownTimer({
    timeInSeconds,
    style,
    onComplete,
    isPlaying = true,
  }) {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    };

    // Simulate countdown behavior in tests
    React.useEffect(() => {
      if (isPlaying && timeInSeconds <= 0 && onComplete) {
        onComplete();
      }
    }, [timeInSeconds, isPlaying, onComplete]);

    return React.createElement(
      'Text',
      { 'data-testid': 'countdown-timer', style },
      formatTime(timeInSeconds),
    );
  };
});

// Mock our AnimatedEmoji component to avoid complex animation testing
jest.mock('./AnimatedEmoji', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return function MockAnimatedEmoji({
    screenWidth,
    screenHeight,
    delay = 0,
    isNotificationMode = false,
    emojiIndex = 0,
    totalEmojis = 1,
  }) {
    return React.createElement(
      'Text',
      {
        'data-testid': `animated-emoji-${emojiIndex}`,
      },
      `MockEmoji-${screenWidth}x${screenHeight}-delay${delay}${
        isNotificationMode ? '-notification' : ''
      }`,
    );
  };
});

// Mock audio files
jest.mock(
  './assets/audio/watermarked_Lunareh_Friday_Night_Feels_background_vocals_3_44.mp3',
  () => 'mock-audio-file',
);

import '@testing-library/jest-dom';
import 'jest-json-schema';

// Polyfill for Response.json in test environment
if (typeof Response !== 'undefined' && !Response.json) {
  Response.json = function (body, init = {}) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init.headers,
      },
    });
  };
}
