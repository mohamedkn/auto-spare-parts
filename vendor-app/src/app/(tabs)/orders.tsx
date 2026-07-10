import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'في انتظار القبول';
    case 'confirmed': return 'مؤكد';
    case 'preparing': return 'جاري التجهيز';
    case 'processing': return 'جاهز — بانتظار المندوب';
    case 'shipped': return 'مع المندوب (في الطريق للعميل)';
    case 'delivered': return 'تم التسليم';
    case 'cancelled': return 'ملغي / مرفوض';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return { bg: '#FEF3C7', text: '#92400E' };
    case 'confirmed': return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'preparing': return { bg: '#FED7AA', text: '#9A3412' };
    case 'processing': return { bg: '#FED7AA', text: '#9A3412' };
    case 'shipped': return { bg: '#E9D5FF', text: '#6B21A8' };
    case 'delivered': return { bg: '#D1FAE5', text: '#065F46' };
    case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B' };
    default: return { bg: '#F4F4F5', text: '#3F3F46' };
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return 'time-outline';
    case 'preparing': return 'construct-outline';
    case 'processing': return 'construct-outline';
    case 'shipped': return 'bicycle-outline';
    case 'delivered': return 'checkmark-circle';
    case 'cancelled': return 'close-circle';
    default: return 'ellipse-outline';
  }
};

export default function OrdersScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const prevOrderCount = useRef(0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vendorOrders'],
    queryFn: async () => {
      const res = await apiClient.get('/vendor/orders');
      return res.data;
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    placeholderData: keepPreviousData,
  });

  // Sound alert for new orders
  useEffect(() => {
    const orders = data?.data?.subOrders || [];
    const pendingCount = orders.filter((o: any) => o.status === 'pending').length;
    if (pendingCount > prevOrderCount.current && prevOrderCount.current > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    prevOrderCount.current = pendingCount;
  }, [data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await apiClient.patch(`/vendor/orders/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const msg = data?.data?.message || 'تم تحديث حالة الطلب';
      Alert.alert('نجاح', msg);
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', error?.response?.data?.error || 'حدث خطأ أثناء التحديث');
    }
  });

  const handleReject = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('رفض الطلب\n\nهل أنت متأكد من رفض هذا الطلب؟\nسيتم تحويل المنتج لـ "غير متوفر" والبحث عن تاجر بديل تلقائياً.')) {
        updateStatusMutation.mutate({ id, status: 'cancelled' });
      }
    } else {
      Alert.alert(
        'رفض الطلب',
        'هل أنت متأكد من رفض هذا الطلب؟\n\nسيتم تحويل المنتج لـ "غير متوفر" والبحث عن تاجر بديل تلقائياً.',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'نعم، ارفض',
            style: 'destructive',
            onPress: () => updateStatusMutation.mutate({ id, status: 'cancelled' }),
          },
        ]
      );
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const colors = getStatusColor(item.status);
    const customerName = item.order?.user?.name || 'عميل';
    const orderTime = new Date(item.order?.createdAt).toLocaleString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });

    return (
      <View className="bg-white rounded-2xl mb-4 shadow-sm border border-zinc-100 overflow-hidden">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-zinc-100">
          <View style={{ backgroundColor: colors.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>
              <Ionicons name={getStatusIcon(item.status) as any} size={12} /> {getStatusText(item.status)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-slate-500 text-xs font-medium">طلب #{item.order.orderNumber?.substring(0, 8)}</Text>
            <Text className="text-slate-500 text-xs mt-0.5">{orderTime}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View className="flex-row items-center px-4 pt-3 pb-1 flex-row-reverse">
          <View className="w-8 h-8 bg-zinc-100 rounded-full items-center justify-center mr-2">
            <Ionicons name="person" size={16} color="#71717A" />
          </View>
          <Text className="text-zinc-700 font-bold text-sm mr-2">{customerName}</Text>
          {item.order?.user?.phone && (
            <Text className="text-slate-500 text-xs">{item.order.user.phone}</Text>
          )}
        </View>

        {/* Driver Info */}
        {item.deliveryJob?.driver?.user && (
          <View className="mx-4 mt-2 mb-2 p-3 bg-amber-50 border border-amber-100 rounded-xl flex-row items-center justify-between flex-row-reverse">
            <View className="flex-row items-center flex-row-reverse flex-1">
              <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center ml-3">
                <Ionicons name="bicycle" size={20} color="#d97706" />
              </View>
              <View className="items-end">
                <Text className="text-zinc-800 font-bold text-sm mb-0.5">{item.deliveryJob.driver.user.name}</Text>
                <Text className="text-amber-700 text-xs font-medium">مندوب التوصيل</Text>
              </View>
            </View>
            {item.deliveryJob.driver.user.phone && (
              <View className="bg-white border border-amber-200 px-3 py-2 rounded-lg flex-row items-center shadow-sm">
                <Text className="text-zinc-800 font-bold text-xs mr-1" style={{fontVariant: ['tabular-nums']}}>{item.deliveryJob.driver.user.phone}</Text>
                <Ionicons name="call" size={14} color="#d97706" />
              </View>
            )}
          </View>
        )}

        {/* Products */}
        <View className="px-4 py-3">
          {item.items.map((subItem: any, index: number) => (
            <View key={index} className="flex-row justify-between items-center py-1.5">
              <Text className="text-primary font-bold text-sm">{Number(subItem.unitPrice || subItem.price)} ج.م</Text>
              <View className="flex-1 items-end mr-3">
                <Text className="text-zinc-900 font-bold text-sm" numberOfLines={1}>{subItem.product.name}</Text>
                <Text className="text-slate-500 text-xs">الكمية: {subItem.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total */}
        <View className="flex-row justify-between items-center border-t border-zinc-100 px-4 py-3">
          <Text className="text-lg font-black text-primary">{Number(item.subtotal)} ج.م</Text>
          <Text className="text-slate-500 text-xs font-medium">الإجمالي</Text>
        </View>

        {/* ═══════════════════════════════════════ */}
        {/* Action Buttons — حسب الحالة            */}
        {/* ═══════════════════════════════════════ */}

        {/* حالة: pending → أزرار قبول + رفض */}
        {item.status === 'pending' && (
          <View className="flex-row gap-3 px-4 pb-4">
            <TouchableOpacity
              className="flex-1 bg-red-50 border border-red-200 py-3 rounded-xl items-center"
              onPress={() => handleReject(item.id)}
              disabled={updateStatusMutation.isPending}
            >
              <Text className="text-red-600 font-bold">
                <Ionicons name="close-circle-outline" size={16} /> رفض
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-[2] bg-primary py-3 rounded-xl items-center flex-row justify-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                updateStatusMutation.mutate({ id: item.id, status: 'preparing' });
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-bold">
                  <Ionicons name="checkmark-circle" size={16} /> قبول الطلب
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* حالة: preparing → زر "جاهز للشحن" */}
        {item.status === 'preparing' && (
          <View className="px-4 pb-4">
            <TouchableOpacity
              className="bg-purple-600 py-3.5 rounded-xl items-center flex-row justify-center"
              onPress={() => {
                if (Platform.OS === 'web') {
                  if (window.confirm('جاهز للشحن؟\n\nسيتم إرسال الطلب للمناديب المتاحين فوراً.')) {
                    updateStatusMutation.mutate({ id: item.id, status: 'processing' });
                  }
                } else {
                  Alert.alert(
                    'جاهز للشحن؟',
                    'سيتم إرسال الطلب للمناديب المتاحين فوراً.',
                    [
                      { text: 'لا', style: 'cancel' },
                      {
                        text: 'نعم، جاهز',
                        onPress: () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                          updateStatusMutation.mutate({ id: item.id, status: 'processing' });
                        }
                      },
                    ]
                  );
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text className="text-slate-900 font-bold text-base">
                  <Ionicons name="bicycle" size={18} /> جاهز للشحن — إرسال للمندوب
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* حالة: processing — عرض OTP الاستلام */}
        {item.status === 'processing' && item.deliveryJob?.pickupOtp && (
          <View className="mx-4 mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 items-center">
            <View className="flex-row items-center mb-2">
              <Ionicons name="key" size={18} color="#EA580C" />
              <Text className="text-orange-800 font-bold mr-2"> رمز تسليم الطلب للمندوب</Text>
            </View>
            <Text className="text-4xl font-black text-orange-600 tracking-[0.3em]">{item.deliveryJob.pickupOtp}</Text>
            <Text className="text-orange-500 text-xs mt-2 text-center">أعط هذا الرمز للمندوب عند استلامه للطلب</Text>
          </View>
        )}

        {/* حالة: delivered — شارة النجاح */}
        {item.status === 'delivered' && (
          <View className="mx-4 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 items-center flex-row justify-center">
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text className="text-emerald-700 font-bold mr-2"> تم التسليم بنجاح</Text>
          </View>
        )}

        {/* حالة: cancelled — شارة الإلغاء */}
        {item.status === 'cancelled' && (
          <View className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-xl p-3 items-center flex-row justify-center">
            <Ionicons name="close-circle" size={20} color="#DC2626" />
            <Text className="text-red-700 font-bold mr-2"> تم رفض / إلغاء الطلب</Text>
          </View>
        )}
      </View>
    );
  }, [updateStatusMutation.isPending]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <View className="p-4 bg-white shadow-sm border-b border-zinc-100 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => refetch()} className="w-10 h-10 items-center justify-center bg-zinc-100 rounded-full">
           <Ionicons name="refresh" size={18} color="#09090b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-zinc-900">طلبات المتجر</Text>
        <View className="w-10" />
      </View>
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-slate-500 mt-3 font-medium">جاري تحميل الطلبات...</Text>
        </View>
      ) : (
        <FlatList
          data={data?.data?.subOrders || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <View className="w-20 h-20 bg-zinc-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="receipt-outline" size={40} color="#d4d4d8" />
              </View>
              <Text className="text-slate-500 font-bold text-lg">لا توجد طلبات حالياً</Text>
              <Text className="text-slate-600 text-sm mt-1">الطلبات الجديدة ستظهر هنا تلقائياً</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
