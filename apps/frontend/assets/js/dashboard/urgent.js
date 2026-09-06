/**
 * Modul Seksi Barang Perlu Tindakan Segera (Urgent Action Items)
 * Khusus untuk Dashboard Utama (Monitoring & Tindakan Cepat)
 */

import { state } from './state.js?v=1.0.7';
import { renderTableRow, renderCard, handleActionClick } from './items.js?v=1.0.9';

let isUrgentEventsBound = false;

export function renderUrgentSection() {
  const urgentContainer = document.getElementById('urgent-container');
  const urgentTableBody = document.getElementById('urgent-table-body');
  const urgentCards = document.getElementById('urgent-cards');
  const urgentLoading = document.getElementById('urgent-loading');
  const urgentEmpty = document.getElementById('urgent-empty');
  const urgentBadgeCount = document.getElementById('urgent-badge-count');

  if (!urgentContainer) return; // Bukan di halaman Dashboard

  // Pasang event listener aksi cepat jika belum terpasang
  if (!isUrgentEventsBound) {
    urgentContainer.addEventListener('click', handleActionClick);
    isUrgentEventsBound = true;
  }

  if (urgentLoading) urgentLoading.classList.add('hidden');

  const currentFilter = (state.activeStatus || 'Semua').toLowerCase();

  // Filter barang berisiko & kritis
  let urgentItems = state.allItems.filter(
    (item) => item.status === 'kritis' || item.status === 'berisiko'
  );

  // Jika user mengklik filter KPI Kritis atau Berisiko di dashboard
  if (currentFilter === 'kritis') {
    urgentItems = urgentItems.filter((i) => i.status === 'kritis');
  } else if (currentFilter === 'berisiko') {
    urgentItems = urgentItems.filter((i) => i.status === 'berisiko');
  }
  // Catatan: Jika filter 'semua' atau 'aman', tetap tampilkan seluruh barang berisiko & kritis agar user selalu terinformasi!

  // Urutkan: Kritis terlebih dahulu, lalu berdasarkan sisa hari paling dekat
  urgentItems.sort((a, b) => {
    if (a.status === 'kritis' && b.status !== 'kritis') return -1;
    if (a.status !== 'kritis' && b.status === 'kritis') return 1;
    return a.sisa_hari - b.sisa_hari;
  });

  if (urgentBadgeCount) {
    urgentBadgeCount.textContent = `${urgentItems.length} Barang`;
  }

  if (urgentItems.length === 0) {
    urgentContainer.classList.add('hidden');
    if (urgentEmpty) {
      urgentEmpty.innerHTML = `
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="font-heading text-[15px] font-semibold text-primary">Semua Stok Pangan Aman!</div>
        <p class="text-xs text-secondary max-w-sm mt-1">Tidak ada stok berstatus waspada atau kritis saat ini. Seluruh bahan pangan dalam kondisi simpan yang baik.</p>
      `;
      urgentEmpty.classList.remove('hidden');
    }
    return;
  }

  if (urgentEmpty) urgentEmpty.classList.add('hidden');
  urgentContainer.classList.remove('hidden');

  if (urgentTableBody) {
    urgentTableBody.innerHTML = '';
    const frag = document.createDocumentFragment();
    urgentItems.forEach((item) => {
      frag.appendChild(renderTableRow(item));
    });
    urgentTableBody.appendChild(frag);
  }

  if (urgentCards) {
    urgentCards.innerHTML = '';
    const frag = document.createDocumentFragment();
    urgentItems.forEach((item) => {
      frag.appendChild(renderCard(item));
    });
    urgentCards.appendChild(frag);
  }
}
