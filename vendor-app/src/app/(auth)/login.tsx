import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const authLogin = useAuthStore(state => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });
      if (response.token) {
        if (response.user.role !== 'vendor') {
          Alert.alert('تنبيه', 'هذا التطبيق مخصص للتجار فقط. يرجى استخدام التطبيق المناسب.');
        } else if (response.user.vendorProfile?.status !== 'approved') {
          Alert.alert('تنبيه', 'حسابك كتاجر قيد المراجعة أو معلق. يرجى الانتظار حتى تتم الموافقة.');
        } else {
          await authLogin(response.token, response.user);
          router.replace('/');
        }
      } else {
        Alert.alert('خطأ', 'بيانات الدخول غير صحيحة');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      Alert.alert('فشل تسجيل الدخول', err?.response?.data?.error || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-4 mt-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-6 w-10 h-10 items-center justify-center bg-slate-100 rounded-full self-end">
          <Ionicons name="arrow-forward" size={20} color="#0f172a" />
        </TouchableOpacity>
        
        <View className="mb-4">
          <View className="bg-primary/20 self-end px-3 py-1 rounded-full border border-primary/30">
            <Text className="text-primary font-bold text-xs">تطبيق التاجر</Text>
          </View>
        </View>

        <Text className="text-3xl font-bold text-slate-900 mb-2 text-right">أهلاً بك مجدداً 👋</Text>
        <Text className="text-slate-500 mb-8 text-right font-medium">سجل دخولك للمتابعة في منصة التاجر</Text>

        <TextInput
          className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 text-slate-900 text-base text-right font-medium"
          placeholder="البريد الإلكتروني"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#71717a"
        />

        <TextInput
          className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 text-slate-900 text-base text-right font-medium"
          placeholder="كلمة المرور"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#71717a"
        />

        <TouchableOpacity 
          className="bg-primary py-4 rounded-2xl items-center shadow-sm"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="black" /> : <Text className="text-black font-bold text-lg">تسجيل الدخول</Text>}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6 flex-row-reverse">
          <Text className="text-slate-500 font-medium text-center text-sm px-4">
            التاجر يجب أن يسجل أولاً عبر الموقع الإلكتروني، ويمكنه تسجيل الدخول هنا فور اعتماد الحساب من الإدارة.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
