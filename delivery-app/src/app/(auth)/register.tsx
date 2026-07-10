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
      await register({ name, email, password, role: 'driver' });
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
    <SafeAreaView className="flex-1 bg-[#09090b]">
      <View className="p-4 mt-4">
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} className="mb-6 w-10 h-10 items-center justify-center bg-zinc-800 rounded-full self-end">
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
        
        <Text className="text-3xl font-bold text-white mb-2 text-right">انضم لكباتن التوصيل ✨</Text>
        <Text className="text-zinc-400 mb-8 text-right font-medium">سجل الآن لتبدأ العمل ككابتن توصيل</Text>

        <TextInput
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 text-white text-base text-right font-medium"
          placeholder="الاسم بالكامل"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#71717a"
        />

        <TextInput
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 text-white text-base text-right font-medium"
          placeholder="البريد الإلكتروني"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#71717a"
        />

        <TextInput
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 text-white text-base text-right font-medium"
          placeholder="كلمة المرور"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#71717a"
        />

        <TouchableOpacity 
          className="bg-primary py-4 rounded-2xl items-center shadow-sm"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="black" /> : <Text className="text-black font-bold text-lg">إنشاء حساب</Text>}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6 flex-row-reverse">
          <Text className="text-zinc-400 font-medium">لديك حساب بالفعل؟ </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-primary font-bold">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
