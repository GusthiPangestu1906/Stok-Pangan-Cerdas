/**
 * Modul Manajemen Inventaris — Modal & Interaction Layer
 * Tanggung Jawab: Form tambah/edit barang, dialog konfirmasi hapus, dan event handling
 */

import { state } from './state.js?v=1.0.7';
import { el } from './elements.js?v=1.0.7';
import { showToast, withButtonLoading } from './utils.js?v=1.0.7';
import { loadRekomendasi, requestRekomendasi } from './ai.js?v=1.0.7';
import { openLabelModal } from './labels.js?v=1.0.7';
import { getItemStatusInfo } from './items-render.js';
import { renderFilters, applyFilters } from './items-filter.js';

export function openFormModal(item = null) {
  if (!el.modalForm) return;
  state.editingItemId = item ? item.id : null;
  el.modalFormTitle.textContent = item ? 'Edit Barang' : 'Tambah Barang';
  el.formError.classList.add('hidden');

  if (item) {
    el.inputNama.value = item.nama;
    el.inputKategori.value = item.kategori;
    el.inputMasuk.value = item.tanggal_masuk;
    el.inputUmur.value = item.estimasi_umur_simpan_hari;
    el.inputStok.value = item.jumlah_stok;
  } else {
    el.formItem.reset();
    el.inputMasuk.value = new Date().toISOString().split('T')[0];
  }

  el.modalForm.classList.remove('hidden');
  el.inputNama.focus();
}

export function closeFormModal() {
  if (!el.modalForm) return;
  el.modalForm.classList.add('hidden');
  state.editingItemId = null;
}

export function openDeleteModal(item) {
  if (!el.modalHapus) return;
  state.deletingItemId = item.id;
  const isKadaluarsa = item.sisa_hari < 0;
  el.modalHapusText.textContent = isKadaluarsa
    ? `"${item.nama}" (${item.jumlah_stok} unit) telah lewat masa kadaluarsa dan akan dicatat ke Riwayat sebagai barang terbuang/pemusnahan.`
    : `"${item.nama}" (${item.jumlah_stok} unit) akan dihapus dari stok aktif dan dicatat ke Riwayat sebagai barang terbuang.`;
  el.modalHapus.classList.remove('hidden');
}

export function closeDeleteModal() {
  if (!el.modalHapus) return;
  el.modalHapus.classList.add('hidden');
  state.deletingItemId = null;
}

export async function handleActionClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  const item = state.allItems.find((i) => i.id === id);
  if (!item) return;

  if (action === 'edit') {
    openFormModal(item);
  } else if (action === 'hapus') {
    openDeleteModal(item);
  } else if (action === 'ai') {
    const statusInfo = getItemStatusInfo(item);
    if (statusInfo.isApplied) {
      showToast(`Tindakan AI "${statusInfo.jenisSaran}" untuk "${item.nama}" telah diterapkan.`);
      return;
    }
    // Jika sudah ada rekomendasi aktif yang menunggu tindakan, sorot kartunya di panel AI
    if (statusInfo.hasAiAction && statusInfo.rekomendasi) {
      const recId = statusInfo.rekomendasi.id;
      const aiCard = document.querySelector(
        `[data-buang-item="${item.id}"], [data-cetak-label="${recId}"], [data-terapkan="${recId}"], [data-buat-voucher="${recId}"], [data-cetak-bundling="${recId}"]`
      )?.closest('.card');
      if (aiCard) {
        aiCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        aiCard.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2');
        setTimeout(() => aiCard.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2'), 2500);
        showToast(`Membuka rekomendasi AI "${statusInfo.jenisSaran}" untuk ${item.nama}.`);
        return;
      }
    }
    await requestRekomendasi(item, btn);
  } else if (action === 'label') {
    const rekomendasi = state.allRekomendasi.find((r) => r.item_id === item.id);
    openLabelModal(item, rekomendasi);
  }
}

export async function loadItems() {
  try {
    const data = await window.fetchItems();
    state.allItems = data || [];
    renderFilters();
    applyFilters();
  } catch (err) {
    if (el.error) {
      el.error.textContent = err.message || 'Gagal memuat data barang.';
      el.error.classList.remove('hidden');
    }
  }
}

/**
 * Setup Event Listeners untuk Inventaris
 */
export function initItemsEvents() {
  if (el.btnTambah) el.btnTambah.addEventListener('click', () => openFormModal());
  if (el.btnTambahFab) el.btnTambahFab.addEventListener('click', () => openFormModal());
  if (el.modalFormClose) el.modalFormClose.addEventListener('click', closeFormModal);
  if (el.formCancel) el.formCancel.addEventListener('click', closeFormModal);
  if (el.modalForm) {
    el.modalForm.addEventListener('click', (e) => {
      if (e.target === el.modalForm) closeFormModal();
    });
  }

  // Submit Form Item dengan Loading Button & Disabled State
  if (el.formItem) {
    el.formItem.addEventListener('submit', async (e) => {
      e.preventDefault();
      el.formError.classList.add('hidden');

      const payload = {
        nama: el.inputNama.value.trim(),
        kategori: el.inputKategori.value.trim(),
        tanggal_masuk: el.inputMasuk.value,
        estimasi_umur_simpan_hari: Number(el.inputUmur.value),
        jumlah_stok: Number(el.inputStok.value),
      };

      await withButtonLoading(el.formSubmit, 'Menyimpan...', async () => {
        try {
          if (state.editingItemId) {
            await window.updateItem(state.editingItemId, payload);
            showToast('Barang berhasil diperbarui.');
          } else {
            await window.createItem(payload);
            showToast('Barang berhasil ditambahkan.');
          }
          closeFormModal();
          await loadRekomendasi();
          await loadItems();
        } catch (err) {
          el.formError.textContent = err.message || 'Gagal menyimpan barang.';
          el.formError.classList.remove('hidden');
        }
      });
    });
  }

  // Modal Hapus Event Listeners dengan Loading Button
  if (el.modalHapusCancel) el.modalHapusCancel.addEventListener('click', closeDeleteModal);
  if (el.modalHapus) {
    el.modalHapus.addEventListener('click', (e) => {
      if (e.target === el.modalHapus) closeDeleteModal();
    });
  }

  if (el.modalHapusConfirm) {
    el.modalHapusConfirm.addEventListener('click', async () => {
      if (!state.deletingItemId) return;
      await withButtonLoading(el.modalHapusConfirm, 'Menghapus...', async () => {
        try {
          await window.deleteItem(state.deletingItemId);
          showToast('Barang berhasil dihapus dan dicatat ke riwayat sebagai pangan terbuang.');
          closeDeleteModal();
          await loadRekomendasi();
          await loadItems();
        } catch (err) {
          showToast(err.message || 'Gagal menghapus barang.');
        }
      });
    });
  }

  // Delegasi event klik aksi pada tabel dan kartu (Inventaris & Dashboard Urgent)
  if (el.tableBody) el.tableBody.addEventListener('click', handleActionClick);
  if (el.cards) el.cards.addEventListener('click', handleActionClick);

  const urgentContainer = document.getElementById('urgent-container');
  if (urgentContainer) urgentContainer.addEventListener('click', handleActionClick);

  // Filter input pencarian, dropdown kategori, & tombol reset
  if (el.cari) el.cari.addEventListener('input', applyFilters);

  if (el.filterKategori) {
    el.filterKategori.addEventListener('change', () => {
      state.activeKategori = el.filterKategori.value;
      applyFilters();
    });
  }

  if (el.resetFilter) {
    el.resetFilter.addEventListener('click', () => {
      state.activeKategori = 'Semua';
      state.activeStatus = 'Semua';
      if (el.filterKategori) el.filterKategori.value = 'Semua';
      if (el.cari) el.cari.value = '';
      renderFilters();
      applyFilters();
    });
  }
}
