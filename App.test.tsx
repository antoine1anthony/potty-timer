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

      expect(getByText('🚽')).toBeTruthy();
      expect(getByText(' Potty Timer is running!')).toBeTruthy();
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
          Haptics.ImpactFeedbackStyle.Medium,
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
          Haptics.ImpactFeedbackStyle.Heavy,
        );
        expect(queryByTestId('animated-emoji-0')).toBeTruthy();
      });
    });

    it('activates debug mode on triple-tap of toilet emoji', async () => {
      const { getByText } = render(<App />);
      const toiletEmoji = getByText('🚽');

      // Triple tap the toilet emoji
      fireEvent.press(toiletEmoji);
      fireEvent.press(toiletEmoji);
      fireEvent.press(toiletEmoji);

      await waitFor(() => {
        expect(getByText('[DEBUG]')).toBeTruthy();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Success,
        );
      });
    });

    it('deactivates debug mode on single tap when already in debug mode', async () => {
      const { getByText, queryByText } = render(<App />);
      const toiletEmoji = getByText('🚽');

      // First activate debug mode
      fireEvent.press(toiletEmoji);
      fireEvent.press(toiletEmoji);
      fireEvent.press(toiletEmoji);

      await waitFor(() => {
        expect(getByText('[DEBUG]')).toBeTruthy();
      });

      // Now tap once to deactivate
      fireEvent.press(toiletEmoji);

      await waitFor(() => {
        expect(queryByText('[DEBUG]')).toBeNull();
        expect(Haptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium,
        );
      });
    });

    it('dismisses notification mode on tap', async () => {
      jest.useFakeTimers();
      const { getByText, getByTestId } = render(<App />);

      // Manually trigger notification mode by triple-tapping toilet emoji first
      const toiletEmoji = getByText('🚽');
      fireEvent.press(toiletEmoji);
      fireEvent.press(toiletEmoji);
      fireEvent.press(toiletEmoji);

      // Wait for debug mode activation, then trigger notification mode
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(getByText('🚽 Time for Potty Break!! 🚽')).toBeTruthy();
      });

      // Tap to dismiss
      const touchableArea = getByTestId('app-touchable');
      fireEvent.press(touchableArea);

      await waitFor(() => {
        expect(getByText('🚽')).toBeTruthy();
        expect(getByText(' Potty Timer is running!')).toBeTruthy();
        expect(
          getByText('Tap anywhere for a potty break animation!'),
        ).toBeTruthy();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Success,
        );
      });

      jest.useRealTimers();
    });
  });

  describe('Notification Mode', () => {
    it('triggers dramatic notification mode after 5 seconds', async () => {
      jest.useFakeTimers();

      const { getByText } = render(<App />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Since the 5-second timeout is now disabled by default (no debug mode),
      // we need to manually trigger notification mode for this test
      const touchableArea = getByText('🚽');

      // Triple tap to enable debug mode first
      fireEvent.press(touchableArea);
      fireEvent.press(touchableArea);
      fireEvent.press(touchableArea);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(getByText('🚽 Time for Potty Break!! 🚽')).toBeTruthy();
        expect(getByText('Tap anywhere to dismiss!')).toBeTruthy();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Warning,
        );
      });

      jest.useRealTimers();
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
      (useWindowDimensions as any).mockReturnValue({ width: 320, height: 480 });

      const { getByText } = render(<App />);
      const titleText = getByText(' Potty Timer is running!');

      expect(titleText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 18 })]),
      );
    });

    it('adapts to tablet screen dimensions', () => {
      (useWindowDimensions as any).mockReturnValue({
        width: 800,
        height: 1024,
      });

      const { getByText } = render(<App />);
      const titleText = getByText(' Potty Timer is running!');

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
      jest.useFakeTimers();
      const { getByText, getByTestId } = render(<App />);

      // Test toilet emoji tap haptic
      const toiletEmoji = getByText('🚽');
      fireEvent.press(toiletEmoji);

      await waitFor(() => {
        expect(Haptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium,
        );
      });

      // Complete triple tap to enable debug mode
      fireEvent.press(toiletEmoji);
      fireEvent.press(toiletEmoji);

      // Test notification warning after debug mode is enabled
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Warning,
        );
      });

      jest.useRealTimers();
    });
  });
});
