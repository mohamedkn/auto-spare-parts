import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { processCheckout } from '../api/checkout';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Location from 'expo-location';

export default function CheckoutScreen() {
  const { user } = useAuthStore();
  const { items, getTotal, clearCart } = useCartStore();
  const deliveryFee = new Set(items.map((item) => item.vendorId || item.productId)).size * 30;
  const [paymentMethod, setPaymentMethod] = useState<'paymob' | 'instapay' | 'cash_on_delivery'>('cash_on_delivery');
  const [shipping, setShipping] = useState({
    fullName: user?.name || '',
    phone: (user as any)?.phone || '',
    addressLine1: '',
    city: '',
    governorate: '',
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await apiClient.get('/addresses');
      return res.data.data;
    }
  });

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];
      setShipping(prev => ({
        ...prev,
        addressLine1: prev.addressLine1 || defaultAddress.streetAddress || '',
        city: prev.city || defaultAddress.city || '',
        governorate: prev.governorate || defaultAddress.governorate || '',
      }));
    }
  }, [addresses]);

  const fetchCurrentLocation = async () => {
    try {
      setIsFetchingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه', 'يرجى السماح بصلاحيات الموقع للوصول إلى عنوانك الحالي');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      
      try {
        // Use OpenStreetMap Nominatim for free reverse geocoding (works on Web, iOS, Android without API keys)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}&accept-language=ar`,
          {
            headers: {
              'User-Agent': 'AutoPartsApp/1.0',
            }
          }
        );
        const data = await response.json();
        
        if (data && data.address) {
          setShipping((prev) => ({
            ...prev,
            city: data.address.city || data.address.town || data.address.village || prev.city,
            governorate: data.address.state || data.address.region || prev.governorate,
            addressLine1: `${data.address.road || ''} ${data.address.suburb || ''}`.trim() || data.display_name || prev.addressLine1,
          }));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (geocodeError) {
        console.error("Geocoding fallback failed:", geocodeError);
        Alert.alert('تنبيه', 'تم الحصول على الإحداثيات، لكن تعذر تحويلها إلى عنوان نصي.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'تعذر الحصول على الموقع الحالي');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const checkoutMutation = useMutation({
    mutationFn: processCheckout,
    onSuccess: async (data) => {
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (data?.paymentUrl) {
        await WebBrowser.openBrowserAsync(data.paymentUrl);
        router.replace('/');
      } else {
        if (Platform.OS === 'web') {
          window.alert('نجاح: تم تأكيد طلبك بنجاح!');
          router.replace('/');
        } else {
          Alert.alert('نجاح', 'تم تأكيد طلبك بنجاح!', [
            { text: 'حسناً', onPress: () => router.replace('/') }
          ]);
        }
      }
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error?.response?.data?.error || 'فشل إتمام الطلب';
      if (Platform.OS === 'web') {
        window.alert(`خطأ: ${msg}`);
      } else {
        Alert.alert('خطأ', msg);
      }
    }
  });

  const handleCheckout = () => {
    if (items.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('تنبيه: سلة المشتريات فارغة');
      } else {
        Alert.alert('تنبيه', 'سلة المشتريات فارغة');
      }
      return;
    }

    if (!shipping.fullName || !shipping.phone || !shipping.addressLine1 || !shipping.city) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      if (Platform.OS === 'web') {
        window.alert('تنبيه: يرجى إكمال جميع بيانات التوصيل');
      } else {
        Alert.alert('تنبيه', 'يرجى إكمال جميع بيانات التوصيل');
      }
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    checkoutMutation.mutate({
      paymentMethod,
      shippingAddress: shipping,
      items: items // pass local cart items to sync before checkout
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <View className="px-4 py-4 bg-white border-b border-zinc-100 flex-row items-center shadow-sm flex-row-reverse z-10">
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')} 
          className="ml-4 w-10 h-10 items-center justify-center bg-zinc-100 rounded-full"
        >
          <Ionicons name="arrow-forward" size={20} color="#09090b" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-zinc-900 flex-1 text-right mr-4">إتمام الطلب</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-4">

        {/* Shipping Address */}
        <View className="flex-row justify-between items-center mb-3 flex-row-reverse">
          <Text className="text-lg font-bold text-zinc-900">عنوان التوصيل</Text>
          <TouchableOpacity 
            onPress={fetchCurrentLocation}
            disabled={isFetchingLocation}
            className="flex-row items-center bg-zinc-100 px-3 py-1.5 rounded-full flex-row-reverse"
          >
            {isFetchingLocation ? (
              <ActivityIndicator size="small" color="#f59e0b" className="ml-1" />
            ) : (
              <Ionicons name="location" size={16} color="#f59e0b" className="ml-1" />
            )}
            <Text className="text-xs font-bold text-zinc-900 mr-1">
              {isFetchingLocation ? "جاري التحديد..." : "استخدام موقعي"}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-zinc-100">
          <TextInput 
            placeholder="الاسم بالكامل" 
            className="border-b border-zinc-200 py-3 mb-2 text-zinc-900 text-right font-medium" 
            value={shipping.fullName}
            onChangeText={(t) => setShipping({...shipping, fullName: t})}
            placeholderTextColor="#a1a1aa"
          />
          <TextInput 
            placeholder="رقم الهاتف" 
            className="border-b border-zinc-200 py-3 mb-2 text-zinc-900 text-right font-medium" 
            keyboardType="phone-pad"
            value={shipping.phone}
            onChangeText={(t) => setShipping({...shipping, phone: t})}
            placeholderTextColor="#a1a1aa"
          />
          <TextInput 
            placeholder="عنوان الشارع بالتفصيل" 
            className="border-b border-zinc-200 py-3 mb-2 text-zinc-900 text-right font-medium" 
            value={shipping.addressLine1}
            onChangeText={(t) => setShipping({...shipping, addressLine1: t})}
            placeholderTextColor="#a1a1aa"
          />
          <View className="flex-row flex-row-reverse">
            <TextInput 
              placeholder="المدينة" 
              className="border-b border-zinc-200 py-3 mb-2 flex-1 ml-2 text-zinc-900 text-right font-medium" 
              value={shipping.city}
              onChangeText={(t) => setShipping({...shipping, city: t})}
              placeholderTextColor="#a1a1aa"
            />
            <TextInput 
              placeholder="المحافظة" 
              className="border-b border-zinc-200 py-3 mb-2 flex-1 text-zinc-900 text-right font-medium" 
              value={shipping.governorate}
              onChangeText={(t) => setShipping({...shipping, governorate: t})}
              placeholderTextColor="#a1a1aa"
            />
          </View>
        </View>

        {/* Payment Method */}
        <Text className="text-lg font-bold text-zinc-900 mb-3 text-right">طريقة الدفع</Text>
        <View className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-zinc-100">
          <TouchableOpacity 
            className="flex-row items-center mb-4 flex-row-reverse"
            onPress={() => {
              Haptics.selectionAsync();
              setPaymentMethod('paymob');
            }}
          >
            <Ionicons name={paymentMethod === 'paymob' ? 'radio-button-on' : 'radio-button-off'} size={24} color="#f59e0b" />
            <Text className="mr-3 text-base text-zinc-900 font-bold">البطاقة البنكية (Paymob)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-row items-center mb-4 flex-row-reverse"
            onPress={() => {
              Haptics.selectionAsync();
              setPaymentMethod('instapay');
            }}
          >
            <Ionicons name={paymentMethod === 'instapay' ? 'radio-button-on' : 'radio-button-off'} size={24} color="#f59e0b" />
            <Text className="mr-3 text-base text-zinc-900 font-bold">إنستاباي (InstaPay)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-row items-center flex-row-reverse"
            onPress={() => {
              Haptics.selectionAsync();
              setPaymentMethod('cash_on_delivery');
            }}
          >
            <Ionicons name={paymentMethod === 'cash_on_delivery' ? 'radio-button-on' : 'radio-button-off'} size={24} color="#f59e0b" />
            <Text className="mr-3 text-base text-zinc-900 font-bold">الدفع عند الاستلام</Text>
          </TouchableOpacity>
        </View>

        <View className="h-24"></View>
      </ScrollView>

      {/* Floating Place Order Button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-zinc-200 pb-8 shadow-lg">
        <View className="mb-4 px-2 gap-1.5">
          <View className="flex-row justify-between flex-row-reverse">
            <Text className="text-slate-500 font-medium text-sm">قيمة المنتجات</Text>
            <Text className="text-slate-700 font-bold text-sm">{getTotal().toFixed(2)} ج.م</Text>
          </View>
          <View className="flex-row justify-between flex-row-reverse">
            <Text className="text-slate-500 font-medium text-sm">رسوم الشحن</Text>
            <Text className="text-slate-700 font-bold text-sm">+ {deliveryFee.toFixed(2)} ج.م</Text>
          </View>
          <View className="flex-row justify-between flex-row-reverse pt-2 mt-1 border-t border-zinc-200">
            <Text className="text-zinc-900 font-black text-base">المطلوب دفعه</Text>
            <Text className="text-zinc-900 font-black text-xl">{(getTotal() + deliveryFee).toFixed(2)} ج.م</Text>
          </View>
        </View>
        <TouchableOpacity 
          className="bg-primary w-full py-4 rounded-2xl items-center shadow-md flex-row justify-center"
          onPress={handleCheckout}
          disabled={checkoutMutation.isPending}
          activeOpacity={0.8}
        >
          {checkoutMutation.isPending ? (
            <ActivityIndicator color="black" />
          ) : (
            <>
              <Text className="text-black font-bold text-lg mr-2">تأكيد الطلب</Text>
              <Ionicons name="checkmark-circle" size={24} color="black" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
