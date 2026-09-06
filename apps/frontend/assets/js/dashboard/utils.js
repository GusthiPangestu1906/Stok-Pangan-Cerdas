/**
 * Utilitas & Helper Murni
 * Arsitektur Bersih (Clean Architecture) - Utilities Layer
 */

import { el } from './elements.js';

export const BULAN_PANJANG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Escape karakter HTML untuk mencegah serangan XSS
 */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

/**
 * Format tanggal standar Indonesia (DD Bln YYYY)
 */
export function formatTanggal(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format angka ke format mata uang Rupiah
 */
export function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

/**
 * Sanitasi string agar aman dijadikan nama file unduhan / cetak
 */
export function sanitizeFilename(text) {
  return String(text || 'Dokumen')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Timestamp penamaan file cetak
 */
export function tanggalFileStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/**
 * Label status sisa hari kadaluarsa
 */
export function sisaHariText(sisaHari) {
  if (sisaHari < 0) return `Lewat ${Math.abs(sisaHari)} hari`;
  if (sisaHari === 0) return 'Hari ini';
  return `${sisaHari} hari lagi`;
}

/**
 * Kalkulasi persentase umur simpan barang
 */
export function progressPercent(item) {
  const total = item.estimasi_umur_simpan_hari;
  const sisa = Math.max(0, item.sisa_hari);
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((sisa / total) * 100)));
}

/**
 * Tampilkan pesan toast melayang di pojok layar
 */
export function showToast(message) {
  if (!el.toast) return;
  el.toast.textContent = message;
  el.toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    if (el.toast) el.toast.classList.add('hidden');
  }, 3000);
}

/**
 * Helper pembungkus tombol aksi dengan animasi loading spinner & status disabled
 * Mencegah klik ganda (*double-click / race conditions*) serta memberikan feedback visual responsif.
 */
export async function withButtonLoading(buttonEl, loadingText, actionFn) {
  if (!buttonEl) {
    if (typeof actionFn === 'function') return await actionFn();
    return;
  }
  if (buttonEl.disabled) return;

  const originalHtml = buttonEl.innerHTML;
  buttonEl.disabled = true;
  buttonEl.classList.add('opacity-75', 'cursor-not-allowed', 'pointer-events-none');
  buttonEl.innerHTML = `
    <svg class="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current inline-block shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>${esc(loadingText)}</span>
  `;

  try {
    return await actionFn();
  } finally {
    buttonEl.disabled = false;
    buttonEl.classList.remove('opacity-75', 'cursor-not-allowed', 'pointer-events-none');
    buttonEl.innerHTML = originalHtml;
  }
}

/**
 * Cetak dokumen via window.print() dengan pergantian title sementara
 */
export function printDocument(fileTitle, afterFn) {
  const originalTitle = document.title;
  if (fileTitle) document.title = fileTitle;

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.removeEventListener('afterprint', finish);
    document.title = originalTitle;
    if (typeof afterFn === 'function') afterFn();
  };

  window.addEventListener('afterprint', finish);
  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      finish();
    }
  }, 120);

  setTimeout(finish, 15000);
}

/**
 * Generator garis visual Barcode SVG (Code 39 sederhana)
 */
export function generateBarcodeSvgBars(text) {
  const code39Map = {
    '0': 'bwbwbwBwb', '1': 'BwbwbwbwB', '2': 'bwBwbwbwB', '3': 'BwBwbwbwb',
    '4': 'bwbwBwbwB', '5': 'BwbwBwbwb', '6': 'bwBwBwbwb', '7': 'bwbwbwBwB',
    '8': 'BwbwbwBwb', '9': 'bwBwbwBwb', 'A': 'BwbwbwbWb', 'B': 'bwBwbwbWb',
    'C': 'BwBwbwbwb', 'D': 'bwbwBwbWb', 'E': 'BwbwBwbwb', 'F': 'bwBwBwbwb',
    'G': 'bwbwbwBWb', 'H': 'BwbwbwBwb', 'I': 'bwBwbwBwb', 'J': 'bwbwBwBwb',
    'K': 'BwbwbwbwB', 'L': 'bwBwbwbwB', 'M': 'BwBwbwbwb', 'N': 'bwbwBwbwB',
    'O': 'BwbwBwbwb', 'P': 'bwBwBwbwb', 'Q': 'bwbwbwBwB', 'R': 'BwbwbwBwb',
    'S': 'bwBwbwBwb', 'T': 'bwbwBwBwb', 'U': 'BWbwbwbwb', 'V': 'bWBwbwbwb',
    'W': 'BWBwbwbwb', 'X': 'bWbwBwbwb', 'Y': 'BWbwBwbwb', 'Z': 'bWBwBwbwb',
    '-': 'bWbwbwBwb', '.': 'BWbwbwBwb', ' ': 'bWBwbwBwb', '*': 'bWbwBwBwb',
  };

  const cleanText = '*' + String(text || 'SPC').toUpperCase().replace(/[^0-9A-Z\-\. ]/g, '') + '*';
  let x = 2;
  let rects = '';

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const pattern = code39Map[char] || code39Map['-'];

    for (let p = 0; p < pattern.length; p++) {
      const bit = pattern[p];
      const isBar = (p % 2 === 0);
      const isWide = (bit === 'B' || bit === 'W');
      const width = isWide ? 2.6 : 1.1;

      if (isBar) {
        rects += `<rect x="${x.toFixed(1)}" y="0" width="${width.toFixed(1)}" height="24" fill="currentColor"/>`;
      }
      x += width;
    }
    x += 1.8;
  }

  return { rects, totalWidth: Math.ceil(x + 2) };
}

/**
 * Buat kode voucher acak dengan prefix target
 */
export function generateVoucherCode(targetName = 'SPC') {
  const cleanTarget = (targetName || 'SPC')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3) || 'SPC';
  const randNum = Math.floor(10000 + Math.random() * 90000);
  return `VCHR-${cleanTarget}-${randNum}`;
}
