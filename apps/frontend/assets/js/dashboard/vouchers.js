/**
 * Modul Kupon Kasir Penyelamatan Pangan (Food Rescue Vouchers)
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
  generateBarcodeSvgBars,
  generateVoucherCode,
  printDocument,
  showToast,
  withButtonLoading,
} from './utils.js?v=1.0.5';
import { renderRekomendasi } from './ai.js?v=1.0.5';
import { applyFilters, closeFormModal, closeDeleteModal } from './items.js?v=1.0.5';
import { closeLabelModal } from './labels.js?v=1.0.5';
import { populateQtyOptions } from './labels.js?v=1.0.5';

let voucherOpenedFromScanner = false;

export function populateVoucherTargetOptions(selectedVal = 'Semua') {
  if (!el.voucherInputTarget) return;
  el.voucherInputTarget.innerHTML = '';

  const optGlobal = document.createElement('option');
  optGlobal.value = 'Semua';
  optGlobal.textContent = 'Semua Kategori (Global)';
  optGlobal.dataset.prefix = 'SPC';
  el.voucherInputTarget.appendChild(optGlobal);

  const categories = [...new Set(state.allItems.map((i) => i.kategori))];
  const catGroup = document.createElement('optgroup');
  catGroup.label = 'Kategori Produk';
  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = `Kategori: ${cat}`;
    opt.textContent = `Semua ${cat}`;
    opt.dataset.prefix = cat.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'CAT';
    catGroup.appendChild(opt);
  });
  el.voucherInputTarget.appendChild(catGroup);

  const itemGroup = document.createElement('optgroup');
  itemGroup.label = 'Pangan Spesifik (Stok Gudang)';
  state.allItems.forEach((i) => {
    const opt = document.createElement('option');
    opt.value = i.nama;
    opt.textContent = `${i.nama} (${i.kategori} · ${sisaHariText(i.sisa_hari)})`;
    opt.dataset.prefix = i.nama.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'ITM';
    opt.dataset.kadaluarsa = i.tanggal_kadaluarsa;
    opt.dataset.kategori = i.kategori;
    itemGroup.appendChild(opt);
  });
  el.voucherInputTarget.appendChild(itemGroup);

  el.voucherInputTarget.value = selectedVal;
}

export function populateVoucherQtyOptions(item, defaultQty = 4) {
  return populateQtyOptions(el.voucherInputQty, item, 'Kupon', defaultQty);
}

export function openVoucherModal(item = null, rekomendasi = null, fromScanner = false) {
  voucherOpenedFromScanner = Boolean(fromScanner);
  if (fromScanner && el.modalScanVoucher) {
    el.modalScanVoucher.classList.add('hidden');
  }
  closeLabelModal();
  closeFormModal();
  closeDeleteModal();

  const targetName = item ? item.nama : 'Semua';
  const targetKategori = item ? item.kategori : 'Semua Kategori';
  const defaultDiskon = rekomendasi ? 50 : 50;
  const kode = generateVoucherCode(item ? item.nama : 'SPC');

  populateVoucherTargetOptions(targetName);
  const qtyDefault = populateVoucherQtyOptions(item);

  let expDate = '2026-08-25';
  if (item && item.tanggal_kadaluarsa) {
    expDate = item.tanggal_kadaluarsa;
  }

  const untukTargetSpesifik = Boolean(item || rekomendasi);

  state.currentVoucherData = {
    judul: item ? `Food Rescue Promo · ${targetName}` : 'Kupon Penyelamatan Pangan Kasir',
    target: targetKategori,
    tipe: 'persen',
    nilai: defaultDiskon,
    minBelanja: untukTargetSpesifik ? 0 : 25000,
    kadaluarsa: expDate,
    qty: qtyDefault,
    kode: kode,
    rekomendasiId: rekomendasi ? rekomendasi.id : null,
  };

  if (el.voucherInputJudul) el.voucherInputJudul.value = state.currentVoucherData.judul;
  if (el.voucherInputTarget) el.voucherInputTarget.value = targetName;
  if (el.voucherInputKadaluarsa) el.voucherInputKadaluarsa.value = state.currentVoucherData.kadaluarsa;
  if (el.voucherInputMinBelanja) {
    el.voucherInputMinBelanja.value = state.currentVoucherData.minBelanja;
    const minBelanjaField = el.voucherInputMinBelanja.closest('div');
    if (minBelanjaField) minBelanjaField.classList.toggle('hidden', untukTargetSpesifik);
  }
  if (el.voucherInputQty) el.voucherInputQty.value = state.currentVoucherData.qty;
  if (el.voucherInputKode) el.voucherInputKode.value = state.currentVoucherData.kode;

  updateVoucherDiskonButtons(state.currentVoucherData.tipe, state.currentVoucherData.nilai);
  updateVoucherPreview();

  if (el.modalVoucher) el.modalVoucher.classList.remove('hidden');
}

export function closeVoucherModal() {
  if (el.modalVoucher) el.modalVoucher.classList.add('hidden');
  if (voucherOpenedFromScanner) {
    voucherOpenedFromScanner = false;
    if (el.modalScanVoucher) el.modalScanVoucher.classList.remove('hidden');
    if (el.scanInputKode && state.currentVoucherData.kode) {
      el.scanInputKode.value = state.currentVoucherData.kode;
    }
  }
}

export function updateVoucherDiskonButtons(selectedTipe, selectedVal) {
  if (!el.voucherDiskonGroup) return;
  const buttons = el.voucherDiskonGroup.querySelectorAll('[data-val]');
  buttons.forEach((btn) => {
    const isMatch = btn.dataset.tipe === selectedTipe && Number(btn.dataset.val) === Number(selectedVal);
    btn.classList.toggle('active', isMatch);
  });
}

export function updateVoucherPreview() {
  if (el.voucherInputJudul && el.voucherInputJudul.value) {
    state.currentVoucherData.judul = el.voucherInputJudul.value;
  }
  state.currentVoucherData.minBelanja = Math.max(0, Number(el.voucherInputMinBelanja?.value || 0));
  state.currentVoucherData.kadaluarsa = el.voucherInputKadaluarsa?.value || '2026-08-25';
  state.currentVoucherData.qty = Number(el.voucherInputQty?.value || 4);
  state.currentVoucherData.kode = (el.voucherInputKode?.value || 'VCHR-SPC-88219').trim().toUpperCase();

  if (el.voucherPreviewJudul) el.voucherPreviewJudul.textContent = state.currentVoucherData.judul;
  if (el.voucherPreviewTarget) el.voucherPreviewTarget.textContent = `Khusus: ${state.currentVoucherData.target}`;
  if (el.voucherPreviewMinBelanja) el.voucherPreviewMinBelanja.textContent = formatRupiah(state.currentVoucherData.minBelanja);

  const tanpaMinBelanja = state.currentVoucherData.minBelanja <= 0;
  if (el.voucherPreviewMinBelanjaCell) el.voucherPreviewMinBelanjaCell.classList.toggle('hidden', tanpaMinBelanja);
  if (el.voucherPreviewKadaluarsaCell) el.voucherPreviewKadaluarsaCell.classList.toggle('col-span-2', tanpaMinBelanja);
  if (el.voucherPreviewKadaluarsa) el.voucherPreviewKadaluarsa.textContent = formatTanggal(state.currentVoucherData.kadaluarsa);
  if (el.voucherPreviewKode) el.voucherPreviewKode.textContent = state.currentVoucherData.kode;

  if (el.voucherPreviewBadge) {
    if (state.currentVoucherData.tipe === 'persen') {
      el.voucherPreviewBadge.textContent = `-${state.currentVoucherData.nilai}%`;
    } else {
      el.voucherPreviewBadge.textContent = `-Rp ${Number(state.currentVoucherData.nilai).toLocaleString('id-ID')}`;
    }
  }

  if (el.voucherPreviewBarcodeSvg) {
    const barcodeData = generateBarcodeSvgBars(state.currentVoucherData.kode);
    el.voucherPreviewBarcodeSvg.setAttribute('viewBox', `0 0 ${barcodeData.totalWidth} 24`);
    el.voucherPreviewBarcodeSvg.innerHTML = barcodeData.rects;
  }
}

/**
 * Simpan data voucher ke backend & cetak kupon kasir
 * Dilengkapi pembungkus loading spinner dan status disabled pada tombol #btn-print-vouchers
 */
export async function saveAndPrintVouchers() {
  await withButtonLoading(el.btnPrintVouchers, 'Menyimpan & Menyiapkan...', async () => {
    const itemTarget = state.allItems.find((i) => (
      i.nama === state.currentVoucherData.target || `${state.currentVoucherData.target}`.startsWith(i.nama)
    ));

    const payload = {
      item_id: itemTarget ? itemTarget.id : null,
      rekomendasi_id: state.currentVoucherData.rekomendasiId || null,
      judul: state.currentVoucherData.judul,
      target: state.currentVoucherData.target,
      tipe: state.currentVoucherData.tipe,
      nilai: state.currentVoucherData.nilai,
      min_belanja: state.currentVoucherData.minBelanja,
      jumlah: state.currentVoucherData.qty,
      berlaku_sampai: state.currentVoucherData.kadaluarsa,
    };

    let voucherList;
    try {
      voucherList = await window.createVoucher(payload);
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan voucher ke server.');
      return;
    }

    if (!Array.isArray(voucherList) || voucherList.length === 0) {
      showToast('Gagal memproses respons kupon dari server.');
      return;
    }

    const voucherPertama = voucherList[0];
    state.currentVoucherData.kode = voucherPertama.kode;
    if (el.voucherInputKode) el.voucherInputKode.value = voucherPertama.kode;
    if (el.voucherPreviewKode) el.voucherPreviewKode.textContent = voucherPertama.kode;
    if (el.voucherPreviewBarcodeSvg) {
      const barcodeData = generateBarcodeSvgBars(voucherPertama.kode);
      el.voucherPreviewBarcodeSvg.setAttribute('viewBox', `0 0 ${barcodeData.totalWidth} 24`);
      el.voucherPreviewBarcodeSvg.innerHTML = barcodeData.rects;
    }

    showToast(`${voucherList.length} kupon berhasil disimpan ke sistem kasir.`);

    if (state.currentVoucherData.rekomendasiId) {
      window.terapkanRekomendasi(state.currentVoucherData.rekomendasiId).then((updated) => {
        state.allRekomendasi = state.allRekomendasi.map((r) => (r.id === updated.id ? updated : r));
        renderRekomendasi();
        applyFilters();
      }).catch(() => {});
    }

    if (!el.voucherTicketPreview || !el.printableVouchersArea) return;
    if (el.printableLabelsArea) el.printableLabelsArea.innerHTML = '';
    const previewHTML = el.voucherTicketPreview.outerHTML;

    el.printableVouchersArea.innerHTML = '';
    voucherList.forEach((v) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'voucher-print-item';
      itemDiv.innerHTML = previewHTML;

      const kodeEl = itemDiv.querySelector('#voucher-preview-kode');
      if (kodeEl) kodeEl.textContent = v.kode;

      const barcodeEl = itemDiv.querySelector('#voucher-preview-barcode-svg');
      if (barcodeEl) {
        const barcodeData = generateBarcodeSvgBars(v.kode);
        barcodeEl.setAttribute('viewBox', `0 0 ${barcodeData.totalWidth} 24`);
        barcodeEl.innerHTML = barcodeData.rects;
      }

      el.printableVouchersArea.appendChild(itemDiv);
    });

    const fileTitle = `Kupon-${sanitizeFilename(state.currentVoucherData.target)}-${tanggalFileStamp()}`;
    printDocument(fileTitle, closeVoucherModal);
  });
}

/**
 * Setup Event Listeners untuk Modal Kupon Kasir
 */
export function initVouchersEvents() {
  if (el.modalVoucherClose) el.modalVoucherClose.addEventListener('click', closeVoucherModal);
  if (el.modalVoucherCancel) el.modalVoucherCancel.addEventListener('click', closeVoucherModal);
  if (el.modalVoucher) {
    el.modalVoucher.addEventListener('click', (e) => {
      if (e.target === el.modalVoucher) closeVoucherModal();
    });
  }
  if (el.btnPrintVouchers) el.btnPrintVouchers.addEventListener('click', saveAndPrintVouchers);

  if (el.voucherInputJudul) el.voucherInputJudul.addEventListener('input', updateVoucherPreview);
  if (el.voucherInputMinBelanja) el.voucherInputMinBelanja.addEventListener('input', updateVoucherPreview);
  if (el.voucherInputKadaluarsa) el.voucherInputKadaluarsa.addEventListener('change', updateVoucherPreview);
  if (el.voucherInputQty) el.voucherInputQty.addEventListener('change', updateVoucherPreview);
  if (el.voucherInputKode) el.voucherInputKode.addEventListener('input', updateVoucherPreview);

  if (el.btnVoucherGenerateCode) {
    el.btnVoucherGenerateCode.addEventListener('click', () => {
      const opt = el.voucherInputTarget?.options[el.voucherInputTarget.selectedIndex];
      const prefix = opt?.dataset.prefix || 'SPC';
      const baru = generateVoucherCode(prefix);
      if (el.voucherInputKode) el.voucherInputKode.value = baru;
      updateVoucherPreview();
    });
  }

  if (el.voucherDiskonGroup) {
    el.voucherDiskonGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-val]');
      if (!btn) return;
      state.currentVoucherData.tipe = btn.dataset.tipe;
      state.currentVoucherData.nilai = Number(btn.dataset.val);
      updateVoucherDiskonButtons(state.currentVoucherData.tipe, state.currentVoucherData.nilai);
      updateVoucherPreview();
    });
  }

  if (el.voucherInputTarget) {
    el.voucherInputTarget.addEventListener('change', () => {
      const val = el.voucherInputTarget.value;
      const opt = el.voucherInputTarget.options[el.voucherInputTarget.selectedIndex];
      state.currentVoucherData.target = val;

      if (opt && opt.dataset.kadaluarsa) {
        state.currentVoucherData.kadaluarsa = opt.dataset.kadaluarsa;
        if (el.voucherInputKadaluarsa) el.voucherInputKadaluarsa.value = opt.dataset.kadaluarsa;
      }

      const itemTarget = state.allItems.find((i) => i.nama === val);
      state.currentVoucherData.qty = populateVoucherQtyOptions(itemTarget);

      const untukTargetSpesifik = Boolean(itemTarget);
      if (untukTargetSpesifik) {
        state.currentVoucherData.minBelanja = 0;
        if (el.voucherInputMinBelanja) el.voucherInputMinBelanja.value = 0;
      }
      if (el.voucherInputMinBelanja) {
        const minBelanjaField = el.voucherInputMinBelanja.closest('div');
        if (minBelanjaField) minBelanjaField.classList.toggle('hidden', untukTargetSpesifik);
      }

      const prefix = opt?.dataset.prefix || 'SPC';
      state.currentVoucherData.kode = generateVoucherCode(prefix);
      if (el.voucherInputKode) el.voucherInputKode.value = state.currentVoucherData.kode;

      updateVoucherPreview();
    });
  }
}
