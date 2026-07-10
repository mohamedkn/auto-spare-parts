import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { formatImageUrl } from '../api/client';
import type { Product } from '../api/products';
import { useCartStore } from '../store/useCartStore';
import { useFavoritesStore } from '../store/useFavoritesStore';

interface ProductCardProps {
  product: Product;
  index?: number;
  badge?: string;
  compact?: boolean;
}

export function ProductCard({ product, index = 0, badge, compact = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const imageUrl = formatImageUrl(product.images?.[0]?.url) || '';
  const reviewsCount = product.reviewsCount ?? 0;

  const toggleFavorite = () => {
    void Haptics.selectionAsync();
    if (isFavorite) {
      removeFavorite(product.id);
      return;
    }

    addFavorite({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      vendorId: product.vendor?.id,
      image: imageUrl,
    });
  };

  const addToCart = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem({
      id: Math.random().toString(),
      productId: product.id,
      vendorId: product.vendor?.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image: imageUrl,
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 5) * 70).duration(350)}
      className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-white"
    >
      <TouchableOpacity
        activeOpacity={0.8}
        className="flex-1"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/product/${product.id}` as never);
        }}
        accessibilityRole="button"
        accessibilityLabel={product.name}
      >
        <View className={`${compact ? 'h-36' : 'h-40'} relative items-center justify-center bg-zinc-50 p-3`}>
          {badge && (
            <View className="absolute left-2 top-2 z-10 rounded-md bg-zinc-950 px-2 py-1">
              <Text className="text-[9px] font-bold text-white">{badge}</Text>
            </View>
          )}

          <TouchableOpacity
            className="absolute right-2 top-2 z-20 h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white"
            onPress={(event) => {
              event.stopPropagation();
              toggleFavorite();
            }}
            accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? '#e11d48' : '#52525b'}
            />
          </TouchableOpacity>

          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="h-[86%] w-[86%]"
              resizeMode="contain"
              alt={product.name}
            />
          ) : (
            <Ionicons name="image-outline" size={42} color="#a1a1aa" />
          )}

          <TouchableOpacity
            className="absolute bottom-2 right-2 z-20 h-10 w-10 items-center justify-center rounded-lg bg-amber-400"
            onPress={(event) => {
              event.stopPropagation();
              addToCart();
            }}
            accessibilityLabel="إضافة إلى السلة"
          >
            <Ionicons name="add" size={24} color="#18181b" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-end p-3">
          {product.vendor?.storeName && (
            <Text className="mb-1 text-right text-[10px] font-semibold text-zinc-500" numberOfLines={1}>
              {product.vendor.storeName}
            </Text>
          )}
          <Text
            className="w-full text-right text-[13px] font-bold leading-5 text-zinc-900"
            numberOfLines={2}
            style={{ minHeight: 40 }}
          >
            {product.name}
          </Text>

          <View className="mt-2 flex-row-reverse items-center">
            <Ionicons name="star" size={13} color="#d97706" />
            <Text className="mr-1 text-[11px] font-bold text-zinc-700">
              {Number(product.avgRating || 0).toFixed(1)}
            </Text>
            {reviewsCount > 0 && <Text className="mr-1 text-[10px] text-zinc-400">({reviewsCount})</Text>}
          </View>

          <View className="mt-auto w-full pt-3">
            <Text className="text-right text-lg font-black text-zinc-950">
              {Number(product.price).toLocaleString('ar-EG')}{' '}
              <Text className="text-[11px] font-bold text-zinc-500">ج.م</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
