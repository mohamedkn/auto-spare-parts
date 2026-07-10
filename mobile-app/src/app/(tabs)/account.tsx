import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchUserStats } from '../../api/account';

export default function AccountScreen() {
  const { user, token, logout } = useAuthStore();

  const { data: stats, refetch } = useQuery({
    queryKey: ['userStats'],
    queryFn: fetchUserStats,
    enabled: !!token,
  });

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: async () => {
        await logout();
      }}
    ]);
  };

  const handleAction = (route?: any) => {
    if (!token) {
      router.push('/(auth)/login');
      return;
    }
    if (route) {
      router.push(route);
    } else {
      Alert.alert('قريباً', 'هذه الميزة ستتوفر قريباً!');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-4 mt-2">
          
          {/* Profile Header */}
          <View className="bg-white p-5 rounded-3xl shadow-sm mb-6 border border-slate-200">
            {token && user ? (
              <View className="flex-row items-center flex-row-reverse">
                <View className="w-14 h-14 bg-slate-100 rounded-full items-center justify-center ml-4 border border-slate-300">
                  <Text className="text-slate-900 font-bold text-xl">{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-xl font-bold text-slate-900">{user.name}</Text>
                  <Text className="text-sm text-slate-500 font-medium">{user.email}</Text>
                </View>
                <TouchableOpacity className="bg-red-500/20 px-4 py-2 rounded-full" onPress={handleLogout}>
                  <Text className="text-red-500 text-sm font-bold">خروج</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row items-center justify-between flex-row-reverse">
                <View className="items-end">
                  <Text className="text-xl font-bold text-slate-900">أهلاً بك!</Text>
                  <Text className="text-sm text-slate-500 font-medium">سجل دخولك لإدارة حسابك</Text>
                </View>
                <TouchableOpacity 
                  className="bg-primary px-6 py-3 rounded-full shadow-sm"
                  onPress={() => router.push('/(auth)/login')}
                >
                  <Text className="text-black font-bold">تسجيل الدخول</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Quick Actions Grid */}
          <View className="flex-row flex-wrap justify-between mb-8 flex-row-reverse">
            {/* Orders */}
            <TouchableOpacity 
              className="w-[48%] bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-200 items-end"
              onPress={() => handleAction('/profile/orders')}
            >
              <View className="flex-row items-center mb-2 flex-row-reverse">
                <Ionicons name="cube-outline" size={24} color="#f59e0b" />
                <Text className="text-lg font-bold mr-2 text-slate-900">الطلبات</Text>
              </View>
              <Text className="text-sm text-slate-500 font-medium">{stats ? `${stats.ordersCount} طلبات` : 'إدارة وتتبع'}</Text>
            </TouchableOpacity>

            {/* Wishlist */}
            <TouchableOpacity 
              className="w-[48%] bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-200 items-end"
              onPress={() => handleAction('/profile/wishlist')}
            >
              <View className="flex-row items-center mb-2 flex-row-reverse">
                <Ionicons name="heart-outline" size={24} color="#f59e0b" />
                <Text className="text-lg font-bold mr-2 text-slate-900">المفضلة</Text>
              </View>
              <Text className="text-sm text-slate-500 font-medium">{stats ? `${stats.wishlistCount} عناصر محفوظة` : '0 عناصر محفوظة'}</Text>
            </TouchableOpacity>
          </View>

          {/* My Account List */}
          <Text className="text-lg font-bold text-slate-900 mb-3 mr-2 text-right">حسابي</Text>
          <View className="bg-white rounded-3xl shadow-sm mb-8 border border-slate-200 overflow-hidden">
            {[
              { icon: 'location-outline', title: 'العناوين المحفوظة', route: '/profile/addresses' },
              { icon: 'person-outline', title: 'تعديل الملف الشخصي', route: '/profile/edit' }
            ].map((item, index) => (
              <TouchableOpacity 
                key={index} 
                className={`flex-row items-center justify-between p-5 flex-row-reverse ${index !== 1 ? 'border-b border-slate-200' : ''}`}
                onPress={() => handleAction(item.route)}
              >
                <View className="flex-row items-center flex-row-reverse">
                  <View className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center ml-4">
                    <Ionicons name={item.icon as any} size={20} color="#0f172a" />
                  </View>
                  <Text className="text-base font-bold text-slate-900">{item.title}</Text>
                </View>
                <Ionicons name="chevron-back" size={20} color="#a1a1aa" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Settings List */}
          <Text className="text-lg font-bold text-slate-900 mb-3 mr-2 text-right">الإعدادات</Text>
          <View className="bg-white rounded-3xl shadow-sm mb-10 border border-slate-200 overflow-hidden">
            <TouchableOpacity className="flex-row items-center justify-between p-5 flex-row-reverse">
              <View className="flex-row items-center flex-row-reverse">
                <View className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center ml-4">
                  <Ionicons name="globe-outline" size={20} color="#0f172a" />
                </View>
                <Text className="text-base font-bold text-slate-900">البلد</Text>
              </View>
              <View className="flex-row items-center flex-row-reverse">
                <Text className="text-slate-500 ml-2 font-medium">مصر</Text>
                <Ionicons name="chevron-back" size={20} color="#a1a1aa" />
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
