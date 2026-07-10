import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth().finally(() => {
      const { user } = useAuthStore.getState();
      if (user) {
        useCartStore.getState().syncWithBackend().finally(() => {
          SplashScreen.hideAsync();
        });
      } else {
        SplashScreen.hideAsync();
      }
    });
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View className="flex-1 bg-[#e9ecef]">
          <View className="relative mx-auto flex-1 w-full max-w-[520px] overflow-hidden bg-[#f5f6f7] md:border-x md:border-zinc-300">
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f5f6f7' } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </View>
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
