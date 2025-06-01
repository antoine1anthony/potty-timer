import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useWindowDimensions, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import App from './App';

// Mock the AnimatedEmoji component to avoid animation complexity in tests
jest.mock('./AnimatedEmoji', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockAnimatedEmoji({ screenWidth, screenHeight, delay }: any) {
    return (
      <Text testID={`animated-emoji-${delay || 0}`}>
        MockEmoji-{screenWidth}x{screenHeight}-delay{delay || 0}
      </Text>
    );
  };
});

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Reset mocked functions to default values
    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 375,
      height: 667,
    });
    (Device.isDevice as any) = true;
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
      'notification-id',
    );
    (
      Notifications.cancelAllScheduledNotificationsAsync as jest.Mock
    ).mockResolvedValue(undefined);
    (Math.random as jest.Mock).mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Render', () => {
    it('renders the main app with correct initial state', () => {
      const { getByText } = render(<App />);

      expect(getByText('🚽 Potty Timer is running!')).toBeTruthy();
      expect(
        getByText('Tap anywhere for a potty break animation!'),
      ).toBeTruthy();
    });

    it('registers notification permissions on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
        expect(Haptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light,
        );
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Success,
        );
      });
    });

    it('handles device not being physical device', async () => {
      (Device.isDevice as any) = false;

      render(<App />);

      await waitFor(() => {
        expect((globalThis as any).alert).toHaveBeenCalledWith(
          'Push notifications require a physical device.',
        );
      });
    });

    it('handles notification permission denied', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      render(<App />);

      await waitFor(() => {
        expect((globalThis as any).alert).toHaveBeenCalledWith(
          'Permission for notifications not granted!',
        );
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Error,
        );
      });
    });
  });

  describe('User Interactions', () => {
    it('triggers single emoji animation on tap in normal mode', async () => {
      const { getByTestId, queryByTestId } = render(<App />);
      const touchable = getByTestId('app-touchable');

      fireEvent.press(touchable);

      await waitFor(() => {
        expect(Haptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium,
        );
        expect(queryByTestId('animated-emoji-0')).toBeTruthy();
      });
    });

    it('dismisses notification mode on tap', async () => {
      const { getByTestId, getByText } = render(<App />);

      // Trigger notification mode
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(getByText('🚽 Time for Potty Break!! 🚽')).toBeTruthy();
      });

      const touchable = getByTestId('app-touchable');
      fireEvent.press(touchable);

      await waitFor(() => {
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Success,
        );
        expect(getByText('🚽 Potty Timer is running!')).toBeTruthy();
      });
    });
  });

  describe('Notification Mode', () => {
    it('triggers dramatic notification mode after 5 seconds', async () => {
      const { getByText, queryByTestId } = render(<App />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(getByText('🚽 Time for Potty Break!! 🚽')).toBeTruthy();
        expect(getByText('Tap anywhere to dismiss!')).toBeTruthy();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Warning,
        );

        // Check for multiple emojis (8 total)
        for (let i = 0; i < 8; i++) {
          expect(queryByTestId(`animated-emoji-${i * 200}`)).toBeTruthy();
        }
      });
    });

    it('triggers notification mode on hourly interval', async () => {
      const { getByText } = render(<App />);

      act(() => {
        jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour
      });

      await waitFor(() => {
        expect(getByText('🚽 Time for Potty Break!! 🚽')).toBeTruthy();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Warning,
        );
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts to small screen dimensions', () => {
      (useWindowDimensions as jest.Mock).mockReturnValue({
        width: 320,
        height: 480,
      });

      const { getByText } = render(<App />);
      const titleText = getByText('🚽 Potty Timer is running!');

      expect(titleText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 18 })]),
      );
    });

    it('adapts to tablet screen dimensions', () => {
      (useWindowDimensions as jest.Mock).mockReturnValue({
        width: 800,
        height: 1024,
      });

      const { getByText } = render(<App />);
      const titleText = getByText('🚽 Potty Timer is running!');

      expect(titleText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 32 })]),
      );
    });
  });

  describe('AppState Handling', () => {
    it('reschedules notifications when app becomes active', async () => {
      render(<App />);

      // Simulate app going to background and then active
      const appStateListener = (AppState.addEventListener as jest.Mock).mock
        .calls[0][1];

      act(() => {
        appStateListener('active');
      });

      await waitFor(() => {
        expect(
          Notifications.cancelAllScheduledNotificationsAsync,
        ).toHaveBeenCalled();
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Notification Scheduling', () => {
    it('schedules notification with correct parameters', async () => {
      render(<App />);

      await waitFor(() => {
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
          content: {
            title: '🚽 Potty Time!',
            body: "It's time to take a potty break!",
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 3600,
            repeats: true,
          },
        });
      });
    });

    it('cancels previous notifications before scheduling new ones', async () => {
      render(<App />);

      await waitFor(() => {
        expect(
          Notifications.cancelAllScheduledNotificationsAsync,
        ).toHaveBeenCalled();
      });
    });
  });

  describe('Haptic Feedback Integration', () => {
    it('provides appropriate haptic feedback for each interaction type', async () => {
      const { getByTestId } = render(<App />);
      const touchable = getByTestId('app-touchable');

      // Normal tap
      fireEvent.press(touchable);
      await waitFor(() => {
        expect(Haptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium,
        );
      });

      // Trigger notification mode
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Warning,
        );
      });

      // Dismiss notification mode
      fireEvent.press(touchable);
      await waitFor(() => {
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Success,
        );
      });
    });
  });
});
