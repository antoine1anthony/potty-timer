import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { TimerProvider } from '../contexts/TimerContext';
import TimerApp from './index';
import { database } from '../services/database';

// Mock the database service
jest.mock('../services/database', () => ({
  database: {
    initialize: jest.fn(),
    getCurrentTimer: jest.fn(),
    createTimer: jest.fn(),
    updateTimer: jest.fn(),
    deleteTimer: jest.fn(),
  },
}));

const mockDatabase = database as jest.Mocked<typeof database>;

// Create a test wrapper with TimerProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TimerProvider>{children}</TimerProvider>
);

describe('Timer App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mocks
    mockDatabase.initialize.mockResolvedValue();
    mockDatabase.getCurrentTimer.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Load', () => {
    it('should render loading state initially', () => {
      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      expect(getByText('Loading Timer...')).toBeTruthy();
    });

    it('should render timer controls after loading', async () => {
      const { getByText, queryByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(queryByText('Loading Timer...')).toBeNull();
      });

      // Should show timer controls
      expect(getByText('Start')).toBeTruthy();
      expect(getByText('30 mins')).toBeTruthy();
      expect(getByText('1 hour')).toBeTruthy();
      expect(getByText('2 hours')).toBeTruthy();
      expect(getByText('Custom')).toBeTruthy();
    });

    it('should load existing timer on mount', async () => {
      const existingTimer = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(existingTimer);

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(getByText('01:00:00')).toBeTruthy(); // 1 hour remaining
      });
    });
  });

  describe('Timer Creation', () => {
    it('should create timer when duration button is pressed', async () => {
      const newTimer = {
        id: 'timer_456',
        duration: 1800, // 30 minutes
        startTime: Date.now(),
        isActive: false,
        remainingTime: 1800,
        isNotificationMode: false,
      };

      mockDatabase.createTimer.mockResolvedValue(newTimer);

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('30 mins')).toBeTruthy();
      });

      // Press 30 mins button
      await act(async () => {
        fireEvent.press(getByText('30 mins'));
      });

      expect(mockDatabase.createTimer).toHaveBeenCalledWith({
        duration: 1800,
        startTime: expect.any(Number),
        isActive: false,
        remainingTime: 1800,
        isNotificationMode: false,
      });

      await waitFor(() => {
        expect(getByText('00:30:00')).toBeTruthy(); // 30 minutes displayed
      });
    });

    it('should handle custom timer duration', async () => {
      const customTimer = {
        id: 'timer_custom',
        duration: 900, // 15 minutes
        startTime: Date.now(),
        isActive: false,
        remainingTime: 900,
        isNotificationMode: false,
      };

      mockDatabase.createTimer.mockResolvedValue(customTimer);

      const { getByText, getByTestId } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Custom')).toBeTruthy();
      });

      // Press Custom button to open modal
      fireEvent.press(getByText('Custom'));

      // Find and interact with custom timer inputs
      const minutesInput = getByTestId('minutes-input');
      fireEvent.changeText(minutesInput, '15');

      // Press Set Custom Timer button
      const setButton = getByText('Set Custom Timer');
      fireEvent.press(setButton);

      expect(mockDatabase.createTimer).toHaveBeenCalledWith({
        duration: 900,
        startTime: expect.any(Number),
        isActive: false,
        remainingTime: 900,
        isNotificationMode: false,
      });
    });
  });

  describe('Timer Controls', () => {
    it('should start timer when Start button is pressed', async () => {
      const initialTimer = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const startedTimer = {
        ...initialTimer,
        isActive: true,
        startTime: Date.now(),
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(initialTimer);
      mockDatabase.updateTimer.mockResolvedValue(startedTimer);

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for timer to load
      await waitFor(() => {
        expect(getByText('Start')).toBeTruthy();
      });

      // Press Start button
      await act(async () => {
        fireEvent.press(getByText('Start'));
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(initialTimer.id, {
        isActive: true,
        startTime: expect.any(Number),
        isNotificationMode: false,
      });

      await waitFor(() => {
        expect(getByText('Pause')).toBeTruthy(); // Button should change to Pause
      });
    });

    it('should pause timer when Pause button is pressed', async () => {
      const activeTimer = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now() - 1000, // Started 1 second ago
        isActive: true,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const pausedTimer = {
        ...activeTimer,
        isActive: false,
        remainingTime: 3599, // 1 second elapsed
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(activeTimer);
      mockDatabase.updateTimer.mockResolvedValue(pausedTimer);

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for timer to load
      await waitFor(() => {
        expect(getByText('Pause')).toBeTruthy();
      });

      // Press Pause button
      await act(async () => {
        fireEvent.press(getByText('Pause'));
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(activeTimer.id, {
        isActive: false,
        remainingTime: expect.any(Number),
      });

      await waitFor(() => {
        expect(getByText('Start')).toBeTruthy(); // Button should change back to Start
      });
    });

    it('should reset timer when Reset button is pressed', async () => {
      const timerWithProgress = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now() - 10000, // Started 10 seconds ago
        isActive: false,
        remainingTime: 3590, // 10 seconds elapsed
        isNotificationMode: false,
      };

      const resetTimer = {
        ...timerWithProgress,
        remainingTime: 3600,
        startTime: Date.now(),
        isActive: false,
        isNotificationMode: false,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(timerWithProgress);
      mockDatabase.updateTimer.mockResolvedValue(resetTimer);

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for timer to load
      await waitFor(() => {
        expect(getByText('Reset')).toBeTruthy();
      });

      // Press Reset button
      await act(async () => {
        fireEvent.press(getByText('Reset'));
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(
        timerWithProgress.id,
        {
          isActive: false,
          startTime: expect.any(Number),
          remainingTime: timerWithProgress.duration,
          isNotificationMode: false,
        },
      );

      await waitFor(() => {
        expect(getByText('01:00:00')).toBeTruthy(); // Back to full duration
      });
    });
  });

  describe('Real-time Timer Updates', () => {
    it('should update remaining time for active timer', async () => {
      const activeTimer = {
        id: 'timer_123',
        duration: 10, // 10 seconds for quick test
        startTime: Date.now(),
        isActive: true,
        remainingTime: 10,
        isNotificationMode: false,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(activeTimer);

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for timer to load
      await waitFor(() => {
        expect(getByText('00:00:10')).toBeTruthy();
      });

      // Advance time by 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(getByText('00:00:07')).toBeTruthy();
      });

      // Advance time by 5 more seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(getByText('00:00:02')).toBeTruthy();
      });
    });

    it('should trigger notification mode when timer expires', async () => {
      const almostExpiredTimer = {
        id: 'timer_123',
        duration: 2, // 2 seconds
        startTime: Date.now(),
        isActive: true,
        remainingTime: 2,
        isNotificationMode: false,
      };

      const expiredTimer = {
        ...almostExpiredTimer,
        isActive: false,
        remainingTime: 0,
        isNotificationMode: true,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(almostExpiredTimer);
      mockDatabase.updateTimer.mockResolvedValue(expiredTimer);

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for timer to load
      await waitFor(() => {
        expect(getByText('00:00:02')).toBeTruthy();
      });

      // Advance time past expiration
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // Should show notification mode
      await waitFor(() => {
        expect(getByText('Time to use the Potty!!')).toBeTruthy();
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(
        almostExpiredTimer.id,
        {
          isActive: false,
          remainingTime: 0,
          isNotificationMode: true,
        },
      );
    });
  });

  describe('Error Handling', () => {
    it('should display error message when timer operations fail', async () => {
      const error = new Error('Database error');
      mockDatabase.getCurrentTimer.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(getByText('Failed to initialize timer')).toBeTruthy();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize timer:',
        error,
      );
      consoleSpy.mockRestore();
    });

    it('should allow retrying after error', async () => {
      const error = new Error('Network error');
      mockDatabase.createTimer
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          id: 'timer_retry',
          duration: 1800,
          startTime: Date.now(),
          isActive: false,
          remainingTime: 1800,
          isNotificationMode: false,
        });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('30 mins')).toBeTruthy();
      });

      // Try to create timer (will fail first time)
      await act(async () => {
        fireEvent.press(getByText('30 mins'));
      });

      await waitFor(() => {
        expect(getByText('Failed to create timer')).toBeTruthy();
      });

      // Clear the error and retry
      const dismissButton = getByText('Dismiss');
      fireEvent.press(dismissButton);

      // Try again (should succeed this time)
      await act(async () => {
        fireEvent.press(getByText('30 mins'));
      });

      await waitFor(() => {
        expect(getByText('00:30:00')).toBeTruthy();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Timer Duration Display', () => {
    it('should format time correctly for different durations', async () => {
      const testCases = [
        { duration: 30, expected: '00:00:30' },
        { duration: 90, expected: '00:01:30' },
        { duration: 3661, expected: '01:01:01' },
        { duration: 7200, expected: '02:00:00' },
      ];

      for (const testCase of testCases) {
        const timer = {
          id: `timer_${testCase.duration}`,
          duration: testCase.duration,
          startTime: Date.now(),
          isActive: false,
          remainingTime: testCase.duration,
          isNotificationMode: false,
        };

        mockDatabase.getCurrentTimer.mockResolvedValue(timer);

        const { getByText, unmount } = render(
          <TestWrapper>
            <TimerApp />
          </TestWrapper>,
        );

        await waitFor(() => {
          expect(getByText(testCase.expected)).toBeTruthy();
        });

        unmount();
        jest.clearAllMocks();
      }
    });

    it('should handle zero remaining time', async () => {
      const expiredTimer = {
        id: 'timer_expired',
        duration: 3600,
        startTime: Date.now() - 3600000, // 1 hour ago
        isActive: false,
        remainingTime: 0,
        isNotificationMode: true,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(expiredTimer);

      const { getByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(getByText('Time to use the Potty!!')).toBeTruthy();
      });
    });
  });

  describe('Custom Timer Modal', () => {
    it('should validate custom timer input', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Custom')).toBeTruthy();
      });

      // Open custom timer modal
      fireEvent.press(getByText('Custom'));

      // Try to set invalid duration (0 minutes)
      const minutesInput = getByTestId('minutes-input');
      fireEvent.changeText(minutesInput, '0');

      const setButton = getByText('Set Custom Timer');
      fireEvent.press(setButton);

      // Should not create timer with 0 duration
      expect(mockDatabase.createTimer).not.toHaveBeenCalled();
    });

    it('should close modal when Cancel is pressed', async () => {
      const { getByText, queryByText } = render(
        <TestWrapper>
          <TimerApp />
        </TestWrapper>,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Custom')).toBeTruthy();
      });

      // Open custom timer modal
      fireEvent.press(getByText('Custom'));

      // Should show modal content
      expect(getByText('Set Custom Timer')).toBeTruthy();

      // Press Cancel
      fireEvent.press(getByText('Cancel'));

      // Modal should be closed
      await waitFor(() => {
        expect(queryByText('Set Custom Timer')).toBeNull();
      });
    });
  });
});
