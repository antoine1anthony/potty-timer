/**
 * App.tsx - Main entry point for the Potty Timer application.
 * - Registers for push notification permissions
 * - Schedules a local notification every hour
 * - Handles foreground and background operation
 * - Renders responsive UI with emoji animation
 * - Allows user to manually trigger animation via tap
 * - Enhanced with haptic feedback for better UX
 * - Features dramatic "Potty Break Alert" mode with cycling colors and multiple emojis
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  useWindowDimensions,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedEmoji from './AnimatedEmoji';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Schedules a repeating local notification every hour.
 */
const scheduleHourlyNotification = async () => {
  // Cancel any previous potty timer notifications before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
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

  // Light haptic feedback to confirm notification scheduled
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Requests notification permissions and, if granted, schedules notifications.
 */
const registerAndScheduleNotifications = async () => {
  if (!Device.isDevice) {
    alert('Push notifications require a physical device.');
    return;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission for notifications not granted!');
    // Haptic feedback for error
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }
  await scheduleHourlyNotification();
  // Haptic feedback for successful setup
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

function PottyTimerApp() {
  /**
   * Main app component, manages animation state and notification scheduling.
   */
  const [showEmoji, setShowEmoji] = useState(false);
  const [isNotificationMode, setIsNotificationMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#f7f7fc');
  const { width, height } = useWindowDimensions();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const colorCycleRef = useRef<NodeJS.Timeout | null>(null);

  // Array of vibrant colors for notification mode
  const notificationColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Light Yellow
  ];

  useEffect(() => {
    // Register and schedule notifications on mount
    registerAndScheduleNotifications();

    // AppState listener: re-schedule notification if returning to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        scheduleHourlyNotification();
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Initial animation trigger
    triggerEmoji();
    // Animation repeats every hour with notification mode
    const interval = setInterval(() => {
      triggerNotificationMode();
    }, 60 * 60 * 1000);

    // For testing: trigger notification mode after 5 seconds
    const testTimeout = setTimeout(() => {
      triggerNotificationMode();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(testTimeout);
    };
  }, []);

  // Cycle through background colors in notification mode
  useEffect(() => {
    if (isNotificationMode) {
      let colorIndex = 0;
      colorCycleRef.current = setInterval(() => {
        setBackgroundColor(notificationColors[colorIndex]);
        colorIndex = (colorIndex + 1) % notificationColors.length;
        // Haptic feedback on each color change
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 800); // Change color every 800ms
    } else {
      if (colorCycleRef.current) {
        clearInterval(colorCycleRef.current);
        colorCycleRef.current = null;
      }
      setBackgroundColor('#f7f7fc'); // Reset to original color
    }

    return () => {
      if (colorCycleRef.current) {
        clearInterval(colorCycleRef.current);
      }
    };
  }, [isNotificationMode]);

  // Triggers the emoji animation with haptic feedback
  function triggerEmoji() {
    setShowEmoji(true);
    setTimeout(() => setShowEmoji(false), 4000);
    // Light haptic feedback when animation starts
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Triggers dramatic notification mode
  function triggerNotificationMode() {
    setIsNotificationMode(true);
    // Strong haptic feedback for notification
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  // Manually trigger animation on tap with haptic feedback or dismiss notification mode
  const handleUserInteraction = async () => {
    if (isNotificationMode) {
      // Dismiss notification mode
      setIsNotificationMode(false);
      // Success haptic feedback for dismissal
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Medium haptic feedback for user tap interaction
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      triggerEmoji();
    }
  };

  // Responsive font size calculation
  const textFontSize = width < 360 ? 18 : width < 768 ? 24 : 32;

  // Generate multiple emojis for notification mode
  const renderMultipleEmojis = () => {
    if (!isNotificationMode) return null;

    const emojiCount = 8; // Number of emojis to show
    const emojis = [];

    for (let i = 0; i < emojiCount; i++) {
      emojis.push(
        <AnimatedEmoji
          key={i}
          screenWidth={width}
          screenHeight={height}
          delay={i * 200} // Stagger the animations
        />,
      );
    }

    return emojis;
  };

  return (
    <TouchableWithoutFeedback
      onPress={handleUserInteraction}
      testID='app-touchable'>
      <SafeAreaView
        style={[
          styles.container,
          {
            paddingHorizontal: width < 500 ? 16 : 32,
            backgroundColor: backgroundColor,
          },
        ]}
        testID='main-container'>
        <Text style={[styles.text, { fontSize: textFontSize }]}>
          {isNotificationMode
            ? '🚽 Time for Potty Break!! 🚽'
            : '🚽 Potty Timer is running!'}
        </Text>

        {/* Show single emoji for normal mode */}
        {showEmoji && !isNotificationMode && (
          <AnimatedEmoji screenWidth={width} screenHeight={height} />
        )}

        {/* Show multiple emojis for notification mode */}
        {renderMultipleEmojis()}

        <Text style={[styles.instruction, { fontSize: textFontSize * 0.65 }]}>
          {isNotificationMode
            ? 'Tap anywhere to dismiss!'
            : 'Tap anywhere for a potty break animation!'}
        </Text>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PottyTimerApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#222',
    textAlign: 'center',
  },
  instruction: {
    marginTop: 40,
    color: '#777',
    textAlign: 'center',
  },
});
