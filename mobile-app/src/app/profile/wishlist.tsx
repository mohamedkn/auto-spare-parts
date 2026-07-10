import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { formatImageUrl } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

export default function WishlistScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await apiClient.get('/wishlist');
      return res.data;
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiClient.post('/wishlist', { productId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const product = item.product;
    if (!product) return null;

    return (
      <View className="bg-white rounded-2xl mb-4 border border-slate-200 overflow-hidden shadow-sm flex-row flex-row-reverse p-3 items-center">
        <Image 
          source={{ uri: formatImageUrl(product.images?.[0]?.url) || 'https://via.placeholder.com/150' }}
          style={{ width: 80, height: 80, borderRadius: 12, marginLeft: 12 }}
        />
        <View className="flex-1 items-end mr-2">
          <Text className="text-slate-900 font-bold text-base text-right mb-1" numberOfLines={2}>
            {product.name}
          </Text>
          <Text className="text-amber-500 font-black text-lg">
            {product.price} ج.م
          </Text>
          <Text className={`text-xs mt-1 ${product.stockQuantity > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {product.stockQuantity > 0 ? 'متوفر' : 'غير متوفر'}
          </Text>
        </View>
        
        <View className="ml-2 items-center justify-between h-20">
          <TouchableOpacity 
            onPress={() => toggleWishlistMutation.mutate(product.id)}
            disabled={toggleWishlistMutation.isPending}
            className="w-10 h-10 items-center justify-center bg-slate-100 rounded-full"
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [toggleWishlistMutation]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-4 border-b border-slate-200 flex-row justify-between items-center flex-row-reverse">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-slate-100 rounded-full">
          <Ionicons name="arrow-forward" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900">المفضلة</Text>
        <View className="w-10" />
      </View>
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-slate-500 mt-3 font-medium">جاري تحميل المفضلة...</Text>
        </View>
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4 border border-slate-300">
                <Ionicons name="heart-outline" size={40} color="#71717a" />
              </View>
              <Text className="text-slate-500 font-bold text-lg">لا توجد منتجات في المفضلة</Text>
              <TouchableOpacity 
                className="mt-6 bg-amber-500 px-6 py-3 rounded-full"
                onPress={() => router.push('/(tabs)')}
              >
                <Text className="text-black font-bold text-base">تصفح المنتجات</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
