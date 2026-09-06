/**
 * Modul Stiker Label Diskon Rak (Shelf Clearance Tags)
 * Arsitektur Bersih (Clean Architecture) - Domain & Feature Layer
 */

import { state } from './state.js?v=1.0.5';
import { el } from './elements.js?v=1.0.5';
import {
  formatTanggal,
  formatRupiah,
  sisaHariText,
  sanitizeFilename,
  tanggalFileStamp,
  printDocument,
  showToast,
  withButtonLoading,
} from './utils.js?v=1.0.5';
import { renderRekomendasi } from './ai.js?v=1.0.5';
import { applyFilters, closeFormModal, closeDeleteModal } from './items.js?v=1.0.5';

export const DEFAULT_PRICES = {
  sayur: 12000,
  buah: 28000,
  'olahan susu': 24000,
  roti: 16000,
  sembako: 65000,
  daging: 45000,
  ikan: 35000,
  bumbu: 8000,
};

export const QTY_DEFAULT_OPTIONS = [1, 2, 4, 8, 12, 16];
export const QTY_MAKS_BACKEND = 50;

export function extractDiscountPct(saranText) {
  if (!saranText) return 50;
  const match = saranText.match(/(\d{1,2})\s*%/);
  if (match && match[1]) {
    const val = Number(match[1]);
    if (val >= 10 && val <= 90) return val;
  }
  return 50;
}

export function populateQtyOptions(selectEl, item, satuan, defaultQty = 4) {
  if (!selectEl) return defaultQty;
  selectEl.innerHTML = '';

  if (!item) {
    QTY_DEFAULT_OPTIONS.forEach((n) => {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = n === 4 ? `${n} ${satuan} (1 Lembar)` : `${n} ${satuan}`;
      selectEl.appendChild(opt);
    });
    const pilihan = QTY_DEFAULT_OPTIONS.includes(defaultQty) ? defaultQty : 4;
    selectEl.value = String(pilihan);
    return pilihan;
  }

  const maksStok = Math.max(1, Math.min(Number(item.jumlah_stok) || 1, QTY_MAKS_BACKEND));
  const opsi = QTY_DEFAULT_OPTIONS.filter((n) => n <= maksStok);
  if (opsi.length === 0 || opsi[opsi.length - 1] !== maksStok) {
    opsi.push(maksStok);
  }

  opsi.forEach((n) => {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = n === maksStok ? `Sebanyak Stok (${n} ${satuan.toLowerCase()})` : `${n} ${satuan}`;
    selectEl.appendChild(opt);
  });

  const pilihan = Math.min(defaultQty, maksStok);
  selectEl.value = String(pilihan);
  return pilihan;
}

export function populateLabelQtyOptions(item, defaultQty = 4) {
  return populateQtyOptions(el.labelInputQty, item, 'Label', defaultQty);
}

export function openLabelModal(item, rekomendasi = null, isBundling = false) {
  if (el.modalScanVoucher) el.modalScanVoucher.classList.add('hidden');
  if (el.modalVoucher) el.modalVoucher.classList.add('hidden');
  closeFormModal();
  closeDeleteModal();

  if (!item || item.sisa_hari < 0) {
    showToast('Barang yang sudah kadaluarsa tidak dapat dibuatkan label rak.');
    return;
  }

  const isBundlingMode = Boolean(isBundling || (rekomendasi && (rekomendasi.jenis_saran || '').toLowerCase() === 'bundling'));
  const katKey = (item.kategori || '').toLowerCase().trim();
  const defaultHarga = DEFAULT_PRICES[katKey] || 20000;
  const pct = rekomendasi ? extractDiscountPct(rekomendasi.isi_saran) : (isBundlingMode ? 30 : 50);

  state.currentLabelData = {
    id: item.id,
    nama: item.nama,
    kategori: isBundlingMode ? `${item.kategori} · Paket Bundling` : item.kategori,
    kadaluarsa: item.tanggal_kadaluarsa ? formatTanggal(item.tanggal_kadaluarsa) : 'Hari Ini',
    sisaHari: item.sisa_hari,
    hargaAsli: defaultHarga,
    diskonPct: pct,
    tagline: isBundlingMode ? 'PROMO PAKET BUNDLING' : 'FOOD RESCUE DEAL',
    qty: 4,
    rekomendasiId: rekomendasi ? rekomendasi.id : null,
  };

  state.currentLabelData.qty = populateLabelQtyOptions(item);

  if (el.labelInputNama) el.labelInputNama.value = state.currentLabelData.nama;
  if (el.labelInputKategori) el.labelInputKategori.value = state.currentLabelData.kategori;
  if (el.labelInputKadaluarsa) el.labelInputKadaluarsa.value = state.currentLabelData.kadaluarsa;
  if (el.labelInputHargaAsli) el.labelInputHargaAsli.value = state.currentLabelData.hargaAsli;
  if (el.labelInputTagline) el.labelInputTagline.value = state.currentLabelData.tagline;

  updateLabelPctButtons(state.currentLabelData.diskonPct);
  updateLabelPreview();

  if (el.modalLabelDiskon) el.modalLabelDiskon.classList.remove('hidden');
}

export function closeLabelModal() {
  if (el.modalLabelDiskon) el.modalLabelDiskon.classList.add('hidden');
}

export function updateLabelPctButtons(selectedPct) {
  if (!el.labelPctGroup) return;
  const buttons = el.labelPctGroup.querySelectorAll('[data-pct]');
  buttons.forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.pct) === Number(selectedPct));
  });
}

export function updateLabelPreview() {
  const hargaAsli = Math.max(0, Number(el.labelInputHargaAsli?.value || 0));
  const pct = state.currentLabelData.diskonPct;
  const hargaDiskon = Math.max(0, Math.round((hargaAsli * (100 - pct) / 100) / 500) * 500);

  state.currentLabelData.hargaAsli = hargaAsli;
  state.currentLabelData.tagline = el.labelInputTagline?.value || 'FOOD RESCUE DEAL';
  state.currentLabelData.qty = Number(el.labelInputQty?.value || 4);

  if (el.previewNama) el.previewNama.textContent = state.currentLabelData.nama;
  if (el.previewKategori) el.previewKategori.textContent = `${state.currentLabelData.kategori} · ${sisaHariText(state.currentLabelData.sisaHari)}`;
  if (el.previewKadaluarsa) el.previewKadaluarsa.textContent = state.currentLabelData.kadaluarsa;
  if (el.previewTagline) el.previewTagline.textContent = state.currentLabelData.tagline;
  if (el.previewPct) el.previewPct.textContent = `-${pct}%`;
  if (el.previewHargaAsli) el.previewHargaAsli.textContent = formatRupiah(hargaAsli);
  if (el.previewHargaDiskon) el.previewHargaDiskon.textContent = formatRupiah(hargaDiskon);
}

export async function printShelfLabels() {
  if (!el.shelfTagPreview || !el.printableLabelsArea) return;
  
  await withButtonLoading(el.btnPrintLabels, 'Menyiapkan...', async () => {
    if (el.printableVouchersArea) el.printableVouchersArea.innerHTML = '';
    const qty = state.currentLabelData.qty;

    const previewHTML = el.shelfTagPreview.outerHTML;
    el.printableLabelsArea.innerHTML = '';

    for (let i = 0; i < qty; i++) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'shelf-tag-print-item';
      itemDiv.innerHTML = previewHTML;
      el.printableLabelsArea.appendChild(itemDiv);
    }

    if (state.currentLabelData.rekomendasiId) {
      window.terapkanRekomendasi(state.currentLabelData.rekomendasiId).then((updated) => {
        state.allRekomendasi = state.allRekomendasi.map((r) => (r.id === updated.id ? updated : r));
        renderRekomendasi();
        applyFilters();
      }).catch(() => {});
    }

    const fileTitle = `Label-Rak-${sanitizeFilename(state.currentLabelData.nama)}-${tanggalFileStamp()}`;
    printDocument(fileTitle, closeLabelModal);
  });
}

/**
 * Setup Event Listeners untuk Modal Label Diskon Rak
 */
export function initLabelsEvents() {
  if (el.modalLabelClose) el.modalLabelClose.addEventListener('click', closeLabelModal);
  if (el.modalLabelCancel) el.modalLabelCancel.addEventListener('click', closeLabelModal);
  if (el.modalLabelDiskon) {
    el.modalLabelDiskon.addEventListener('click', (e) => {
      if (e.target === el.modalLabelDiskon) closeLabelModal();
    });
  }
  if (el.btnPrintLabels) el.btnPrintLabels.addEventListener('click', printShelfLabels);

  if (el.labelInputHargaAsli) el.labelInputHargaAsli.addEventListener('input', updateLabelPreview);
  if (el.labelInputTagline) el.labelInputTagline.addEventListener('change', updateLabelPreview);
  if (el.labelInputQty) el.labelInputQty.addEventListener('change', updateLabelPreview);

  if (el.labelPctGroup) {
    el.labelPctGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pct]');
      if (!btn) return;
      state.currentLabelData.diskonPct = Number(btn.dataset.pct);
      updateLabelPctButtons(state.currentLabelData.diskonPct);
      updateLabelPreview();
    });
  }
}
