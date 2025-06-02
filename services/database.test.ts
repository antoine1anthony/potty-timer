/**
 * @jest-environment node
 */
import { database } from './database';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(),
}));

describe('DatabaseService', () => {
  let mockDb: any;
  let mockTransaction: jest.Mock;
  let mockExecuteSql: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock database and transaction
    mockExecuteSql = jest.fn();
    mockTransaction = jest.fn();
    mockDb = {
      transaction: mockTransaction,
    };

    (SQLite.openDatabase as jest.Mock).mockReturnValue(mockDb);
  });

  describe('initialize', () => {
    it('should initialize database and create tables successfully', async () => {
      // Mock successful table creation
      mockTransaction.mockImplementation(
        (callback, errorCallback, successCallback) => {
          const mockTx = {
            executeSql: mockExecuteSql,
          };

          // Mock successful SQL execution
          mockExecuteSql.mockImplementation((sql, params, successCb) => {
            if (successCb) successCb();
          });

          callback(mockTx);
          if (successCallback) successCallback();
        },
      );

      await database.initialize();

      expect(SQLite.openDatabase).toHaveBeenCalledWith('potty-timer.db');
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS timers'),
        [],
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should handle database initialization failure', async () => {
      // Mock database initialization failure
      mockTransaction.mockImplementation((callback, errorCallback) => {
        const error = new Error('Database initialization failed');
        if (errorCallback) errorCallback(error);
      });

      await expect(database.initialize()).rejects.toThrow(
        'Database initialization failed',
      );
    });
  });

  describe('createTimer', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockTransaction.mockImplementation(
        (callback, errorCallback, successCallback) => {
          const mockTx = { executeSql: mockExecuteSql };
          mockExecuteSql.mockImplementation((sql, params, successCb) => {
            if (successCb) successCb();
          });
          callback(mockTx);
          if (successCallback) successCallback();
        },
      );

      await database.initialize();
      jest.clearAllMocks();
    });

    it('should create a timer successfully', async () => {
      const timerData = {
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      // Mock successful timer creation
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          if (successCb) successCb();
        });

        callback(mockTx);
      });

      const result = await database.createTimer(timerData);

      expect(result).toMatchObject({
        id: expect.stringMatching(/^timer_\d+_[a-z0-9]+$/),
        ...timerData,
      });
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO timers'),
        expect.arrayContaining([
          expect.stringMatching(/^timer_\d+_[a-z0-9]+$/),
          timerData.duration,
          timerData.startTime,
          0, // isActive as integer
          timerData.remainingTime,
          0, // isNotificationMode as integer
          expect.any(Number), // created_at
          expect.any(Number), // updated_at
        ]),
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should handle timer creation failure', async () => {
      const timerData = {
        duration: 3600,
        startTime: Date.now(),
        isActive: false,
        remainingTime: 3600,
        isNotificationMode: false,
      };

      // Mock database error
      mockTransaction.mockImplementation((callback, errorCallback) => {
        const error = new Error('Insert failed');
        if (errorCallback) errorCallback(error);
      });

      await expect(database.createTimer(timerData)).rejects.toThrow(
        'Insert failed',
      );
    });
  });

  describe('updateTimer', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockTransaction.mockImplementation(
        (callback, errorCallback, successCallback) => {
          const mockTx = { executeSql: mockExecuteSql };
          mockExecuteSql.mockImplementation((sql, params, successCb) => {
            if (successCb) successCb();
          });
          callback(mockTx);
          if (successCallback) successCallback();
        },
      );

      await database.initialize();
      jest.clearAllMocks();
    });

    it('should update a timer successfully', async () => {
      const timerId = 'timer_123';
      const updates = {
        isActive: true,
        startTime: Date.now(),
      };

      const mockTimerRow = {
        id: timerId,
        duration: 3600,
        start_time: updates.startTime,
        is_active: 1,
        remaining_time: 3600,
        is_notification_mode: 0,
      };

      // Mock successful update and fetch
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        let callCount = 0;
        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          callCount++;
          if (callCount === 1) {
            // First call is the UPDATE
            if (successCb) successCb();
          } else if (callCount === 2) {
            // Second call is the SELECT
            const mockResult = {
              rows: {
                length: 1,
                item: (index: number) => mockTimerRow,
              },
            };
            if (successCb) successCb(null, mockResult);
          }
        });

        callback(mockTx);
      });

      const result = await database.updateTimer(timerId, updates);

      expect(result).toEqual({
        id: timerId,
        duration: 3600,
        startTime: updates.startTime,
        isActive: true,
        remainingTime: 3600,
        isNotificationMode: false,
      });
    });

    it('should handle timer not found after update', async () => {
      const timerId = 'timer_123';
      const updates = { isActive: true };

      // Mock update success but timer not found on fetch
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        let callCount = 0;
        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          callCount++;
          if (callCount === 1) {
            // First call is the UPDATE
            if (successCb) successCb();
          } else if (callCount === 2) {
            // Second call is the SELECT - no rows found
            const mockResult = {
              rows: { length: 0 },
            };
            if (successCb) successCb(null, mockResult);
          }
        });

        callback(mockTx);
      });

      await expect(database.updateTimer(timerId, updates)).rejects.toThrow(
        'Timer not found after update',
      );
    });
  });

  describe('getTimer', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockTransaction.mockImplementation(
        (callback, errorCallback, successCallback) => {
          const mockTx = { executeSql: mockExecuteSql };
          mockExecuteSql.mockImplementation((sql, params, successCb) => {
            if (successCb) successCb();
          });
          callback(mockTx);
          if (successCallback) successCallback();
        },
      );

      await database.initialize();
      jest.clearAllMocks();
    });

    it('should get a timer successfully', async () => {
      const timerId = 'timer_123';
      const mockTimerRow = {
        id: timerId,
        duration: 3600,
        start_time: Date.now(),
        is_active: 1,
        remaining_time: 3600,
        is_notification_mode: 0,
      };

      // Mock successful timer fetch
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          const mockResult = {
            rows: {
              length: 1,
              item: (index: number) => mockTimerRow,
            },
          };
          if (successCb) successCb(null, mockResult);
        });

        callback(mockTx);
      });

      const result = await database.getTimer(timerId);

      expect(result).toEqual({
        id: timerId,
        duration: 3600,
        startTime: mockTimerRow.start_time,
        isActive: true,
        remainingTime: 3600,
        isNotificationMode: false,
      });
    });

    it('should return null when timer not found', async () => {
      const timerId = 'timer_123';

      // Mock timer not found
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          const mockResult = {
            rows: { length: 0 },
          };
          if (successCb) successCb(null, mockResult);
        });

        callback(mockTx);
      });

      const result = await database.getTimer(timerId);

      expect(result).toBeNull();
    });
  });

  describe('getCurrentTimer', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockTransaction.mockImplementation(
        (callback, errorCallback, successCallback) => {
          const mockTx = { executeSql: mockExecuteSql };
          mockExecuteSql.mockImplementation((sql, params, successCb) => {
            if (successCb) successCb();
          });
          callback(mockTx);
          if (successCallback) successCallback();
        },
      );

      await database.initialize();
      jest.clearAllMocks();
    });

    it('should get the most recent timer', async () => {
      const mockTimerRow = {
        id: 'timer_123',
        duration: 3600,
        start_time: Date.now(),
        is_active: 1,
        remaining_time: 3600,
        is_notification_mode: 0,
      };

      // Mock successful timer fetch
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          const mockResult = {
            rows: {
              length: 1,
              item: (index: number) => mockTimerRow,
            },
          };
          if (successCb) successCb(null, mockResult);
        });

        callback(mockTx);
      });

      const result = await database.getCurrentTimer();

      expect(result).toEqual({
        id: 'timer_123',
        duration: 3600,
        startTime: mockTimerRow.start_time,
        isActive: true,
        remainingTime: 3600,
        isNotificationMode: false,
      });

      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC LIMIT 1'),
        [],
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should return null when no timers exist', async () => {
      // Mock no timers found
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          const mockResult = {
            rows: { length: 0 },
          };
          if (successCb) successCb(null, mockResult);
        });

        callback(mockTx);
      });

      const result = await database.getCurrentTimer();

      expect(result).toBeNull();
    });
  });

  describe('deleteTimer', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockTransaction.mockImplementation(
        (callback, errorCallback, successCallback) => {
          const mockTx = { executeSql: mockExecuteSql };
          mockExecuteSql.mockImplementation((sql, params, successCb) => {
            if (successCb) successCb();
          });
          callback(mockTx);
          if (successCallback) successCallback();
        },
      );

      await database.initialize();
      jest.clearAllMocks();
    });

    it('should delete a timer successfully', async () => {
      const timerId = 'timer_123';

      // Mock successful deletion
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          if (successCb) successCb();
        });

        callback(mockTx);
      });

      await database.deleteTimer(timerId);

      expect(mockExecuteSql).toHaveBeenCalledWith(
        'DELETE FROM timers WHERE id = ?;',
        [timerId],
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should handle deletion failure', async () => {
      const timerId = 'timer_123';

      // Mock database error
      mockTransaction.mockImplementation((callback, errorCallback) => {
        const error = new Error('Delete failed');
        if (errorCallback) errorCallback(error);
      });

      await expect(database.deleteTimer(timerId)).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('getAllTimers', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockTransaction.mockImplementation(
        (callback, errorCallback, successCallback) => {
          const mockTx = { executeSql: mockExecuteSql };
          mockExecuteSql.mockImplementation((sql, params, successCb) => {
            if (successCb) successCb();
          });
          callback(mockTx);
          if (successCallback) successCallback();
        },
      );

      await database.initialize();
      jest.clearAllMocks();
    });

    it('should get all timers successfully', async () => {
      const mockTimerRows = [
        {
          id: 'timer_1',
          duration: 1800,
          start_time: Date.now() - 1000,
          is_active: 0,
          remaining_time: 1800,
          is_notification_mode: 0,
        },
        {
          id: 'timer_2',
          duration: 3600,
          start_time: Date.now(),
          is_active: 1,
          remaining_time: 3600,
          is_notification_mode: 0,
        },
      ];

      // Mock successful timer fetch
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          const mockResult = {
            rows: {
              length: mockTimerRows.length,
              item: (index: number) => mockTimerRows[index],
            },
          };
          if (successCb) successCb(null, mockResult);
        });

        callback(mockTx);
      });

      const result = await database.getAllTimers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'timer_1',
        duration: 1800,
        startTime: mockTimerRows[0].start_time,
        isActive: false,
        remainingTime: 1800,
        isNotificationMode: false,
      });
      expect(result[1]).toEqual({
        id: 'timer_2',
        duration: 3600,
        startTime: mockTimerRows[1].start_time,
        isActive: true,
        remainingTime: 3600,
        isNotificationMode: false,
      });
    });

    it('should return empty array when no timers exist', async () => {
      // Mock no timers found
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          const mockResult = {
            rows: { length: 0 },
          };
          if (successCb) successCb(null, mockResult);
        });

        callback(mockTx);
      });

      const result = await database.getAllTimers();

      expect(result).toEqual([]);
    });
  });

  describe('clearAllTimers', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockTransaction.mockImplementation(
        (callback, errorCallback, successCallback) => {
          const mockTx = { executeSql: mockExecuteSql };
          mockExecuteSql.mockImplementation((sql, params, successCb) => {
            if (successCb) successCb();
          });
          callback(mockTx);
          if (successCallback) successCallback();
        },
      );

      await database.initialize();
      jest.clearAllMocks();
    });

    it('should clear all timers successfully', async () => {
      // Mock successful clear
      mockTransaction.mockImplementation((callback) => {
        const mockTx = {
          executeSql: mockExecuteSql,
        };

        mockExecuteSql.mockImplementation((sql, params, successCb) => {
          if (successCb) successCb();
        });

        callback(mockTx);
      });

      await database.clearAllTimers();

      expect(mockExecuteSql).toHaveBeenCalledWith(
        'DELETE FROM timers;',
        [],
        expect.any(Function),
        expect.any(Function),
      );
    });
  });
});
