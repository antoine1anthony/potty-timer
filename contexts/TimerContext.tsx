import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { database } from '../services/database';

// Types
export interface TimerState {
  id: string;
  duration: number;
  startTime: number;
  isActive: boolean;
  remainingTime: number;
  isNotificationMode: boolean;
}

interface TimerContextType {
  timer: TimerState | null;
  loading: boolean;
  error: string | null;
  createTimer: (duration: number) => Promise<void>;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  updateDuration: (duration: number) => Promise<void>;
  syncTimer: () => Promise<void>;
  setNotificationMode: (isNotificationMode: boolean) => void;
}

// Actions
type TimerAction =
  | { type: 'SET_TIMER'; payload: TimerState }
  | { type: 'UPDATE_REMAINING_TIME'; payload: number }
  | { type: 'SET_NOTIFICATION_MODE'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_TIMER' };

// Reducer
const timerReducer = (
  state: { timer: TimerState | null; loading: boolean; error: string | null },
  action: TimerAction,
) => {
  switch (action.type) {
    case 'SET_TIMER':
      return { ...state, timer: action.payload, error: null };
    case 'UPDATE_REMAINING_TIME':
      return state.timer
        ? { ...state, timer: { ...state.timer, remainingTime: action.payload } }
        : state;
    case 'SET_NOTIFICATION_MODE':
      return state.timer
        ? {
            ...state,
            timer: { ...state.timer, isNotificationMode: action.payload },
          }
        : state;
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_TIMER':
      return { ...state, timer: null };
    default:
      return state;
  }
};

// Context
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Provider
export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(timerReducer, {
    timer: null,
    loading: false,
    error: null,
  });

  // Initialize database on mount
  useEffect(() => {
    database.initialize().catch((error) => {
      console.error('Failed to initialize database:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize database' });
    });
  }, []);

  // Calculate remaining time based on current time and start time
  const calculateRemainingTime = (timer: TimerState): number => {
    if (!timer.isActive) return timer.remainingTime;

    const now = Date.now();
    const elapsed = Math.floor((now - timer.startTime) / 1000);
    const remaining = Math.max(0, timer.duration - elapsed);

    return remaining;
  };

  // Timer tick effect
  useEffect(() => {
    if (!state.timer?.isActive) return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingTime(state.timer!);
      dispatch({ type: 'UPDATE_REMAINING_TIME', payload: remaining });

      // Trigger notification mode when timer reaches 0
      if (remaining <= 0 && !state.timer!.isNotificationMode) {
        dispatch({ type: 'SET_NOTIFICATION_MODE', payload: true });
        // Update database
        database
          .updateTimer(state.timer!.id, {
            isActive: false,
            remainingTime: 0,
            isNotificationMode: true,
          })
          .catch(console.error);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state.timer?.isActive, state.timer?.startTime, state.timer?.duration]);

  // Sync timer from database on mount
  useEffect(() => {
    syncTimer();
  }, []);

  const createTimer = async (duration: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const timer = await database.createTimer({
        duration,
        startTime: Date.now(),
        isActive: false,
        remainingTime: duration,
        isNotificationMode: false,
      });
      dispatch({ type: 'SET_TIMER', payload: timer });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : 'Failed to create timer',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startTimer = async () => {
    if (!state.timer) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedTimer = await database.updateTimer(state.timer.id, {
        isActive: true,
        startTime: Date.now(),
        isNotificationMode: false,
      });
      dispatch({ type: 'SET_TIMER', payload: updatedTimer });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : 'Failed to start timer',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const pauseTimer = async () => {
    if (!state.timer) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const remaining = calculateRemainingTime(state.timer);
      const updatedTimer = await database.updateTimer(state.timer.id, {
        isActive: false,
        remainingTime: remaining,
      });
      dispatch({ type: 'SET_TIMER', payload: updatedTimer });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : 'Failed to pause timer',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resetTimer = async () => {
    if (!state.timer) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedTimer = await database.updateTimer(state.timer.id, {
        isActive: false,
        startTime: Date.now(),
        remainingTime: state.timer.duration,
        isNotificationMode: false,
      });
      dispatch({ type: 'SET_TIMER', payload: updatedTimer });
      dispatch({ type: 'SET_NOTIFICATION_MODE', payload: false });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : 'Failed to reset timer',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateDuration = async (duration: number) => {
    if (!state.timer) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedTimer = await database.updateTimer(state.timer.id, {
        duration,
        remainingTime: state.timer.isActive ? duration : duration,
        startTime: state.timer.isActive ? Date.now() : state.timer.startTime,
      });
      dispatch({ type: 'SET_TIMER', payload: updatedTimer });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : 'Failed to update duration',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const syncTimer = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const timer = await database.getCurrentTimer();
      if (timer) {
        // Update remaining time based on current time
        const remaining = calculateRemainingTime(timer);
        const updatedTimer = { ...timer, remainingTime: remaining };
        dispatch({ type: 'SET_TIMER', payload: updatedTimer });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : 'Failed to sync timer',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setNotificationMode = (isNotificationMode: boolean) => {
    dispatch({ type: 'SET_NOTIFICATION_MODE', payload: isNotificationMode });
    // Update database
    if (state.timer) {
      database
        .updateTimer(state.timer.id, { isNotificationMode })
        .catch(console.error);
    }
  };

  const value: TimerContextType = {
    timer: state.timer,
    loading: state.loading,
    error: state.error,
    createTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    updateDuration,
    syncTimer,
    setNotificationMode,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

// Hook
export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
