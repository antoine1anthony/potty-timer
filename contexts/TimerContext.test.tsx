import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TimerProvider, useTimer } from './TimerContext';
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

// Test component to access context
const TestComponent: React.FC<{ onRender?: (context: any) => void }> = ({
  onRender,
}) => {
  const context = useTimer();

  React.useEffect(() => {
    if (onRender) {
      onRender(context);
    }
  }, [context, onRender]);

  return (
    <Text testID='timer-state'>
      Timer ID: {context.timer?.id || 'none'} | Remaining:{' '}
      {context.timer?.remainingTime || 0} | Active:{' '}
      {context.timer?.isActive ? 'true' : 'false'} | Loading:{' '}
      {context.isLoading ? 'true' : 'false'} | Error: {context.error || 'none'}
    </Text>
  );
};

describe('TimerContext', () => {
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

  describe('Provider Initialization', () => {
    it('should initialize database and load current timer on mount', async () => {
      const mockTimer = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(mockTimer);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initialization
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockDatabase.initialize).toHaveBeenCalled();
      expect(mockDatabase.getCurrentTimer).toHaveBeenCalled();

      await waitFor(() => {
        expect(contextValue.timer).toEqual(mockTimer);
        expect(contextValue.isLoading).toBe(false);
      });
    });

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Database initialization failed');
      mockDatabase.initialize.mockRejectedValue(error);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(contextValue.error).toBe('Failed to initialize timer');
        expect(contextValue.isLoading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize timer:',
        error,
      );
      consoleSpy.mockRestore();
    });
  });

  describe('createTimer', () => {
    it('should create a new timer successfully', async () => {
      const newTimer = {
        id: 'timer_456',
        duration: 1800,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 1800,
        isNotificationMode: false,
      };

      mockDatabase.createTimer.mockResolvedValue(newTimer);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Create timer
      await act(async () => {
        await contextValue.createTimer(1800);
      });

      expect(mockDatabase.createTimer).toHaveBeenCalledWith({
        duration: 1800,
        startTime: expect.any(Number),
        isActive: false,
        remainingTime: 1800,
        isNotificationMode: false,
      });

      await waitFor(() => {
        expect(contextValue.timer).toEqual(newTimer);
        expect(contextValue.isLoading).toBe(false);
      });
    });

    it('should handle timer creation failure', async () => {
      const error = new Error('Failed to create timer');
      mockDatabase.createTimer.mockRejectedValue(error);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Attempt to create timer
      await act(async () => {
        await contextValue.createTimer(1800);
      });

      await waitFor(() => {
        expect(contextValue.error).toBe('Failed to create timer');
        expect(contextValue.isLoading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to create timer:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('startTimer', () => {
    it('should start an existing timer successfully', async () => {
      const initialTimer = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now() - 1000,
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const updatedTimer = {
        ...initialTimer,
        isActive: true,
        startTime: Date.now(),
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(initialTimer);
      mockDatabase.updateTimer.mockResolvedValue(updatedTimer);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Start timer
      await act(async () => {
        await contextValue.startTimer();
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(initialTimer.id, {
        isActive: true,
        startTime: expect.any(Number),
        isNotificationMode: false,
      });

      await waitFor(() => {
        expect(contextValue.timer).toEqual(updatedTimer);
      });
    });

    it('should handle starting timer when no timer exists', async () => {
      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Try to start timer
      await act(async () => {
        await contextValue.startTimer();
      });

      await waitFor(() => {
        expect(contextValue.error).toBe('No timer to start');
      });

      expect(mockDatabase.updateTimer).not.toHaveBeenCalled();
    });
  });

  describe('pauseTimer', () => {
    it('should pause an active timer successfully', async () => {
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

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Pause timer
      await act(async () => {
        await contextValue.pauseTimer();
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(activeTimer.id, {
        isActive: false,
        remainingTime: expect.any(Number),
      });

      await waitFor(() => {
        expect(contextValue.timer).toEqual(pausedTimer);
      });
    });

    it('should handle pausing when no timer exists', async () => {
      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Try to pause timer
      await act(async () => {
        await contextValue.pauseTimer();
      });

      await waitFor(() => {
        expect(contextValue.error).toBe('No timer to pause');
      });

      expect(mockDatabase.updateTimer).not.toHaveBeenCalled();
    });
  });

  describe('resetTimer', () => {
    it('should reset a timer successfully', async () => {
      const existingTimer = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now() - 1000,
        isActive: true,
        remainingTime: 3599,
        isNotificationMode: false,
      };

      const resetTimer = {
        ...existingTimer,
        isActive: false,
        startTime: Date.now(),
        remainingTime: 3600,
        isNotificationMode: false,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(existingTimer);
      mockDatabase.updateTimer.mockResolvedValue(resetTimer);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Reset timer
      await act(async () => {
        await contextValue.resetTimer();
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(existingTimer.id, {
        isActive: false,
        startTime: expect.any(Number),
        remainingTime: existingTimer.duration,
        isNotificationMode: false,
      });

      await waitFor(() => {
        expect(contextValue.timer).toEqual(resetTimer);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update remaining time for active timers', async () => {
      const activeTimer = {
        id: 'timer_123',
        duration: 10, // 10 seconds
        startTime: Date.now(),
        isActive: true,
        remainingTime: 10,
        isNotificationMode: false,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(activeTimer);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Advance time by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(contextValue.timer.remainingTime).toBe(8);
      });

      // Advance time by 5 more seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(contextValue.timer.remainingTime).toBe(3);
      });
    });

    it('should trigger notification mode when timer expires', async () => {
      const activeTimer = {
        id: 'timer_123',
        duration: 2, // 2 seconds
        startTime: Date.now(),
        isActive: true,
        remainingTime: 2,
        isNotificationMode: false,
      };

      const expiredTimer = {
        ...activeTimer,
        isActive: false,
        remainingTime: 0,
        isNotificationMode: true,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(activeTimer);
      mockDatabase.updateTimer.mockResolvedValue(expiredTimer);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Advance time past timer duration
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(contextValue.timer.isNotificationMode).toBe(true);
        expect(contextValue.timer.isActive).toBe(false);
        expect(contextValue.timer.remainingTime).toBe(0);
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(activeTimer.id, {
        isActive: false,
        remainingTime: 0,
        isNotificationMode: true,
      });
    });

    it('should not update inactive timers', async () => {
      const inactiveTimer = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now() - 1000,
        isActive: false,
        remainingTime: 3599,
        isNotificationMode: false,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(inactiveTimer);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      const initialRemainingTime = contextValue.timer.remainingTime;

      // Advance time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should remain the same since timer is inactive
      expect(contextValue.timer.remainingTime).toBe(initialRemainingTime);
    });
  });

  describe('updateDuration', () => {
    it('should update timer duration successfully', async () => {
      const existingTimer = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const updatedTimer = {
        ...existingTimer,
        duration: 1800,
        remainingTime: 1800,
      };

      mockDatabase.getCurrentTimer.mockResolvedValue(existingTimer);
      mockDatabase.updateTimer.mockResolvedValue(updatedTimer);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for initial load
      await act(async () => {
        await Promise.resolve();
      });

      // Update duration
      await act(async () => {
        await contextValue.updateDuration(1800);
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(existingTimer.id, {
        duration: 1800,
        remainingTime: 1800,
        startTime: expect.any(Number),
      });

      await waitFor(() => {
        expect(contextValue.timer).toEqual(updatedTimer);
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const error = new Error('Test error');
      mockDatabase.initialize.mockRejectedValue(error);

      let contextValue: any;
      const onRender = jest.fn((context) => {
        contextValue = context;
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TimerProvider>
          <TestComponent onRender={onRender} />
        </TimerProvider>,
      );

      // Wait for error to occur
      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(contextValue.error).toBeTruthy();
      });

      // Clear error
      act(() => {
        contextValue.clearError();
      });

      expect(contextValue.error).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('useTimer hook outside provider', () => {
    it('should throw error when used outside provider', () => {
      const TestComponentOutside = () => {
        useTimer();
        return <Text>Test</Text>;
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponentOutside />);
      }).toThrow('useTimer must be used within a TimerProvider');

      consoleSpy.mockRestore();
    });
  });
});
