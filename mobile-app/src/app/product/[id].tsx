import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchProductById } from '../../api/products';
import { useCartStore } from '../../store/useCartStore';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { formatImageUrl } from '../../api/client';

// Force RTL if needed for display
I18nManager.allowRTL(true);

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(state => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-4">
        <Text className="text-red-500 mb-4 font-bold text-lg">لم يتم العثور على المنتج.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-white px-8 py-3 rounded-full">
          <Text className="text-slate-900 font-bold">العودة للخلف</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleAddToCart = async () => {
    // Haptic Feedback for micro-interaction
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setIsAdded(true);
    addItem({
      id: Math.random().toString(), // local id
      productId: product.id,
      vendorId: product.vendor?.id,
      name: product.name,
      price: Number(product.price),
      quantity: quantity,
      image: product.images?.[0]?.url || '',
    });

    // Reset button state after a short delay (Micro-interaction)
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <View className="flex-1 bg-zinc-50">
      
      {/* Floating Header (Glassmorphism style over image) */}
      <View className="absolute top-12 left-0 right-0 z-10 flex-row items-center justify-between px-4">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-sm"
        >
          <Ionicons name="arrow-back" size={20} color="#09090b" />
        </TouchableOpacity>
        
        <View className="flex-row">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-sm mr-2"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="heart-outline" size={22} color="#09090b" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/cart')} 
            className="w-10 h-10 items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-sm"
          >
            <Ionicons name="cart-outline" size={20} color="#09090b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
        {/* Edge-to-Edge Product Image */}
        <View className="w-full h-[450px] bg-zinc-200">
          {product.images?.[0]?.url ? (
             <Image source={{ uri: formatImageUrl(product.images[0].url) || undefined }} className="w-full h-full object-cover" />
          ) : (
             <View className="flex-1 items-center justify-center bg-zinc-100">
               <Ionicons name="image-outline" size={80} color="#ccc" />
             </View>
          )}
        </View>

        {/* Details Section (Pulled up slightly over the image) */}
        <View className="bg-white px-5 pt-6 pb-4 -mt-6 rounded-t-3xl shadow-sm">
          {/* Social Proof Badge */}
          <View className="flex-row items-center mb-3 flex-row-reverse">
            <View className="bg-red-50 px-3 py-1 rounded-full border border-red-100 flex-row items-center flex-row-reverse">
              <Ionicons name="flame" size={14} color="#ef4444" />
              <Text className="text-red-500 text-xs font-bold mr-1">يباع بسرعة</Text>
            </View>
          </View>

          <Text className="text-2xl font-bold text-zinc-900 text-right leading-8 mb-2">{product.name}</Text>
          <Text className="text-primary font-bold text-sm text-right mb-4">يُباع بواسطة: {product.vendor?.storeName || 'علامة تجارية مميزة'}</Text>
          
          <View className="flex-row items-end justify-between mb-2 flex-row-reverse">
            <View className="flex-row items-end flex-row-reverse">
              <Text className="text-4xl font-bold text-zinc-900">{product.price}</Text>
              <Text className="text-lg font-bold text-slate-500 mr-1 mb-1">ج.م</Text>
            </View>
            
            <View className="flex-row items-center bg-zinc-100 px-3 py-1.5 rounded-full">
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text className="ml-1 text-zinc-900 font-bold">{product.avgRating || '4.8'}</Text>
              <Text className="ml-1 text-slate-500 text-xs">({product.reviewsCount || 124})</Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View className="bg-white p-5 mt-2 mb-32 border-t border-zinc-50">
          <View className="flex-row items-center justify-between mb-4 flex-row-reverse">
             <Text className="text-lg font-bold text-zinc-900">الوصف</Text>
          </View>
          <Text className="text-zinc-600 leading-8 text-right font-medium text-base">{product.description || 'لا يوجد وصف متاح.'}</Text>
          
          <View className="mt-8 bg-zinc-50 p-5 rounded-3xl border border-zinc-100">
            {product.oemNumber && (
              <View className="flex-row justify-between mb-4 flex-row-reverse border-b border-zinc-200 pb-4">
                <Text className="text-slate-500 font-medium text-base">رقم القطعة (OEM)</Text>
                <Text className="text-zinc-900 font-bold text-base">{product.oemNumber}</Text>
              </View>
            )}
            <View className="flex-row justify-between mb-4 flex-row-reverse border-b border-zinc-200 pb-4">
              <Text className="text-slate-500 font-medium text-base">الحالة</Text>
              <Text className="text-zinc-900 font-bold text-base bg-white px-3 py-1 rounded-full shadow-sm">{product.condition === 'new' ? 'جديد' : 'مستعمل'}</Text>
            </View>
            <View className="flex-row justify-between flex-row-reverse">
              <Text className="text-slate-500 font-medium text-base">التوفر</Text>
              <Text className={`${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'} font-bold text-base`}>
                {product.stockQuantity > 0 ? `متوفر (${product.stockQuantity})` : 'نفذت الكمية'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-zinc-200 px-4 py-4 pb-8 flex-row items-center justify-between flex-row-reverse">
        
        <TouchableOpacity 
          className={`flex-1 py-4 rounded-2xl items-center flex-row justify-center shadow-md ml-4 transition-colors duration-300 ${isAdded ? 'bg-green-500' : 'bg-primary'}`}
          onPress={handleAddToCart}
          disabled={!product || product.stockQuantity <= 0 || isAdded}
          activeOpacity={0.8}
        >
          {isAdded ? (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#0f172a" />
              <Text className="text-slate-900 font-bold text-lg mr-2">تمت الإضافة</Text>
            </>
          ) : (
            <>
              <Ionicons name="cart" size={24} color="#000000" />
              <Text className="text-black font-bold text-lg mr-2">أضف للسلة</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Quantity Selector */}
        <View className="flex-row items-center border border-zinc-200 rounded-2xl bg-zinc-50 py-1.5 px-1 shadow-sm">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center bg-white rounded-xl shadow-sm"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setQuantity(Math.min(product?.stockQuantity || 1, quantity + 1));
            }}
          >
            <Ionicons name="add" size={20} color="#09090b" />
          </TouchableOpacity>
          <Text className="font-bold text-lg w-10 text-center text-zinc-900">{quantity}</Text>
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center bg-white rounded-xl shadow-sm"
            onPress={() => {
              if (quantity > 1) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setQuantity(quantity - 1);
              }
            }}
          >
            <Ionicons name="remove" size={20} color="#09090b" />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}
