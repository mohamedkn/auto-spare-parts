import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import apiClient, { formatImageUrl } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

export default function MyOrdersScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customerOrders'],
    queryFn: async () => {
      const res = await apiClient.get('/orders');
      return res.data;
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'confirmed': return 'مؤكد';
      case 'preparing': return 'جاري التجهيز';
      case 'processing': return 'جاهز للشحن';
      case 'shipped': return 'في الطريق';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-900/30 border border-amber-800/50';
      case 'confirmed': return 'text-blue-400 bg-blue-900/30 border border-blue-800/50';
      case 'preparing': case 'processing': return 'text-orange-400 bg-orange-900/30 border border-orange-800/50';
      case 'shipped': return 'text-purple-400 bg-purple-900/30 border border-purple-800/50';
      case 'delivered': return 'text-emerald-400 bg-emerald-900/30 border border-emerald-800/50';
      case 'cancelled': return 'text-red-400 bg-red-900/30 border border-red-800/50';
      default: return 'text-slate-500 bg-slate-100 border border-slate-300/50';
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const orderDate = new Date(item.createdAt).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    // Sub-orders statuses
    const subOrders = item.subOrders || [];
    
    // Overall status logic (simplistic)
    const isCancelled = subOrders.every((s: any) => s.status === 'cancelled');
    const isDelivered = subOrders.every((s: any) => s.status === 'delivered');
    const displayStatus = isCancelled ? 'cancelled' : isDelivered ? 'delivered' : subOrders[0]?.status || 'pending';
    const itemsSubtotal = Number(item.pricing?.itemsSubtotal ?? subOrders.reduce(
      (total: number, subOrder: any) => total + Number(subOrder.subtotal || 0),
      0
    ));
    const orderTotal = Number(item.pricing?.total ?? item.payments?.[0]?.amount ?? itemsSubtotal);
    const deliveryFee = Number(item.pricing?.deliveryFee ?? Math.max(0, orderTotal - itemsSubtotal));

    return (
      <View className="bg-white rounded-2xl mb-4 border border-slate-200 overflow-hidden shadow-sm">
        <View className="flex-row-reverse justify-between items-center p-4 border-b border-slate-200">
          <View className="items-end">
            <Text className="text-slate-600 font-bold text-right">طلب #{item.orderNumber?.substring(0, 8) || item.id?.substring(0,8)}</Text>
            <Text className="text-slate-500 text-xs mt-1 text-right">{orderDate}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${getStatusColor(displayStatus)}`}>
            <Text className="text-xs font-bold">{getStatusText(displayStatus)}</Text>
          </View>
        </View>

        <View className="p-4">
          <Text className="text-slate-900 text-right font-bold mb-2">المشتريات:</Text>
          {subOrders.map((sub: any, idx: number) => (
            <View key={idx} className="mb-3">
              <Text className="text-slate-500 text-xs text-right mb-1">متجر: {sub.vendor?.storeName}</Text>
              {sub.items.map((orderItem: any, i: number) => (
                <View key={i} className="flex-row items-center flex-row-reverse mb-2 bg-slate-100/50 p-2 rounded-xl border border-slate-200">
                  <Image 
                    source={{ uri: formatImageUrl(orderItem.product?.images?.[0]?.url) || 'https://via.placeholder.com/150' }}
                    style={{ width: 40, height: 40, borderRadius: 8, marginLeft: 12 }}
                  />
                  <View className="flex-1 items-end mr-2">
                    <Text className="text-slate-900 font-medium text-sm" numberOfLines={1}>{orderItem.product?.name}</Text>
                    <Text className="text-amber-500 text-xs">الكمية: {orderItem.quantity}</Text>
                  </View>
                </View>
              ))}
              
              {/* Show OTP if the sub-order is shipped and has a delivery OTP */}
              {sub.status === 'shipped' && sub.deliveryJob?.deliveryOtp && (
                <View className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800 flex-row justify-between items-center mt-2 flex-row-reverse">
                  <View className="items-end">
                    <Text className="text-emerald-400 text-xs font-bold mb-1">رمز تأكيد الاستلام</Text>
                    <Text className="text-slate-600 text-xs">أعطِ هذا الرمز للمندوب عند الاستلام</Text>
                  </View>
                  <Text className="text-emerald-400 font-black text-2xl tracking-widest">{sub.deliveryJob.deliveryOtp}</Text>
                </View>
              )}
            </View>
          ))}
          
          <View className="mt-2 pt-3 border-t border-slate-200 gap-2">
            <View className="flex-row-reverse justify-between items-center">
              <Text className="text-slate-500 font-medium text-sm">قيمة المنتجات</Text>
              <Text className="text-slate-700 font-bold text-sm">{itemsSubtotal} ج.م</Text>
            </View>
            {deliveryFee > 0 && (
              <View className="flex-row-reverse justify-between items-center">
                <View className="flex-row-reverse items-center gap-1">
                  <Ionicons name="bicycle-outline" size={15} color="#64748b" />
                  <Text className="text-slate-500 font-medium text-sm">رسوم التوصيل</Text>
                </View>
                <Text className="text-slate-700 font-bold text-sm">{deliveryFee} ج.م</Text>
              </View>
            )}
            <View className="flex-row-reverse justify-between items-center pt-2 mt-1 border-t border-dashed border-slate-200">
              <Text className="text-slate-900 font-black text-base">الإجمالي</Text>
              <Text className="text-amber-500 font-black text-xl">{orderTotal} ج.م</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-4 border-b border-slate-200 flex-row justify-between items-center flex-row-reverse">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/account')} className="w-10 h-10 items-center justify-center bg-slate-100 rounded-full">
          <Ionicons name="arrow-forward" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900">طلباتي</Text>
        <View className="w-10" />
      </View>
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-slate-500 mt-3 font-medium">جاري تحميل الطلبات...</Text>
        </View>
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4 border border-slate-300">
                <Ionicons name="cube-outline" size={40} color="#71717a" />
              </View>
              <Text className="text-slate-500 font-bold text-lg">لا توجد طلبات سابقة</Text>
              <TouchableOpacity 
                className="mt-6 bg-amber-500 px-6 py-3 rounded-full"
                onPress={() => router.push('/(tabs)')}
              >
                <Text className="text-black font-bold text-base">تصفح المنتجات</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
