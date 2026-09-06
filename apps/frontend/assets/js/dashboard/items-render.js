/**
 * Modul Manajemen Inventaris — Render Layer
 * Tanggung Jawab: Render tabel, kartu mobile, status badge, progress bar, dan tombol aksi
 */

import { state } from './state.js?v=1.0.7';
import { el } from './elements.js?v=1.0.7';
import {
  formatTanggal,
  sisaHariText,
  progressPercent,
} from './utils.js?v=1.0.7';
import { isSudahDiterapkanBaruBaruIni } from './ai.js?v=1.0.7';

export function getItemStatusInfo(item) {
  if (!item) return { label: '', badgeClass: 'badge-default', dotColor: '#8a9a8f' };

  // 1. Cek apakah ada rekomendasi yang sudah DITERAPKAN hari ini (prioritas utama)
  const appliedRec = (state.allRekomendasi || []).find(
    (r) => r.item_id === item.id && (r.diterapkan === true || r.diterapkan === 1) && isSudahDiterapkanBaruBaruIni(r)
  );

  // 2. Cek apakah ada rekomendasi AI aktif yang menunggu tindakan
  const pendingRec = (state.allRekomendasi || []).find(
    (r) => r.item_id === item.id && (!r.diterapkan || r.diterapkan === false || r.diterapkan === 0)
  );

  const activeRec = appliedRec || pendingRec;
  const isApplied = Boolean(appliedRec);
  const rawJenis = activeRec?.jenis_saran ? activeRec.jenis_saran.trim() : null;
  const jenisSaran = rawJenis ? (rawJenis.charAt(0).toUpperCase() + rawJenis.slice(1)) : null;

  // Status risiko bawaan barang (Aman, Berisiko, Kritis)
  const dotColors = { aman: '#22c55e', berisiko: '#f59e0b', kritis: '#e11d48' };
  const rawStatus = (item.status || 'aman').toLowerCase();
  const label = rawStatus === 'berisiko' ? 'Berisiko' : (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1));
  const dotColor = dotColors[rawStatus] || '#8a9a8f';
  const badgeClass = `badge-${rawStatus}`;

  return {
    hasAiAction: Boolean(activeRec),
    isApplied,
    jenisSaran,
    label,
    badgeClass,
    dotClass: `dot-${rawStatus}`,
    dotColor,
    title: isApplied
      ? `Status: ${label} · Tindakan AI "${jenisSaran}" telah diterapkan`
      : jenisSaran
      ? `Status: ${label} · Saran AI: "${jenisSaran}"`
      : `Status: ${label}`,
    rekomendasi: activeRec,
  };
}

export function hasRekomendasiAktif(itemId) {
  return state.allRekomendasi.some((r) => (
    r.item_id === itemId && (!r.diterapkan || isSudahDiterapkanBaruBaruIni(r))
  ));
}

export function renderActionButtons(item, isMobile = false) {
  const template = document.getElementById('tmpl-action-buttons');
  if (!template) return document.createElement('div');
  const clone = template.content.cloneNode(true);

  const btnAi = clone.querySelector('[data-action="ai"]');
  const btnLabel = clone.querySelector('[data-action="label"]');
  const btnEdit = clone.querySelector('[data-action="edit"]');
  const btnHapus = clone.querySelector('[data-action="hapus"]');

  const bisaAi = item.status !== 'aman';
  const statusInfo = getItemStatusInfo(item);
  const sudahKadaluarsa = item.sisa_hari < 0;

  // 1. Tombol AI (hanya untuk barang kritis/berisiko)
  if (bisaAi && btnAi) {
    btnAi.classList.remove('hidden');
    btnAi.dataset.id = item.id;

    if (statusInfo.hasAiAction) {
      if (statusInfo.isApplied) {
        btnAi.disabled = true;
        btnAi.className = isMobile
          ? 'btn bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold cursor-default'
          : 'btn btn-outline btn-icon border-emerald-300 text-emerald-800 bg-emerald-50/70 w-7 h-7 shrink-0 cursor-default';
        btnAi.title = `Tindakan AI "${statusInfo.jenisSaran}" telah diterapkan`;
        btnAi.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;
        if (isMobile) {
          const labelSpan = document.createElement('span');
          labelSpan.textContent = statusInfo.jenisSaran;
          btnAi.appendChild(labelSpan);
        }
      } else {
        btnAi.className = isMobile
          ? 'btn bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100 cursor-pointer text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold'
          : 'btn btn-outline btn-icon border-purple-200 text-purple-700 hover:bg-purple-50 cursor-pointer transition-colors w-7 h-7 shrink-0';
        btnAi.title = `Saran AI: ${statusInfo.jenisSaran} (Klik untuk melihat saran)`;
        btnAi.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v3M12 18v3M4.9 7.5l2.6 1.5M16.5 15l2.6 1.5M4.9 16.5l2.6-1.5M16.5 9l2.6-1.5" />
            <circle cx="12" cy="12" r="3.4" />
          </svg>
        `;
        if (isMobile) {
          const labelSpan = document.createElement('span');
          labelSpan.textContent = `Saran: ${statusInfo.jenisSaran}`;
          btnAi.appendChild(labelSpan);
        }
      }
    } else {
      btnAi.className = isMobile
        ? 'btn bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100 cursor-pointer text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold'
        : 'btn btn-outline btn-icon border-purple-200 text-purple-700 hover:bg-purple-50 cursor-pointer transition-colors w-7 h-7 shrink-0';
      btnAi.title = 'Minta Saran AI';
      btnAi.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v3M12 18v3M4.9 7.5l2.6 1.5M16.5 15l2.6 1.5M4.9 16.5l2.6-1.5M16.5 9l2.6-1.5" />
          <circle cx="12" cy="12" r="3.4" />
        </svg>
      `;
      if (isMobile) {
        const labelSpan = document.createElement('span');
        labelSpan.textContent = 'Minta Saran AI';
        btnAi.appendChild(labelSpan);
      }
    }
  } else if (btnAi) {
    btnAi.remove();
  }

  // 2. Tombol Label Rak (untuk barang yang belum kadaluarsa)
  const bisaLabelRak = !sudahKadaluarsa;
  if (btnLabel) {
    if (bisaLabelRak) {
      btnLabel.dataset.id = item.id;
      btnLabel.title = 'Cetak Label Rak';
      if (isMobile) {
        btnLabel.className = 'btn btn-outline btn-icon hover:!border-purple-300 hover:!text-purple-700';
      } else {
        btnLabel.className = 'btn btn-outline btn-icon hover:!border-purple-300 hover:!text-purple-700 w-7 h-7 shrink-0';
      }
    } else {
      btnLabel.remove();
    }
  }

  // 3. Tombol Edit & Hapus
  if (btnEdit) btnEdit.dataset.id = item.id;
  if (btnHapus) btnHapus.dataset.id = item.id;

  if (isMobile && btnEdit && btnHapus) {
    btnEdit.className = 'btn btn-outline btn-icon';
    btnHapus.className = 'btn btn-outline btn-icon hover:!border-danger hover:!text-danger';

    const rightActions = document.createElement('div');
    rightActions.className = 'flex items-center gap-1.5 ml-auto';
    if (btnLabel && bisaLabelRak && btnLabel.parentNode) {
      btnLabel.parentNode.insertBefore(rightActions, btnLabel);
      rightActions.appendChild(btnLabel);
    } else if (btnEdit.parentNode) {
      btnEdit.parentNode.insertBefore(rightActions, btnEdit);
    }
    rightActions.appendChild(btnEdit);
    rightActions.appendChild(btnHapus);
  } else {
    if (btnEdit) btnEdit.className = 'btn btn-outline btn-icon w-7 h-7 shrink-0';
    if (btnHapus) btnHapus.className = 'btn btn-outline btn-icon hover:!border-danger hover:!text-danger w-7 h-7 shrink-0';
  }

  return clone;
}

export function renderTableRow(item) {
  const pct = progressPercent(item);
  const template = document.getElementById('tmpl-table-row');
  if (!template) return document.createElement('div');
  const clone = template.content.cloneNode(true);

  const statusInfo = getItemStatusInfo(item);

  const dotEl = clone.querySelector('.js-dot');
  if (dotEl) {
    dotEl.classList.add(statusInfo.dotClass);
  }

  const statusDot = clone.querySelector('.js-status-dot');
  if (statusDot) {
    statusDot.style.backgroundColor = statusInfo.dotColor;
  }

  const elNama = clone.querySelector('.js-nama');
  if (elNama) elNama.textContent = item.nama;

  const elKategori = clone.querySelector('.js-kategori');
  if (elKategori) elKategori.textContent = item.kategori;

  const elStok = clone.querySelector('.js-stok');
  if (elStok) elStok.textContent = item.jumlah_stok;

  const elKadaluarsa = clone.querySelector('.js-kadaluarsa');
  if (elKadaluarsa) elKadaluarsa.textContent = formatTanggal(item.tanggal_kadaluarsa);

  const elSisa = clone.querySelector('.js-sisa-text');
  if (elSisa) {
    elSisa.textContent = sisaHariText(item.sisa_hari);
    const sisaColors = { aman: '#166534', berisiko: '#92400e', kritis: '#9f1239' };
    elSisa.style.color = sisaColors[item.status] || '';
  }

  const progressBar = clone.querySelector('.js-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${pct}%`;
    progressBar.classList.add(`progress-${item.status}`);
  }

  const badge = clone.querySelector('.js-status-badge');
  if (badge) {
    badge.textContent = statusInfo.label;
    badge.className = `js-status-badge badge text-[11px] ${statusInfo.badgeClass}`;
    badge.title = statusInfo.title;
  }

  const actions = clone.querySelector('.js-actions');
  if (actions) {
    actions.appendChild(renderActionButtons(item, false));
  }

  return clone;
}

export function renderCard(item) {
  const pct = progressPercent(item);
  const template = document.getElementById('tmpl-card');
  if (!template) return document.createElement('div');
  const clone = template.content.cloneNode(true);

  const statusInfo = getItemStatusInfo(item);

  const elNama = clone.querySelector('.js-nama');
  if (elNama) elNama.textContent = item.nama;

  const elKategori = clone.querySelector('.js-kategori');
  if (elKategori) elKategori.textContent = item.kategori;

  const elStok = clone.querySelector('.js-stok');
  if (elStok) elStok.textContent = item.jumlah_stok;

  const elSisa = clone.querySelector('.js-sisa-text');
  if (elSisa) elSisa.textContent = sisaHariText(item.sisa_hari);

  const elKadaluarsa = clone.querySelector('.js-kadaluarsa');
  if (elKadaluarsa) elKadaluarsa.textContent = formatTanggal(item.tanggal_kadaluarsa);

  const progressBar = clone.querySelector('.js-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${pct}%`;
    progressBar.classList.add(`progress-${item.status}`);
  }

  const badge = clone.querySelector('.js-status-badge');
  if (badge) {
    badge.textContent = statusInfo.label;
    badge.className = `js-status-badge badge shrink-0 ${statusInfo.badgeClass}`;
    badge.title = statusInfo.title;
  }

  const actions = clone.querySelector('.js-actions');
  if (actions) {
    actions.appendChild(renderActionButtons(item, true));
  }

  return clone;
}

export function renderItems(items) {
  if (!el.tableBody || !el.cards) return;
  el.tableBody.innerHTML = '';
  el.cards.innerHTML = '';

  const tableFrag = document.createDocumentFragment();
  const cardFrag = document.createDocumentFragment();

  items.forEach((item) => {
    tableFrag.appendChild(renderTableRow(item));
    cardFrag.appendChild(renderCard(item));
  });

  el.tableBody.appendChild(tableFrag);
  el.cards.appendChild(cardFrag);
}
