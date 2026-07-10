import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { router } from 'expo-router';

export default function AccountScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'خروج', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const handleWhatsApp = () => {
    const phoneNumber = '+201503444184'; // Replace with actual support number
    const message = 'مرحباً، أحتاج إلى مساعدة بخصوص تطبيقط قطع الغيار';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('خطأ', 'تطبيق الواتساب غير مثبت على جهازك');
      }
    });
  };

  const menuItems = [
    { icon: 'storefront-outline', title: 'بيانات المتجر', subtitle: 'الاسم والعنوان' },
    { icon: 'wallet-outline', title: 'الأرباح والتسويات', subtitle: 'كشف حساب مالي', action: () => router.push('/earnings') },
    { icon: 'notifications-outline', title: 'الإشعارات', subtitle: 'تنبيهات الطلبات', action: () => router.push('/notifications') },
    { icon: 'help-circle-outline', title: 'المساعدة والدعم', subtitle: 'تواصل مع الإدارة', action: handleWhatsApp },
  ];

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <View className="p-4 bg-white shadow-sm border-b border-zinc-100 flex-row justify-between items-center">
        <View className="w-8" />
        <Text className="text-lg font-bold text-zinc-900">حسابي</Text>
        <TouchableOpacity className="w-8 h-8 items-center justify-center bg-zinc-100 rounded-full">
           <Ionicons name="settings-outline" size={18} color="#09090b" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Profile Info */}
        <View className="items-center py-8 bg-white border-b border-zinc-100 mb-6">
          <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-4 border-[4px] border-white shadow-md">
             <Text className="text-4xl font-bold text-primary">{user?.name?.charAt(0) || 'ت'}</Text>
          </View>
          <Text className="text-xl font-bold text-zinc-900 mb-1">{user?.name || 'تاجر قطع الغيار'}</Text>
          <Text className="text-slate-500 font-medium">{user?.email}</Text>
          
          <View className="mt-4 px-4 py-1.5 bg-green-100 rounded-full">
            <Text className="text-green-800 text-xs font-bold">حساب معتمد (Approved)</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-4 mb-6">
          <View className="bg-white rounded-2xl overflow-hidden border border-zinc-200">
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                className={`flex-row justify-between items-center p-4 ${index !== menuItems.length - 1 ? 'border-b border-zinc-100' : ''}`}
                onPress={() => {
                  if (item.action) {
                    item.action();
                  }
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#a1a1aa" />
                <View className="flex-row items-center flex-1 justify-end">
                  <View className="mr-3 items-end">
                    <Text className="text-zinc-900 font-bold text-base mb-1">{item.title}</Text>
                    {item.subtitle && <Text className="text-slate-500 text-xs">{item.subtitle}</Text>}
                  </View>
                  <View className="w-10 h-10 bg-zinc-50 rounded-full items-center justify-center ml-2 border border-zinc-100">
                    <Ionicons name={item.icon as any} size={20} color="#09090b" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-4 pb-8 mt-4">
          <TouchableOpacity 
            className="bg-red-50 py-4 rounded-2xl items-center border border-red-100 flex-row justify-center"
            onPress={handleLogout}
          >
            <Text className="text-red-600 font-bold text-lg mr-2">تسجيل الخروج</Text>
            <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
