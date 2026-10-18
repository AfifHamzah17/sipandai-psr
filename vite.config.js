import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig({
resolve:{alias:{buffer:'buffer'}},
define:{global:'globalThis'},
optimizeDeps:{include:['buffer','shpjs','@mapbox/shp-write','jszip']},
plugins:[react(),VitePWA({registerType:'autoUpdate',injectRegister:false,includeAssets:['favicon.svg','contoh-tiket-timbang.pdf'],
devOptions:{enabled:true,type:'module'},
manifest:{name:'SIPANDAI-PSR',short_name:'SIPANDAI',description:'Panen dan produktivitas sawit rakyat pascareplanting',lang:'id',theme_color:'#123A2A',background_color:'#F2F5F3',display:'standalone',start_url:'/',
icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},
workbox:{globPatterns:['**/*.{js,css,html,svg,png,woff2,mjs,pdf}'],navigateFallback:'/index.html',maximumFileSizeToCacheInBytes:5*1024*1024}})],
build:{target:'es2020',rollupOptions:{output:{manualChunks:{react:['react','react-dom','react-router-dom'],pdf:['react-pdf','pdfjs-dist'],gis:['leaflet','@geoman-io/leaflet-geoman-free','@turf/turf','shpjs','@mapbox/shp-write','jszip']}}}}});
