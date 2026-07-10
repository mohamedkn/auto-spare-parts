import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useAlertStore } from '../store/useAlertStore';
import CustomAlert from '../components/CustomAlert';

// Override default Alert.alert globally to use our custom brand identity
Alert.alert = (title, message, buttons) => {
  useAlertStore.getState().showAlert(title, message, buttons as any);
};

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const checkAuth = useAuthStore((state: any) => state.checkAuth);

  useEffect(() => {
    checkAuth().finally(() => {
      SplashScreen.hideAsync();
      const { token, user } = useAuthStore.getState();
      if (!token || user?.role !== 'vendor') {
        router.replace('/(auth)/login');
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View className="flex-1 bg-slate-50">
          <View className="flex-1 w-full max-w-[480px] mx-auto bg-slate-50 md:border-x md:border-slate-200 relative overflow-hidden">
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090b' } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <CustomAlert />
          </View>
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
