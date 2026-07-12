import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';

import apiClient from '../api/client';

const DISMISSED_KEY = 'dismissedInquiryAlerts';

interface LiveInquiry {
  id: string;
  description: string;
  biddingEndsAt: string;
  category?: { name: string } | null;
  aiParsedData?: { partName?: string } | null;
  bids: Array<{ id: string }>;
}

interface LiveInquiryResponse {
  requests: LiveInquiry[];
  serverTime: string;
}

export default function InquiryAlertQueue() {
  const [now, setNow] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((value) => setDismissedIds(new Set(value ? JSON.parse(value) as string[] : [])))
      .finally(() => setIsReady(true));
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const live = useQuery<LiveInquiryResponse>({
    queryKey: ['vendorLiveRequests'],
    queryFn: async () => (await apiClient.get('/vendor/live-requests')).data.data,
    refetchInterval: 8_000,
  });

  const queue = useMemo(
    () => (live.data?.requests || []).filter(
      (request) => !dismissedIds.has(request.id) && new Date(request.biddingEndsAt).getTime() > now,
    ),
    [dismissedIds, live.data?.requests, now],
  );
  const current = isReady ? queue[0] : undefined;
  const currentId = current?.id;

  useEffect(() => {
    if (!currentId || Platform.OS === 'web') return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const secondPulse = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 450);
    return () => clearTimeout(secondPulse);
  }, [currentId]);

  const dismiss = async (id: string) => {
    const next = new Set(dismissedIds).add(id);
    const compact = Array.from(next).slice(-100);
    setDismissedIds(new Set(compact));
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(compact));
  };

  if (!current) return null;

  const seconds = Math.max(0, Math.ceil((new Date(current.biddingEndsAt).getTime() - now) / 1_000));
  const countdown = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const partName = current.aiParsedData?.partName || current.description;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => void dismiss(current.id)}>
      <View className="flex-1 items-center justify-center bg-black/80 p-4">
        <View className="w-full max-w-[520px] overflow-hidden rounded-[30px] border border-amber-400/30 bg-zinc-950 p-5 shadow-2xl">
          <View className="absolute left-0 right-0 top-0 h-1.5 bg-amber-400" />
          <View className="mt-3 flex-row-reverse items-center justify-between">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-amber-400">
              <Ionicons name="flash" size={32} color="#09090b" />
            </View>
            <View className="ml-4 flex-1 items-end">
              <Text className="text-xs font-black text-amber-400">طلب B2B مباشر من عميل</Text>
              <Text className="mt-1 text-right text-2xl font-black text-white">طلب جديد على الرادار</Text>
            </View>
          </View>

          <View className="mt-5 rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <View className="flex-row-reverse items-center justify-between">
              <Text className="text-xs font-bold text-zinc-400">{current.category?.name || 'طلب حر'}</Text>
              <View className="flex-row items-center rounded-xl bg-red-500/10 px-3 py-2">
                <Ionicons name="time-outline" size={17} color="#fca5a5" />
                <Text className="ml-1 font-black text-red-300">{countdown}</Text>
              </View>
            </View>
            <Text className="mt-3 text-right text-lg font-black leading-7 text-white" numberOfLines={2}>{partName}</Text>
            <Text className="mt-2 text-right text-sm leading-6 text-zinc-400" numberOfLines={3}>{current.description}</Text>
          </View>

          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 py-4"
              onPress={() => void dismiss(current.id)}
            >
              <Text className="font-bold text-zinc-300">لاحقًا</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-[2] flex-row items-center justify-center rounded-xl bg-amber-400 py-4"
              onPress={() => {
                void dismiss(current.id);
                router.push('/logo');
              }}
            >
              {live.isFetching ? <ActivityIndicator className="mr-2" color="#09090b" /> : <Ionicons name="radio" size={20} color="#09090b" />}
              <Text className="ml-2 text-base font-black text-zinc-950">فتح الرادار وتقديم عرض</Text>
            </TouchableOpacity>
          </View>

          <Text className="mt-4 text-center text-xs text-zinc-600">
            {queue.length > 1 ? `يوجد ${queue.length - 1} طلب آخر بانتظارك` : 'التنبيه لن يتكرر بعد فتحه أو تأجيله'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
