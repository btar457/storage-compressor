import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('storage_compressor.db');

export interface FileRecord {
  id: number;
  name: string;
  originalUri: string;
  compressedUri: string;
  originalSize: number;
  compressedSize: number;
  type: 'image' | 'file';
  createdAt: string;
}

// إنشاء الجدول عند أول تشغيل
export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      originalUri TEXT NOT NULL,
      compressedUri TEXT NOT NULL,
      originalSize INTEGER NOT NULL,
      compressedSize INTEGER NOT NULL,
      type TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
}

// حفظ ملف مضغوط
export function saveFileRecord(record: Omit<FileRecord, 'id'>): void {
  db.runSync(
    `INSERT INTO files (name, originalUri, compressedUri, originalSize, compressedSize, type, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      record.name,
      record.originalUri,
      record.compressedUri,
      record.originalSize,
      record.compressedSize,
      record.type,
      record.createdAt,
    ]
  );
}

// جلب كل الملفات
export function getAllFiles(): FileRecord[] {
  return db.getAllSync<FileRecord>('SELECT * FROM files ORDER BY createdAt DESC');
}

// حذف ملف
export async function deleteFileRecord(id: number, compressedUri: string): Promise<void> {
  await FileSystem.deleteAsync(compressedUri, { idempotent: true });
  db.runSync('DELETE FROM files WHERE id = ?', [id]);
}

// إحصائيات المساحة الموفّرة
export function getStats(): { totalOriginal: number; totalCompressed: number; count: number } {
  const result = db.getFirstSync<{
    totalOriginal: number;
    totalCompressed: number;
    count: number;
  }>('SELECT SUM(originalSize) as totalOriginal, SUM(compressedSize) as totalCompressed, COUNT(*) as count FROM files');

  return result ?? { totalOriginal: 0, totalCompressed: 0, count: 0 };
}
