import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { goBackOrHome } from '../utils/navigation';

interface Category {
  id: string;
  name: string;
  slug?: string;
  children?: Category[];
}

interface VehicleMake {
  id: string;
  name: string;
  models: { id: string; name: string; startYear: number | null; endYear: number | null }[];
}

interface Compatibility {
  vehicleModelId: string;
  make: string;
  model: string;
  specificYear: number | null;
}

const flattenLeafCategories = (items: Category[], parents: string[] = []): Category[] =>
  items.flatMap((category) => {
    const path = [...parents, category.name];
    if (category.children?.length) return flattenLeafCategories(category.children, path);
    return [{ ...category, name: path.join(' / ') }];
  });

const isAllowedImageUrl = (value: string) => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && ['images.unsplash.com', 'res.cloudinary.com'].includes(url.hostname);
  } catch {
    return false;
  }
};

const CONDITIONS = [
  { value: 'new_original', label: 'جديد (أصلي)' },
  { value: 'new_aftermarket', label: 'جديد (تجارية/بديل)' },
  { value: 'used', label: 'مستعمل / استيراد' },
  { value: 'refurbished', label: 'مجدد' },
];

export default function AddProductScreen() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleMake[]>([]);
  const [compatibilities, setCompatibilities] = useState<Compatibility[]>([]);
  const [selectedMakeId, setSelectedMakeId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [recommendedCategory, setRecommendedCategory] = useState<Category | null>(null);

  const [form, setForm] = useState({
    name: '',
    price: '',
    stockQuantity: '',
    categoryId: '',
    oemNumber: '',
    partNumber: '',
    brand: '',
    condition: 'new_original',
    placement: '',
    imageUrl: '',
  });

  useEffect(() => {
    apiClient.get('/categories').then((r: any) => {
      if (r.data?.data) {
        setCategories(flattenLeafCategories(r.data.data as Category[]));
        setCategoryError(false);
      }
    }).catch(() => setCategoryError(true)).finally(() => setCategoriesLoading(false));
    apiClient.get('/vehicles').then((r: any) => {
      if (r.data?.data) setVehicles(r.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (form.name.trim().length < 2) {
        setRecommendedCategory(null);
        return;
      }
      apiClient
        .get('/catalog/category-recommendation', { params: { q: form.name.trim() } })
        .then(response => setRecommendedCategory(response.data?.data?.recommendation || null))
        .catch(() => undefined);
    }, 250);
    return () => clearTimeout(timeout);
  }, [form.name]);

  const selectedMake = vehicles.find(v => v.id === selectedMakeId);
  const selectedCondition = CONDITIONS.find(c => c.value === form.condition);
  const selectedCategory = categories.find(c => c.id === form.categoryId);

  const addCompatibility = () => {
    if (!selectedMakeId || !selectedModelId) {
      Alert.alert('تنبيه', 'اختر الشركة والموديل أولاً');
      return;
    }
    const make = vehicles.find(v => v.id === selectedMakeId);
    const model = make?.models.find(m => m.id === selectedModelId);
    if (!make || !model) return;

    const year = selectedYear ? parseInt(selectedYear, 10) : null;
    if (year && (year < 1900 || year > new Date().getFullYear() + 1)) {
      Alert.alert('سنة غير صحيحة', 'أدخل سنة تصنيع صحيحة للسيارة');
      return;
    }
    if (year && ((model.startYear && year < model.startYear) || (model.endYear && year > model.endYear))) {
      Alert.alert('سنة غير متوافقة', `هذا الموديل متاح من ${model.startYear || 'البداية'} إلى ${model.endYear || 'الآن'}`);
      return;
    }
    if (compatibilities.some(c => c.vehicleModelId === model.id && c.specificYear === year)) {
      Alert.alert('تنبيه', 'هذه السيارة مضافة بالفعل');
      return;
    }
    setCompatibilities(prev => [...prev, {
      vehicleModelId: model.id,
      make: make.name,
      model: model.name,
      specificYear: year,
    }]);
    setSelectedMakeId('');
    setSelectedModelId('');
    setSelectedYear('');
  };

  const removeCompatibility = (index: number) => {
    setCompatibilities(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const price = parseFloat(form.price);
    const stockQuantity = parseInt(form.stockQuantity, 10);

    if (form.name.trim().length < 2) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المنتج');
      return;
    }
    if (!form.categoryId) {
      Alert.alert('خطأ', 'يجب اختيار تصنيف دقيق للمنتج');
      return;
    }
    if (isNaN(price) || price <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال سعر صحيح أكبر من صفر');
      return;
    }
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      Alert.alert('خطأ', 'يرجى إدخال كمية مخزون صحيحة');
      return;
    }
    if (!isAllowedImageUrl(form.imageUrl)) {
      Alert.alert('رابط الصورة غير صالح', 'استخدم رابط HTTPS من Cloudinary أو Unsplash');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        name: form.name.trim(),
        price,
        stockQuantity,
        categoryId: form.categoryId,
        condition: form.condition,
      };
      if (form.oemNumber.trim()) body.oemNumber = form.oemNumber.trim();
      if (form.partNumber.trim()) body.partNumber = form.partNumber.trim();
      if (form.brand.trim()) body.brand = form.brand.trim();
      if (form.placement.trim()) body.placement = form.placement.trim();
      if (form.imageUrl.trim()) {
        body.images = [{ url: form.imageUrl.trim(), position: 0 }];
      }
      if (compatibilities.length > 0) {
        body.compatibilities = compatibilities.map(c => ({
          vehicleModelId: c.vehicleModelId,
          specificYear: c.specificYear,
        }));
      }

      await apiClient.post('/vendor/products', body);
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      Alert.alert('نجاح ✓', 'تمت إضافة المنتج بنجاح', [
        { text: 'حسناً', onPress: goBackOrHome }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'حدث خطأ أثناء إضافة المنتج';
      Alert.alert('فشل', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center border-b border-slate-200">
        <TouchableOpacity
          onPress={goBackOrHome}
          className="w-9 h-9 items-center justify-center rounded-full bg-white border border-slate-200 ml-3"
        >
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-slate-900 font-bold text-lg text-right">إضافة قطعة غيار</Text>
          <Text className="text-slate-500 text-xs text-right">أضف قطعة جديدة وتفاصيلها</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">

          {/* ── المعلومات الأساسية ── */}
          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <Text className="text-slate-900 font-bold text-base mb-4 text-right border-b border-slate-200 pb-3">
              المعلومات الأساسية
            </Text>

            <View className="mb-3">
              <Text className="text-slate-500 text-xs mb-1 text-right">اسم المنتج <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={form.name}
                onChangeText={v => setForm(p => ({ ...p, name: v }))}
                placeholder="مثال: تيل فرامل أمامي"
                placeholderTextColor="#52525b"
                textAlign="right"
                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-slate-500 text-xs mb-1 text-right">السعر (ج.م) <Text className="text-red-500">*</Text></Text>
                <TextInput
                  value={form.price}
                  onChangeText={v => setForm(p => ({ ...p, price: v }))}
                  placeholder="0.00"
                  placeholderTextColor="#52525b"
                  keyboardType="decimal-pad"
                  textAlign="right"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-slate-500 text-xs mb-1 text-right">الكمية بالمخزون <Text className="text-red-500">*</Text></Text>
                <TextInput
                  value={form.stockQuantity}
                  onChangeText={v => setForm(p => ({ ...p, stockQuantity: v }))}
                  placeholder="0"
                  placeholderTextColor="#52525b"
                  keyboardType="number-pad"
                  textAlign="right"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                />
              </View>
            </View>

            {/* Category picker */}
            <View className="mb-3">
              <Text className="text-slate-500 text-xs mb-1 text-right">التصنيف الدقيق <Text className="text-red-500">*</Text></Text>
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                disabled={categoriesLoading || categoryError}
                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Ionicons name="chevron-down" size={16} color="#71717a" />
                {categoriesLoading ? <ActivityIndicator size="small" color="#f59e0b" /> : <Text className={selectedCategory ? "text-slate-900" : "text-slate-500"}>{selectedCategory?.name || 'اختر التصنيف'}</Text>}
              </TouchableOpacity>
              <Text className="mt-1 text-right text-[11px] text-slate-500">
                التصنيف إلزامي لضمان ظهور القطعة في البحث الصحيح.
              </Text>
              {recommendedCategory && recommendedCategory.id !== form.categoryId && (
                <TouchableOpacity
                  className="mt-2 flex-row-reverse items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                  onPress={() => setForm(previous => ({ ...previous, categoryId: recommendedCategory.id }))}
                >
                  <Text className="text-xs font-bold text-amber-900">التصنيف المقترح</Text>
                  <Text className="text-xs text-amber-800">{recommendedCategory.name}</Text>
                </TouchableOpacity>
              )}
              {showCategoryPicker && (
                <View className="bg-white border border-slate-300 rounded-xl mt-1 max-h-64">
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => { setForm(p => ({ ...p, categoryId: cat.id })); setShowCategoryPicker(false); }}
                      className="px-4 py-3 border-b border-slate-200"
                    >
                      <Text className={`text-right ${form.categoryId === cat.id ? 'text-primary font-bold' : 'text-slate-900'}`}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {categoryError && <Text className="mt-2 text-right text-xs font-medium text-red-500">تعذر تحميل التصنيفات. ارجع للصفحة وحاول مرة أخرى.</Text>}
            </View>
          </View>

          {/* ── تفاصيل القطعة ── */}
          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <Text className="text-slate-900 font-bold text-base mb-4 text-right border-b border-slate-200 pb-3">
              تفاصيل القطعة (أرقام وماركة)
            </Text>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-slate-500 text-xs mb-1 text-right">رقم المصنع (OEM)</Text>
                <TextInput
                  value={form.oemNumber}
                  onChangeText={v => setForm(p => ({ ...p, oemNumber: v }))}
                  placeholder="04465-02390"
                  placeholderTextColor="#52525b"
                  textAlign="right"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-slate-500 text-xs mb-1 text-right">الماركة (Brand)</Text>
                <TextInput
                  value={form.brand}
                  onChangeText={v => setForm(p => ({ ...p, brand: v }))}
                  placeholder="Bosch, Denso"
                  placeholderTextColor="#52525b"
                  textAlign="right"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                />
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-slate-500 text-xs mb-1 text-right">رقم القطعة (Part Number)</Text>
              <TextInput
                value={form.partNumber}
                onChangeText={v => setForm(p => ({ ...p, partNumber: v }))}
                placeholder="0986494"
                placeholderTextColor="#52525b"
                textAlign="right"
                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />
            </View>

            <View className="flex-row gap-3">
              {/* Condition picker */}
              <View className="flex-1">
                <Text className="text-slate-500 text-xs mb-1 text-right">حالة القطعة</Text>
                <TouchableOpacity
                  onPress={() => setShowConditionPicker(!showConditionPicker)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 flex-row justify-between items-center"
                >
                  <Ionicons name="chevron-down" size={14} color="#71717a" />
                  <Text className="text-slate-900 text-xs flex-1 text-right mr-1" numberOfLines={1}>
                    {selectedCondition?.label || 'جديد (أصلي)'}
                  </Text>
                </TouchableOpacity>
                {showConditionPicker && (
                  <View className="bg-white border border-slate-300 rounded-xl mt-1 z-10">
                    {CONDITIONS.map(cond => (
                      <TouchableOpacity
                        key={cond.value}
                        onPress={() => { setForm(p => ({ ...p, condition: cond.value })); setShowConditionPicker(false); }}
                        className="px-4 py-3 border-b border-slate-200"
                      >
                        <Text className={`text-right text-sm ${form.condition === cond.value ? 'text-primary font-bold' : 'text-slate-900'}`}>{cond.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-slate-500 text-xs mb-1 text-right">مكان التركيب</Text>
                <TextInput
                  value={form.placement}
                  onChangeText={v => setForm(p => ({ ...p, placement: v }))}
                  placeholder="أمام، خلف..."
                  placeholderTextColor="#52525b"
                  textAlign="right"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
                />
              </View>
            </View>
          </View>

          {/* ── رابط الصورة ── */}
          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <Text className="text-slate-900 font-bold text-base mb-4 text-right border-b border-slate-200 pb-3">
              🖼️ رابط صورة المنتج
            </Text>
            <TextInput
              value={form.imageUrl}
              onChangeText={v => setForm(p => ({ ...p, imageUrl: v }))}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#52525b"
              textAlign="right"
              autoCapitalize="none"
              keyboardType="url"
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
            />
          </View>

          {/* ── السيارات المتوافقة ── */}
          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <View className="flex-row items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <TouchableOpacity onPress={addCompatibility} className="bg-zinc-700 rounded-full px-3 py-1">
                <Text className="text-slate-900 text-xs font-bold">+ إضافة</Text>
              </TouchableOpacity>
              <Text className="text-slate-900 font-bold text-base">🚗 السيارات المتوافقة</Text>
            </View>

            {/* Make Picker */}
            <View className="mb-2">
              <Text className="text-slate-500 text-xs mb-1 text-right">الشركة</Text>
              <TouchableOpacity
                onPress={() => setShowMakePicker(!showMakePicker)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Ionicons name="chevron-down" size={16} color="#71717a" />
                <Text className={selectedMakeId ? "text-slate-900" : "text-slate-500"}>
                  {selectedMake?.name || 'اختر الشركة'}
                </Text>
              </TouchableOpacity>
              {showMakePicker && (
                <View className="bg-white border border-slate-300 rounded-xl mt-1 max-h-48">
                  <ScrollView nestedScrollEnabled>
                    {vehicles.map(v => (
                      <TouchableOpacity
                        key={v.id}
                        onPress={() => { setSelectedMakeId(v.id); setSelectedModelId(''); setShowMakePicker(false); }}
                        className="px-4 py-3 border-b border-slate-200"
                      >
                        <Text className={`text-right ${selectedMakeId === v.id ? 'text-primary font-bold' : 'text-slate-900'}`}>{v.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Model Picker */}
            <View className="mb-2">
              <Text className="text-slate-500 text-xs mb-1 text-right">الموديل</Text>
              <TouchableOpacity
                onPress={() => selectedMakeId && setShowModelPicker(!showModelPicker)}
                className={`bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 flex-row justify-between items-center ${!selectedMakeId ? 'opacity-40' : ''}`}
              >
                <Ionicons name="chevron-down" size={16} color="#71717a" />
                <Text className={selectedModelId ? "text-slate-900" : "text-slate-500"}>
                  {selectedMake?.models.find(m => m.id === selectedModelId)?.name || 'اختر الموديل'}
                </Text>
              </TouchableOpacity>
              {showModelPicker && selectedMake && (
                <View className="bg-white border border-slate-300 rounded-xl mt-1 max-h-48">
                  <ScrollView nestedScrollEnabled>
                    {selectedMake.models.map(m => (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => { setSelectedModelId(m.id); setShowModelPicker(false); }}
                        className="px-4 py-3 border-b border-slate-200"
                      >
                        <Text className={`text-right ${selectedModelId === m.id ? 'text-primary font-bold' : 'text-slate-900'}`}>{m.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Year input */}
            <View className="mb-3">
              <Text className="text-slate-500 text-xs mb-1 text-right">سنة الصنع (اختياري)</Text>
              <TextInput
                value={selectedYear}
                onChangeText={setSelectedYear}
                placeholder="مثال: 2019"
                placeholderTextColor="#52525b"
                keyboardType="number-pad"
                textAlign="right"
                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              />
            </View>

            {/* Compatibility list */}
            {compatibilities.length === 0 ? (
              <Text className="text-zinc-600 text-sm text-center py-4 italic">لم يتم إضافة سيارات بعد</Text>
            ) : (
              <View className="gap-2">
                {compatibilities.map((comp, i) => (
                  <View key={i} className="flex-row items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                    <TouchableOpacity onPress={() => removeCompatibility(i)}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                    <View className="items-end">
                      <Text className="text-slate-900 font-bold text-sm">{comp.make} - {comp.model}</Text>
                      <Text className="text-slate-500 text-xs">
                        {comp.specificYear ? `سنة: ${comp.specificYear}` : 'كل الموديلات'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || form.name.trim().length < 2 || !form.price || !form.stockQuantity || !form.categoryId || categoriesLoading || categoryError}
            className={`py-4 rounded-2xl items-center mb-8 flex-row justify-center ${
              loading || form.name.trim().length < 2 || !form.price || !form.stockQuantity || !form.categoryId || categoriesLoading || categoryError
                ? 'bg-slate-100 opacity-50'
                : 'bg-primary'
            }`}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text className="text-slate-900 font-bold text-base mr-2">إضافة المنتج</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
