import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Storage Compressor' }} />
      <Stack.Screen name="images" options={{ title: 'ضغط الصور' }} />
      <Stack.Screen name="files" options={{ title: 'ضغط الملفات' }} />
    </Stack>
  );
}
