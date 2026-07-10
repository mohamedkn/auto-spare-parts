import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { register } from '../../api/auth';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('تنبيه', 'يرجى إكمال جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password });
      Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.', [
        { text: 'حسناً', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('فشل التسجيل', error?.response?.data?.error || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 mt-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-6 w-10 h-10 items-center justify-center bg-zinc-100 rounded-full self-end">
          <Ionicons name="arrow-forward" size={20} color="#09090b" />
        </TouchableOpacity>
        
        <Text className="text-3xl font-bold text-zinc-900 mb-2 text-right">إنشاء حساب جديد ✨</Text>
        <Text className="text-slate-500 mb-8 text-right font-medium">سجل الآن لتبدأ التسوق</Text>

        <TextInput
          className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 mb-4 text-zinc-900 text-base text-right font-medium"
          placeholder="الاسم بالكامل"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#a1a1aa"
        />

        <TextInput
          className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 mb-4 text-zinc-900 text-base text-right font-medium"
          placeholder="البريد الإلكتروني"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#a1a1aa"
        />

        <TextInput
          className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 mb-6 text-zinc-900 text-base text-right font-medium"
          placeholder="كلمة المرور"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#a1a1aa"
        />

        <TouchableOpacity 
          className="bg-primary py-4 rounded-2xl items-center shadow-sm"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="black" /> : <Text className="text-black font-bold text-lg">إنشاء حساب</Text>}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6 flex-row-reverse">
          <Text className="text-slate-500 font-medium">لديك حساب بالفعل؟ </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-primary font-bold">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
