import {useCallback,useEffect,useRef,useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Peta pratinjau Leaflet, hanya baca (tanpa toolbar gambar — itu ada di
 * /kebun/peta). items: [{id, label, koordinat:[{lat,lng}], color?}]
 *
 * Pakai ref CALLBACK (bukan useRef+useEffect dengan deps []) supaya map
 * dibuat persis saat node DOM-nya benar-benar terpasang, dan dibongkar saat
 * node-nya lepas — ini menghindari "Map container not found" yang muncul
 * kalau komponennya di-remount lewat Suspense/StrictMode sebelum effect
 * sempat jalan dengan ref yang masih null.
 */
export default function MiniMap({items,height=360,onSelect,emptyText}){
  const [container,setContainer]=useState(null);
  const mapRef=useRef(),layersRef=useRef({});
  const setEl=useCallback(node=>setContainer(node),[]);

  useEffect(()=>{
    if(!container)return;
    const map=L.map(container,{center:[1.8034,100.1346],zoom:16,scrollWheelZoom:false});
    mapRef.current=map;
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {maxZoom:20,attribution:'Esri, Maxar, Earthstar Geographics'}).addTo(map);
    return ()=>{map.remove();mapRef.current=null;layersRef.current={}};
  },[container]);

  useEffect(()=>{
    const map=mapRef.current;if(!map)return;
    Object.values(layersRef.current).forEach(l=>map.removeLayer(l));
    layersRef.current={};
    const bounds=[];
    (items||[]).forEach(it=>{
      if(!it.koordinat?.length)return;
      const latlngs=it.koordinat.map(p=>[p.lat,p.lng]);
      const poly=L.polygon(latlngs,{color:it.color||'#e5484d',weight:2,fillOpacity:.35});
      poly.bindTooltip(it.label,{permanent:false,direction:'center',className:'font-sans text-xs'});
      if(onSelect)poly.on('click',()=>onSelect(it.id));
      poly.addTo(map);
      layersRef.current[it.id]=poly;
      bounds.push(...latlngs);
    });
    if(bounds.length)map.fitBounds(bounds,{padding:[24,24],maxZoom:19});
  },[items,onSelect,container]);

  if(!(items||[]).some(it=>it.koordinat?.length))return <div className="grid h-[200px] place-items-center rounded-2xl bg-tint/60 text-sm text-mute">{emptyText||'Belum ada data lokasi untuk ditampilkan.'}</div>;
  return <div ref={setEl} style={{height}} className="w-full overflow-hidden rounded-2xl ring-1 ring-line" role="img" aria-label="Peta lokasi kebun"/>;
}
