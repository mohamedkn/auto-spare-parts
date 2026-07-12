import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { fetchBestSellers, fetchProducts } from '../../api/products';
import { fetchCategories } from '../../api/categories';
import { formatImageUrl } from '../../api/client';
import { ProductCard } from '../../components/ProductCard';
import { VehicleSelector } from '../../components/VehicleSelector';
import { useFavoritesStore } from '../../store/useFavoritesStore';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=86';

function SectionHeader({
  title,
  actionLabel = 'عرض الكل',
  onPress,
}: {
  title: string;
  actionLabel?: string;
  onPress: () => void;
}) {
  return (
    <View className="mb-4 flex-row-reverse items-center justify-between">
      <Text className="text-right text-[20px] font-black text-zinc-950">{title}</Text>
      <TouchableOpacity
        className="min-h-10 flex-row-reverse items-center gap-1 px-1"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text className="text-sm font-bold text-amber-700">{actionLabel}</Text>
        <Ionicons name="chevron-back" size={16} color="#b45309" />
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const selectedCategory = params.categoryId || null;
  const [vehicleMakeId, setVehicleMakeId] = useState('');
  const [vehicleModelId, setVehicleModelId] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleMarkets, setVehicleMarkets] = useState<string[]>([]);
  const [locationName, setLocationName] = useState('القاهرة، مصر');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const favoritesCount = useFavoritesStore((state) => state.favorites.length);

  const productsQuery = useQuery({
    queryKey: [
      'products',
      selectedCategory,
      vehicleMakeId,
      vehicleModelId,
      vehicleYear,
      vehicleMarkets.join(','),
    ],
    queryFn: () =>
      fetchProducts({
        limit: 10,
        categoryId: selectedCategory || undefined,
        vehicleMakeId: vehicleMakeId || undefined,
        vehicleModelId: vehicleModelId || undefined,
        year: vehicleYear || undefined,
        vehicleMarkets: vehicleMarkets.length ? vehicleMarkets.join(',') : undefined,
      }),
  });

  const bestSellersQuery = useQuery({
    queryKey: ['bestSellers'],
    queryFn: () => fetchBestSellers(10),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const fetchUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('الموقع غير متاح', 'فعّل إذن الموقع لتحديد عنوان التوصيل تلقائيًا.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const places = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      const place = places[0];
      const city = place?.city || place?.region || place?.subregion;

      if (city) {
        setLocationName(place.country ? `${city}، ${place.country}` : city);
      } else {
        Alert.alert('الموقع غير متاح', 'تعذر تحديد اسم المنطقة بدقة.');
      }
    } catch (error) {
      console.log('Error fetching location:', error);
      Alert.alert('تعذر تحديد الموقع', 'حاول مرة أخرى بعد التأكد من تفعيل خدمة الموقع.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const selectCategory = (categoryId: string | null) => {
    void Haptics.selectionAsync();
    router.setParams({ categoryId: categoryId || '' });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f7]" edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-zinc-950 px-5 pb-6 pt-3">
          <Animated.View entering={FadeInDown.duration(350)}>
            <View className="mb-5 flex-row-reverse items-center justify-between">
              <TouchableOpacity
                className="max-w-[72%] flex-row-reverse items-center"
                onPress={fetchUserLocation}
                disabled={isLoadingLocation}
                accessibilityRole="button"
                accessibilityLabel="تحديد موقع التوصيل"
              >
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-amber-400">
                  {isLoadingLocation ? (
                    <ActivityIndicator size="small" color="#18181b" />
                  ) : (
                    <Ionicons name="location" size={21} color="#18181b" />
                  )}
                </View>
                <View className="mr-3 flex-1 items-end">
                  <Text className="mb-0.5 text-right text-[11px] font-semibold text-zinc-400">
                    التوصيل إلى
                  </Text>
                  <View className="flex-row-reverse items-center">
                    <Text className="text-right text-sm font-extrabold text-white" numberOfLines={1}>
                      {locationName}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#a1a1aa" />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="relative h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900"
                onPress={() => router.push('/favorites')}
                accessibilityRole="button"
                accessibilityLabel="المفضلة"
              >
                <Ionicons name="heart-outline" size={22} color="#ffffff" />
                {favoritesCount > 0 && (
                  <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1">
                    <Text className="text-[10px] font-black text-zinc-950">{favoritesCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View className="mb-4 flex-row-reverse items-end justify-between">
              <View className="items-end">
                <Text className="text-right text-[28px] font-black text-white">AutoParts</Text>
                <Text className="mt-1 text-right text-xs font-medium text-zinc-400">
                  القطعة المناسبة لسيارتك، من بائع موثوق
                </Text>
              </View>
              <View className="mb-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1">
                <Text className="text-[10px] font-bold text-emerald-300">قطع موثقة</Text>
              </View>
            </View>

            <TouchableOpacity
              className="h-14 flex-row-reverse items-center rounded-xl bg-white px-4"
              onPress={() => router.push('/search' as never)}
              accessibilityRole="button"
              accessibilityLabel="فتح البحث عن المنتجات"
            >
              <Ionicons name="search" size={22} color="#18181b" />
              <Text className="mx-3 flex-1 text-right text-[15px] font-semibold text-zinc-500">
                ابحث باسم القطعة أو رقم OEM
              </Text>
              <Ionicons name="arrow-back" size={18} color="#a1a1aa" />
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-3 min-h-14 flex-row-reverse items-center rounded-xl border border-amber-400/30 bg-amber-400/10 px-4"
              onPress={() => router.push('/inquiries' as never)}
              accessibilityRole="button"
              accessibilityLabel="طلب تسعير قطعة غير موجودة"
            >
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-amber-400">
                <Ionicons name="radio-outline" size={20} color="#18181b" />
              </View>
              <View className="mr-3 flex-1 items-end">
                <Text className="text-sm font-black text-white">مش لاقي القطعة؟ اطلب تسعيرها</Text>
                <Text className="mt-0.5 text-[11px] text-zinc-400">اكتب وصفك واستقبل عروض التجار</Text>
              </View>
              <Ionicons name="chevron-back" size={18} color="#fbbf24" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <VehicleSelector
          onSearch={(makeId, modelId, year, markets) => {
            setVehicleMakeId(makeId);
            setVehicleModelId(modelId);
            setVehicleYear(year);
            setVehicleMarkets(markets);
          }}
        />

        <Animated.View entering={FadeInDown.delay(120).duration(400)} className="mb-8 px-4">
          <View className="h-48 overflow-hidden rounded-2xl bg-zinc-900">
            <Image
              source={{ uri: HERO_IMAGE }}
              className="absolute inset-0 h-full w-full"
              resizeMode="cover"
              alt="فني يفحص محرك سيارة"
            />
            <View className="absolute inset-0 bg-black/55" />
            <View className="h-full items-end justify-between p-5">
              <View className="items-end">
                <View className="mb-3 rounded-md bg-amber-400 px-2.5 py-1">
                  <Text className="text-[10px] font-black text-zinc-950">عرض الأسبوع</Text>
                </View>
                <Text className="text-right text-2xl font-black text-white">خصم حتى 30%</Text>
                <Text className="mt-1 text-right text-sm font-medium text-zinc-200">
                  على الزيوت والفلاتر المختارة
                </Text>
              </View>
              <TouchableOpacity
                className="min-h-11 flex-row-reverse items-center rounded-xl bg-white px-5"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/search' as never);
                }}
              >
                <Text className="font-extrabold text-zinc-950">تسوق العرض</Text>
                <Ionicons name="arrow-back" size={17} color="#18181b" style={{ marginRight: 8 }} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <View className="mb-8">
          <View className="px-4">
            <SectionHeader
              title="تسوق حسب القسم"
              actionLabel="كل الأقسام"
              onPress={() => router.push('/categories' as never)}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            <TouchableOpacity className="w-[76px] items-center" onPress={() => selectCategory(null)}>
              <View
                className={`mb-2 h-[70px] w-[70px] items-center justify-center rounded-xl ${
                  selectedCategory === null
                    ? 'border-2 border-amber-500 bg-amber-50'
                    : 'border border-zinc-200 bg-white'
                }`}
              >
                <Ionicons name="grid-outline" size={25} color="#18181b" />
              </View>
              <Text className="text-center text-xs font-bold text-zinc-800">الكل</Text>
            </TouchableOpacity>

            {categoriesQuery.isLoading ? (
              <View className="h-[70px] w-20 items-center justify-center">
                <ActivityIndicator size="small" color="#d97706" />
              </View>
            ) : (
              categoriesQuery.data?.map((category, index) => (
                <Animated.View key={category.id} entering={FadeInRight.delay(index * 45)}>
                  <TouchableOpacity
                    className="w-[76px] items-center"
                    onPress={() => selectCategory(selectedCategory === category.id ? null : category.id)}
                  >
                    <View
                      className={`mb-2 h-[70px] w-[70px] overflow-hidden rounded-xl ${
                        selectedCategory === category.id
                          ? 'border-2 border-amber-500 bg-amber-50'
                          : 'border border-zinc-200 bg-white'
                      }`}
                    >
                      {category.imageUrl ? (
                        <Image
                          source={{ uri: formatImageUrl(category.imageUrl) || undefined }}
                          className="h-full w-full"
                          resizeMode="cover"
                          alt={category.name}
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center">
                          <Ionicons name="construct-outline" size={25} color="#52525b" />
                        </View>
                      )}
                    </View>
                    <Text className="text-center text-[11px] font-semibold text-zinc-700" numberOfLines={2}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </View>

        <View className="mb-8">
          <View className="px-4">
            <SectionHeader title="الأكثر طلبًا" onPress={() => router.push('/search' as never)} />
          </View>
          {bestSellersQuery.isLoading ? (
            <ActivityIndicator size="large" color="#d97706" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {bestSellersQuery.data?.products.map((product, index) => (
                <View key={product.id} className="w-[184px]">
                  <ProductCard product={product} index={index} badge="الأكثر طلبًا" compact />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View className="px-4">
          <SectionHeader title="وصل حديثًا" onPress={() => router.push('/search' as never)} />
          {productsQuery.isLoading ? (
            <ActivityIndicator size="large" color="#d97706" />
          ) : productsQuery.error ? (
            <View className="items-center rounded-xl border border-red-100 bg-red-50 px-5 py-8">
              <Ionicons name="cloud-offline-outline" size={28} color="#dc2626" />
              <Text className="mt-2 text-center font-bold text-red-700">تعذر تحميل المنتجات</Text>
              <TouchableOpacity className="mt-3 px-4 py-2" onPress={() => productsQuery.refetch()}>
                <Text className="font-bold text-zinc-900">إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          ) : productsQuery.data?.products.length ? (
            <View className="flex-row-reverse flex-wrap justify-between">
              {productsQuery.data.products.map((product, index) => (
                <View key={product.id} className="mb-4 w-[48.5%]">
                  <ProductCard product={product} index={index} />
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center py-10">
              <Ionicons name="search-outline" size={32} color="#a1a1aa" />
              <Text className="mt-3 text-center font-bold text-zinc-600">لا توجد نتائج مطابقة</Text>
              <TouchableOpacity
                className="mt-3"
                onPress={() => {
                  selectCategory(null);
                  setVehicleMakeId('');
                  setVehicleModelId('');
                  setVehicleYear('');
                  setVehicleMarkets([]);
                }}
              >
                <Text className="font-bold text-amber-700">مسح عوامل التصفية</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
