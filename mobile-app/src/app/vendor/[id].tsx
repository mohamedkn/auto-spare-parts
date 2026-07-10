import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { fetchVendorById } from '../../api/vendors';
import { fetchProducts } from '../../api/products';
import { formatImageUrl } from '../../api/client';
import { ProductCard } from '../../components/ProductCard';

export default function VendorDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendorQuery = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => fetchVendorById(id),
    enabled: Boolean(id),
  });
  const productsQuery = useQuery({
    queryKey: ['products', 'vendor', id],
    queryFn: () => fetchProducts({ vendorId: id, limit: 50 }),
    enabled: Boolean(id),
  });

  if (vendorQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f6f7]">
        <ActivityIndicator size="large" color="#d97706" />
      </SafeAreaView>
    );
  }

  if (!vendorQuery.data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f6f7] px-6">
        <Ionicons name="alert-circle-outline" size={44} color="#dc2626" />
        <Text className="mt-4 text-lg font-black text-zinc-900">المتجر غير موجود</Text>
        <TouchableOpacity className="mt-5 rounded-lg bg-zinc-950 px-6 py-3" onPress={() => router.back()}>
          <Text className="font-bold text-white">العودة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const vendor = vendorQuery.data;
  const logoUrl = formatImageUrl(vendor.logoUrl) || '';
  const products = productsQuery.data?.products || [];

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f7]" edges={['top', 'left', 'right']}>
      <View className="flex-row-reverse items-center justify-between bg-zinc-950 px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900"
          accessibilityLabel="العودة"
        >
          <Ionicons name="arrow-forward" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-white">تفاصيل المتجر</Text>
        <View className="h-11 w-11" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-zinc-950 px-5 pb-7 pt-2">
          <View className="flex-row-reverse items-center">
            <View className="h-24 w-24 overflow-hidden rounded-2xl border border-zinc-700 bg-white">
              {logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                  alt={`شعار ${vendor.storeName}`}
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-amber-50">
                  <Ionicons name="storefront-outline" size={38} color="#b45309" />
                </View>
              )}
            </View>

            <View className="mr-4 flex-1 items-end">
              <View className="mb-2 flex-row-reverse items-center rounded-md bg-emerald-400/10 px-2 py-1">
                <Ionicons name="checkmark-circle" size={13} color="#6ee7b7" />
                <Text className="mr-1 text-[10px] font-bold text-emerald-300">متجر موثّق</Text>
              </View>
              <Text className="text-right text-xl font-black text-white">{vendor.storeName}</Text>
              <View className="mt-2 flex-row-reverse items-center">
                <Ionicons name="star" size={15} color="#fbbf24" />
                <Text className="mr-1 text-xs font-bold text-white">
                  {vendor.avgRating ? Number(vendor.avgRating).toFixed(1) : 'جديد'}
                </Text>
                <Text className="mr-1 text-[11px] text-zinc-400">({vendor.reviewsCount || 0} تقييم)</Text>
              </View>
            </View>
          </View>

          {vendor.description && (
            <Text className="mt-5 text-right text-sm leading-6 text-zinc-300">{vendor.description}</Text>
          )}
        </View>

        <View className="flex-row-reverse items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <View className="flex-row-reverse items-center">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <Ionicons name="cube-outline" size={19} color="#b45309" />
            </View>
            <Text className="mr-2 font-black text-zinc-900">المنتجات المتاحة</Text>
          </View>
          <Text className="text-xs font-bold text-zinc-500">{products.length} منتج</Text>
        </View>

        <View className="p-4">
          {productsQuery.isLoading ? (
            <ActivityIndicator size="large" color="#d97706" className="mt-10" />
          ) : products.length === 0 ? (
            <View className="items-center py-14">
              <Ionicons name="cube-outline" size={42} color="#a1a1aa" />
              <Text className="mt-4 text-center font-bold text-zinc-600">لا توجد منتجات متاحة حاليًا</Text>
            </View>
          ) : (
            <View className="flex-row-reverse flex-wrap justify-between">
              {products.map((product, index) => (
                <View key={product.id} className="mb-4 w-[48.5%]">
                  <ProductCard product={product} index={index} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
