import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/client';
import { router } from 'expo-router';

export default function EditProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    try {
      setIsSaving(true);
      const res = await apiClient.put('/auth/me', { name, phone });
      if (res.data.success) {
        setUser(res.data.data.user);
        Alert.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح', [
          { text: 'موافق', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('خطأ', error?.response?.data?.message || 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom', 'left', 'right']}>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        
        <View className="items-center mb-8 mt-4">
          <View className="w-24 h-24 bg-slate-100 rounded-full items-center justify-center border-2 border-primary mb-4 relative">
            <Text className="text-slate-900 font-bold text-4xl">{name.charAt(0).toUpperCase() || 'U'}</Text>
            <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-[#09090b]">
              <Ionicons name="pencil" size={16} color="black" />
            </View>
          </View>
          <Text className="text-slate-500 text-sm">{user?.email}</Text>
        </View>

        <View className="bg-white p-5 rounded-2xl border border-slate-200">
          <View className="mb-4">
            <Text className="text-slate-500 mb-2 text-right">الاسم بالكامل</Text>
            <TextInput 
              className="bg-slate-100 text-slate-900 p-4 rounded-xl text-right font-bold text-lg"
              placeholder="الاسم"
              placeholderTextColor="#71717a"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-6">
            <Text className="text-slate-500 mb-2 text-right">رقم الهاتف</Text>
            <TextInput 
              className="bg-slate-100 text-slate-900 p-4 rounded-xl text-right font-bold text-lg"
              placeholder="01XXXXXXXXX"
              placeholderTextColor="#71717a"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <TouchableOpacity 
            className="bg-primary p-4 rounded-xl items-center shadow-sm"
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text className="text-black font-bold text-lg">حفظ التغييرات</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
