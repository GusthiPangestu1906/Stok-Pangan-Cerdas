/**
 * Modul Simulator Kasir & Scanner Barcode Voucher
 * Arsitektur Bersih (Clean Architecture) - Domain & Feature Layer
 */

import { state } from './state.js?v=1.0.5';
import { el } from './elements.js?v=1.0.5';
import { esc, formatRupiah, showToast, withButtonLoading } from './utils.js?v=1.0.5';
import { openVoucherModal, closeVoucherModal } from './vouchers.js?v=1.0.5';
import { closeLabelModal } from './labels.js?v=1.0.5';
import { closeFormModal, closeDeleteModal } from './items.js?v=1.0.5';

export function resetScanResultBox(pesan = 'Ketik atau pilih kode barcode di atas, lalu klik "Validasi"') {
  if (!el.scanResultContainer) return;
  el.scanResultContainer.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa89e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-1 opacity-60">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </svg>
    <span class="text-muted font-medium text-[11px]">${esc(pesan)}</span>
  `;
}

export function openScanVoucherModal() {
  closeLabelModal();
  closeVoucherModal();
  closeFormModal();
  closeDeleteModal();

  if (el.modalScanVoucher) el.modalScanVoucher.classList.remove('hidden');
  renderQuickVouchers();
  if (el.scanInputKode) {
    el.scanInputKode.value = '';
    el.scanInputKode.focus();
  }
  resetScanResultBox();
}

export function closeScanVoucherModal() {
  if (el.modalScanVoucher) el.modalScanVoucher.classList.add('hidden');
  stopScanCamera();
}

export async function renderQuickVouchers() {
  if (!el.scanQuickVouchers) return;

  let vouchers = [];
  try {
    vouchers = await window.fetchVouchers({ status: 'aktif' });
  } catch (err) {
    el.scanQuickVouchers.innerHTML = '<span class="text-gray-400 text-xs italic">Gagal memuat voucher dari server.</span>';
    return;
  }

  vouchers = (vouchers || []).filter((v) => v.terpakai < v.kuota);
  el.scanQuickVouchers.innerHTML = '';

  if (vouchers.length === 0) {
    el.scanQuickVouchers.innerHTML = '<span class="text-gray-400 text-xs italic">Belum ada voucher aktif.</span>';
    return;
  }

  vouchers.slice(0, 4).forEach((v) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'px-1.5 py-0.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold transition cursor-pointer shrink-0';
    chip.textContent = v.kode;
    chip.title = `${v.judul} (${v.tipe === 'persen' ? '-' + v.nilai + '%' : '-Rp ' + Number(v.nilai).toLocaleString('id-ID')})`;
    chip.addEventListener('click', () => {
      if (el.scanInputKode) el.scanInputKode.value = v.kode;
      doValidateVoucher();
    });
    el.scanQuickVouchers.appendChild(chip);
  });
}

export async function doValidateVoucher() {
  const kode = (el.scanInputKode?.value || '').trim().toUpperCase();
  const totalBelanja = Number(el.scanInputBelanja?.value || 0);

  if (!kode) {
    showToast('Masukkan kode voucher terlebih dahulu.');
    return;
  }

  await withButtonLoading(el.btnDoScan, 'Memvalidasi...', async () => {
    let voucher;
    try {
      voucher = await window.validasiVoucher(kode, totalBelanja);
    } catch (err) {
      const pesan = err.message || 'Voucher tidak dapat divalidasi.';
      const belumKadaluarsa = !pesan.toLowerCase().includes('kadaluarsa') && !pesan.toLowerCase().includes('berlaku');
      const isNotFound = pesan.toLowerCase().includes('tidak ditemukan');
      const isKuotaHabis = pesan.toLowerCase().includes('kuota');
      const isMinBelanja = pesan.toLowerCase().includes('minimal');

      if (isMinBelanja) {
        el.scanResultContainer.innerHTML = `
          <div class="w-full p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-left">
            <div class="flex items-center gap-1.5 font-bold text-xs">
              <span>⚠️ Belum Memenuhi Minimal Belanja</span>
            </div>
            <div class="text-[11px] mt-1">${esc(pesan)}</div>
          </div>
        `;
      } else if (isNotFound) {
        el.scanResultContainer.innerHTML = `
          <div class="w-full p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex flex-col items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="mb-1"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
            <strong class="font-bold text-xs">Voucher Tidak Ditemukan!</strong>
            <span class="text-[11px] mt-0.5">Kode "${esc(kode)}" tidak terdaftar di database server.</span>
          </div>
        `;
      } else if (isKuotaHabis) {
        el.scanResultContainer.innerHTML = `
          <div class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 flex flex-col items-center">
            <strong class="font-bold text-xs">Kuota Kupon Habis!</strong>
            <span class="text-[11px] mt-0.5">${esc(pesan)}</span>
          </div>
        `;
      } else if (!belumKadaluarsa) {
        el.scanResultContainer.innerHTML = `
          <div class="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex flex-col items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <strong class="font-bold text-xs">Kupon Telah Kadaluarsa!</strong>
            <span class="text-[11px] mt-0.5">${esc(pesan)}</span>
          </div>
        `;
      } else {
        el.scanResultContainer.innerHTML = `
          <div class="w-full p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex flex-col items-center">
            <strong class="font-bold text-xs">Voucher Tidak Valid</strong>
            <span class="text-[11px] mt-0.5">${esc(pesan)}</span>
          </div>
        `;
      }
      return;
    }

    let potongan = 0;
    if (voucher.tipe === 'persen') {
      potongan = Math.round((totalBelanja * (voucher.nilai / 100)) / 500) * 500;
    } else {
      potongan = Math.min(totalBelanja, voucher.nilai);
    }
    const totalAkhir = Math.max(0, totalBelanja - potongan);

    el.scanResultContainer.innerHTML = `
      <div class="w-full p-3.5 bg-emerald-50/90 border-2 border-emerald-500 rounded-xl text-left text-emerald-950 flex flex-col gap-2.5 box-border">
        <!-- Header Status & Badge Diskon -->
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1 bg-emerald-800 text-white text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Kupon Valid & Aktif</span>
          </span>
          <span class="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300/70">
            Diskon ${voucher.tipe === 'persen' ? voucher.nilai + '%' : formatRupiah(voucher.nilai)}
          </span>
        </div>

        <!-- Nama Kupon / Promo Lengkap -->
        <div>
          <h4 class="font-heading font-bold text-[13px] sm:text-sm text-gray-900 leading-snug break-words">${esc(voucher.judul)}</h4>
          <p class="text-[10.5px] text-gray-500 mt-0.5">Target: ${esc(voucher.target || 'Semua Kategori')} · Sisa kuota: <strong>${voucher.sisa_kuota}</strong></p>
        </div>

        <!-- Rincian Biaya Kasir -->
        <div class="bg-white rounded-lg p-2.5 border border-emerald-200 text-xs flex flex-col gap-1.5 shadow-2xs">
          <div class="flex justify-between items-center text-gray-500 text-[11.5px]">
            <span>Total Belanja Awal:</span>
            <span class="font-medium">${formatRupiah(totalBelanja)}</span>
          </div>
          <div class="flex justify-between items-center text-emerald-700 text-[11.5px]">
            <span>Potongan Kupon:</span>
            <span class="font-bold">-${formatRupiah(potongan)}</span>
          </div>
          <div class="flex justify-between items-center font-bold pt-1.5 border-t border-gray-100 text-gray-900">
            <span class="text-xs text-emerald-950">Total Tagihan Kasir:</span>
            <span class="font-heading text-sm sm:text-base text-emerald-800">${formatRupiah(totalAkhir)}</span>
          </div>
        </div>

        <!-- Tombol Eksekusi dengan Loading Feedback -->
        <button type="button" id="btn-redeem-voucher" class="btn btn-primary h-9 px-3 text-xs font-semibold w-full mt-0.5 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Terapkan Kupon Kasir</span>
        </button>
      </div>
    `;

    document.getElementById('btn-redeem-voucher')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      await withButtonLoading(btn, 'Menerapkan Kupon...', async () => {
        try {
          const updated = await window.klaimVoucher(voucher.id, totalBelanja);
          showToast(`Kupon ${updated.kode} berhasil diklaim. Sisa kuota: ${updated.sisa_kuota}`);
          await renderQuickVouchers();
          await doValidateVoucher();
        } catch (err) {
          showToast(err.message || 'Gagal mengklaim voucher.');
        }
      });
    });
  });
}

export function isBarcodeDetectorSupported() {
  return typeof window.BarcodeDetector !== 'undefined';
}

export async function startScanCamera() {
  if (!el.scanCameraWrap || !el.scanCameraVideo) return;

  if (!isBarcodeDetectorSupported()) {
    if (el.scanCameraStatus) {
      el.scanCameraStatus.textContent = 'Browser tidak mendukung, silakan ketik manual.';
    }
    el.scanCameraWrap.classList.remove('hidden');
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    if (el.scanCameraStatus) {
      el.scanCameraStatus.textContent = 'Kamera tidak tersedia di perangkat ini.';
    }
    el.scanCameraWrap.classList.remove('hidden');
    return;
  }

  try {
    state.scanCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
  } catch (err) {
    showToast('Tidak bisa mengakses kamera. Periksa izin browser.');
    return;
  }

  el.scanCameraVideo.srcObject = state.scanCameraStream;
  el.scanCameraWrap.classList.remove('hidden');
  if (el.scanCameraStatus) el.scanCameraStatus.textContent = 'Arahkan kamera ke barcode voucher...';

  try {
    state.scanBarcodeDetector = new window.BarcodeDetector({ formats: ['code_39', 'code_128', 'ean_13', 'qr_code'] });
  } catch (err) {
    state.scanBarcodeDetector = new window.BarcodeDetector();
  }

  const detectLoop = async () => {
    if (!state.scanCameraStream || !el.scanCameraVideo) return;
    try {
      const barcodes = await state.scanBarcodeDetector.detect(el.scanCameraVideo);
      if (barcodes.length > 0) {
        const kode = barcodes[0].rawValue;
        if (el.scanInputKode) el.scanInputKode.value = kode.trim().toUpperCase();
        stopScanCamera();
        doValidateVoucher();
        return;
      }
    } catch (err) {
      // Frame belum siap / tidak terbaca
    }
    state.scanCameraRafId = requestAnimationFrame(detectLoop);
  };
  state.scanCameraRafId = requestAnimationFrame(detectLoop);
}

export function stopScanCamera() {
  if (state.scanCameraRafId) {
    cancelAnimationFrame(state.scanCameraRafId);
    state.scanCameraRafId = null;
  }
  if (state.scanCameraStream) {
    state.scanCameraStream.getTracks().forEach((track) => track.stop());
    state.scanCameraStream = null;
  }
  if (el.scanCameraVideo) el.scanCameraVideo.srcObject = null;
  if (el.scanCameraWrap) el.scanCameraWrap.classList.add('hidden');
}

/**
 * Setup Event Listeners untuk Scanner Kasir
 */
export function initScannerEvents() {
  if (el.btnNavScanVoucher) el.btnNavScanVoucher.addEventListener('click', openScanVoucherModal);
  if (el.btnMobileScanVoucher) el.btnMobileScanVoucher.addEventListener('click', openScanVoucherModal);
  if (el.btnKasirCreateVoucher) {
    el.btnKasirCreateVoucher.addEventListener('click', () => openVoucherModal(null, null, true));
  }
  if (el.modalScanClose) el.modalScanClose.addEventListener('click', closeScanVoucherModal);
  if (el.modalScanCloseBtn) el.modalScanCloseBtn.addEventListener('click', closeScanVoucherModal);
  if (el.modalScanVoucher) {
    el.modalScanVoucher.addEventListener('click', (e) => {
      if (e.target === el.modalScanVoucher) closeScanVoucherModal();
    });
  }
  if (el.btnDoScan) el.btnDoScan.addEventListener('click', doValidateVoucher);
  if (el.scanInputKode) {
    el.scanInputKode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doValidateVoucher();
    });
  }
  if (el.scanInputBelanja) {
    el.scanInputBelanja.addEventListener('input', () => {
      resetScanResultBox('Nominal belanja berubah, klik "Validasi" lagi untuk memeriksa ulang kupon.');
    });
  }
  if (el.btnScanCamera) el.btnScanCamera.addEventListener('click', startScanCamera);
  if (el.btnScanCameraClose) el.btnScanCameraClose.addEventListener('click', stopScanCamera);
}
