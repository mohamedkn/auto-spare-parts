import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useAlertStore } from '../store/useAlertStore';
import { Ionicons } from '@expo/vector-icons';

export default function CustomAlert() {
  const { isVisible, title, message, buttons, hideAlert } = useAlertStore();

  if (!isVisible) return null;

  // If no buttons are provided, default to a simple "OK" button
  const alertButtons = buttons && buttons.length > 0 
    ? buttons 
    : [{ text: 'حسناً', onPress: () => {} }];

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 justify-center items-center p-6">
        <View className="bg-white dark:bg-white w-full rounded-3xl p-6 shadow-2xl overflow-hidden items-center border border-zinc-200 dark:border-slate-200">
          
          {/* Accent Header */}
          <View className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
          
          {/* Icon */}
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4 mt-2">
            <Ionicons name="information-circle" size={32} color="#f59e0b" />
          </View>

          {/* Texts */}
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-900 text-center mb-2 font-cairo">
            {title}
          </Text>
          {message ? (
            <Text className="text-slate-500 dark:text-slate-500 text-center mb-6 text-base font-cairo leading-relaxed">
              {message}
            </Text>
          ) : <View className="mb-4" />}

          {/* Buttons */}
          <View className={`w-full ${alertButtons.length > 2 ? 'flex-col' : 'flex-row'} justify-center gap-3`}>
            {alertButtons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              // Determine button styling
              let btnClass = "bg-primary shadow-primary/20";
              let textClass = "text-black";

              if (isDestructive) {
                btnClass = "bg-red-500 shadow-red-500/20";
                textClass = "text-slate-900";
              } else if (isCancel) {
                btnClass = "bg-zinc-200 dark:bg-slate-100";
                textClass = "text-zinc-700 dark:text-slate-600";
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) btn.onPress();
                  }}
                  className={`flex-1 py-3.5 rounded-xl items-center justify-center shadow-lg ${btnClass}`}
                  activeOpacity={0.8}
                >
                  <Text className={`font-bold text-base ${textClass}`}>{btn.text || 'OK'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
