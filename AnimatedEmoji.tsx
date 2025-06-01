/**
 * AnimatedEmoji.tsx - Emoji animation component for Potty Timer.
 * - Displays a randomly chosen potty-related emoji
 * - Animates emoji floating up to middle of screen and fading out
 * - Responsive to screen size and resizes emoji accordingly
 * - Added scale bounce effect for better visual appeal
 * - Enhanced with haptic feedback during key animation moments
 * - Supports delay prop for staggered animations in notification mode
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const emojis = ['🚽', '🧻', '💧', '🛁', '🧼', '🚿', '🧴', '🪥', '🧽', '🪒'];

interface AnimatedEmojiProps {
  screenWidth: number;
  screenHeight: number;
  delay?: number; // Optional delay for staggered animations
}

/**
 * AnimatedEmoji component.
 * @param screenWidth - width of the device screen
 * @param screenHeight - height of the device screen
 * @param delay - optional delay in milliseconds before animation starts
 */
const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({
  screenWidth,
  screenHeight,
  delay = 0,
}) => {
  // Animation state
  const translateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Responsive emoji size with some variation for multiple emojis
  const baseSizeMultiplier = delay > 0 ? 0.7 + Math.random() * 0.6 : 1; // Vary size for notification mode
  const emojiSize =
    (screenWidth < 400 ? 40 : screenWidth < 768 ? 60 : 100) *
    baseSizeMultiplier;

  // Random horizontal position for fun - spread across screen in notification mode
  const left =
    delay > 0
      ? Math.random() * (screenWidth - emojiSize) // Full random spread for notification mode
      : Math.random() * (screenWidth - emojiSize); // Random position for single emoji

  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  useEffect(() => {
    // Apply delay if specified
    const startAnimations = () => {
      // Animate emoji upwards and fade out - stopping at middle of screen
      translateY.value = withTiming(-screenHeight / 2, {
        duration: 4000,
        easing: Easing.out(Easing.exp),
      });

      // Add a subtle bounce scale effect with haptic feedback
      scale.value = withSequence(
        withTiming(1.2, { duration: 2000 }),
        withSpring(1, { damping: 8, stiffness: 100 }),
      );

      // Haptic feedback when emoji reaches middle (after 2 seconds)
      // Only provide haptic feedback for single emoji or first emoji in group
      if (delay === 0) {
        setTimeout(() => {
          Haptics.selectionAsync();
        }, 2000);
      }

      opacity.value = withTiming(0, {
        duration: 4000,
        easing: Easing.linear,
      });
    };

    if (delay > 0) {
      const timeoutId = setTimeout(startAnimations, delay);
      return () => clearTimeout(timeoutId);
    } else {
      startAnimations();
    }
  }, [delay]);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
    left,
  }));

  return (
    <Animated.Text
      style={[styles.emoji, animatedStyle, { fontSize: emojiSize }]}>
      {emoji}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  emoji: {
    position: 'absolute',
    bottom: 0,
  },
});

export default AnimatedEmoji;
