import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { initDatabase, getStats } from '../utils/storage';
import { formatSize, savingsPercent } from '../utils/compression';

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalOriginal: 0, totalCompressed: 0, count: 0 });

  useEffect(() => {
    initDatabase();
    setStats(getStats());
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Storage Compressor</Text>

      {/* بطاقة الإحصائيات */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>المساحة الموفّرة</Text>
        <Text style={styles.savedText}>
          {formatSize(stats.totalOriginal - stats.totalCompressed)}
        </Text>
        <Text style={styles.statsDetail}>
          {stats.count} ملف | توفير {savingsPercent(stats.totalOriginal, stats.totalCompressed)}%
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>قبل: {formatSize(stats.totalOriginal)}</Text>
          <Text style={styles.label}>بعد: {formatSize(stats.totalCompressed)}</Text>
        </View>
      </View>

      {/* أزرار التنقل */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/images')}
      >
        <Text style={styles.buttonText}>🖼 ضغط الصور</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.push('/files')}
      >
        <Text style={styles.buttonText}>📁 ضغط الملفات</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  statsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    marginBottom: 24, elevation: 3, alignItems: 'center'
  },
  statsTitle: { fontSize: 16, color: '#666', marginBottom: 8 },
  savedText: { fontSize: 40, fontWeight: 'bold', color: '#22c55e' },
  statsDetail: { fontSize: 14, color: '#888', marginTop: 4 },
  row: { flexDirection: 'row', gap: 20, marginTop: 12 },
  label: { fontSize: 13, color: '#555' },
  button: {
    backgroundColor: '#6366f1', borderRadius: 12,
    padding: 18, alignItems: 'center', marginBottom: 12
  },
  buttonSecondary: { backgroundColor: '#0ea5e9' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
