import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, token, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-50">
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  if (!token || !user || user.role !== 'vendor') {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
