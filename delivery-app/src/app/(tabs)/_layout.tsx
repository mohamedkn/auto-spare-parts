import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#18181b' }, // Card Dark
        headerTintColor: '#fbbf24', // Primary Amber
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#fbbf24', // Primary Amber
        tabBarInactiveTintColor: '#a1a1aa', // Muted
        tabBarStyle: {
          backgroundColor: '#09090b', // Carbon Dark
          borderTopWidth: 1,
          borderTopColor: '#27272a', // Secondary / Border
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الخريطة',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'طلباتي',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'السجل',
          tabBarIcon: ({ color }) => <Ionicons name="time" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'المحفظة',
          tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
