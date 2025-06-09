/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from './[id]+api';
import { database } from '../../../services/database';

// Mock the database service
jest.mock('../../../services/database', () => ({
  database: {
    initialize: jest.fn(() => Promise.resolve()),
    getTimer: jest.fn(),
    updateTimer: jest.fn(),
    deleteTimer: jest.fn(),
  },
}));

const mockDatabase = database as jest.Mocked<typeof database>;

describe('/api/timers/[id] API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/timers/[id]', () => {
    it('should return a specific timer with status 200', async () => {
      const timerId = 'timer_123';
      const mockTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now(),
        isActive: true,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      mockDatabase.getTimer.mockResolvedValue(mockTimer);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}`,
      );
      const response = await GET(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        timer: mockTimer,
      });

      expect(mockDatabase.getTimer).toHaveBeenCalledWith(timerId);

      // Validate response schema
      const expectedSchema = {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          timer: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              duration: { type: 'number' },
              startTime: { type: 'number' },
              isActive: { type: 'boolean' },
              remainingTime: { type: 'number' },
              isNotificationMode: { type: 'boolean' },
            },
            required: [
              'id',
              'duration',
              'startTime',
              'isActive',
              'remainingTime',
              'isNotificationMode',
            ],
          },
        },
        required: ['success', 'timer'],
      };

      expect(body).toMatchSchema(expectedSchema);
    });

    it('should return 404 when timer not found', async () => {
      const timerId = 'nonexistent_timer';

      mockDatabase.getTimer.mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}`,
      );
      const response = await GET(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({
        success: false,
        error: 'Timer not found',
      });

      expect(mockDatabase.getTimer).toHaveBeenCalledWith(timerId);
    });

    it('should handle database errors gracefully', async () => {
      const timerId = 'timer_123';
      const error = new Error('Database connection failed');

      mockDatabase.getTimer.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}`,
      );
      const response = await GET(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to fetch timer',
        details: 'Database connection failed',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        `GET /api/timers/${timerId} error:`,
        error,
      );
      consoleSpy.mockRestore();
    });
  });

  describe('PUT /api/timers/[id]', () => {
    it('should handle start action successfully', async () => {
      const timerId = 'timer_123';
      const existingTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now() - 1000,
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const updatedTimer = {
        ...existingTimer,
        isActive: true,
        startTime: Date.now(),
        isNotificationMode: false,
      };

      mockDatabase.getTimer.mockResolvedValue(existingTimer);
      mockDatabase.updateTimer.mockResolvedValue(updatedTimer);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}/start`,
        {
          method: 'PUT',
        },
      );

      const response = await PUT(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        timer: updatedTimer,
        message: 'Timer start successfully',
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(timerId, {
        isActive: true,
        startTime: expect.any(Number),
        isNotificationMode: false,
      });
    });

    it('should handle pause action successfully', async () => {
      const timerId = 'timer_123';
      const startTime = Date.now() - 5000; // Started 5 seconds ago
      const activeTimer = {
        id: timerId,
        duration: 3600,
        startTime,
        isActive: true,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const pausedTimer = {
        ...activeTimer,
        isActive: false,
        remainingTime: 3595, // 5 seconds elapsed
      };

      mockDatabase.getTimer.mockResolvedValue(activeTimer);
      mockDatabase.updateTimer.mockResolvedValue(pausedTimer);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}/pause`,
        {
          method: 'PUT',
        },
      );

      const response = await PUT(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        timer: pausedTimer,
        message: 'Timer pause successfully',
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(timerId, {
        isActive: false,
        remainingTime: expect.any(Number),
      });
    });

    it('should handle reset action successfully', async () => {
      const timerId = 'timer_123';
      const existingTimer = {
        id: timerId,
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

      mockDatabase.getTimer.mockResolvedValue(existingTimer);
      mockDatabase.updateTimer.mockResolvedValue(resetTimer);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}/reset`,
        {
          method: 'PUT',
        },
      );

      const response = await PUT(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        timer: resetTimer,
        message: 'Timer reset successfully',
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(timerId, {
        isActive: false,
        startTime: expect.any(Number),
        remainingTime: existingTimer.duration,
        isNotificationMode: false,
      });
    });

    it('should handle duration update action successfully', async () => {
      const timerId = 'timer_123';
      const existingTimer = {
        id: timerId,
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

      const requestData = { duration: 1800 };

      mockDatabase.getTimer.mockResolvedValue(existingTimer);
      mockDatabase.updateTimer.mockResolvedValue(updatedTimer);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}/duration`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        },
      );

      const response = await PUT(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        timer: updatedTimer,
        message: 'Timer duration successfully',
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(timerId, {
        duration: 1800,
        remainingTime: 1800,
        startTime: expect.any(Number),
      });
    });

    it('should return 400 for invalid duration update', async () => {
      const timerId = 'timer_123';
      const existingTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      mockDatabase.getTimer.mockResolvedValue(existingTimer);

      const invalidData = { duration: -1 };

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}/duration`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        },
      );

      const response = await PUT(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({
        success: false,
        error: 'Invalid duration. Must be a positive number.',
      });

      expect(mockDatabase.updateTimer).not.toHaveBeenCalled();
    });

    it('should handle generic update action', async () => {
      const timerId = 'timer_123';
      const existingTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const updatedTimer = {
        ...existingTimer,
        isNotificationMode: true,
      };

      const updateData = { isNotificationMode: true };

      mockDatabase.getTimer.mockResolvedValue(existingTimer);
      mockDatabase.updateTimer.mockResolvedValue(updatedTimer);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        },
      );

      const response = await PUT(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        timer: updatedTimer,
        message: 'Timer updated successfully',
      });

      expect(mockDatabase.updateTimer).toHaveBeenCalledWith(
        timerId,
        updateData,
      );
    });

    it('should return 404 when timer not found for update', async () => {
      const timerId = 'nonexistent_timer';

      mockDatabase.getTimer.mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}/start`,
        {
          method: 'PUT',
        },
      );

      const response = await PUT(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({
        success: false,
        error: 'Timer not found',
      });

      expect(mockDatabase.updateTimer).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      const timerId = 'timer_123';
      const existingTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const error = new Error('Database update failed');

      mockDatabase.getTimer.mockResolvedValue(existingTimer);
      mockDatabase.updateTimer.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}/start`,
        {
          method: 'PUT',
        },
      );

      const response = await PUT(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to update timer',
        details: 'Database update failed',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        `PUT /api/timers/${timerId} error:`,
        error,
      );
      consoleSpy.mockRestore();
    });
  });

  describe('DELETE /api/timers/[id]', () => {
    it('should delete a timer successfully', async () => {
      const timerId = 'timer_123';
      const existingTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      mockDatabase.getTimer.mockResolvedValue(existingTimer);
      mockDatabase.deleteTimer.mockResolvedValue();

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}`,
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        message: 'Timer deleted successfully',
      });

      expect(mockDatabase.getTimer).toHaveBeenCalledWith(timerId);
      expect(mockDatabase.deleteTimer).toHaveBeenCalledWith(timerId);
    });

    it('should return 404 when timer not found for deletion', async () => {
      const timerId = 'nonexistent_timer';

      mockDatabase.getTimer.mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}`,
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({
        success: false,
        error: 'Timer not found',
      });

      expect(mockDatabase.deleteTimer).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      const timerId = 'timer_123';
      const existingTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      const error = new Error('Database deletion failed');

      mockDatabase.getTimer.mockResolvedValue(existingTimer);
      mockDatabase.deleteTimer.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}`,
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to delete timer',
        details: 'Database deletion failed',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        `DELETE /api/timers/${timerId} error:`,
        error,
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed JSON in PUT requests', async () => {
      const timerId = 'timer_123';
      const existingTimer = {
        id: timerId,
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      mockDatabase.getTimer.mockResolvedValue(existingTimer);

      const request = new Request(
        `http://localhost:3000/api/timers/${timerId}/duration`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json',
        },
      );

      const response = await PUT(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to update timer');
    });

    it('should handle empty timer ID', async () => {
      const request = new Request('http://localhost:3000/api/timers/', {
        method: 'PUT',
      });

      const response = await PUT(request, { id: '' });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({
        success: false,
        error: 'Timer not found',
      });
    });

    it('should handle special characters in timer ID', async () => {
      const timerId = 'timer_with_special_chars_!@#$%';

      mockDatabase.getTimer.mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/timers/${encodeURIComponent(timerId)}`,
      );
      const response = await GET(request, { id: timerId });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({
        success: false,
        error: 'Timer not found',
      });

      expect(mockDatabase.getTimer).toHaveBeenCalledWith(timerId);
    });
  });
});
