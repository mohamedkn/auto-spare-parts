import { useDeferredValue, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { fetchProducts, type ProductQueryParams } from '../api/products';
import { fetchCategories } from '../api/categories';
import { ProductCard } from '../components/ProductCard';
import { VehicleSelector } from '../components/VehicleSelector';

type Condition = NonNullable<ProductQueryParams['condition']> | '';
type SortBy = NonNullable<ProductQueryParams['sortBy']>;

const CONDITIONS: Array<{ value: Condition; label: string }> = [
  { value: '', label: 'كل الحالات' },
  { value: 'new_original', label: 'أصلي جديد' },
  { value: 'new_aftermarket', label: 'بديل جديد' },
  { value: 'used', label: 'استيراد / مستعمل' },
  { value: 'refurbished', label: 'مجدّد' },
];

const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: 'relevance', label: 'الأكثر صلة' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'price_asc', label: 'السعر: الأقل أولًا' },
  { value: 'price_desc', label: 'السعر: الأعلى أولًا' },
  { value: 'rating_desc', label: 'الأعلى تقييمًا' },
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const deferredSearch = useDeferredValue(searchQuery.trim());
  const [showFilters, setShowFilters] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<Condition>('');
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [vehicleMakeId, setVehicleMakeId] = useState('');
  const [vehicleModelId, setVehicleModelId] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleSelectorKey, setVehicleSelectorKey] = useState(0);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const productsQuery = useQuery({
    queryKey: ['products', 'search', deferredSearch, categoryId, condition, inStock, sortBy, vehicleMakeId, vehicleModelId, vehicleYear],
    queryFn: () =>
      fetchProducts({
        search: deferredSearch || undefined,
        categoryId: categoryId || undefined,
        condition: condition || undefined,
        inStock: inStock ? 'true' : undefined,
        vehicleMakeId: vehicleMakeId || undefined,
        vehicleModelId: vehicleModelId || undefined,
        year: vehicleYear || undefined,
        sortBy: deferredSearch ? sortBy : sortBy === 'relevance' ? 'newest' : sortBy,
        limit: 30,
      }),
  });

  const products = productsQuery.data?.products || [];
  const total = productsQuery.data?.pagination.total || 0;
  const activeFilters = Number(Boolean(categoryId)) + Number(Boolean(condition)) + Number(inStock) + Number(Boolean(vehicleMakeId || vehicleModelId || vehicleYear));

  const clearFilters = () => {
    setCategoryId('');
    setCondition('');
    setInStock(false);
    setSortBy('relevance');
    setVehicleMakeId('');
    setVehicleModelId('');
    setVehicleYear('');
    setVehicleSelectorKey(key => key + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6f7]" edges={['top', 'left', 'right']}>
      <View className="bg-zinc-950 px-4 pb-4 pt-3">
        <View className="mb-4 flex-row-reverse items-center justify-between">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            className="h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900"
            accessibilityLabel="العودة"
          >
            <Ionicons name="arrow-forward" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View className="items-end">
            <Text className="text-xl font-black text-white">البحث عن قطع الغيار</Text>
            <Text className="mt-1 text-xs font-medium text-zinc-400">بالاسم أو الماركة أو رقم OEM</Text>
          </View>
          <View className="h-11 w-11" />
        </View>

        <View className="h-14 flex-row-reverse items-center rounded-xl bg-white px-3">
          <Ionicons name="search" size={21} color="#18181b" />
          <TextInput
            autoFocus
            className="mx-3 flex-1 text-right text-[15px] font-semibold text-zinc-950"
            placeholder="مثال: تيل فرامل بوش أو 90915-YZZD2"
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity className="h-9 w-9 items-center justify-center" onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#a1a1aa" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="relative h-10 w-10 items-center justify-center rounded-lg bg-zinc-100"
            onPress={() => setShowFilters(true)}
            accessibilityLabel="فتح فلاتر البحث"
          >
            <Ionicons name="options-outline" size={20} color="#18181b" />
            {activeFilters > 0 && (
              <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1">
                <Text className="text-[9px] font-black text-zinc-950">{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <VehicleSelector
        key={vehicleSelectorKey}
        onSearch={(makeId, modelId, year) => {
          setVehicleMakeId(makeId);
          setVehicleModelId(modelId);
          setVehicleYear(year);
        }}
      />

      <View className="flex-row-reverse items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <Text className="max-w-[72%] font-black text-zinc-900" numberOfLines={1}>
          {deferredSearch ? `نتائج “${deferredSearch}”` : 'كل المنتجات'}
        </Text>
        {!productsQuery.isLoading && <Text className="text-xs font-bold text-zinc-500">{total} نتيجة</Text>}
      </View>

      {productsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#d97706" />
          <Text className="mt-3 font-semibold text-zinc-500">جارٍ ترتيب أفضل النتائج...</Text>
        </View>
      ) : productsQuery.error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={42} color="#dc2626" />
          <Text className="mt-4 text-center font-black text-zinc-900">تعذر إكمال البحث</Text>
          <TouchableOpacity className="mt-4 rounded-lg bg-zinc-950 px-5 py-3" onPress={() => productsQuery.refetch()}>
            <Text className="font-bold text-white">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="search-outline" size={38} color="#71717a" />
          <Text className="mt-4 text-center text-base font-black text-zinc-900">لا توجد نتائج مطابقة</Text>
          <Text className="mt-2 text-center text-sm leading-6 text-zinc-500">
            جرّب اسمًا أقصر، مرادفًا مصريًا، أو رقم OEM بدون مسافات.
          </Text>
          {activeFilters > 0 && (
            <TouchableOpacity className="mt-3" onPress={clearFilters}>
              <Text className="font-bold text-amber-700">مسح الفلاتر</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(product) => product.id}
          numColumns={2}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item, index }) => (
            <View className="mb-4 w-[48.5%]">
              <ProductCard product={item} index={index} />
            </View>
          )}
        />
      )}

      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setShowFilters(false)} />
          <View className="max-h-[78%] rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-zinc-300" />
            <View className="mb-4 flex-row-reverse items-center justify-between">
              <Text className="text-lg font-black text-zinc-950">تصفية النتائج</Text>
              {activeFilters > 0 && (
                <TouchableOpacity onPress={clearFilters} className="min-h-10 justify-center">
                  <Text className="text-xs font-bold text-red-600">مسح الكل</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="mb-2 text-right text-sm font-black text-zinc-900">التصنيف</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setCategoryId('')}
                  className={`rounded-lg border px-3 py-2 ${!categoryId ? 'border-amber-500 bg-amber-50' : 'border-zinc-200'}`}
                >
                  <Text className="text-xs font-bold text-zinc-800">الكل</Text>
                </TouchableOpacity>
                {categoriesQuery.data?.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    className={`rounded-lg border px-3 py-2 ${categoryId === category.id ? 'border-amber-500 bg-amber-50' : 'border-zinc-200'}`}
                  >
                    <Text className="text-xs font-bold text-zinc-800">{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text className="mb-2 mt-5 text-right text-sm font-black text-zinc-900">حالة القطعة</Text>
              <View className="flex-row-reverse flex-wrap gap-2">
                {CONDITIONS.map(option => (
                  <TouchableOpacity
                    key={option.value || 'all'}
                    onPress={() => setCondition(option.value)}
                    className={`rounded-lg border px-3 py-2 ${condition === option.value ? 'border-amber-500 bg-amber-50' : 'border-zinc-200'}`}
                  >
                    <Text className="text-xs font-bold text-zinc-800">{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mt-5 flex-row-reverse items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
                <View className="items-end">
                  <Text className="text-sm font-black text-zinc-900">متوفر في المخزون فقط</Text>
                  <Text className="mt-1 text-[11px] text-zinc-500">إخفاء المنتجات غير المتاحة</Text>
                </View>
                <Switch value={inStock} onValueChange={setInStock} trackColor={{ true: '#f59e0b' }} />
              </View>

              <Text className="mb-2 mt-5 text-right text-sm font-black text-zinc-900">ترتيب النتائج</Text>
              {SORT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSortBy(option.value)}
                  className="flex-row-reverse items-center justify-between border-b border-zinc-100 py-3"
                >
                  <Text className="text-sm font-bold text-zinc-800">{option.label}</Text>
                  <Ionicons
                    name={sortBy === option.value ? 'radio-button-on' : 'radio-button-off'}
                    size={19}
                    color={sortBy === option.value ? '#d97706' : '#a1a1aa'}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity className="mt-5 h-12 items-center justify-center rounded-xl bg-zinc-950" onPress={() => setShowFilters(false)}>
              <Text className="font-black text-white">عرض النتائج</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
