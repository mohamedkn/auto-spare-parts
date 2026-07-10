import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { useEffect } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from '../../utils/pushNotifications';
import OrderAlertQueue from '../../components/OrderAlertQueue';

export default function TabLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Push Token registered:', token);
      }
    });
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#f59e0b',
          tabBarInactiveTintColor: '#71717a',
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 84 : 68,
            paddingBottom: Platform.OS === 'ios' ? 24 : 9,
            paddingTop: 8,
            backgroundColor: '#ffffff',
            borderTopColor: '#e4e4e7',
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontWeight: '600',
            fontSize: 11,
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'الرئيسية',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'المنتجات',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="view-grid-outline" size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="logo"
          options={{
            title: '',
            tabBarIcon: () => (
              <View className="w-16 h-16 bg-zinc-950 rounded-full items-center justify-center -mt-7 shadow-xl border-[4px] border-white">
                 <Text className="text-amber-400 font-black text-[10px] text-center leading-tight">
                   AUTO{'\n'}PARTS
                 </Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'حسابي',
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'الطلبات',
            tabBarIcon: ({ color }) => (
              <Ionicons name="list-outline" size={26} color={color} />
            ),
          }}
        />
      </Tabs>
      <OrderAlertQueue />
    </>
  );
}
