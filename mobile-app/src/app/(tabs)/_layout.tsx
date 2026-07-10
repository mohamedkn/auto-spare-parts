import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCartStore } from '@/store/useCartStore';

export default function TabLayout() {
  const items = useCartStore((state) => state.items);
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#b45309',
        tabBarInactiveTintColor: '#71717a',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 70,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e4e4e7',
          elevation: 10,
          shadowColor: '#18181b',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 10,
          letterSpacing: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'الأقسام',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'المتاجر',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'السلة',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={color} />
              {cartItemCount > 0 && (
                <View className="absolute -right-2 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1">
                  <Text className="text-[9px] font-black text-white">{cartItemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
