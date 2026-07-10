import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFavoritesStore } from '../store/useFavoritesStore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCartStore } from '../store/useCartStore';
import * as Haptics from 'expo-haptics';

export default function FavoritesScreen() {
  const { favorites, removeFavorite } = useFavoritesStore();
  const addItem = useCartStore((state) => state.addItem);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Background Orbs */}
      <View className="absolute top-0 right-0 w-72 h-72 bg-indigo-900/30 rounded-full blur-3xl opacity-50" />
      <View className="absolute bottom-0 left-0 w-80 h-80 bg-amber-900/20 rounded-full blur-3xl opacity-50" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200 flex-row-reverse bg-white/90">
        <Text className="text-xl font-bold text-slate-900">المفضلة</Text>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-slate-100 rounded-full border border-slate-300">
          <Ionicons name="arrow-forward" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {favorites.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Ionicons name="heart-dislike-outline" size={80} color="#3f3f46" />
            <Text className="text-slate-500 text-lg font-medium mt-4">لا توجد منتجات في المفضلة</Text>
            <TouchableOpacity 
              className="mt-6 bg-primary px-6 py-3 rounded-full"
              onPress={() => router.back()}
            >
              <Text className="text-black font-bold text-base">تصفح المنتجات</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row flex-wrap flex-row-reverse -mx-2">
            {favorites.map((product, index) => (
              <Animated.View 
                key={product.id} 
                entering={FadeInDown.delay(index * 100)}
                className="w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 px-2 mb-4"
              >
                <View className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
                <TouchableOpacity 
                  activeOpacity={0.7}
                  className="flex-1"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/product/${product.id}`);
                  }}
                >
                  <View className="h-40 bg-slate-100/50 relative items-center justify-center p-2">
                    {/* Remove from favorites */}
                    <TouchableOpacity 
                      className="absolute top-1 right-1.5 z-10 w-8 h-8 rounded-full bg-slate-100 items-center justify-center shadow-sm border border-slate-300"
                      onPress={(e) => {
                        e.stopPropagation();
                        Haptics.selectionAsync();
                        removeFavorite(product.id);
                      }}
                    >
                      <Ionicons name="heart" size={16} color="#ef4444" />
                    </TouchableOpacity>

                    {product.image ? (
                      <Image source={{ uri: product.image }} className="w-[90%] h-[90%] object-contain opacity-90" />
                    ) : (
                      <Ionicons name="image-outline" size={50} color="#52525b" />
                    )}

                    {/* Add to Cart */}
                    <TouchableOpacity 
                      className="absolute bottom-2 right-2 w-9 h-9 bg-white rounded-full items-center justify-center shadow-md z-20"
                      onPress={(e) => {
                        e.stopPropagation();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        addItem({
                          id: Math.random().toString(),
                          productId: product.id,
                          vendorId: product.vendorId,
                          name: product.name,
                          price: Number(product.price),
                          quantity: 1,
                          image: product.image,
                        });
                      }}
                    >
                      <Ionicons name="add" size={24} color="#09090b" />
                    </TouchableOpacity>
                  </View>

                  {/* Product Details */}
                  <View className="p-3 items-end flex-1 justify-between">
                    <View className="w-full items-end">
                      <Text className="text-slate-800 font-medium text-sm text-right leading-5" numberOfLines={2} style={{ height: 42 }}>
                        {product.name}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-end justify-between w-full mt-2 flex-row-reverse">
                      <View className="items-end">
                        <Text className="text-slate-900 font-bold text-lg text-right">
                          {product.price} <Text className="text-xs font-normal text-slate-500">ج.م</Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
