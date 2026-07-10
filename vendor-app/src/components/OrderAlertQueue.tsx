import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function OrderAlertQueue() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');
  const notifiedOrderIds = useRef(new Set<string>());

  // Poll for orders every 10 seconds globally
  const { data } = useQuery({
    queryKey: ['vendorOrders'],
    queryFn: async () => {
      const res = await apiClient.get('/vendor/orders');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const queue = useMemo(
    () => (data?.data?.subOrders || []).filter(
      (order: any) => order.status === 'pending' || order.status === 'confirmed'
    ),
    [data]
  );

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/vendor/orders/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (_response, variables) => {
      setActionError('');
      queryClient.setQueryData(['vendorOrders'], (cached: any) => {
        if (!cached?.data?.subOrders) return cached;
        return {
          ...cached,
          data: {
            ...cached.data,
            subOrders: cached.data.subOrders.map((order: any) =>
              order.id === variables.id ? { ...order, status: variables.status } : order
            ),
          },
        };
      });
      void queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error: any) => {
      setActionError(error?.response?.data?.error || 'تعذر تحديث الطلب. حدّث القائمة وحاول مرة أخرى.');
      void queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const playSound = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        // High impact haptics
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        
        // We'll use a local audio file or default system sound if possible.
        // For simplicity, we just use a heavy haptic if no audio file is provided.
        // If there was a require('./alert.mp3'), we would load it.
      } else {
        // Web audio beep
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
      }
    } catch (error) {
      console.log('Error playing sound', error);
    }
  }, []);

  useEffect(() => {
    const liveIds = new Set<string>(queue.map((order: any) => order.id));
    const hasUnannouncedOrder = queue.some((order: any) => !notifiedOrderIds.current.has(order.id));
    notifiedOrderIds.current = liveIds;
    if (hasUnannouncedOrder) void playSound();
  }, [playSound, queue]);

  const handleAccept = (id: string) => {
    setActionError('');
    updateStatusMutation.mutate({ id, status: 'preparing' });
  };

  const handleReject = (id: string) => {
    setActionError('');
    updateStatusMutation.mutate({ id, status: 'cancelled' });
  };

  if (queue.length === 0) return null;

  const currentOrder = queue[0];

  return (
    <Modal visible transparent animationType="fade">
      <View className="flex-1 bg-black/70 justify-center items-center p-4">
        <View className="bg-white w-full max-w-[520px] rounded-[28px] p-5 shadow-2xl overflow-hidden border border-slate-200">
          <View className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
          
          <View className="items-center mb-5 mt-2">
            <View className="w-16 h-16 bg-amber-100 rounded-2xl items-center justify-center mb-3">
              <Ionicons name="receipt-outline" size={32} color="#d97706" />
            </View>
            <Text className="text-2xl font-black text-slate-900 text-center">
              طلب جديد ينتظر موافقتك
            </Text>
            <Text className="text-slate-500 text-center mt-2 text-sm">
              راجع المنتجات ثم ابدأ التجهيز
            </Text>
          </View>

          <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
            <Text className="text-slate-700 font-bold mb-2 text-right text-base">
              المنتجات ({currentOrder.items?.length || 0})
            </Text>
            {currentOrder.items?.slice(0, 3).map((item: any, idx: number) => (
              <View key={idx} className="flex-row justify-between items-center py-2 border-b border-slate-200 dark:border-slate-300/50">
                <Text className="text-slate-800 flex-1 text-right ml-4" numberOfLines={1}>
                  {item.product?.name}
                </Text>
                <Text className="text-amber-600 font-black">
                  ×{item.quantity}
                </Text>
              </View>
            ))}
            {currentOrder.items?.length > 3 && (
              <Text className="text-center text-slate-500 mt-2">
                +{currentOrder.items.length - 3} منتجات أخرى
              </Text>
            )}
          </View>

          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex-row-reverse items-center justify-between">
            <View className="items-end flex-1">
              <Text className="text-slate-900 font-black text-base">قيمة منتجات متجرك</Text>
              <Text className="text-slate-500 text-xs mt-1">رسوم التوصيل تُضاف للعميل منفصلة</Text>
            </View>
            <Text className="text-amber-600 font-black text-xl ml-3">{Number(currentOrder.subtotal)} ج.م</Text>
          </View>

          {actionError ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex-row-reverse items-center">
              <Ionicons name="alert-circle" size={20} color="#dc2626" />
              <Text className="text-red-700 text-sm font-bold flex-1 text-right mr-2">{actionError}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-4">
            <TouchableOpacity
              className="flex-1 bg-red-100 dark:bg-red-900/30 py-4 rounded-xl items-center"
              onPress={() => handleReject(currentOrder.id)}
              disabled={updateStatusMutation.isPending}
              activeOpacity={0.8}
            >
              <Text className="text-red-700 font-bold text-base">رفض الطلب</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-[2] bg-amber-500 py-4 rounded-xl items-center shadow-lg shadow-amber-200"
              onPress={() => handleAccept(currentOrder.id)}
              disabled={updateStatusMutation.isPending}
              activeOpacity={0.85}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text className="text-slate-900 font-black text-base">قبول وبدء التجهيز</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <Text className="text-center text-xs text-slate-400 mt-4">
            {queue.length > 1 ? `يوجد ${queue.length - 1} طلبات أخرى بالانتظار` : 'لا توجد طلبات أخرى في الطابور'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
