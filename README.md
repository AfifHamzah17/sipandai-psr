# SIPANDAI-PSR frontend

Vite + React 18, Tailwind CSS 3, react-router-dom 6, lucide-react, react-pdf (pdf.js), PWA lewat vite-plugin-pwa.

## Jalankan
```
npm install
npm run dev
npm run build && npm run preview   # lalu: npm run audit  (Lighthouse, butuh Chrome)
```
Login demo: kata sandi apa saja minimal 6 karakter, pilih peran di form. Data masih di memori (`src/store.jsx`); sambungkan ke backend lewat `VITE_API_BASE_URL`.

## Struktur
`src/pages` (satu chunk per halaman) · `src/components` (ui, Layout, Fab, Chart, PdfViewer, InstallPrompt, Toast) · `src/store.jsx` (reducer, dispatch terpisah dari state) · `src/lib/utils.js` (aturan R1–R7, luas poligon, produktivitas).

## Performa
Chunk per rute dan per vendor (`react`, `pdf`) · PDF viewer dimuat saat dibuka · font Geist self-host (fontsource) · tabel dipaginasi, pencarian di-debounce 250 ms · `memo`, `useMemo`, dispatch store terpisah · skeleton pada Suspense · grafik SVG tanpa library · cache aset `immutable` di `vercel.json` · worker pdf.js ikut precache service worker.
