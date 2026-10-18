// Transformasi sederhana antara px sketsa (dipakai halaman Kebun & Peta, 1 px = 0,5 m)
// dan lat/lng sungguhan (dipakai Alat GIS berbasis Leaflet). Titik acuan sama dengan
// yang dipakai backend seed (sekitar Pasir Tuntung, Labuhanbatu Selatan).
export const PX_PER_DEG=111320/0.5;
export const toPts=koord=>(koord||[]).map(p=>[Math.round((p.lng-100.1336)*PX_PER_DEG),Math.round((1.8039-p.lat)*PX_PER_DEG)]);
export const toKoord=pts=>pts.map(([x,y])=>({lat:1.8039-y*.5/111320,lng:100.1336+x*.5/111320}));
