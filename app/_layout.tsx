import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TimerProvider } from '../contexts/TimerContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TimerProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="api" options={{ href: null }} />
        </Stack>
      </TimerProvider>
    </SafeAreaProvider>
  );
} 