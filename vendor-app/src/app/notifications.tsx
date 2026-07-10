import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { goBackOrHome } from '../utils/navigation';

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data;
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  useEffect(() => {
    // Mark as read when screen is opened
    if (data?.data?.notifications?.some((n: any) => !n.read)) {
      markAsReadMutation.mutate();
    }
  }, [data]);

  const notifications = data?.data?.notifications || [];

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <View className="flex-row items-center p-4 bg-white border-b border-zinc-100 shadow-sm z-10">
        <TouchableOpacity onPress={goBackOrHome} className="w-10 h-10 items-center justify-center bg-zinc-50 rounded-full border border-zinc-200">
          <Ionicons name="arrow-back" size={20} color="#09090b" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-zinc-900 ml-3">الإشعارات</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {isLoading ? (
          <View className="items-center justify-center mt-20">
            <ActivityIndicator size="large" color="#208AEF" />
            <Text className="text-slate-500 font-medium mt-4 text-center">جاري تحميل الإشعارات...</Text>
          </View>
        ) : error ? (
          <View className="bg-red-50 border border-red-100 rounded-3xl p-8 items-center justify-center mt-10 shadow-sm">
            <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={40} color="#ef4444" />
            </View>
            <Text className="text-red-600 font-bold text-lg mt-2 text-center">عذراً، حدث خطأ!</Text>
            <Text className="text-red-500/80 font-medium text-center mt-2 leading-6">
              لم نتمكن من جلب الإشعارات الخاصة بك. يرجى التحقق من اتصالك بالإنترنت والمحاولة لاحقاً.
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="bg-white rounded-3xl border border-zinc-100 p-10 items-center justify-center mt-10 shadow-sm">
            <View className="w-24 h-24 bg-zinc-50 rounded-full items-center justify-center mb-6">
              <Ionicons name="notifications-off-outline" size={48} color="#a1a1aa" />
            </View>
            <Text className="text-zinc-900 font-bold text-xl mt-2 text-center">لا توجد إشعارات جديدة</Text>
            <Text className="text-slate-500 font-medium mt-3 text-center leading-6">
              يبدو أن كل شيء هادئ هنا. سيتم إرسال إشعار لك عندما يكون هناك تحديث جديد لطلباتك أو رصيدك.
            </Text>
          </View>
        ) : (
          <View className="mb-8">
            {notifications.map((notif: any) => (
              <View key={notif.id} className={`bg-white rounded-2xl border ${notif.read ? 'border-zinc-100' : 'border-[#208AEF] shadow-sm shadow-[#208AEF]/10'} p-4 mb-3 flex-row`}>
                <View className="w-12 h-12 rounded-full bg-zinc-50 items-center justify-center border border-zinc-100 ml-3 shrink-0">
                  <Ionicons 
                    name={
                      notif.type === 'ORDER_RECEIVED' ? 'cart-outline' :
                      notif.type === 'PAYOUT_REQUESTED' ? 'cash-outline' :
                      notif.type === 'PAYOUT_SETTLED' ? 'checkmark-circle-outline' :
                      'notifications-outline'
                    } 
                    size={24} 
                    color={notif.read ? '#a1a1aa' : '#208AEF'} 
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className={`text-base font-bold ${notif.read ? 'text-zinc-700' : 'text-zinc-900'}`}>{notif.title}</Text>
                    {!notif.read && <View className="w-2 h-2 rounded-full bg-[#208AEF] mt-1" />}
                  </View>
                  <Text className={`text-sm mb-2 leading-6 ${notif.read ? 'text-slate-500' : 'text-zinc-700'}`}>{notif.message}</Text>
                  <Text className="text-xs text-slate-500 text-left">{formatDate(notif.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
