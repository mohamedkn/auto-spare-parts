import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import apiClient, { formatImageUrl } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';

export default function ProductsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vendorProducts'],
    queryFn: async () => {
      const res = await apiClient.get('/vendor/products');
      return res.data;
    }
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl p-3 mb-4 flex-row-reverse shadow-sm border border-slate-200">
      <View className="flex-1 justify-center mr-3">
        <Text className="text-slate-900 font-bold text-base text-right mb-1" numberOfLines={2}>{item.name}</Text>
        <Text className="text-primary font-black text-lg text-right">{item.price} ج.م</Text>
        <View className="flex-row justify-end items-center mt-2">
          <Text className={`text-xs font-bold ${item.stockQuantity > 0 ? 'text-green-500' : 'text-red-500'}`}>
            المخزون: {item.stockQuantity}
          </Text>
        </View>
      </View>
      
      <View className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 ml-3">
        {item.images && item.images.length > 0 ? (
          <Image 
            source={{ uri: formatImageUrl(item.images[0].url) || undefined }} 
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
             <Ionicons name="image-outline" size={32} color="#52525b" />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 py-4 bg-white border-b border-slate-200 flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={() => router.push('/add-product')} 
          className="h-10 px-3 items-center justify-center bg-amber-400 rounded-xl flex-row"
        >
           <Ionicons name="add" size={20} color="#18181b" />
           <Text className="text-zinc-900 font-bold text-xs mr-1">منتج جديد</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900">منتجاتي</Text>
        <TouchableOpacity 
          onPress={() => refetch()} 
          className="w-9 h-9 items-center justify-center bg-white border border-slate-200 rounded-full"
        >
           <Ionicons name="refresh" size={18} color="#334155" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={data?.data?.products || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#208AEF" />}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 border border-slate-200">
                <Ionicons name="cube-outline" size={48} color="#71717a" />
              </View>
              <Text className="text-slate-500 font-medium text-base">لا توجد منتجات حالياً</Text>
              <Text className="text-slate-500 text-sm mt-2">اضغط على زر الإضافة لإدراج منتجك الأول</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
