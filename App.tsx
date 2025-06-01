/**
 * App.tsx - Main entry point for the Potty Timer application.
 * - Registers for push notification permissions
 * - Schedules a local notification every hour
 * - Handles foreground and background operation
 * - Renders responsive UI with emoji animation
 * - Allows user to manually trigger animation via tap
 * - Enhanced with haptic feedback for better UX
 * - Features dramatic "Potty Break Alert" mode with cycling colors and multiple emojis
 * - Environment-aware notifications: local in dev, push in production
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
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import AnimatedEmoji from './AnimatedEmoji';
import CountdownTimer from './CountdownTimer';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';

// Environment configuration
const ENV = process.env.EXPO_PUBLIC_ENV || 'development';
const isDevelopment = ENV === 'development';
const isProduction = ENV === 'production';

console.log(`🚽 Potty Timer running in ${ENV} mode`);

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
 * Schedules a repeating local notification every hour (development mode).
 */
const scheduleLocalNotification = async () => {
  try {
    console.log('🔄 Attempting to schedule local notification...');
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('📱 Scheduling local notification (development mode)');

    const result = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚽 Potty Time!',
        body: "It's time to take a potty break! (Local notification)",
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3600, // 1 hour
        repeats: true,
      },
    });
    console.log('✅ Local notification scheduled with ID:', result);
  } catch (error) {
    console.error('❌ Error scheduling local notification:', error);
  }
};

/**
 * Sets up push notification token and schedules notifications (production mode).
 */
const setupPushNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🌐 Setting up push notifications (production mode)');

    // Get push notification token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '38c1b2a8-7e31-4365-9996-b982ad430a7c',
    });
    console.log('Push token:', token.data);

    // For demonstration, we'll still schedule a local notification
    // In a real app, you'd send this token to your backend server
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚽 Potty Time!',
        body: "It's time to take a potty break! (Push notification ready)",
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3600, // 1 hour
        repeats: true,
      },
    });
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    // Fallback to local notifications
    await scheduleLocalNotification();
  }
};

/**
 * Requests notification permissions and sets up appropriate notification type.
 */
const registerAndScheduleNotifications = async () => {
  console.log('🚀 Starting notification registration process...');

  if (!Device.isDevice) {
    console.log('❌ Not a physical device, notifications require real device');
    alert('Push notifications require a physical device.');
    return;
  }

  console.log('📱 Requesting notification permissions...');
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('❌ Notification permissions denied');
    alert('Permission for notifications not granted!');
    // Haptic feedback for error
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }

  console.log('✅ Notification permissions granted');

  // Choose notification strategy based on environment
  if (isProduction) {
    console.log('🚀 Production mode: Setting up push notifications');
    await setupPushNotifications();
  } else {
    console.log('🔧 Development mode: Setting up local notifications');
    await scheduleLocalNotification();
  }

  // Haptic feedback for successful setup
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  console.log('🎉 Notification setup completed');
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
  const [showTimerSelector, setShowTimerSelector] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('60');
  const [customSeconds, setCustomSeconds] = useState('00');
  const { width, height } = useWindowDimensions();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const colorCycleRef = useRef<any>(null); // Using any to avoid TypeScript timeout issues

  // Initialize audio player
  const audioSource = require('./assets/audio/watermarked_Lunareh_Friday_Night_Feels_background_vocals_3_44.mp3');
  const player = useAudioPlayer(audioSource);

  // Determine if device is in landscape mode
  const isLandscape = width > height;

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

  // Timer preset options
  const timerPresets = [
    { label: '30 Minutes', value: 1800 },
    { label: '1 Hour', value: 3600 },
    { label: '2 Hours', value: 7200 },
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
        // Re-schedule notifications based on environment
        if (isProduction) {
          setupPushNotifications();
        } else {
          scheduleLocalNotification();
        }
      }
      appState.current = nextAppState;
    });

    // Cleanup function
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
      // Start audio when notification mode begins
      player.loop = true;
      player.volume = 0.5;
      player.play();

      let colorIndex = 0;
      colorCycleRef.current = setInterval(() => {
        setBackgroundColor(notificationColors[colorIndex]);
        colorIndex = (colorIndex + 1) % notificationColors.length;
        // Haptic feedback on each color change
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 800); // Change color every 800ms
    } else {
      // Stop audio when exiting notification mode
      player.pause();

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
  }, [isNotificationMode, player]);

  // Add countdown reset logic
  useEffect(() => {
    if (!isNotificationMode) {
      // Reset countdown when returning to normal mode
      setCountdownTime(3600);
    }
  }, [isNotificationMode]);

  // Countdown tick handler
  const handleCountdownComplete = () => {
    // Immediately trigger notification mode when countdown completes
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

  // Handle timer duration selection
  const selectTimerDuration = (seconds: number) => {
    setCountdownTime(seconds);
    setShowTimerSelector(false);
    // Haptic feedback for selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Handle custom timer input
  const handleCustomTimer = () => {
    const minutes = parseInt(customMinutes) || 0;
    const seconds = parseInt(customSeconds) || 0;

    if (minutes > 99 || seconds > 59 || (minutes === 0 && seconds === 0)) {
      Alert.alert('Invalid Time', 'Please enter a valid time up to 99:59');
      return;
    }

    const totalSeconds = minutes * 60 + seconds;
    selectTimerDuration(totalSeconds);
  };

  // Format time for display
  const formatDisplayTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // Generate multiple emojis for notification mode with enhanced layout
  const renderMultipleEmojis = () => {
    if (!isNotificationMode) return null;

    const emojiCount = 12; // Increased for top and bottom rows
    const emojis = [];

    for (let i = 0; i < emojiCount; i++) {
      emojis.push(
        <AnimatedEmoji
          key={i}
          screenWidth={width}
          screenHeight={height}
          delay={i * 150} // Reduced delay for more dynamic effect
          isNotificationMode={true}
          emojiIndex={i}
          totalEmojis={emojiCount}
        />,
      );
    }

    return emojis;
  };

  // Timer Selection Modal
  const renderTimerSelector = () => (
    <Modal
      visible={showTimerSelector}
      transparent={true}
      animationType='slide'
      onRequestClose={() => setShowTimerSelector(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Timer Duration</Text>

          {/* Preset Options */}
          {timerPresets.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.presetButton,
                countdownTime === preset.value && styles.selectedPreset,
              ]}
              onPress={() => selectTimerDuration(preset.value)}>
              <Text
                style={[
                  styles.presetText,
                  countdownTime === preset.value && styles.selectedPresetText,
                ]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Custom Timer Input */}
          <Text style={styles.customLabel}>Custom Timer (up to 99:59):</Text>
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.timeInput}
              value={customMinutes}
              onChangeText={setCustomMinutes}
              placeholder='MM'
              keyboardType='numeric'
              maxLength={2}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              style={styles.timeInput}
              value={customSeconds}
              onChangeText={setCustomSeconds}
              placeholder='SS'
              keyboardType='numeric'
              maxLength={2}
            />
            <TouchableOpacity
              style={styles.setButton}
              onPress={handleCustomTimer}>
              <Text style={styles.setButtonText}>Set</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowTimerSelector(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
        {/* Countdown Timer with Settings Button - Only in Normal Mode */}
        {!isNotificationMode && (
          <View style={styles.timerSection}>
            <CountdownTimer
              timeInSeconds={countdownTime}
              isPlaying={!isNotificationMode}
              onComplete={handleCountdownComplete}
              style={styles.countdownWrapper}
            />
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowTimerSelector(true)}>
              <Text style={styles.settingsButtonText}>⚙️ Timer Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.textContainer}>
          {isNotificationMode ? (
            <View style={styles.notificationTextContainer}>
              {isLandscape ? (
                // Horizontal layout for landscape mode
                <Text
                  style={[
                    styles.notificationText,
                    { fontSize: textFontSize * 1.8 },
                  ]}>
                  🚽 Time to use the Potty!! 🚽
                </Text>
              ) : (
                // Vertical layout for portrait mode
                <View style={styles.verticalTextContainer}>
                  <Text
                    style={[
                      styles.notificationText,
                      { fontSize: textFontSize * 1.5 },
                    ]}>
                    🚽
                  </Text>
                  <Text
                    style={[
                      styles.notificationText,
                      { fontSize: textFontSize * 1.2 },
                    ]}>
                    Time
                  </Text>
                  <Text
                    style={[
                      styles.notificationText,
                      { fontSize: textFontSize * 1.2 },
                    ]}>
                    to
                  </Text>
                  <Text
                    style={[
                      styles.notificationText,
                      { fontSize: textFontSize * 1.2 },
                    ]}>
                    use
                  </Text>
                  <Text
                    style={[
                      styles.notificationText,
                      { fontSize: textFontSize * 1.2 },
                    ]}>
                    the
                  </Text>
                  <Text
                    style={[
                      styles.notificationText,
                      { fontSize: textFontSize * 1.2 },
                    ]}>
                    Potty!!
                  </Text>
                  <Text
                    style={[
                      styles.notificationText,
                      { fontSize: textFontSize * 1.5 },
                    ]}>
                    🚽
                  </Text>
                </View>
              )}
            </View>
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

              {/* Environment indicator */}
              {debugMode ? (
                <Text
                  style={[styles.envText, { fontSize: textFontSize * 0.4 }]}>
                  {isDevelopment ? '🔧 DEV MODE' : '🚀 PROD MODE'}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {/* Show single emoji for normal mode */}
        {showEmoji && !isNotificationMode && (
          <AnimatedEmoji
            screenWidth={width}
            screenHeight={height}
            isNotificationMode={false}
          />
        )}

        {/* Show multiple emojis for notification mode */}
        {renderMultipleEmojis()}

        <Text style={[styles.instruction, { fontSize: textFontSize * 0.65 }]}>
          {isNotificationMode
            ? 'Tap anywhere to dismiss!'
            : 'Tap anywhere for a potty break animation!'}
        </Text>

        {/* Timer Selection Modal */}
        {renderTimerSelector()}
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
  timerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownWrapper: {
    marginBottom: 10,
  },
  settingsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  envText: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  presetButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPreset: {
    backgroundColor: '#007AFF',
    borderColor: '#0051D0',
  },
  presetText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  selectedPresetText: {
    color: 'white',
    fontWeight: 'bold',
  },
  customLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    textAlign: 'center',
    width: 60,
    marginHorizontal: 5,
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  setButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  setButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  notificationTextContainer: {
    alignItems: 'center',
  },
  verticalTextContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  notificationText: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
    textAlign: 'center',
  },
});

// Global function declarations
declare global {
  function alert(message: string): void;
}
