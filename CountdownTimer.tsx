import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

interface CountdownTimerProps {
  timeInSeconds: number;
  onComplete?: () => void;
  isPlaying?: boolean;
  style?: object;
}

export default function CountdownTimer({
  timeInSeconds,
  onComplete,
  isPlaying = true,
  style,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeInSeconds);
  const flipAnimation = useSharedValue(0);
  const appState = useRef(AppState.currentState);
  const startTimeRef = useRef<number | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // Split formatted time into individual digits for flip animation
  const timeString = formatTime(timeLeft);
  const digits = timeString.split('');

  // Reset timer when timeInSeconds prop changes
  useEffect(() => {
    setTimeLeft(timeInSeconds);
    startTimeRef.current = Date.now();
    backgroundTimeRef.current = null;
  }, [timeInSeconds]);

  // Handle app state changes for background timing
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App is coming back to foreground
        if (backgroundTimeRef.current && startTimeRef.current && isPlaying) {
          const backgroundTime = Date.now() - backgroundTimeRef.current;
          const totalElapsed = Date.now() - startTimeRef.current;
          const newTimeLeft = Math.max(
            0,
            timeInSeconds - Math.floor(totalElapsed / 1000),
          );
          setTimeLeft(newTimeLeft);

          if (newTimeLeft <= 0 && onComplete) {
            onComplete();
          }
        }
        backgroundTimeRef.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background
        backgroundTimeRef.current = Date.now();
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, [timeInSeconds, isPlaying, onComplete]);

  // More accurate countdown logic using time-based calculation
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    // Initialize start time if not set
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, timeInSeconds - elapsed);

        setTimeLeft(newTimeLeft);

        if (newTimeLeft <= 0) {
          if (onComplete) {
            onComplete();
          }
          return;
        }
      }
    }, 100); // Update more frequently for accuracy

    return () => clearInterval(interval);
  }, [isPlaying, onComplete, timeInSeconds]);

  // Flip animation effect when time changes
  useEffect(() => {
    flipAnimation.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 150 }),
    );
  }, [timeLeft]);

  // Animated style for flip effect
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotateX: `${flipAnimation.value * 10}deg`,
        },
      ],
    };
  });

  // Render individual digit with flip animation
  const renderDigit = (digit: string, index: number) => {
    const isColon = digit === ':';

    return (
      <Animated.View
        key={index}
        style={[
          isColon ? styles.colonContainer : styles.digitContainer,
          animatedStyle,
        ]}>
        <Text style={isColon ? styles.colon : styles.digit}>{digit}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.timeContainer}>
        {digits.map((digit, index) => renderDigit(digit, index))}
      </View>
      <Text style={styles.label}>Until Next Potty Break</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  digitContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    minWidth: 50,
    alignItems: 'center',
  },
  colonContainer: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  digit: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
