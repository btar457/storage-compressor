import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface FileResult {
  name: string;
  originalSize: number;
  newSize: number;
  saved: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);

  async function compressImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('خطأ', 'يجب منح إذن الوصول للصور');
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (picked.canceled) return;
      setLoading(true);

      for (const asset of picked.assets) {
        const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
        const originalSize = info.exists ? (info.size ?? 0) : 0;

        const compressed = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
        );

        const newInfo = await FileSystem.getInfoAsync(compressed.uri, { size: true });
        const newSize = newInfo.exists ? (newInfo.size ?? 0) : 0;
        const saved = originalSize - newSize;

        const result: FileResult = {
          name: asset.fileName ?? 'صورة',
          originalSize,
          newSize,
          saved,
        };

        setResults(prev => [result, ...prev]);
        setTotalSaved(prev => prev + saved);
      }
    } catch (e) {
      Alert.alert('خطأ', 'فشل ضغط الصورة');
    } finally {
      setLoading(false);
    }
  }

  async function compressFile() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled) return;
      setLoading(true);

      const asset = picked.assets[0];
      const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
      const originalSize = info.exists ? (info.size ?? 0) : 0;

      const destDir = FileSystem.documentDirectory + 'compressed/';
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      const destUri = destDir + asset.name;
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });

      const newInfo = await FileSystem.getInfoAsync(destUri, { size: true });
      const newSize = newInfo.exists ? (newInfo.size ?? 0) : originalSize;
      const saved = originalSize - newSize;

      const result: FileResult = {
        name: asset.name,
        originalSize,
        newSize,
        saved: Math.max(0, saved),
      };

      setResults(prev => [result, ...prev]);
      setTotalSaved(prev => prev + Math.max(0, saved));
    } catch (e) {
      Alert.alert('خطأ', 'فشل معالجة الملف');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💾 Storage Compressor</Text>
        <View style={styles.statsBox}>
          <Text style={styles.statsLabel}>إجمالي المساحة الموفّرة</Text>
          <Text style={styles.statsValue}>{formatSize(totalSaved)}</Text>
          <Text style={styles.statsCount}>{results.length} ملف تمت معالجته</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPurple]}
          onPress={compressImage}
          disabled={loading}
        >
          <Text style={styles.btnText}>🖼️ ضغط الصور</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnBlue]}
          onPress={compressFile}
          disabled={loading}
        >
          <Text style={styles.btnText}>📁 ضغط الملفات</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#6366f1" style={{ margin: 20 }} />
      )}

      {results.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>قبل</Text>
            <Text style={styles.cardLabel}>بعد</Text>
            <Text style={styles.cardLabel}>الوفر</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardValue}>{formatSize(item.originalSize)}</Text>
            <Text style={styles.cardValue}>{formatSize(item.newSize)}</Text>
            <Text style={styles.cardSaved}>{formatSize(item.saved)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#6366f1', padding: 24, paddingTop: 48 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  statsBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statsLabel: { color: '#e0e7ff', fontSize: 14 },
  statsValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 4 },
  statsCount: { color: '#c7d2fe', fontSize: 13 },
  buttons: { padding: 16, gap: 12 },
  btn: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  btnPurple: { backgroundColor: '#6366f1' },
  btnBlue: { backgroundColor: '#0ea5e9' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardName: { fontWeight: '700', fontSize: 15, marginBottom: 10, color: '#1e293b' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontSize: 12, color: '#94a3b8', flex: 1, textAlign: 'center' },
  cardValue: { fontSize: 14, color: '#475569', flex: 1, textAlign: 'center' },
  cardSaved: { fontSize: 14, color: '#22c55e', fontWeight: '700', flex: 1, textAlign: 'center' },
});
