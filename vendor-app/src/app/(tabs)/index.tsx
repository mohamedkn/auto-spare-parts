import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Image, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import apiClient, { formatImageUrl } from '../../api/client';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'جديد';
    case 'confirmed': return 'مؤكد';
    case 'preparing': return 'تجهيز';
    case 'processing': return 'جاهز للشحن';
    case 'shipped': return 'في الطريق';
    case 'delivered': return 'مكتمل';
    case 'cancelled': return 'ملغي';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return { bg: '#FEF3C7', text: '#92400E' };
    case 'confirmed': return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'preparing': return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'processing': return { bg: '#FED7AA', text: '#9A3412' };
    case 'shipped': return { bg: '#E9D5FF', text: '#6B21A8' };
    case 'delivered': return { bg: '#D1FAE5', text: '#065F46' };
    case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B' };
    default: return { bg: '#F4F4F5', text: '#3F3F46' };
  }
};

export default function VendorDashboard() {
  const user = useAuthStore(state => state.user);
  const [refreshing, setRefreshing] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['vendorDashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/vendor/dashboard');
      return res.data?.data; 
    }
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = notificationsData?.data?.notifications?.filter((n: any) => !n.read).length || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const stats = data?.metrics || { pendingBalance: 0, totalPaid: 0, totalRevenue: 0, ordersCount: 0, pendingOrdersCount: 0, aov: 0 };

  const executePayout = async () => {
    setRequestingPayout(true);
    try {
      const res = await apiClient.post('/vendor/payouts');
      if (Platform.OS === 'web') {
        window.alert(res.data.message || 'تم تقديم طلب السحب بنجاح!');
      } else {
        Alert.alert('نجاح', res.data.message || 'تم تقديم طلب السحب بنجاح!');
      }
      await refetch();
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'حدث خطأ غير متوقع أثناء طلب السحب.';
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert('فشل الطلب', errMsg);
      }
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleRequestPayout = () => {
    const pendingBalance = stats.pendingBalance;
    if (pendingBalance <= 0) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`هل ترغب في تقديم طلب سحب للرصيد المتاح البالغ ${pendingBalance.toFixed(2)} ج.م؟`);
      if (confirmed) {
        executePayout();
      }
    } else {
      Alert.alert(
        'طلب سحب الرصيد',
        `هل ترغب في تقديم طلب سحب للرصيد المتاح البالغ ${pendingBalance.toFixed(2)} ج.م؟`,
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'تأكيد السحب',
            onPress: executePayout
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-4 py-4 flex-row justify-between items-center bg-slate-50 border-b border-slate-200">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-full items-center justify-center mr-3">
             <Ionicons name="storefront" size={20} color="#f59e0b" />
          </View>
          <View className="items-start">
            <Text className="text-slate-500 text-xs font-medium">مرحباً بك،</Text>
            <Text className="font-bold text-slate-900 text-base">{user?.name || 'التاجر'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/notifications')} 
          className="w-10 h-10 bg-white border border-slate-200 items-center justify-center rounded-full relative"
        >
           <Ionicons name="notifications-outline" size={20} color="#0f172a" />
           {unreadCount > 0 && (
             <View className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full items-center justify-center border-2 border-zinc-900">
               <Text className="text-[8px] text-slate-900 font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
             </View>
           )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#208AEF" />}
      >
        {data?.vendorStatus !== 'approved' && !isLoading && (
          <View className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-4 flex-row items-start mb-6">
            <Ionicons name="warning" size={20} color="#fbbf24" style={{ marginTop: 2, marginRight: 10 }} />
            <View className="flex-1">
              <Text className="text-amber-400 font-bold text-sm mb-1 text-right">متجرك قيد المراجعة</Text>
              <Text className="text-amber-500/80 text-xs leading-5 text-right">
                لا زال طلبك قيد المراجعة ولن تظهر منتجاتك للعملاء. يمكنك الاستمرار في تحضير المتجر!
              </Text>
            </View>
          </View>
        )}

        <Text className="text-xl font-bold text-slate-900 mb-4 text-right">نظرة عامة على نشاطك</Text>
        
        {isLoading ? (
           <ActivityIndicator size="large" color="#208AEF" className="mt-10" />
        ) : (
          <>
            {/* Top Metrics Grid */}
            <View className="flex-row justify-between mb-3 gap-3">
              <View className="bg-white rounded-2xl p-4 flex-1 border border-slate-200 justify-between">
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-slate-500 text-xs font-medium">إجمالي الأرباح</Text>
                  <View className="w-7 h-7 bg-indigo-950/40 rounded-full items-center justify-center border border-indigo-800/30">
                    <Ionicons name="trending-up" size={14} color="#818cf8" />
                  </View>
                </View>
                <Text className="text-lg font-bold text-slate-900 text-right">{stats.totalRevenue.toLocaleString()} ج.م</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 flex-1 border border-slate-200 justify-between">
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-slate-500 text-xs font-medium">إجمالي الطلبات</Text>
                  <View className="w-7 h-7 bg-blue-950/40 rounded-full items-center justify-center border border-blue-800/30">
                    <Ionicons name="cart" size={14} color="#60a5fa" />
                  </View>
                </View>
                <Text className="text-lg font-bold text-slate-900 text-right">{stats.ordersCount}</Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-5 gap-3">
              <View className="bg-white rounded-2xl p-4 flex-1 border border-slate-200 justify-between">
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-slate-500 text-xs font-medium">متوسط الطلب (AOV)</Text>
                  <View className="w-7 h-7 bg-emerald-950/40 rounded-full items-center justify-center border border-emerald-800/30">
                    <Ionicons name="card" size={14} color="#34d399" />
                  </View>
                </View>
                <Text className="text-lg font-bold text-slate-900 text-right">{stats.aov} ج.م</Text>
              </View>

              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/orders')}
                className="bg-white rounded-2xl p-4 flex-1 border border-slate-200 justify-between"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-slate-500 text-xs font-medium">طلبات جديدة</Text>
                  <View className="w-7 h-7 bg-amber-950/40 rounded-full items-center justify-center border border-amber-800/30">
                    <Ionicons name="alert-circle" size={14} color="#fbbf24" />
                  </View>
                </View>
                <Text className="text-lg font-bold text-slate-900 text-right">{stats.pendingOrdersCount}</Text>
              </TouchableOpacity>
            </View>

            {/* Payout Area */}
            <View className="bg-white rounded-2xl p-4 mb-6 border border-slate-200 flex-row items-center justify-between">
              <TouchableOpacity 
                onPress={handleRequestPayout}
                disabled={stats.pendingBalance <= 0 || requestingPayout}
                className={`px-4 py-2 rounded-xl flex-row items-center justify-center border ${
                  stats.pendingBalance > 0 
                    ? 'bg-primary border-primary' 
                    : 'bg-slate-100 border-slate-300 opacity-50'
                }`}
              >
                {requestingPayout ? (
                  <ActivityIndicator size="small" color={stats.pendingBalance > 0 ? "black" : "white"} />
                ) : (
                  <Text className={`font-bold text-sm ${stats.pendingBalance > 0 ? 'text-black' : 'text-slate-500'}`}>سحب</Text>
                )}
              </TouchableOpacity>
              
              <View className="items-end">
                <Text className="text-slate-500 text-xs font-medium mb-0.5">الرصيد المتاح للسحب</Text>
                <Text className="text-base font-bold text-slate-900">{stats.pendingBalance.toFixed(2)} ج.م</Text>
              </View>
            </View>


            {/* Recent Orders List */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                  <Text className="text-primary text-xs font-bold">عرض الكل</Text>
                </TouchableOpacity>
                <Text className="text-slate-900 font-bold text-lg">أحدث الطلبات</Text>
              </View>
              
              <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {data?.recentOrders?.length === 0 ? (
                  <View className="p-6 items-center">
                    <Text className="text-slate-500 text-sm">لا توجد طلبات حديثة</Text>
                  </View>
                ) : (
                  data?.recentOrders?.map((order: any, index: number) => {
                    const colors = getStatusColor(order.status);
                    return (
                      <TouchableOpacity 
                        key={order.id}
                        onPress={() => router.push('/(tabs)/orders')}
                        className={`p-4 flex-row items-center justify-between flex-row-reverse ${index !== data.recentOrders.length - 1 ? 'border-b border-slate-200' : ''}`}
                      >
                        <View className="items-end flex-1">
                          <Text className="text-slate-900 font-bold text-sm mb-1">#{order.order.orderNumber?.substring(0,8)}</Text>
                          <Text className="text-slate-500 text-xs truncate max-w-[100px]" numberOfLines={1}>{order.order.user?.name || 'عميل'}</Text>
                        </View>
                        
                        <View style={{ backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginHorizontal: 10 }}>
                          <Text style={{ color: colors.text, fontSize: 10, fontWeight: 'bold' }}>{getStatusText(order.status)}</Text>
                        </View>

                        <Text className="text-slate-900 font-bold text-sm text-left">{Number(order.subtotal)} ج.م</Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            {/* Top Products */}
            <View className="mb-10">
              <View className="flex-row justify-between items-center mb-3">
                <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                  <Text className="text-primary text-xs font-bold">إدارة المنتجات</Text>
                </TouchableOpacity>
                <Text className="text-slate-900 font-bold text-lg">المنتجات الأكثر مبيعاً</Text>
              </View>

              <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {data?.topProducts?.length === 0 ? (
                  <View className="p-6 items-center">
                    <Text className="text-slate-500 text-sm">لا توجد مبيعات للمنتجات بعد</Text>
                  </View>
                ) : (
                  data?.topProducts?.map((product: any, index: number) => (
                    <View 
                      key={product.id}
                      className={`p-3 flex-row items-center flex-row-reverse ${index !== data.topProducts.length - 1 ? 'border-b border-slate-200' : ''}`}
                    >
                      <View className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden ml-3 items-center justify-center">
                        {product.images?.[0]?.url ? (
                          <Image source={{ uri: formatImageUrl(product.images[0].url) || undefined }} className="w-full h-full" />
                        ) : (
                          <Ionicons name="image-outline" size={20} color="#52525b" />
                        )}
                      </View>
                      <View className="flex-1 items-end mr-2">
                        <Text className="text-slate-900 font-bold text-sm text-right mb-1" numberOfLines={1}>{product.name}</Text>
                        <Text className="text-slate-500 text-xs">{Number(product.price)} ج.م</Text>
                      </View>
                      <View className="items-center bg-slate-100/50 px-3 py-1.5 rounded-lg">
                        <Text className="text-slate-900 font-bold text-sm">{product.totalSold}</Text>
                        <Text className="text-slate-500 text-[10px]">مبيعات</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
