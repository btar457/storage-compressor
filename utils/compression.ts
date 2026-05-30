import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { zip } from 'react-native-zip-archive';

// ضغط الصور
export async function compressImage(
  uri: string,
  quality: number = 0.4
): Promise<{ uri: string; originalSize: number; compressedSize: number }> {
  
  const originalInfo = await FileSystem.getInfoAsync(uri, { size: true });
  const originalSize = originalInfo.exists ? (originalInfo.size ?? 0) : 0;

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const compressedInfo = await FileSystem.getInfoAsync(result.uri, { size: true });
  const compressedSize = compressedInfo.exists ? (compressedInfo.size ?? 0) : 0;

  return {
    uri: result.uri,
    originalSize,
    compressedSize,
  };
}

// ضغط الملفات إلى ZIP
export async function compressFileToZip(
  sourceUri: string,
  fileName: string
): Promise<{ uri: string; originalSize: number; compressedSize: number }> {

  const originalInfo = await FileSystem.getInfoAsync(sourceUri, { size: true });
  const originalSize = originalInfo.exists ? (originalInfo.size ?? 0) : 0;

  const destDir = FileSystem.documentDirectory + 'compressed/';
  await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });

  const zipPath = destDir + fileName + '.zip';
  await zip(sourceUri, zipPath);

  const compressedInfo = await FileSystem.getInfoAsync(zipPath, { size: true });
  const compressedSize = compressedInfo.exists ? (compressedInfo.size ?? 0) : 0;

  return {
    uri: zipPath,
    originalSize,
    compressedSize,
  };
}

// تحويل الحجم لنص مقروء
export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// حساب نسبة التوفير
export function savingsPercent(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.round(((original - compressed) / original) * 100);
}
