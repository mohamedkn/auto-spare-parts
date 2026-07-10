import { Stack } from "expo-router";

export default function DriverLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "طلبات التوصيل",
          headerShown: true
        }} 
      />
      <Stack.Screen 
        name="job/[id]" 
        options={{ 
          title: "تفاصيل الرحلة",
          headerShown: true
        }} 
      />
    </Stack>
  );
}
