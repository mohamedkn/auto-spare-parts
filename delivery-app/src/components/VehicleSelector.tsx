import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchVehicles } from '../api/vehicles';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  onSearch: (makeId: string, modelId: string, year: string) => void;
}

export function VehicleSelector({ onSearch }: Props) {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });

  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [year, setYear] = useState('');

  const [isMakeModalOpen, setIsMakeModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  const selectedMake = vehicles?.find(v => v.id === makeId);
  const selectedModel = selectedMake?.models?.find(m => m.id === modelId);

  const handleSearch = () => {
    onSearch(makeId, modelId, year);
  };

  return (
    <Animated.View entering={FadeInDown} className="px-4 mb-6 mt-2">
      <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
        <View className="flex-row items-center mb-3 flex-row-reverse">
          <Ionicons name="car-sport-outline" size={20} color="#f59e0b" />
          <Text className="text-white font-bold text-base mr-2">ابحث بالسيارة (Fitment)</Text>
        </View>
        
        <View className="flex-col gap-3">
          <View className="flex-row justify-between flex-row-reverse gap-3">
            <TouchableOpacity 
              className="flex-1 bg-zinc-800 p-3 rounded-xl flex-row justify-between items-center flex-row-reverse border border-zinc-700"
              onPress={() => setIsMakeModalOpen(true)}
            >
              <Text className="text-zinc-300 font-medium text-right text-sm" numberOfLines={1}>
                {selectedMake ? selectedMake.name : 'اختر الشركة'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#a1a1aa" />
            </TouchableOpacity>

            <TouchableOpacity 
              className={`flex-1 bg-zinc-800 p-3 rounded-xl flex-row justify-between items-center flex-row-reverse border border-zinc-700 ${!makeId ? 'opacity-50' : ''}`}
              disabled={!makeId}
              onPress={() => setIsModelModalOpen(true)}
            >
              <Text className="text-zinc-300 font-medium text-right text-sm" numberOfLines={1}>
                {selectedModel ? selectedModel.name : 'اختر الموديل'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between flex-row-reverse gap-3">
            <TextInput 
              placeholder="سنة الصنع (اختياري)"
              placeholderTextColor="#a1a1aa"
              keyboardType="numeric"
              value={year}
              onChangeText={setYear}
              className="flex-1 bg-zinc-800 p-3 rounded-xl text-right text-white font-medium border border-zinc-700 h-[46px]"
            />

            <TouchableOpacity 
              className="flex-1 bg-primary items-center justify-center rounded-xl flex-row flex-row-reverse gap-2 h-[46px]"
              onPress={handleSearch}
            >
              <Ionicons name="search" size={18} color="#000" />
              <Text className="text-black font-bold text-sm">بحث وتصفية</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Make Modal */}
      <Modal visible={isMakeModalOpen} transparent animationType="slide">
        <TouchableOpacity className="flex-1 bg-black/50 justify-end" activeOpacity={1} onPress={() => setIsMakeModalOpen(false)}>
          <View className="bg-zinc-900 rounded-t-3xl p-5 h-1/2">
            <Text className="text-white font-bold text-lg text-center mb-4">اختر الشركة</Text>
            {isLoading ? (
              <ActivityIndicator size="large" color="#f59e0b" />
            ) : (
              <ScrollView>
                <TouchableOpacity 
                  className="p-4 border-b border-zinc-800"
                  onPress={() => { setMakeId(''); setModelId(''); setIsMakeModalOpen(false); }}
                >
                  <Text className="text-white text-right">الكل</Text>
                </TouchableOpacity>
                {vehicles?.map(make => (
                  <TouchableOpacity 
                    key={make.id}
                    className="p-4 border-b border-zinc-800"
                    onPress={() => { setMakeId(make.id); setModelId(''); setIsMakeModalOpen(false); }}
                  >
                    <Text className="text-white text-right font-medium">{make.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Model Modal */}
      <Modal visible={isModelModalOpen} transparent animationType="slide">
        <TouchableOpacity className="flex-1 bg-black/50 justify-end" activeOpacity={1} onPress={() => setIsModelModalOpen(false)}>
          <View className="bg-zinc-900 rounded-t-3xl p-5 h-1/2">
            <Text className="text-white font-bold text-lg text-center mb-4">اختر الموديل</Text>
            <ScrollView>
              <TouchableOpacity 
                className="p-4 border-b border-zinc-800"
                onPress={() => { setModelId(''); setIsModelModalOpen(false); }}
              >
                <Text className="text-white text-right">الكل</Text>
              </TouchableOpacity>
              {selectedMake?.models?.map(model => (
                <TouchableOpacity 
                  key={model.id}
                  className="p-4 border-b border-zinc-800"
                  onPress={() => { setModelId(model.id); setIsModelModalOpen(false); }}
                >
                  <Text className="text-white text-right font-medium">{model.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
}
