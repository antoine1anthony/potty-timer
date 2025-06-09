import * as SQLite from 'expo-sqlite';
import { TimerState } from '../contexts/TimerContext';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.db) return; // Already initialized

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeInternal();
    return this.initializationPromise;
  }

  // Method for testing: reset the database service state
  resetForTesting(): void {
    this.db = null;
    this.initializationPromise = null;
  }

  private initializeInternal(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.db = SQLite.openDatabase('potty-timer.db');
        this.createTables()
          .then(() => {
            console.log('✅ Database initialized successfully');
            resolve();
          })
          .catch((error) => {
            console.error('❌ Database initialization failed:', error);
            this.db = null;
            this.initializationPromise = null;
            reject(error);
          });
      } catch (error) {
        console.error('❌ Database initialization failed:', error);
        this.db = null;
        this.initializationPromise = null;
        reject(error);
      }
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
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
            tx.executeSql(
              `CREATE INDEX IF NOT EXISTS idx_timers_active ON timers(is_active);`,
              [],
              () => {
                console.log('✅ Database tables created successfully');
                resolve();
              },
              (_, error) => {
                console.error('❌ Failed to create index:', error);
                reject(error);
                return false;
              },
            );
          },
          (_, error) => {
            console.error('❌ Failed to create tables:', error);
            reject(error);
            return false;
          },
        );
      });
    });
  }

  async createTimer(timer: Omit<TimerState, 'id'>): Promise<TimerState> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
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
      });
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
      this.db!.transaction((tx) => {
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
      });
    });
  }

  async getTimer(id: string): Promise<TimerState | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM timers WHERE id = ?;`,
          [id],
          (_, result) => {
            if (result.rows.length > 0) {
              const row = result.rows.item(0);
              resolve({
                id: row.id,
                duration: row.duration,
                startTime: row.start_time,
                isActive: row.is_active === 1,
                remainingTime: row.remaining_time,
                isNotificationMode: row.is_notification_mode === 1,
              });
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
      });
    });
  }

  async getCurrentTimer(): Promise<TimerState | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM timers ORDER BY created_at DESC LIMIT 1;`,
          [],
          (_, result) => {
            if (result.rows.length > 0) {
              const row = result.rows.item(0);
              resolve({
                id: row.id,
                duration: row.duration,
                startTime: row.start_time,
                isActive: row.is_active === 1,
                remainingTime: row.remaining_time,
                isNotificationMode: row.is_notification_mode === 1,
              });
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
      });
    });
  }

  async getAllTimers(): Promise<TimerState[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
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
      });
    });
  }

  async deleteTimer(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
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
      });
    });
  }

  async clearAllTimers(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
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
      });
    });
  }
}

export const database = new DatabaseService();
