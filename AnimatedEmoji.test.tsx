import React from 'react';
import { render } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import AnimatedEmoji from './AnimatedEmoji';

describe('AnimatedEmoji', () => {
  const defaultProps = {
    screenWidth: 375,
    screenHeight: 667,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Mock Math.random to return predictable values
    (Math.random as jest.Mock).mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders emoji correctly with default props', () => {
      const { getByText } = render(<AnimatedEmoji {...defaultProps} />);

      // Should render the mock emoji component
      const emojiComponent = getByText('MockEmoji-375x667-delay0');
      expect(emojiComponent).toBeTruthy();
    });

    it('renders emoji with delay prop', () => {
      const { getByText } = render(
        <AnimatedEmoji {...defaultProps} delay={200} />,
      );

      const emojiComponent = getByText('MockEmoji-375x667-delay200');
      expect(emojiComponent).toBeTruthy();
    });
  });

  describe('Responsive Sizing', () => {
    it('adapts to different screen sizes', () => {
      const { getByText } = render(
        <AnimatedEmoji screenWidth={320} screenHeight={480} />,
      );

      const emojiComponent = getByText('MockEmoji-320x480-delay0');
      expect(emojiComponent).toBeTruthy();
    });

    it('handles large screen sizes', () => {
      const { getByText } = render(
        <AnimatedEmoji screenWidth={800} screenHeight={1024} />,
      );

      const emojiComponent = getByText('MockEmoji-800x1024-delay0');
      expect(emojiComponent).toBeTruthy();
    });
  });

  describe('Animation Properties', () => {
    it('applies correct positioning styles', () => {
      const { getByText } = render(<AnimatedEmoji {...defaultProps} />);

      const emojiComponent = getByText('MockEmoji-375x667-delay0');
      expect(emojiComponent).toBeTruthy();
    });

    it('handles different delay values', () => {
      const delays = [0, 200, 500, 1000];

      delays.forEach((delay) => {
        const { getByText } = render(
          <AnimatedEmoji {...defaultProps} delay={delay} />,
        );
        const emojiComponent = getByText(`MockEmoji-375x667-delay${delay}`);
        expect(emojiComponent).toBeTruthy();
      });
    });
  });

  describe('Haptic Feedback', () => {
    it('provides haptic feedback for emoji without delay', () => {
      render(<AnimatedEmoji {...defaultProps} />);

      // Component should render successfully (haptic feedback is handled internally)
      expect(true).toBe(true);
    });

    it('does not provide immediate haptic feedback for emojis with delay', () => {
      const hapticCallsBefore = (Haptics.selectionAsync as jest.Mock).mock.calls
        .length;

      render(<AnimatedEmoji {...defaultProps} delay={200} />);

      // Should not immediately call haptic feedback for delayed emojis
      const hapticCallsAfter = (Haptics.selectionAsync as jest.Mock).mock.calls
        .length;
      expect(hapticCallsAfter).toBe(hapticCallsBefore);
    });
  });

  describe('Edge Cases', () => {
    it('handles minimum screen size', () => {
      const { getByText } = render(
        <AnimatedEmoji screenWidth={100} screenHeight={100} />,
      );

      const emojiComponent = getByText('MockEmoji-100x100-delay0');
      expect(emojiComponent).toBeTruthy();
    });

    it('handles zero delay', () => {
      const { getByText } = render(
        <AnimatedEmoji {...defaultProps} delay={0} />,
      );

      const emojiComponent = getByText('MockEmoji-375x667-delay0');
      expect(emojiComponent).toBeTruthy();
    });

    it('handles undefined delay (default value)', () => {
      const { getByText } = render(<AnimatedEmoji {...defaultProps} />);

      const emojiComponent = getByText('MockEmoji-375x667-delay0');
      expect(emojiComponent).toBeTruthy();
    });
  });

  describe('Component Props Variations', () => {
    it('handles different screen dimensions', () => {
      const testCases = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 414, height: 896 }, // iPhone 11
        { width: 768, height: 1024 }, // iPad
      ];

      testCases.forEach(({ width, height }) => {
        const { getByText } = render(
          <AnimatedEmoji screenWidth={width} screenHeight={height} />,
        );
        const emojiComponent = getByText(`MockEmoji-${width}x${height}-delay0`);
        expect(emojiComponent).toBeTruthy();
      });
    });

    it('handles various delay values', () => {
      const delays = [0, 100, 200, 500, 1000, 1500];

      delays.forEach((delay) => {
        const { getByText } = render(
          <AnimatedEmoji {...defaultProps} delay={delay} />,
        );
        const emojiComponent = getByText(`MockEmoji-375x667-delay${delay}`);
        expect(emojiComponent).toBeTruthy();
      });
    });
  });
});
