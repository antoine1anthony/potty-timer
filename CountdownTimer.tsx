import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  }, [timeInSeconds]);

  // Countdown logic
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          onComplete?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isPlaying, onComplete]);

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
