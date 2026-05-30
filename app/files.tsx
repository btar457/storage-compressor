import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, FlatList, Alert, ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { compressFileToZip, formatSize, savingsPercent } from '../utils/compression';
import { saveFileRecord } from '../utils/storage';

interface CompressedFile {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
}

export default function FilesScreen() {
  const [files, setFiles] = useState<CompressedFile[]>([]);
  const [loading, setLoading] = useState(false);

  async function pickAndCompress() {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    setLoading(true);

    for (const asset of result.assets) {
      try {
        const compressed = await compressFileToZip(asset.uri, asset.name);

        saveFileRecord({
          name: asset.name,
          originalUri: asset.uri,
          compressedUri: compressed.uri,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          type: 'file',
          createdAt: new Date().toISOString(),
        });

        setFiles(prev => [{
          id: Date.now().toString(),
          name: asset.name,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
        }, ...prev]);
      } catch (e) {
        Alert.alert('خطأ', `فشل ضغط ${asset.name}`);
      }
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickAndCompress}>
        <Text style={styles.buttonText}>+ اختر ملفات للضغط</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#0ea5e9" style={{ margin: 20 }} />}

      <FlatList
        data={files}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.icon}>📄</Text>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.size}>
                {formatSize(item.originalSize)} ← {formatSize(item.compressedSize)}
              </Text>
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
    backgroundColor: '#0ea5e9', borderRadius: 12,
    padding: 16, alignItems: 'center', marginBottom: 16
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 10,
    elevation: 2, alignItems: 'center'
  },
  icon: { fontSize: 32 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontWeight: '600', marginBottom: 4 },
  size: { fontSize: 12, color: '#666' },
  savings: { fontSize: 13, color: '#22c55e', fontWeight: '600', marginTop: 4 },
});
