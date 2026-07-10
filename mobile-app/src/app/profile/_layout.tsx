import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerTitleAlign: 'center', headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="addresses" options={{ title: 'العناوين المحفوظة' }} />
      <Stack.Screen name="edit" options={{ title: 'تعديل الملف الشخصي' }} />
    </Stack>
  );
}
