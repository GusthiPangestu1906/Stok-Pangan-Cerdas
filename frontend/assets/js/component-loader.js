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
}
