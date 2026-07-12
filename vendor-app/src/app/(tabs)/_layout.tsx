import { Tabs, router } from 'expo-router';
import { View, Platform } from 'react-native';
import { useEffect } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from '../../utils/pushNotifications';
import OrderAlertQueue from '../../components/OrderAlertQueue';
import InquiryAlertQueue from '../../components/InquiryAlertQueue';
import * as Notifications from 'expo-notifications';

export default function TabLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Push Token registered:', token);
      }
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.type === 'NEW_INQUIRY') {
        router.push('/logo');
      }
    });
    return () => responseSubscription.remove();
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
            title: 'الرادار',
            tabBarIcon: ({ color, focused }) => (
              <View className="relative">
                <Ionicons name={focused ? "radio" : "radio-outline"} size={27} color={color} />
                <View className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
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
      <InquiryAlertQueue />
    </>
  );
}
