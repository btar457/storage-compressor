import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, FlatList, Alert, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { compressImage, formatSize, savingsPercent } from '../utils/compression';
import { saveFileRecord } from '../utils/storage';

interface CompressedImage {
  id: string;
  uri: string;
  originalSize: number;
  compressedSize: number;
  name: string;
}

export default function ImagesScreen() {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [loading, setLoading] = useState(false);

  async function pickAndCompress() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('خطأ', 'يجب منح إذن الوصول للصور');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled) return;

    setLoading(true);
    const newImages: CompressedImage[] = [];

    for (const asset of result.assets) {
      try {
        const compressed = await compressImage(asset.uri, 0.4);
        const name = asset.fileName ?? `image_${Date.now()}.jpg`;

        // حفظ في المجلد الدائم
        const destDir = FileSystem.documentDirectory + 'images/';
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
        const finalUri = destDir + name;
        await FileSystem.moveAsync({ from: compressed.uri, to: finalUri });

        saveFileRecord({
          name,
          originalUri: asset.uri,
          compressedUri: finalUri,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          type: 'image',
          createdAt: new Date().toISOString(),
        });

        newImages.push({
          id: Date.now().toString() + name,
          uri: finalUri,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          name,
        });
      } catch (e) {
        Alert.alert('خطأ', 'فشل ضغط إحدى الصور');
      }
    }

    setImages(prev => [...newImages, ...prev]);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickAndCompress}>
        <Text style={styles.buttonText}>+ اختر صور للضغط</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#6366f1" style={{ margin: 20 }} />}

      <FlatList
        data={images}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.uri }} style={styles.thumbnail} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.size}>قبل: {formatSize(item.originalSize)}</Text>
              <Text style={styles.size}>بعد: {formatSize(item.compressedSize)}</Text>
              <Text style={styles.savings}>
                ✅ وفّرت {savingsPercent(item.originalSize, item.compressedSize)}%
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  button: {
    backgroundColor: '#6366f1', borderRadius: 12,
    padding: 16, alignItems: 'center', marginBottom: 16
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 12, padding: 12, marginBottom: 10, elevation: 2
  },
  thumbnail: { width: 70, height: 70, borderRadius: 8 },
  info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  name: { fontWeight: '600', marginBottom: 4 },
  size: { fontSize: 12, color: '#666' },
  savings: { fontSize: 13, color: '#22c55e', fontWeight: '600', marginTop: 4 },
});
