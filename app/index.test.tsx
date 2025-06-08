import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import App from './index';

// Mock expo modules that cause issues
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
    granted: true,
  }),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
    granted: true,
  }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
  },
  addNotificationReceivedListener: jest
    .fn()
    .mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest
    .fn()
    .mockReturnValue({ remove: jest.fn() }),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
    Warning: 'warning',
  },
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: () => View,
      useSharedValue: (value: any) => ({ value }),
      useAnimatedStyle: (callback: () => any) => callback(),
      withTiming: (value: any) => value,
      withRepeat: (value: any) => value,
      withSequence: (value: any) => value,
      runOnJS: (fn: any) => fn,
      interpolate: (value: any) => value,
      Extrapolate: { CLAMP: 'clamp' },
    },
    useSharedValue: (value: any) => ({ value }),
    useAnimatedStyle: (callback: () => any) => callback(),
    withTiming: (value: any) => value,
    withRepeat: (value: any) => value,
    withSequence: (value: any) => value,
  };
});

// Mock TimerContext
const mockTimerContext = {
  timer: {
    id: 'test-timer',
    duration: 3600,
    remainingTime: 3600,
    isActive: false,
    startTime: Date.now(),
    isNotificationMode: false,
  },
  loading: false,
  error: null,
  createTimer: jest.fn(),
  startTimer: jest.fn(),
  pauseTimer: jest.fn(),
  resetTimer: jest.fn(),
  updateDuration: jest.fn(),
  syncTimer: jest.fn(),
  setNotificationMode: jest.fn(),
};

jest.mock('../contexts/TimerContext', () => ({
  useTimer: () => mockTimerContext,
  TimerProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock database service
jest.mock('../services/database', () => ({
  databaseService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getCurrentTimer: jest.fn().mockResolvedValue(null),
    createTimer: jest.fn().mockResolvedValue({
      id: 'test-timer',
      duration: 3600,
      remainingTime: 3600,
      isActive: false,
      startTime: Date.now(),
      isNotificationMode: false,
    }),
    updateTimer: jest.fn(),
    resetForTesting: jest.fn(),
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { getByTestId } = render(<App />);
      expect(getByTestId('app-touchable')).toBeTruthy();
    });

    it('renders timer text', () => {
      const { getByText } = render(<App />);
      expect(getByText(/\d{2}:\d{2}/)).toBeTruthy();
    });

    it('renders basic elements', () => {
      const { getByText } = render(<App />);
      expect(getByText('▶️ Start')).toBeTruthy();
      expect(getByText('🔄 Reset')).toBeTruthy();
    });
  });

  describe('Content Rendering', () => {
    it('displays timer time', () => {
      const { getByText } = render(<App />);
      expect(getByText(/\d{2}:\d{2}/)).toBeTruthy();
    });

    it('shows settings button', () => {
      const { getByText } = render(<App />);
      expect(getByText('⚙️ Timer Settings')).toBeTruthy();
    });

    it('displays potty timer message', () => {
      const { getByText } = render(<App />);
      expect(getByText('Potty Timer is running!')).toBeTruthy();
    });
  });

  describe('Platform Compatibility', () => {
    it('works on iOS', () => {
      Platform.OS = 'ios';
      const { getByTestId } = render(<App />);
      expect(getByTestId('app-touchable')).toBeTruthy();
    });

    it('works on Android', () => {
      Platform.OS = 'android';
      const { getByTestId } = render(<App />);
      expect(getByTestId('app-touchable')).toBeTruthy();
    });

    it('works on web', () => {
      Platform.OS = 'web' as any;
      const { getByTestId } = render(<App />);
      expect(getByTestId('app-touchable')).toBeTruthy();
    });
  });

  describe('Component Structure', () => {
    it('has proper touchable container', () => {
      const { getByTestId } = render(<App />);
      const container = getByTestId('app-touchable');
      expect(container).toBeTruthy();
    });

    it('renders emoji elements', () => {
      const { getByText } = render(<App />);
      expect(getByText('🚽')).toBeTruthy();
    });
  });

  describe('Timer Integration', () => {
    it('integrates with timer context', () => {
      const { getByText } = render(<App />);
      expect(getByText(/\d{2}:\d{2}/)).toBeTruthy();
    });

    it('displays correct timer format', () => {
      const { getByText } = render(<App />);
      expect(getByText('60:00')).toBeTruthy(); // Based on mock context
    });
  });

  describe('Interactive Elements', () => {
    it('has touchable main container', () => {
      const { getByTestId } = render(<App />);
      const touchable = getByTestId('app-touchable');
      expect(touchable).toBeTruthy();
    });

    it('shows tap instruction', () => {
      const { getByText } = render(<App />);
      expect(
        getByText('Tap anywhere for a potty break animation!'),
      ).toBeTruthy();
    });
  });
});
