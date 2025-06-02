import { TimerState } from '../contexts/TimerContext';
import { Platform } from 'react-native';

// Get the correct API base URL for the current environment
const getAPIBaseURL = () => {
  if (Platform.OS === 'web') {
    // For web, use relative URLs
    return '';
  } else {
    // For mobile, we need to handle development vs production
    if (__DEV__) {
      // Development - use localhost with the dev server port
      return 'http://localhost:8082';
    } else {
      // Production - this would be your deployed API endpoint
      return 'https://your-production-api.com';
    }
  }
};

const API_BASE_URL = getAPIBaseURL();

export function useTimerAPI() {
  const makeRequest = async (
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> => {
    try {
      const url =
        Platform.OS === 'web'
          ? `/api/${endpoint}`
          : `${API_BASE_URL}/api/${endpoint}`;

      console.log(`🌐 Making API request to: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Response:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Request failed for ${endpoint}:`, error);
      throw error;
    }
  };

  const createTimer = async (duration: number): Promise<TimerState> => {
    const response = await makeRequest('timers', {
      method: 'POST',
      body: JSON.stringify({ duration }),
    });
    return response.timer;
  };

  const getCurrentTimer = async (): Promise<TimerState | null> => {
    try {
      const response = await makeRequest('timers/current');
      return response.timer || null;
    } catch (error) {
      // If no timer exists, return null instead of throwing
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  };

  const startTimer = async (id: string): Promise<TimerState> => {
    const response = await makeRequest(`timers/${id}/start`, {
      method: 'PUT',
    });
    return response.timer;
  };

  const pauseTimer = async (id: string): Promise<TimerState> => {
    const response = await makeRequest(`timers/${id}/pause`, {
      method: 'PUT',
    });
    return response.timer;
  };

  const resetTimer = async (id: string): Promise<TimerState> => {
    const response = await makeRequest(`timers/${id}/reset`, {
      method: 'PUT',
    });
    return response.timer;
  };

  const updateDuration = async (
    id: string,
    duration: number,
  ): Promise<TimerState> => {
    const response = await makeRequest(`timers/${id}/duration`, {
      method: 'PUT',
      body: JSON.stringify({ duration }),
    });
    return response.timer;
  };

  const deleteTimer = async (id: string): Promise<void> => {
    await makeRequest(`timers/${id}`, {
      method: 'DELETE',
    });
  };

  const getAllTimers = async (): Promise<TimerState[]> => {
    const response = await makeRequest('timers');
    return response.timers;
  };

  return {
    createTimer,
    getCurrentTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    updateDuration,
    deleteTimer,
    getAllTimers,
  };
}
