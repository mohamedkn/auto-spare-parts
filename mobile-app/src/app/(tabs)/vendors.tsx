import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { formatImageUrl } from '../../api/client';
import { fetchVendors, type Vendor } from '../../api/vendors';

function VendorCard({ vendor }: { vendor: Vendor }) {
  const logoUrl = formatImageUrl(vendor.logoUrl) || '';
  const rating = vendor.avgRating ? Number(vendor.avgRating).toFixed(1) : null;

  return (
    <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/vendor/${vendor.id}` as never)}
        className="mb-3 flex-row-reverse items-center rounded-xl border border-zinc-200 bg-white p-3"
        accessibilityRole="button"
        accessibilityLabel={`فتح متجر ${vendor.storeName}`}
      >
        <View className="h-[76px] w-[76px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              className="h-full w-full"
              resizeMode="cover"
              alt={`شعار ${vendor.storeName}`}
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-amber-50">
              <Ionicons name="storefront-outline" size={29} color="#b45309" />
            </View>
          )}
        </View>

        <View className="mr-3 flex-1 items-end">
          <View className="w-full flex-row-reverse items-start justify-between">
            <Text className="flex-1 text-right text-base font-black text-zinc-950" numberOfLines={1}>
              {vendor.storeName}
            </Text>
            <View className="mr-2 flex-row-reverse items-center rounded-md bg-emerald-50 px-2 py-1">
              <Ionicons name="checkmark-circle" size={13} color="#047857" />
              <Text className="mr-1 text-[9px] font-bold text-emerald-700">موثّق</Text>
            </View>
          </View>

          <Text className="mt-1 w-full text-right text-xs leading-5 text-zinc-500" numberOfLines={1}>
            {vendor.description || 'متجر معتمد لبيع قطع غيار السيارات'}
          </Text>

          <View className="mt-2 w-full flex-row-reverse items-center">
            <Ionicons name="star" size={14} color="#d97706" />
            <Text className="mr-1 text-xs font-extrabold text-zinc-800">{rating || 'جديد'}</Text>
            <Text className="mr-1 text-[11px] text-zinc-400">({vendor.reviewsCount || 0} تقييم)</Text>
          </View>
        </View>

        <View className="mr-2 h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
          <Ionicons name="chevron-back" size={18} color="#52525b" />
        </View>
    </TouchableOpacity>
  );
}

export default function VendorsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const vendorsQuery = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
  });

  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('ar');
    if (!query) return vendorsQuery.data?.vendors || [];

    return (vendorsQuery.data?.vendors || []).filter((vendor) =>
      `${vendor.storeName} ${vendor.description || ''}`.toLocaleLowerCase('ar').includes(query),
    );
  }, [searchQuery, vendorsQuery.data?.vendors]);

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f7]" edges={['top', 'left', 'right']}>
      <View className="bg-zinc-950 px-5 pb-5 pt-3">
        <View className="mb-4 flex-row-reverse items-center justify-between">
          <View className="items-end">
            <Text className="text-right text-2xl font-black text-white">المتاجر المعتمدة</Text>
            <Text className="mt-1 text-right text-xs font-medium text-zinc-400">
              اشترِ من بائعين موثوقين في مكان واحد
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-amber-400">
            <Ionicons name="storefront" size={22} color="#18181b" />
          </View>
        </View>

        <View className="h-12 flex-row-reverse items-center rounded-xl bg-white px-4">
          <Ionicons name="search" size={20} color="#52525b" />
          <TextInput
            className="mx-3 flex-1 text-right text-sm font-semibold text-zinc-900"
            placeholder="ابحث باسم المتجر"
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity className="h-8 w-8 items-center justify-center" onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={19} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {vendorsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#d97706" />
          <Text className="mt-3 font-semibold text-zinc-500">جارٍ تحميل المتاجر...</Text>
        </View>
      ) : vendorsQuery.error ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <Ionicons name="cloud-offline-outline" size={28} color="#dc2626" />
          </View>
          <Text className="mt-4 text-center text-base font-black text-zinc-900">تعذر تحميل المتاجر</Text>
          <Text className="mt-1 text-center text-sm leading-6 text-zinc-500">تحقق من الاتصال ثم أعد المحاولة.</Text>
          <TouchableOpacity
            className="mt-4 rounded-lg bg-zinc-950 px-5 py-3"
            onPress={() => vendorsQuery.refetch()}
          >
            <Text className="font-bold text-white">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredVendors}
          keyExtractor={(vendor) => vendor.id}
          renderItem={({ item }) => <VendorCard vendor={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
          ListHeaderComponent={
            <View className="mb-3 flex-row-reverse items-center justify-between px-1">
              <Text className="text-base font-black text-zinc-950">كل المتاجر</Text>
              <Text className="text-xs font-bold text-zinc-500">{filteredVendors.length} متجر</Text>
            </View>
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="storefront-outline" size={42} color="#a1a1aa" />
              <Text className="mt-4 text-center font-black text-zinc-800">
                {searchQuery ? 'لا توجد متاجر مطابقة' : 'لا توجد متاجر حاليًا'}
              </Text>
              {searchQuery.length > 0 && (
                <TouchableOpacity className="mt-3" onPress={() => setSearchQuery('')}>
                  <Text className="font-bold text-amber-700">مسح البحث</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
