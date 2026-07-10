import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';

export default function AddressesScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    fullName: user?.name || '',
    phone: (user as any)?.phone || '',
    governorate: '',
    city: '',
    streetAddress: '',
  });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await apiClient.get('/addresses');
      return res.data.data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (addressData: any) => {
      const res = await apiClient.post('/addresses', addressData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAdding(false);
      setNewAddress({ label: '', fullName: user?.name || '', phone: (user as any)?.phone || '', governorate: '', city: '', streetAddress: '' });
      Alert.alert('نجاح', 'تمت إضافة العنوان بنجاح');
    },
    onError: (error: any) => {
      Alert.alert('خطأ', error?.response?.data?.message || 'حدث خطأ أثناء إضافة العنوان');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/addresses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      Alert.alert('نجاح', 'تم حذف العنوان');
    }
  });

  const handleAddSubmit = () => {
    if (!newAddress.label || !newAddress.fullName || !newAddress.phone || !newAddress.governorate || !newAddress.city || !newAddress.streetAddress) {
      Alert.alert('خطأ', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    addMutation.mutate(newAddress);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('حذف العنوان', 'هل أنت متأكد أنك تريد حذف هذا العنوان؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteMutation.mutate(id) }
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom', 'left', 'right']}>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {!isAdding ? (
          <>
            <TouchableOpacity 
              className="bg-primary p-4 rounded-xl flex-row justify-center items-center mb-6 shadow-sm"
              onPress={() => setIsAdding(true)}
            >
              <Text className="text-black font-bold text-lg mr-2">إضافة عنوان جديد</Text>
              <Ionicons name="add-circle-outline" size={24} color="black" />
            </TouchableOpacity>

            {addresses?.length === 0 ? (
              <View className="items-center justify-center mt-10">
                <Ionicons name="location-outline" size={64} color="#52525b" />
                <Text className="text-slate-500 mt-4 text-lg">لا توجد عناوين محفوظة</Text>
              </View>
            ) : (
              addresses?.map((address: any) => (
                <View key={address.id} className="bg-white p-5 rounded-2xl mb-4 border border-slate-200 flex-row justify-between items-start flex-row-reverse">
                  <View className="flex-1 items-end mr-4">
                    <View className="flex-row items-center flex-row-reverse mb-2">
                      <Ionicons name={address.label.includes('منزل') ? 'home' : 'briefcase'} size={20} color="#f59e0b" />
                      <Text className="text-lg font-bold text-slate-900 mr-2">{address.label}</Text>
                      {address.isDefault && (
                        <View className="bg-green-500/20 px-2 py-1 rounded-md mr-3">
                          <Text className="text-green-500 text-xs font-bold">الافتراضي</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-slate-600 font-medium">{address.fullName}</Text>
                    <Text className="text-slate-500 text-sm">{address.phone}</Text>
                    <Text className="text-slate-500 text-sm mt-1 text-right">{address.streetAddress}، {address.city}، {address.governorate}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(address.id)} className="p-2 bg-red-500/10 rounded-full">
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          <View className="bg-white p-5 rounded-2xl border border-slate-200">
            <Text className="text-xl font-bold text-slate-900 mb-4 text-right">إضافة عنوان جديد</Text>
            
            <View className="mb-4">
              <Text className="text-slate-500 mb-2 text-right">تسمية العنوان (مثال: المنزل، العمل)</Text>
              <TextInput 
                className="bg-slate-100 text-slate-900 p-4 rounded-xl text-right"
                placeholder="المنزل"
                placeholderTextColor="#71717a"
                value={newAddress.label}
                onChangeText={(t) => setNewAddress({...newAddress, label: t})}
              />
            </View>

            <View className="mb-4">
              <Text className="text-slate-500 mb-2 text-right">الاسم بالكامل</Text>
              <TextInput 
                className="bg-slate-100 text-slate-900 p-4 rounded-xl text-right"
                placeholder="الاسم الثلاثي"
                placeholderTextColor="#71717a"
                value={newAddress.fullName}
                onChangeText={(t) => setNewAddress({...newAddress, fullName: t})}
              />
            </View>

            <View className="mb-4">
              <Text className="text-slate-500 mb-2 text-right">رقم الهاتف</Text>
              <TextInput 
                className="bg-slate-100 text-slate-900 p-4 rounded-xl text-right"
                placeholder="01XXXXXXXXX"
                placeholderTextColor="#71717a"
                keyboardType="phone-pad"
                value={newAddress.phone}
                onChangeText={(t) => setNewAddress({...newAddress, phone: t})}
              />
            </View>

            <View className="flex-row flex-row-reverse mb-4 justify-between">
              <View className="w-[48%]">
                <Text className="text-slate-500 mb-2 text-right">المحافظة</Text>
                <TextInput 
                  className="bg-slate-100 text-slate-900 p-4 rounded-xl text-right"
                  placeholder="القاهرة"
                  placeholderTextColor="#71717a"
                  value={newAddress.governorate}
                  onChangeText={(t) => setNewAddress({...newAddress, governorate: t})}
                />
              </View>
              <View className="w-[48%]">
                <Text className="text-slate-500 mb-2 text-right">المدينة / المنطقة</Text>
                <TextInput 
                  className="bg-slate-100 text-slate-900 p-4 rounded-xl text-right"
                  placeholder="المعادي"
                  placeholderTextColor="#71717a"
                  value={newAddress.city}
                  onChangeText={(t) => setNewAddress({...newAddress, city: t})}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-slate-500 mb-2 text-right">العنوان التفصيلي (الشارع، رقم العمارة)</Text>
              <TextInput 
                className="bg-slate-100 text-slate-900 p-4 rounded-xl text-right"
                placeholder="شارع 9، عمارة 15..."
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: 'top' }}
                value={newAddress.streetAddress}
                onChangeText={(t) => setNewAddress({...newAddress, streetAddress: t})}
              />
            </View>

            <TouchableOpacity 
              className="bg-primary p-4 rounded-xl items-center mb-3"
              onPress={handleAddSubmit}
              disabled={addMutation.isPending}
            >
              {addMutation.isPending ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-bold text-lg">حفظ العنوان</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="p-4 rounded-xl items-center border border-slate-300"
              onPress={() => setIsAdding(false)}
            >
              <Text className="text-slate-900 font-bold text-lg">إلغاء</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
