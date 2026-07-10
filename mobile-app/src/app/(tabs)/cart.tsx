import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { router } from 'expo-router';
import { formatImageUrl } from '../../api/client';

export default function CartScreen() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const token = useAuthStore(state => state.token);

  const handleCheckout = () => {
    if (!token) {
      router.push('/(auth)/login');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-4 py-4 bg-white/90 border-b border-slate-200 flex-row items-center justify-between flex-row-reverse shadow-sm">
        <Text className="text-xl font-bold text-slate-900">عربة التسوق</Text>
        <Text className="text-slate-500 font-medium">{items.length} منتجات</Text>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="cart-outline" size={80} color="#52525b" />
          <Text className="text-slate-500 text-lg mt-4 font-bold">عربة التسوق فارغة</Text>
          <TouchableOpacity 
            className="mt-6 bg-primary px-8 py-3 rounded-full shadow-sm"
            onPress={() => router.push('/')}
          >
            <Text className="text-black font-bold text-lg">ابدأ التسوق</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <View className="p-4">
              {items.map((item) => (
                <View key={item.id} className="bg-white p-3 rounded-2xl mb-4 shadow-sm flex-row-reverse border border-slate-200">
                  <View className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden ml-3 border border-slate-300">
                    {item.image ? (
                      <Image source={{ uri: formatImageUrl(item.image) || undefined }} className="w-full h-full object-cover" />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Ionicons name="image-outline" size={24} color="#ccc" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1 justify-between">
                    <View className="flex-row justify-between items-start flex-row-reverse">
                      <Text className="text-slate-900 font-bold flex-1 ml-2 text-right text-base" numberOfLines={2}>
                        {item.name}
                      </Text>
                      <TouchableOpacity onPress={() => removeItem(item.id)} className="p-1 bg-red-500/20 rounded-full">
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    
                    <View className="flex-row items-center justify-between mt-2 flex-row-reverse">
                      <Text className="text-primary font-bold text-lg">{item.price} ج.م</Text>
                      
                      <View className="flex-row items-center bg-slate-100 rounded-full py-1 px-1 border border-slate-300 flex-row-reverse">
                        <TouchableOpacity 
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 items-center justify-center bg-zinc-700 rounded-full shadow-sm"
                        >
                          <Ionicons name="add" size={18} color="#0f172a" />
                        </TouchableOpacity>
                        <Text className="mx-3 font-bold text-slate-900">{item.quantity}</Text>
                        <TouchableOpacity 
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 items-center justify-center bg-zinc-700 rounded-full shadow-sm"
                        >
                          <Ionicons name="remove" size={18} color="#0f172a" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Checkout Footer */}
          <View className="bg-white p-4 border-t border-slate-200 pb-8 shadow-lg">
            <View className="flex-row justify-between mb-4 flex-row-reverse">
              <Text className="text-slate-500 text-lg font-bold">قيمة المنتجات</Text>
              <Text className="text-slate-900 font-bold text-2xl">{getTotal().toFixed(2)} ج.م</Text>
            </View>
            <TouchableOpacity 
              className="bg-primary w-full py-4 rounded-2xl items-center shadow-sm"
              onPress={handleCheckout}
            >
              <Text className="text-black font-bold text-lg">متابعة الدفع</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
