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
  type AppStateStatus,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedEmoji from './AnimatedEmoji';
import CountdownTimer from './CountdownTimer';
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
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚽 Potty Time!',
        body: "It's time to take a potty break!",
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3600, // 1 hour
        repeats: true,
      },
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
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
  const [countdownTime, setCountdownTime] = useState(3600); // 1 hour in seconds
  const [debugMode, setDebugMode] = useState(false);
  const [toiletEmojiTapCount, setToiletEmojiTapCount] = useState(0);
  const { width, height } = useWindowDimensions();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const colorCycleRef = useRef<any>(null); // Using any to avoid TypeScript timeout issues

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

    // For testing: trigger notification mode after 5 seconds (only in debug mode)
    let testTimeout: any = null;
    if (debugMode) {
      testTimeout = setTimeout(() => {
        triggerNotificationMode();
      }, 5000);
    }

    return () => {
      clearInterval(interval);
      if (testTimeout) {
        clearTimeout(testTimeout);
      }
    };
  }, [debugMode]);

  // Cycle through background colors in notification mode
  useEffect(() => {
    if (isNotificationMode) {
      let colorIndex = 0;
      colorCycleRef.current = setInterval(() => {
        setBackgroundColor(notificationColors[colorIndex]);
        colorIndex = (colorIndex + 1) % notificationColors.length;
        // Haptic feedback on each color change
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  // Add countdown reset logic
  useEffect(() => {
    if (!isNotificationMode) {
      // Reset countdown when returning to normal mode
      setCountdownTime(3600);
    }
  }, [isNotificationMode]);

  // Countdown tick handler
  const handleCountdownComplete = () => {
    triggerNotificationMode();
  };

  // Triggers the emoji animation with haptic feedback
  function triggerEmoji() {
    setShowEmoji(true);
    setTimeout(() => setShowEmoji(false), 4000);
    // Light haptic feedback when animation starts
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      triggerEmoji();
    }
  };

  // Handle toilet emoji tap for debug mode activation/deactivation
  const handleToiletEmojiTap = async () => {
    // If already in debug mode, turn it off
    if (debugMode) {
      setDebugMode(false);
      setToiletEmojiTapCount(0);
      // Light haptic feedback for debug deactivation
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    const newTapCount = toiletEmojiTapCount + 1;
    setToiletEmojiTapCount(newTapCount);

    // Light haptic feedback for each tap
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (newTapCount >= 3) {
      // Activate debug mode on triple tap
      setDebugMode(true);
      setToiletEmojiTapCount(0); // Reset counter
      // Success haptic feedback for debug activation
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Reset tap counter after 2 seconds if not activated
    setTimeout(() => {
      setToiletEmojiTapCount(0);
    }, 2000);
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
        {/* Countdown Timer - Only in Normal Mode */}
        {!isNotificationMode && (
          <CountdownTimer
            timeInSeconds={countdownTime}
            isPlaying={!isNotificationMode}
            onComplete={handleCountdownComplete}
            style={styles.countdownWrapper}
          />
        )}

        <View style={styles.textContainer}>
          {isNotificationMode ? (
            <Text style={[styles.text, { fontSize: textFontSize }]}>
              🚽 Time for Potty Break!! 🚽
            </Text>
          ) : (
            <>
              <View style={styles.textRow}>
                <TouchableWithoutFeedback onPress={handleToiletEmojiTap}>
                  <Text style={[styles.text, { fontSize: textFontSize }]}>
                    🚽
                  </Text>
                </TouchableWithoutFeedback>
                <Text style={[styles.text, { fontSize: textFontSize }]}>
                  {' '}
                  Potty Timer is running!
                </Text>
              </View>
              {debugMode && (
                <Text
                  style={[styles.debugText, { fontSize: textFontSize * 0.5 }]}>
                  [DEBUG]
                </Text>
              )}
            </>
          )}
        </View>

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
  countdownWrapper: {
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 5,
  },
});

// Global function declarations
declare global {
  function alert(message: string): void;
}
