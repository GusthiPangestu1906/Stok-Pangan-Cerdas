/**
 * Component Loader for Clean Frontend Architecture
 * Loads modular HTML component partials into [data-include] DOM slots.
 */
async function loadComponents() {
  const includeElements = Array.from(document.querySelectorAll('[data-include]'));
  
  await Promise.all(
    includeElements.map(async (element) => {
      const componentPath = element.getAttribute('data-include');
      if (!componentPath) return;

      try {
        // Gunakan cache-buster agar update komponen selalu termuat segar
        const response = await fetch(`${componentPath}?v=${Date.now()}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} saat memuat ${componentPath}`);
        }
        const html = await response.text();

        const temp = document.createElement('div');
        temp.innerHTML = html.trim();

        if (temp.childNodes.length > 0) {
          element.replaceWith(...temp.childNodes);
        }
      } catch (err) {
        console.error(`[ComponentLoader] Gagal memuat komponen: ${componentPath}`, err);
      }
    })
  );

  updateActiveNavLinks();
}

/**
 * Sinkronisasi status aktif otomatis pada bilah navigasi desktop & mobile
 */
function updateActiveNavLinks() {
  const path = window.location.pathname.toLowerCase();
  const isInventaris = path.includes('inventaris');
  const isRiwayat = path.includes('riwayat');
  const isDashboard = !isInventaris && !isRiwayat;

  // Mobile Bottom Nav items
  document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach((item) => {
    const href = (item.getAttribute('href') || '').toLowerCase();
    if (!href) return; // Tombol aksi modal (cth: scanner voucher)

    let isActive = false;
    if (isInventaris) {
      isActive = href.includes('inventaris');
    } else if (isRiwayat) {
      isActive = href.includes('riwayat');
    } else {
      isActive = href.includes('index') || href === './' || href === '';
    }

    item.classList.toggle('active', isActive);
    if (isActive) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });

  // Desktop Nav Pills
  document.querySelectorAll('.nav-pills .nav-link').forEach((link) => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    let isActive = false;
    if (isInventaris) {
      isActive = href.includes('inventaris');
    } else if (isRiwayat) {
      isActive = href.includes('riwayat');
    } else {
      isActive = href.includes('index') || href === './' || href === '';
    }

    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}
