import { renderHook, act } from '@testing-library/react-native';
import { useTimerAPI } from './useTimerAPI';
import { Platform } from 'react-native';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios || options.default),
  },
}));

describe('useTimerAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset Platform.OS to default
    (Platform as any).OS = 'ios';
  });

  const createMockResponse = (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  });

  describe('createTimer', () => {
    it('should create a timer successfully', async () => {
      const mockTimer = {
        id: 'timer_123',
        duration: 1800,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 1800,
        isNotificationMode: false,
      };

      const mockResponseData = {
        success: true,
        timer: mockTimer,
        message: 'Timer created successfully',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.createTimer(1800);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/timers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration: 1800 }),
      });

      expect(response).toEqual(mockResponseData);
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorData = {
        success: false,
        error: 'Invalid duration',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockErrorData, 400) as any,
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTimerAPI());

      let error: any;
      await act(async () => {
        try {
          await result.current.createTimer(-1);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toEqual(mockErrorData);
      expect(consoleSpy).toHaveBeenCalledWith('API Error:', mockErrorData);

      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTimerAPI());

      let error: any;
      await act(async () => {
        try {
          await result.current.createTimer(1800);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBe(networkError);
      expect(consoleSpy).toHaveBeenCalledWith('Network Error:', networkError);

      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentTimer', () => {
    it('should get current timer successfully', async () => {
      const mockTimer = {
        id: 'timer_123',
        duration: 3600,
        startTime: Date.now(),
        isActive: true,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const mockResponseData = {
        success: true,
        timer: mockTimer,
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.getCurrentTimer();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/timers/current');
      expect(response).toEqual(mockResponseData);
    });

    it('should handle timer not found', async () => {
      const mockResponseData = {
        success: false,
        error: 'No timer found',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData, 404) as any,
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTimerAPI());

      let error: any;
      await act(async () => {
        try {
          await result.current.getCurrentTimer();
        } catch (e) {
          error = e;
        }
      });

      expect(error).toEqual(mockResponseData);
      consoleSpy.mockRestore();
    });
  });

  describe('startTimer', () => {
    it('should start timer successfully', async () => {
      const timerId = 'timer_123';
      const mockUpdatedTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now(),
        isActive: true,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const mockResponseData = {
        success: true,
        timer: mockUpdatedTimer,
        message: 'Timer started successfully',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.startTimer(timerId);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/timers/${timerId}/start`, {
        method: 'PUT',
      });

      expect(response).toEqual(mockResponseData);
    });

    it('should handle timer not found error', async () => {
      const timerId = 'nonexistent_timer';
      const mockErrorData = {
        success: false,
        error: 'Timer not found',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockErrorData, 404) as any,
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTimerAPI());

      let error: any;
      await act(async () => {
        try {
          await result.current.startTimer(timerId);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toEqual(mockErrorData);
      consoleSpy.mockRestore();
    });
  });

  describe('pauseTimer', () => {
    it('should pause timer successfully', async () => {
      const timerId = 'timer_123';
      const mockUpdatedTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now() - 1000,
        isActive: false,
        remainingTime: 3599,
        isNotificationMode: false,
      };

      const mockResponseData = {
        success: true,
        timer: mockUpdatedTimer,
        message: 'Timer paused successfully',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.pauseTimer(timerId);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/timers/${timerId}/pause`, {
        method: 'PUT',
      });

      expect(response).toEqual(mockResponseData);
    });
  });

  describe('resetTimer', () => {
    it('should reset timer successfully', async () => {
      const timerId = 'timer_123';
      const mockResetTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const mockResponseData = {
        success: true,
        timer: mockResetTimer,
        message: 'Timer reset successfully',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.resetTimer(timerId);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/timers/${timerId}/reset`, {
        method: 'PUT',
      });

      expect(response).toEqual(mockResponseData);
    });
  });

  describe('updateDuration', () => {
    it('should update timer duration successfully', async () => {
      const timerId = 'timer_123';
      const newDuration = 1800;
      const mockUpdatedTimer = {
        id: timerId,
        duration: newDuration,
        startTime: Date.now(),
        isActive: false,
        remainingTime: newDuration,
        isNotificationMode: false,
      };

      const mockResponseData = {
        success: true,
        timer: mockUpdatedTimer,
        message: 'Timer duration updated successfully',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.updateDuration(timerId, newDuration);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/timers/${timerId}/duration`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ duration: newDuration }),
        },
      );

      expect(response).toEqual(mockResponseData);
    });

    it('should handle invalid duration error', async () => {
      const timerId = 'timer_123';
      const invalidDuration = -1;
      const mockErrorData = {
        success: false,
        error: 'Invalid duration. Must be a positive number.',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockErrorData, 400) as any,
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTimerAPI());

      let error: any;
      await act(async () => {
        try {
          await result.current.updateDuration(timerId, invalidDuration);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toEqual(mockErrorData);
      consoleSpy.mockRestore();
    });
  });

  describe('deleteTimer', () => {
    it('should delete timer successfully', async () => {
      const timerId = 'timer_123';
      const mockResponseData = {
        success: true,
        message: 'Timer deleted successfully',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.deleteTimer(timerId);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/timers/${timerId}`, {
        method: 'DELETE',
      });

      expect(response).toEqual(mockResponseData);
    });
  });

  describe('getAllTimers', () => {
    it('should get all timers successfully', async () => {
      const mockTimers = [
        {
          id: 'timer_1',
          duration: 1800,
          startTime: Date.now() - 1000,
          isActive: false,
          remainingTime: 1800,
          isNotificationMode: false,
        },
        {
          id: 'timer_2',
          duration: 3600,
          startTime: Date.now(),
          isActive: true,
          remainingTime: 3600,
          isNotificationMode: false,
        },
      ];

      const mockResponseData = {
        success: true,
        timers: mockTimers,
        count: 2,
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.getAllTimers();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/timers');
      expect(response).toEqual(mockResponseData);
    });

    it('should handle empty timers list', async () => {
      const mockResponseData = {
        success: true,
        timers: [],
        count: 0,
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.getAllTimers();
      });

      expect(response).toEqual(mockResponseData);
    });
  });

  describe('Platform-specific URL handling', () => {
    it('should use relative URLs on web platform', async () => {
      (Platform as any).OS = 'web';

      const mockResponseData = {
        success: true,
        timers: [],
        count: 0,
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      await act(async () => {
        await result.current.getAllTimers();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/timers');
    });

    it('should use localhost URLs on mobile platforms in development', async () => {
      (Platform as any).OS = 'ios';
      process.env.NODE_ENV = 'development';

      const mockResponseData = {
        success: true,
        timers: [],
        count: 0,
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      await act(async () => {
        await result.current.getAllTimers();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8081/api/timers',
      );
    });

    it('should use relative URLs on mobile platforms in production', async () => {
      (Platform as any).OS = 'android';
      process.env.NODE_ENV = 'production';

      const mockResponseData = {
        success: true,
        timers: [],
        count: 0,
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      await act(async () => {
        await result.current.getAllTimers();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/timers');
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTimerAPI());

      let error: any;
      await act(async () => {
        try {
          await result.current.getAllTimers();
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid JSON');

      consoleSpy.mockRestore();
    });

    it('should handle response with no body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue(undefined),
      } as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTimerAPI());

      let error: any;
      await act(async () => {
        try {
          await result.current.getAllTimers();
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockFetch.mockRejectedValueOnce(timeoutError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTimerAPI());

      let error: any;
      await act(async () => {
        try {
          await result.current.createTimer(1800);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBe(timeoutError);
      expect(consoleSpy).toHaveBeenCalledWith('Network Error:', timeoutError);

      consoleSpy.mockRestore();
    });
  });

  describe('Response validation', () => {
    it('should pass through successful responses unchanged', async () => {
      const mockResponseData = {
        success: true,
        timer: {
          id: 'timer_123',
          duration: 3600,
          startTime: Date.now(),
          isActive: false,
          remainingTime: 3600,
          isNotificationMode: false,
        },
        message: 'Success',
        customField: 'custom value',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData) as any,
      );

      const { result } = renderHook(() => useTimerAPI());

      let response: any;
      await act(async () => {
        response = await result.current.createTimer(3600);
      });

      expect(response).toEqual(mockResponseData);
    });

    it('should handle responses with missing success field', async () => {
      const mockResponseData = {
        timer: {
          id: 'timer_123',
          duration: 3600,
        },
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockResponseData, 500) as any,
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTimerAPI());

      let error: any;
      await act(async () => {
        try {
          await result.current.createTimer(3600);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toEqual(mockResponseData);

      consoleSpy.mockRestore();
    });
  });
});
