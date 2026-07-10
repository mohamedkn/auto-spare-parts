import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { fetchVehicles } from '../api/vehicles';

interface VehicleSelectorProps {
  onSearch: (makeId: string, modelId: string, year: string) => void;
}

function PickerButton({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className={`h-12 flex-1 flex-row-reverse items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 ${
        disabled ? 'opacity-40' : ''
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="flex-1 text-right text-xs font-bold text-zinc-700" numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-down" size={15} color="#71717a" />
    </TouchableOpacity>
  );
}

function SelectionSheet({
  visible,
  title,
  loading = false,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  loading?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View className="max-h-[68%] min-h-[44%] rounded-t-3xl bg-white px-5 pb-8 pt-4">
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-zinc-300" />
          <View className="mb-3 flex-row-reverse items-center justify-between">
            <Text className="text-lg font-black text-zinc-950">{title}</Text>
            <TouchableOpacity className="h-10 w-10 items-center justify-center" onPress={onClose}>
              <Ionicons name="close" size={22} color="#18181b" />
            </TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator size="large" color="#d97706" /> : children}
        </View>
      </View>
    </Modal>
  );
}

export function VehicleSelector({ onSearch }: VehicleSelectorProps) {
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });
  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [year, setYear] = useState('');
  const [isMakeModalOpen, setIsMakeModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  const selectedMake = vehiclesQuery.data?.find((vehicle) => vehicle.id === makeId);
  const selectedModel = selectedMake?.models?.find((model) => model.id === modelId);
  const hasFilters = Boolean(makeId || modelId || year);

  const applyFilters = () => {
    void Haptics.selectionAsync();
    onSearch(makeId, modelId, year.trim());
  };

  const clearFilters = () => {
    setMakeId('');
    setModelId('');
    setYear('');
    onSearch('', '', '');
  };

  return (
    <>
      <Animated.View entering={FadeInDown.delay(60).duration(350)} className="mb-6 mt-4 px-4">
        <View className="rounded-2xl border border-zinc-200 bg-white p-4">
          <View className="mb-4 flex-row-reverse items-start justify-between">
            <View className="flex-row-reverse items-center">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Ionicons name="car-sport-outline" size={22} color="#b45309" />
              </View>
              <View className="mr-3 items-end">
                <Text className="text-right text-base font-black text-zinc-950">حدد سيارتك</Text>
                <Text className="mt-0.5 text-right text-[11px] font-medium text-zinc-500">
                  اعرض القطع المتوافقة فقط
                </Text>
              </View>
            </View>
            {hasFilters && (
              <TouchableOpacity className="min-h-9 justify-center px-1" onPress={clearFilters}>
                <Text className="text-xs font-bold text-red-600">مسح</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row-reverse gap-2">
            <PickerButton
              label={selectedMake?.name || 'الماركة'}
              onPress={() => setIsMakeModalOpen(true)}
            />
            <PickerButton
              label={selectedModel?.name || 'الموديل'}
              disabled={!makeId}
              onPress={() => setIsModelModalOpen(true)}
            />
          </View>

          <View className="mt-2 flex-row-reverse gap-2">
            <TextInput
              className="h-12 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-right text-xs font-bold text-zinc-800"
              placeholder="سنة الصنع"
              placeholderTextColor="#71717a"
              keyboardType="numeric"
              maxLength={4}
              value={year}
              onChangeText={setYear}
            />
            <TouchableOpacity
              className="h-12 flex-1 flex-row-reverse items-center justify-center rounded-lg bg-zinc-950"
              onPress={applyFilters}
            >
              <Ionicons name="options-outline" size={18} color="#fbbf24" />
              <Text className="mr-2 text-sm font-extrabold text-white">تطبيق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <SelectionSheet
        visible={isMakeModalOpen}
        title="اختر ماركة السيارة"
        loading={vehiclesQuery.isLoading}
        onClose={() => setIsMakeModalOpen(false)}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            className="border-b border-zinc-100 py-4"
            onPress={() => {
              setMakeId('');
              setModelId('');
              setIsMakeModalOpen(false);
            }}
          >
            <Text className="text-right font-bold text-zinc-700">كل الماركات</Text>
          </TouchableOpacity>
          {vehiclesQuery.data?.map((make) => (
            <TouchableOpacity
              key={make.id}
              className="flex-row-reverse items-center justify-between border-b border-zinc-100 py-4"
              onPress={() => {
                setMakeId(make.id);
                setModelId('');
                setIsMakeModalOpen(false);
              }}
            >
              <Text className="text-right font-bold text-zinc-900">{make.name}</Text>
              {make.id === makeId && <Ionicons name="checkmark-circle" size={20} color="#d97706" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SelectionSheet>

      <SelectionSheet
        visible={isModelModalOpen}
        title="اختر موديل السيارة"
        onClose={() => setIsModelModalOpen(false)}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            className="border-b border-zinc-100 py-4"
            onPress={() => {
              setModelId('');
              setIsModelModalOpen(false);
            }}
          >
            <Text className="text-right font-bold text-zinc-700">كل الموديلات</Text>
          </TouchableOpacity>
          {selectedMake?.models?.map((model) => (
            <TouchableOpacity
              key={model.id}
              className="flex-row-reverse items-center justify-between border-b border-zinc-100 py-4"
              onPress={() => {
                setModelId(model.id);
                setIsModelModalOpen(false);
              }}
            >
              <Text className="text-right font-bold text-zinc-900">{model.name}</Text>
              {model.id === modelId && <Ionicons name="checkmark-circle" size={20} color="#d97706" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SelectionSheet>
    </>
  );
}
