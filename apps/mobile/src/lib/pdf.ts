import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// HTML'ni PDF qilib ulashadi: native'da fayl yaratib share-sheet ochadi,
// web'da brauzer chop etish (Print) dialogini ochadi (PDF sifatida saqlash mumkin).
export async function exportHtmlToPdf(html: string, dialogTitle: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf' });
  }
}

// XSS'siz HTML uchun oddiy escape (report matnlari foydalanuvchi kiritmasa ham).
export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}
