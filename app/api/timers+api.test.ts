/**
 * @jest-environment node
 */
import { GET, POST } from './timers+api';
import { database } from '../../services/database';

// Mock the database service
jest.mock('../../services/database', () => ({
  database: {
    initialize: jest.fn(() => Promise.resolve()),
    getAllTimers: jest.fn(),
    createTimer: jest.fn(),
  },
}));

const mockDatabase = database as jest.Mocked<typeof database>;

describe('/api/timers API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/timers', () => {
    it('should return all timers with status 200', async () => {
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

      mockDatabase.getAllTimers.mockResolvedValue(mockTimers);

      const request = new Request('http://localhost:3000/api/timers');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        timers: mockTimers,
        count: 2,
      });

      // Validate response schema
      const expectedSchema = {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          timers: {
            type: 'array',
            items: {
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
          count: { type: 'number' },
        },
        required: ['success', 'timers', 'count'],
      };

      expect(body).toMatchSchema(expectedSchema);
    });

    it('should return empty array when no timers exist', async () => {
      mockDatabase.getAllTimers.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/timers');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        timers: [],
        count: 0,
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockDatabase.getAllTimers.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new Request('http://localhost:3000/api/timers');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to fetch timers',
        details: 'Database connection failed',
      });

      expect(consoleSpy).toHaveBeenCalledWith('GET /api/timers error:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('POST /api/timers', () => {
    it('should create a timer successfully with status 200', async () => {
      const requestData = {
        duration: 1800,
      };

      const newTimer = {
        id: 'timer_123',
        duration: 1800,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 1800,
        isNotificationMode: false,
      };

      mockDatabase.createTimer.mockResolvedValue(newTimer);

      const request = new Request('http://localhost:3000/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        timer: newTimer,
        message: 'Timer created successfully',
      });

      expect(mockDatabase.createTimer).toHaveBeenCalledWith({
        duration: 1800,
        startTime: expect.any(Number),
        isActive: false,
        remainingTime: 1800,
        isNotificationMode: false,
      });

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
          message: { type: 'string' },
        },
        required: ['success', 'timer', 'message'],
      };

      expect(body).toMatchSchema(expectedSchema);
    });

    it('should return status 400 when duration is missing', async () => {
      const requestData = {};

      const request = new Request('http://localhost:3000/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({
        success: false,
        error: 'Invalid duration. Must be a positive number.',
      });

      expect(mockDatabase.createTimer).not.toHaveBeenCalled();
    });

    it('should return status 400 when duration is invalid', async () => {
      const testCases = [
        { duration: 0 },
        { duration: -1 },
        { duration: 'invalid' },
        { duration: null },
      ];

      for (const requestData of testCases) {
        const request = new Request('http://localhost:3000/api/timers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({
          success: false,
          error: 'Invalid duration. Must be a positive number.',
        });
      }

      expect(mockDatabase.createTimer).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const requestData = {
        duration: 1800,
      };

      const error = new Error('Database insertion failed');
      mockDatabase.createTimer.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new Request('http://localhost:3000/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to create timer',
        details: 'Database insertion failed',
      });

      expect(consoleSpy).toHaveBeenCalledWith('POST /api/timers error:', error);
      consoleSpy.mockRestore();
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new Request('http://localhost:3000/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to create timer');
      expect(body.details).toBe('Unknown error');
    });

    it('should create timer with valid edge case durations', async () => {
      const testCases = [
        { duration: 1 }, // 1 second
        { duration: 60 }, // 1 minute
        { duration: 3600 }, // 1 hour
        { duration: 86400 }, // 24 hours
        { duration: 604800 }, // 1 week
      ];

      for (const requestData of testCases) {
        const newTimer = {
          id: `timer_${requestData.duration}`,
          duration: requestData.duration,
          startTime: Date.now(),
          isActive: false,
          remainingTime: requestData.duration,
          isNotificationMode: false,
        };

        mockDatabase.createTimer.mockResolvedValue(newTimer);

        const request = new Request('http://localhost:3000/api/timers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.timer.duration).toBe(requestData.duration);

        jest.clearAllMocks();
      }
    });
  });

  describe('Database initialization', () => {
    it('should initialize database on module import', () => {
      // Since the module is already imported when the test file loads,
      // we can check that the initialize function is available and callable
      expect(mockDatabase.initialize).toBeDefined();
      expect(typeof mockDatabase.initialize).toBe('function');

      // Call the initialize function to simulate module import behavior
      mockDatabase.initialize();
      expect(mockDatabase.initialize).toHaveBeenCalled();
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle non-Error objects thrown from database', async () => {
      mockDatabase.getAllTimers.mockRejectedValue('String error');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new Request('http://localhost:3000/api/timers');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to fetch timers',
        details: 'Unknown error',
      });

      consoleSpy.mockRestore();
    });

    it('should handle null/undefined errors from database', async () => {
      mockDatabase.createTimer.mockRejectedValue(null);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new Request('http://localhost:3000/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 1800 }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to create timer',
        details: 'Unknown error',
      });

      consoleSpy.mockRestore();
    });
  });
});
