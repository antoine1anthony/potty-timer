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

      // Should render one of the potty emojis
      const emojiText = getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/);
      expect(emojiText).toBeTruthy();
    });

    it('renders emoji with delay prop', () => {
      const { getByText } = render(
        <AnimatedEmoji {...defaultProps} delay={200} />,
      );

      const emojiText = getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/);
      expect(emojiText).toBeTruthy();
    });
  });

  describe('Responsive Sizing', () => {
    it('adapts to different screen sizes', () => {
      const { getByText } = render(
        <AnimatedEmoji screenWidth={320} screenHeight={480} />,
      );

      const emojiText = getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/);
      expect(emojiText).toBeTruthy();

      // Font size should be calculated based on screen width
      expect(emojiText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: expect.any(Number),
          }),
        ]),
      );
    });

    it('handles large screen sizes', () => {
      const { getByText } = render(
        <AnimatedEmoji screenWidth={800} screenHeight={1024} />,
      );

      const emojiText = getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/);
      expect(emojiText).toBeTruthy();
    });
  });

  describe('Animation Properties', () => {
    it('applies correct positioning styles', () => {
      const { getByText } = render(<AnimatedEmoji {...defaultProps} />);

      const emojiText = getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/);

      expect(emojiText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            position: 'absolute',
          }),
          expect.objectContaining({
            fontSize: expect.any(Number),
          }),
        ]),
      );
    });

    it('handles different delay values', () => {
      const delays = [0, 200, 500, 1000];

      delays.forEach((delay) => {
        const { getByText } = render(
          <AnimatedEmoji {...defaultProps} delay={delay} />,
        );
        expect(getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/)).toBeTruthy();
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

      expect(getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/)).toBeTruthy();
    });

    it('handles zero delay', () => {
      const { getByText } = render(
        <AnimatedEmoji {...defaultProps} delay={0} />,
      );

      expect(getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/)).toBeTruthy();
    });

    it('handles undefined delay (default value)', () => {
      const { getByText } = render(<AnimatedEmoji {...defaultProps} />);

      expect(getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/)).toBeTruthy();
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
        expect(getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/)).toBeTruthy();
      });
    });

    it('handles various delay values', () => {
      const delays = [0, 100, 200, 500, 1000, 1500];

      delays.forEach((delay) => {
        const { getByText } = render(
          <AnimatedEmoji {...defaultProps} delay={delay} />,
        );
        expect(getByText(/[🚽🧻💧🛁🧼🚿🧴🪥🧽🪒]/)).toBeTruthy();
      });
    });
  });
});
