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
  isNotificationMode?: boolean; // Add prop to distinguish between modes
  emojiIndex?: number; // Index for positioning in notification mode
  totalEmojis?: number; // Total number of emojis for positioning calculations
}

/**
 * AnimatedEmoji component.
 * @param screenWidth - width of the device screen
 * @param screenHeight - height of the device screen
 * @param delay - optional delay in milliseconds before animation starts
 * @param isNotificationMode - whether this is in notification mode for different positioning
 * @param emojiIndex - index of this emoji in notification mode for positioning
 * @param totalEmojis - total number of emojis for positioning calculations
 */
const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({
  screenWidth,
  screenHeight,
  delay = 0,
  isNotificationMode = false,
  emojiIndex = 0,
  totalEmojis = 1,
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

  // Helper function to calculate emojis per row for pyramid layout
  const getEmojisPerRow = () => Math.ceil(totalEmojis / 2);

  // Helper function to determine if emoji is in top row
  const isInTopRow = (index: number) => index < getEmojisPerRow();

  // Calculate position for notification mode semi-step pyramid layout
  const calculateNotificationPosition = () => {
    if (!isNotificationMode) {
      return Math.random() * (screenWidth - emojiSize);
    }

    const totalInRow = getEmojisPerRow();
    const isTopRow = isInTopRow(emojiIndex);
    const indexInRow = isTopRow ? emojiIndex : emojiIndex - totalInRow;
    const emojisInThisRow = isTopRow ? totalInRow : totalEmojis - totalInRow;

    // Create semi-step pyramid spacing
    const baseSpacing = screenWidth / (emojisInThisRow + 1);
    const stepOffset = isTopRow ? 0 : baseSpacing * 0.5; // Offset bottom row for pyramid effect
    const pyramidOffset = (totalInRow - emojisInThisRow) * baseSpacing * 0.25; // Center adjustment

    return (
      stepOffset +
      pyramidOffset +
      baseSpacing * (indexInRow + 1) -
      emojiSize / 2
    );
  };

  // Random horizontal position for fun - use pyramid layout for notification mode
  const left = React.useMemo(() => calculateNotificationPosition(), [
    isNotificationMode,
    emojiIndex,
    totalEmojis,
    screenWidth,
    emojiSize,
  ]);

  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  useEffect(() => {
    // Apply delay if specified
    const startAnimations = () => {
      // Calculate target position: go higher above countdown/text by 10-20px
      // For notification mode, create different heights for top and bottom rows
      const extraHeight = 10 + Math.random() * 10; // 10-20px additional height

      let targetY;
      if (isNotificationMode) {
        const isTopRow = isInTopRow(emojiIndex);
        // Top row goes higher, bottom row goes to middle-upper area with more spread
        targetY = isTopRow
          ? -(screenHeight * 0.8) - extraHeight // Top row very high
          : -(screenHeight * 0.6) - extraHeight; // Bottom row medium-high
      } else {
        targetY = -(screenHeight * 0.75) - extraHeight; // Normal mode goes to top 75% of screen
      }

      // Animate emoji upwards and fade out
      translateY.value = withTiming(targetY, {
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
  }, [delay, isNotificationMode, emojiIndex, totalEmojis, screenHeight]);

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
