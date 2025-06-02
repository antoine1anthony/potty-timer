import * as SQLite from 'expo-sqlite';
import { TimerState } from '../contexts/TimerContext';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = SQLite.openDatabase('potty-timer.db');
      await this.createTables();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS timers (
              id TEXT PRIMARY KEY,
              duration INTEGER NOT NULL,
              start_time INTEGER NOT NULL,
              is_active INTEGER NOT NULL DEFAULT 0,
              remaining_time INTEGER NOT NULL,
              is_notification_mode INTEGER NOT NULL DEFAULT 0,
              created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
              updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            );`,
            [],
            () => {
              console.log('✅ Timers table created successfully');
            },
            (_, error) => {
              console.error('❌ Failed to create timers table:', error);
              return false;
            },
          );

          // Create index for efficient queries
          tx.executeSql(
            `CREATE INDEX IF NOT EXISTS idx_timers_active ON timers(is_active);`,
            [],
            () => {
              console.log('✅ Database index created successfully');
            },
            (_, error) => {
              console.error('❌ Failed to create index:', error);
              return false;
            },
          );
        },
        (error) => {
          console.error('❌ Transaction failed:', error);
          reject(error);
        },
        () => {
          console.log('✅ Database tables created successfully');
          resolve();
        },
      );
    });
  }

  async createTimer(timer: Omit<TimerState, 'id'>): Promise<TimerState> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO timers (id, duration, start_time, is_active, remaining_time, is_notification_mode, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              id,
              timer.duration,
              timer.startTime,
              timer.isActive ? 1 : 0,
              timer.remainingTime,
              timer.isNotificationMode ? 1 : 0,
              now,
              now,
            ],
            () => {
              const newTimer: TimerState = {
                id,
                ...timer,
              };
              console.log('✅ Timer created:', id);
              resolve(newTimer);
            },
            (_, error) => {
              console.error('❌ Failed to create timer:', error);
              reject(error);
              return false;
            },
          );
        },
        (error) => {
          console.error('❌ Create timer transaction failed:', error);
          reject(error);
        },
      );
    });
  }

  async updateTimer(
    id: string,
    updates: Partial<TimerState>,
  ): Promise<TimerState> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Math.floor(Date.now() / 1000);
    const updateFields = [];
    const updateValues = [];

    if (updates.duration !== undefined) {
      updateFields.push('duration = ?');
      updateValues.push(updates.duration);
    }
    if (updates.startTime !== undefined) {
      updateFields.push('start_time = ?');
      updateValues.push(updates.startTime);
    }
    if (updates.isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(updates.isActive ? 1 : 0);
    }
    if (updates.remainingTime !== undefined) {
      updateFields.push('remaining_time = ?');
      updateValues.push(updates.remainingTime);
    }
    if (updates.isNotificationMode !== undefined) {
      updateFields.push('is_notification_mode = ?');
      updateValues.push(updates.isNotificationMode ? 1 : 0);
    }

    updateFields.push('updated_at = ?');
    updateValues.push(now);
    updateValues.push(id);

    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            `UPDATE timers SET ${updateFields.join(', ')} WHERE id = ?;`,
            updateValues,
            () => {
              // Fetch the updated timer
              tx.executeSql(
                `SELECT * FROM timers WHERE id = ?;`,
                [id],
                (_, result) => {
                  if (result.rows.length > 0) {
                    const row = result.rows.item(0);
                    const timer: TimerState = {
                      id: row.id,
                      duration: row.duration,
                      startTime: row.start_time,
                      isActive: row.is_active === 1,
                      remainingTime: row.remaining_time,
                      isNotificationMode: row.is_notification_mode === 1,
                    };
                    console.log('✅ Timer updated:', id);
                    resolve(timer);
                  } else {
                    reject(new Error('Timer not found after update'));
                  }
                },
                (_, error) => {
                  console.error('❌ Failed to fetch updated timer:', error);
                  reject(error);
                  return false;
                },
              );
            },
            (_, error) => {
              console.error('❌ Failed to update timer:', error);
              reject(error);
              return false;
            },
          );
        },
        (error) => {
          console.error('❌ Update timer transaction failed:', error);
          reject(error);
        },
      );
    });
  }

  async getTimer(id: string): Promise<TimerState | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT * FROM timers WHERE id = ?;`,
            [id],
            (_, result) => {
              if (result.rows.length > 0) {
                const row = result.rows.item(0);
                const timer: TimerState = {
                  id: row.id,
                  duration: row.duration,
                  startTime: row.start_time,
                  isActive: row.is_active === 1,
                  remainingTime: row.remaining_time,
                  isNotificationMode: row.is_notification_mode === 1,
                };
                resolve(timer);
              } else {
                resolve(null);
              }
            },
            (_, error) => {
              console.error('❌ Failed to get timer:', error);
              reject(error);
              return false;
            },
          );
        },
        (error) => {
          console.error('❌ Get timer transaction failed:', error);
          reject(error);
        },
      );
    });
  }

  async getCurrentTimer(): Promise<TimerState | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT * FROM timers ORDER BY created_at DESC LIMIT 1;`,
            [],
            (_, result) => {
              if (result.rows.length > 0) {
                const row = result.rows.item(0);
                const timer: TimerState = {
                  id: row.id,
                  duration: row.duration,
                  startTime: row.start_time,
                  isActive: row.is_active === 1,
                  remainingTime: row.remaining_time,
                  isNotificationMode: row.is_notification_mode === 1,
                };
                resolve(timer);
              } else {
                resolve(null);
              }
            },
            (_, error) => {
              console.error('❌ Failed to get current timer:', error);
              reject(error);
              return false;
            },
          );
        },
        (error) => {
          console.error('❌ Get current timer transaction failed:', error);
          reject(error);
        },
      );
    });
  }

  async getAllTimers(): Promise<TimerState[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT * FROM timers ORDER BY created_at DESC;`,
            [],
            (_, result) => {
              const timers: TimerState[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                timers.push({
                  id: row.id,
                  duration: row.duration,
                  startTime: row.start_time,
                  isActive: row.is_active === 1,
                  remainingTime: row.remaining_time,
                  isNotificationMode: row.is_notification_mode === 1,
                });
              }
              resolve(timers);
            },
            (_, error) => {
              console.error('❌ Failed to get all timers:', error);
              reject(error);
              return false;
            },
          );
        },
        (error) => {
          console.error('❌ Get all timers transaction failed:', error);
          reject(error);
        },
      );
    });
  }

  async deleteTimer(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            `DELETE FROM timers WHERE id = ?;`,
            [id],
            () => {
              console.log('✅ Timer deleted:', id);
              resolve();
            },
            (_, error) => {
              console.error('❌ Failed to delete timer:', error);
              reject(error);
              return false;
            },
          );
        },
        (error) => {
          console.error('❌ Delete timer transaction failed:', error);
          reject(error);
        },
      );
    });
  }

  async clearAllTimers(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(
            `DELETE FROM timers;`,
            [],
            () => {
              console.log('✅ All timers cleared');
              resolve();
            },
            (_, error) => {
              console.error('❌ Failed to clear all timers:', error);
              reject(error);
              return false;
            },
          );
        },
        (error) => {
          console.error('❌ Clear all timers transaction failed:', error);
          reject(error);
        },
      );
    });
  }
}

export const database = new DatabaseService();
