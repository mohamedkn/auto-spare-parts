import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/client";

const conditions = [
  { value: "new_original", label: "جديد أصلي" },
  { value: "new_aftermarket", label: "جديد بديل" },
  { value: "used", label: "مستعمل" },
  { value: "refurbished", label: "مجدّد" },
];

export default function LiveRequestsScreen() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(0);
  const [forms, setForms] = useState<
    Record<string, { price: string; condition: string; notes: string }>
  >({});
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const live = useQuery({
    queryKey: ["vendorLiveRequests"],
    queryFn: async () =>
      (await apiClient.get("/vendor/live-requests")).data.data,
    refetchInterval: 8_000,
  });
  const requests = useMemo(
    () =>
      (live.data?.requests || []).filter(
        (item: any) => new Date(item.biddingEndsAt).getTime() > now,
      ),
    [live.data, now],
  );
  const save = useMutation({
    mutationFn: async ({ inquiryId, form }: any) =>
      apiClient.post("/vendor/bids", {
        inquiryId,
        price: form.price,
        condition: form.condition,
        notes: form.notes || undefined,
      }),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["vendorLiveRequests"] }),
    onError: (error: any) =>
      Alert.alert(
        "تعذر حفظ العرض",
        error.response?.data?.error || "حاول مرة أخرى",
      ),
  });
  const time = (end: string) => {
    const seconds = Math.max(
      0,
      Math.ceil((new Date(end).getTime() - now) / 1000),
    );
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };
  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-row-reverse items-center justify-between border-b border-white/10 px-4 py-4">
        <View className="items-end">
          <Text className="text-xl font-black text-white">رادار الطلبات</Text>
          <Text className="mt-1 text-xs text-zinc-400">
            5 دقائق لتقديم أو تحديث عرضك
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => live.refetch()}
          className="h-10 w-10 items-center justify-center rounded-xl bg-white/10"
        >
          <Ionicons name="refresh" size={19} color="#fbbf24" />
        </TouchableOpacity>
      </View>
      {live.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fbbf24" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item: any) => item.id}
          refreshing={live.isFetching}
          onRefresh={() => live.refetch()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }: any) => {
            const form = forms[item.id] || {
              price: item.bids[0]?.price?.toString() || "",
              condition: item.bids[0]?.condition || "new_original",
              notes: item.bids[0]?.notes || "",
            };
            return (
              <View className="mb-4 rounded-3xl border border-white/10 bg-zinc-900 p-4">
                <View className="flex-row-reverse items-start justify-between">
                  <View className="flex-1 items-end">
                    <Text className="text-xs font-bold text-amber-400">
                      {item.category?.name || "طلب حر"}
                    </Text>
                    <Text className="mt-1 text-right text-lg font-black text-white">
                      {item.aiParsedData?.partName || item.description}
                    </Text>
                  </View>
                  <View className="ml-3 flex-row items-center rounded-xl bg-red-500/10 px-3 py-2">
                    <Ionicons name="time-outline" size={16} color="#fca5a5" />
                    <Text className="ml-1 font-black text-red-300">
                      {time(item.biddingEndsAt)}
                    </Text>
                  </View>
                </View>
                <Text className="mt-3 rounded-xl bg-black/20 p-3 text-right text-sm leading-6 text-zinc-300">
                  {item.description}
                </Text>
                <TextInput
                  value={form.price}
                  onChangeText={(price) =>
                    setForms((all) => ({
                      ...all,
                      [item.id]: { ...form, price },
                    }))
                  }
                  keyboardType="decimal-pad"
                  textAlign="right"
                  placeholder="السعر بالجنيه"
                  placeholderTextColor="#71717a"
                  className="mt-3 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
                />
                <View className="mt-2 flex-row-reverse flex-wrap gap-2">
                  {conditions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        setForms((all) => ({
                          ...all,
                          [item.id]: { ...form, condition: option.value },
                        }))
                      }
                      className={`rounded-lg px-3 py-2 ${form.condition === option.value ? "bg-amber-400" : "bg-zinc-800"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${form.condition === option.value ? "text-zinc-950" : "text-zinc-300"}`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={form.notes}
                  onChangeText={(notes) =>
                    setForms((all) => ({
                      ...all,
                      [item.id]: { ...form, notes },
                    }))
                  }
                  textAlign="right"
                  placeholder="الضمان أو الماركة (اختياري)"
                  placeholderTextColor="#71717a"
                  className="mt-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
                />
                <TouchableOpacity
                  disabled={!form.price || save.isPending}
                  onPress={() => save.mutate({ inquiryId: item.id, form })}
                  className="mt-3 min-h-12 items-center justify-center rounded-xl bg-amber-400 disabled:opacity-50"
                >
                  <Text className="font-black text-zinc-950">
                    {item.bids.length ? "تحديث العرض" : "إرسال العرض"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-24">
              <Ionicons name="radio-outline" size={52} color="#52525b" />
              <Text className="mt-4 font-bold text-zinc-400">
                لا توجد طلبات حية الآن
              </Text>
              <Text className="mt-2 text-xs text-zinc-600">
                ستظهر الطلبات تلقائيًا فور اعتمادها
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
