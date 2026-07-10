import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { goBackOrHome } from '../utils/navigation';

// Helper for formatting dates
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function EarningsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['vendor-earnings'],
    queryFn: async () => {
      const res = await apiClient.get('/vendor/payouts');
      return res.data?.data;
    }
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/vendor/payouts');
      return res.data;
    },
    onSuccess: (resData) => {
      Alert.alert('نجاح', resData.data?.message || 'تم إرسال طلب السحب بنجاح');
      queryClient.invalidateQueries({ queryKey: ['vendor-earnings'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDashboard'] });
    },
    onError: () => {
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال طلب السحب');
    }
  });

  const orders = data?.payouts?.pending || [];
  const totalAvailable = Number(data?.stats?.pendingBalance || 0);

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <View className="flex-row items-center p-4 bg-white border-b border-zinc-100 shadow-sm z-10">
        <TouchableOpacity onPress={goBackOrHome} className="w-10 h-10 items-center justify-center">
          <Ionicons name="arrow-back" size={24} color="#09090b" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-zinc-900 ml-2">الأرباح والتسويات</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Earnings Summary */}
        <View className="bg-primary/10 rounded-2xl p-6 mb-6 items-center">
          <Text className="text-zinc-600 font-bold mb-2 text-base">إجمالي الأرباح المتاحة</Text>
          <Text className="text-4xl font-black text-primary">{totalAvailable.toFixed(2)} ج.م</Text>
          <TouchableOpacity 
            className={`mt-4 px-8 py-3 rounded-full shadow-sm shadow-primary/30 ${requestPayoutMutation.isPending ? 'bg-zinc-400' : 'bg-primary'}`}
            onPress={() => requestPayoutMutation.mutate()}
            disabled={requestPayoutMutation.isPending || totalAvailable <= 0}
          >
             <Text className="text-slate-900 font-bold">
               {requestPayoutMutation.isPending ? 'جاري الإرسال...' : 'طلب سحب الأرباح'}
             </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <Text className="text-lg font-bold text-zinc-900 mb-4 px-1">السجل المالي (الطلبات المسلمة)</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#09090b" className="mt-10" />
        ) : error ? (
          <Text className="text-red-500 text-center mt-4">حدث خطأ أثناء تحميل السجل.</Text>
        ) : orders.length === 0 ? (
          <View className="bg-white rounded-2xl border border-zinc-100 p-8 items-center justify-center mt-2">
            <Ionicons name="wallet-outline" size={48} color="#d4d4d8" />
            <Text className="text-slate-500 font-medium mt-4 text-center">لا توجد حركات مالية مسجلة حتى الآن.</Text>
          </View>
        ) : (
          <View className="mb-8">
            {orders.map((order: any) => (
              <View key={order.id} className="bg-white rounded-2xl border border-zinc-100 p-4 mb-3">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-zinc-900 font-bold">طلب #{order.order.orderNumber}</Text>
                  <Text className="text-green-600 font-black">+{Number(order.vendorPayoutAmount).toFixed(2)} ج.م</Text>
                </View>
                <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 text-xs">{formatDate(order.updatedAt)}</Text>
                  <Text className="text-slate-500 text-xs text-right">
                    الإجمالي: {Number(order.subtotal).toFixed(2)} | العمولة: {Number(order.commissionAmount).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
