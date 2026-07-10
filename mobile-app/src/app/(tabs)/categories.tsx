import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../../api/categories';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { formatImageUrl } from '../../api/client';

export default function CategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const categoryColors = [
    'bg-red-900/20', 'bg-blue-900/20', 'bg-green-900/20', 'bg-orange-900/20', 
    'bg-purple-900/20', 'bg-yellow-900/20', 'bg-cyan-900/20', 'bg-white/50'
  ];

  // Filter categories locally based on search
  const filteredCategories = categories?.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header Search */}
      <View className="px-4 py-3 border-b border-slate-200">
        <View className="bg-white/90 rounded-xl flex-row items-center px-4 py-2 flex-row-reverse border border-slate-200">
          <Ionicons name="search" size={20} color="#a1a1aa" />
          <TextInput 
            placeholder="ابحث في الأقسام..." 
            className="flex-1 mr-2 text-base text-slate-900 text-right"
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4">
          <Text className="text-xl font-bold text-slate-900 mb-4 text-right">تصفح الأقسام</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#f59e0b" className="mt-10" />
          ) : error ? (
            <Text className="text-red-500 text-center mt-10 font-bold">فشل في تحميل الأقسام</Text>
          ) : (
            <View className="flex-row flex-wrap justify-between flex-row-reverse">
              {filteredCategories?.map((cat, i) => (
                <TouchableOpacity 
                  key={cat.id} 
                  activeOpacity={0.7}
                  className={`w-[31%] h-36 ${categoryColors[i % categoryColors.length]} rounded-2xl mb-4 items-center justify-center p-2 border border-slate-200 shadow-sm`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push({ pathname: '/(tabs)', params: { categoryId: cat.id } });
                  }}
                >
                  <View className="w-20 h-20 bg-slate-100/80 rounded-2xl mb-3 items-center justify-center overflow-hidden border border-slate-300">
                    {cat.imageUrl ? (
                      <Image source={{ uri: formatImageUrl(cat.imageUrl) || undefined }} className="w-full h-full object-cover" />
                    ) : (
                      <Ionicons name="apps-outline" size={32} color="#52525b" />
                    )}
                  </View>
                  <Text className="text-center text-xs font-bold text-slate-600">{cat.name}</Text>
                </TouchableOpacity>
              ))}
              
              {filteredCategories?.length === 0 && (
                <View className="w-full items-center mt-10">
                  <Ionicons name="search-outline" size={60} color="#52525b" />
                  <Text className="text-slate-500 mt-4 font-medium text-lg">لا توجد أقسام مطابقة للبحث</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View className="h-10"></View>
      </ScrollView>
    </SafeAreaView>
  );
}
