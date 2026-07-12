import { useState } from "react";
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
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

const statusLabel: Record<string, string> = {
  under_review: "قيد المراجعة",
  open: "يستقبل عروضًا",
  bidding_closed: "انتهى التسعير",
  accepted: "تم اختيار عرض",
  cancelled: "ملغي",
  expired: "منتهي",
};
const conditionLabel: Record<string, string> = {
  new_original: "جديد أصلي",
  new_aftermarket: "جديد بديل",
  used: "مستعمل",
  refurbished: "مجدّد",
};
const vehicleMarkets = [
  ["german", "ألماني"], ["korean", "كوري"], ["japanese", "ياباني"],
  ["american", "أمريكي"], ["chinese", "صيني"], ["european", "أوروبي آخر"], ["other", "أخرى"],
] as const;

export default function InquiriesScreen() {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [vin, setVin] = useState("");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const inquiries = useQuery({
    queryKey: ["inquiries"],
    queryFn: async () =>
      (await apiClient.get("/inquiries")).data.data.inquiries,
    refetchInterval: 10_000,
  });
  const create = useMutation({
    mutationFn: async () =>
      apiClient.post("/inquiries", {
        description: description.trim(),
        vin: vin.trim() || undefined,
        vehicleMarkets: selectedMarkets,
      }),
    onSuccess: async () => {
      setDescription("");
      setVin("");
      setSelectedMarkets([]);
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      Alert.alert(
        "تم إرسال الطلب",
        "بعد مراجعة الطلب سيصل للتجار لمدة 5 دقائق.",
      );
    },
    onError: (error: any) =>
      Alert.alert(
        "تعذر إرسال الطلب",
        error.response?.data?.error || "حاول مرة أخرى",
      ),
  });
  const accept = useMutation({
    mutationFn: async (bidId: string) =>
      apiClient.post("/inquiries/accept-bid", { bidId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
      ]);
      Alert.alert(
        "تم اختيار العرض",
        "أضيفت القطعة إلى السلة بسعر العرض الثابت.",
      );
    },
    onError: (error: any) =>
      Alert.alert(
        "تعذر اختيار العرض",
        error.response?.data?.error || "حاول مرة أخرى",
      ),
  });

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5f7]">
      <View className="flex-row-reverse items-center border-b border-zinc-800 bg-zinc-950 px-5 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
          accessibilityLabel="العودة"
        >
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
        <View className="mr-3 flex-1 items-end">
          <Text className="text-xl font-black text-white">اطلب تسعير قطعة</Text>
          <Text className="mt-0.5 text-xs text-zinc-400">من الوصف إلى أفضل عرض في خطوات بسيطة</Text>
        </View>
      </View>
      <FlatList
        data={inquiries.data || []}
        keyExtractor={(item) => item.id}
        refreshing={inquiries.isFetching}
        onRefresh={() => inquiries.refetch()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View className="mb-4 overflow-hidden rounded-3xl bg-zinc-950 p-5">
              <View className="absolute -left-10 -top-12 h-36 w-36 rounded-full bg-amber-400/10" />
              <View className="flex-row-reverse items-start">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-400">
                  <Ionicons name="sparkles-outline" size={24} color="#18181b" />
                </View>
                <View className="mr-3 flex-1 items-end">
                  <Text className="text-right text-xl font-black text-white">مش عارف اسم القطعة؟</Text>
                  <Text className="mt-1 text-right text-xs leading-5 text-zinc-400">اوصف المشكلة بطريقتك، ونراجعها قبل إرسالها للتجار المتخصصين.</Text>
                </View>
              </View>
              <View className="mt-5 flex-row-reverse items-start">
                {[['create-outline', 'اكتب الطلب'], ['shield-checkmark-outline', 'نراجعه'], ['pricetags-outline', 'استقبل عروضًا']].map(([icon, label]) => (
                  <View key={label} className="flex-1 items-center px-1">
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-white/10">
                      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color="#fbbf24" />
                    </View>
                    <Text className="mt-1.5 text-center text-[10px] font-bold text-zinc-300">{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <View className="mb-3 flex-row-reverse items-center">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-zinc-950"><Text className="text-xs font-black text-amber-400">1</Text></View>
                <View className="mr-2 flex-1 items-end"><Text className="text-sm font-black text-zinc-950">اوصف القطعة أو المشكلة</Text><Text className="mt-0.5 text-[11px] text-zinc-500">اذكر الماركة والموديل والسنة ومكان القطعة</Text></View>
              </View>
              <View className="rounded-2xl border border-zinc-200 bg-zinc-50 p-1 focus:border-amber-400">
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={2000}
                  textAlign="right"
                  style={{ writingDirection: "rtl", textAlignVertical: "top" }}
                  placeholder="مثال: محتاج مقص أمامي يمين لإلنترا 2017 ويفضل أصلي..."
                  placeholderTextColor="#a1a1aa"
                  className="min-h-32 p-3 text-sm leading-6 text-zinc-900"
                />
                <Text className="px-3 pb-2 text-left text-[10px] text-zinc-400">{description.length}/2000</Text>
              </View>

              <View className="mb-3 mt-5 flex-row-reverse items-center">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-zinc-950"><Text className="text-xs font-black text-amber-400">2</Text></View>
                <View className="mr-2 flex-1 items-end"><Text className="text-sm font-black text-zinc-950">بيانات السيارة</Text><Text className="mt-0.5 text-[11px] text-zinc-500">تساعد التجار على إرسال عرض متوافق</Text></View>
              </View>
              <View className="flex-row-reverse items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4">
                <Ionicons name="barcode-outline" size={20} color="#71717a" />
                <TextInput value={vin} onChangeText={setVin} textAlign="right" style={{ writingDirection: "rtl" }} autoCapitalize="characters" placeholder="رقم الشاسيه VIN (اختياري)" placeholderTextColor="#a1a1aa" className="min-h-13 mr-2 flex-1 text-sm text-zinc-900" />
              </View>

              <Text className="mb-2 mt-4 text-right text-xs font-bold text-zinc-700">نوع السيارة <Text className="font-medium text-zinc-400">— يمكن اختيار أكثر من فرع</Text></Text>
              <View className="flex-row-reverse flex-wrap gap-2">
                {vehicleMarkets.map(([value, label]) => {
                  const selected = selectedMarkets.includes(value);
                  return <TouchableOpacity key={value} onPress={() => setSelectedMarkets((current) => selected ? current.filter((item) => item !== value) : [...current, value])} className={`flex-row-reverse items-center rounded-xl border px-3 py-2.5 ${selected ? "border-amber-400 bg-amber-50" : "border-zinc-200 bg-white"}`}>
                    {selected && <Ionicons name="checkmark-circle" size={15} color="#b45309" />}
                    <Text className={`${selected ? "mr-1 text-amber-800" : "text-zinc-600"} text-xs font-bold`}>{label}</Text>
                  </TouchableOpacity>;
                })}
              </View>

              <View className="mt-5 flex-row-reverse items-start rounded-2xl bg-amber-50 p-3">
                <Ionicons name="time-outline" size={18} color="#b45309" />
                <Text className="mr-2 flex-1 text-right text-[11px] leading-5 text-amber-900">بعد المراجعة، يحصل التجار المطابقون على 5 دقائق كاملة لتقديم عروضهم.</Text>
              </View>
              <TouchableOpacity disabled={create.isPending || description.trim().length < 10} onPress={() => create.mutate()} className="mt-4 min-h-14 flex-row-reverse items-center justify-center gap-2 rounded-2xl bg-zinc-950 disabled:opacity-40">
                {create.isPending ? <ActivityIndicator color="#fbbf24" /> : <><Ionicons name="sparkles-outline" size={20} color="#fbbf24" /><Text className="font-black text-white">تحليل الطلب وإرساله للمراجعة</Text></>}
              </TouchableOpacity>
              {description.trim().length > 0 && description.trim().length < 10 && <Text className="mt-2 text-center text-[11px] font-medium text-red-500">اكتب وصفًا أوضح من 10 أحرف على الأقل</Text>}
            </View>

            <View className="mb-3 flex-row-reverse items-end justify-between px-1">
              <View className="items-end"><Text className="text-lg font-black text-zinc-950">طلباتك السابقة</Text><Text className="mt-0.5 text-xs text-zinc-500">تابع المراجعة والعروض من هنا</Text></View>
              <View className="h-9 min-w-9 items-center justify-center rounded-xl bg-zinc-200 px-2"><Text className="text-xs font-black text-zinc-700">{inquiries.data?.length || 0}</Text></View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mb-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <View className="border-b border-slate-100 p-4">
              <View className="flex-row-reverse items-center justify-between">
                <Text
                  className="flex-1 text-right font-black text-zinc-950"
                  numberOfLines={2}
                >
                  {item.aiParsedData?.partName || item.description}
                </Text>
                <Text className="mr-3 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-700">
                  {statusLabel[item.status] || item.status}
                </Text>
              </View>
              <Text
                className="mt-2 text-right text-xs leading-5 text-zinc-500"
                numberOfLines={3}
              >
                {item.description}
              </Text>
            </View>
            <View className="p-4">
              <Text className="mb-2 text-right text-xs font-black text-zinc-700">
                العروض ({item.bids.length})
              </Text>
              {item.bids.map((bid: any) => (
                <View key={bid.id} className="mb-2 rounded-2xl bg-slate-50 p-3">
                  <View className="flex-row-reverse items-center justify-between">
                    <View className="items-end">
                      <Text className="font-bold text-zinc-900">
                        {bid.vendor.storeName}
                      </Text>
                      <Text className="mt-1 text-[10px] text-zinc-500">
                        {conditionLabel[bid.condition]}
                      </Text>
                    </View>
                    <Text className="text-lg font-black text-zinc-950">
                      {Number(bid.price).toFixed(2)} ج.م
                    </Text>
                  </View>
                  {item.status === "bidding_closed" && (
                    <TouchableOpacity
                      disabled={accept.isPending}
                      onPress={() => accept.mutate(bid.id)}
                      className="mt-3 rounded-xl bg-zinc-950 py-3"
                    >
                      <Text className="text-center text-xs font-black text-white">
                        اختيار وإضافة للسلة
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {item.bids.length === 0 && (
                <View className="flex-row-reverse items-center justify-center rounded-xl bg-zinc-50 py-3"><Ionicons name="hourglass-outline" size={16} color="#a1a1aa" /><Text className="mr-2 text-center text-xs text-zinc-500">بانتظار وصول عروض التجار</Text></View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          inquiries.isLoading ? (
            <ActivityIndicator className="mt-10" color="#d97706" />
          ) : (
            <View className="mt-2 items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-10">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100"><Ionicons name="document-text-outline" size={27} color="#71717a" /></View>
              <Text className="mt-4 text-center font-black text-zinc-800">لا توجد طلبات سابقة</Text>
              <Text className="mt-1 text-center text-xs leading-5 text-zinc-500">أرسل طلبك الأول من النموذج، وستظهر حالته والعروض هنا.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
