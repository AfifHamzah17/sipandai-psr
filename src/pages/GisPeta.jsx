import {useCallback,useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import {area as turfArea,length as turfLength} from '@turf/turf';
import {Crosshair,Download,FileUp,MapPin,Satellite,Trash2,Upload} from 'lucide-react';
import {toPts} from '../lib/geoTransform.js';
import {fmt} from '../lib/utils.js';
import {PageHead,Panel} from '../components/ui.jsx';
import {useToast} from '../components/Toast.jsx';

// Ikon pin default Leaflet (file PNG) sering gagal dimuat tergantung setup
// bundler. Dipakai lingkaran CSS murni sebagai gantinya — tidak bergantung
// pada file gambar sama sekali, selalu tampil.
const markerIcon=L.divIcon({className:'',html:'<span style="display:block;width:16px;height:16px;border-radius:50%;background:#228be6;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>',iconSize:[16,16],iconAnchor:[8,8]});
L.Marker.prototype.options.icon=markerIcon;

const TYPE_LABEL={point:'Titik',line:'Garis',area:'Area'};
const layerType=l=>l instanceof L.Marker?'point':(l instanceof L.Polygon?'area':(l instanceof L.Polyline?'line':'point'));
function measure(l,t){
  if(t==='area'){const ha=turfArea(l.toGeoJSON())/10000;return fmt(ha)+' Ha'}
  if(t==='line'){const m=turfLength(l.toGeoJSON(),{units:'kilometers'})*1000;return fmt(m)+' m'}
  const {lat,lng}=l.getLatLng();return lat.toFixed(5)+', '+lng.toFixed(5);
}
function downloadBlob(content,mime,filename){
  const blob=content instanceof Blob?content:new Blob([content],{type:mime});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}

export default function GisPeta(){
  const nav=useNavigate(),toast=useToast(),mapRef=useRef(),fgRef=useRef(),satRef=useRef(),jalanRef=useRef();
  const [rows,setRows]=useState([]),[basemap,setBasemap]=useState('satelit'),[busy,setBusy]=useState(false);

  const syncRows=useCallback(()=>{
    if(!fgRef.current)return;
    const list=fgRef.current.getLayers().map(l=>{
      const t=layerType(l);
      return {id:L.Util.stamp(l),type:t,label:TYPE_LABEL[t],name:l.feature?.properties?.name||'',measure:measure(l,t)};
    });
    setRows(list);
  },[]);
  const findLayer=id=>fgRef.current?.getLayers().find(l=>L.Util.stamp(l)===id);

  const [container,setContainer]=useState(null);
  const setMapEl=useCallback(node=>setContainer(node),[]);

  useEffect(()=>{
    if(!container)return;
    const map=L.map(container,{center:[1.8034,100.1346],zoom:17});
    mapRef.current=map;
    satRef.current=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Esri, Maxar, Earthstar Geographics'}).addTo(map);
    jalanRef.current=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'});
    const fg=L.featureGroup().addTo(map);fgRef.current=fg;

    map.pm.addControls({position:'topleft',drawCircle:false,drawCircleMarker:false,drawText:false,
      drawMarker:true,drawPolyline:true,drawRectangle:true,drawPolygon:true,editMode:true,dragMode:true,cutPolygon:false,removalMode:true,rotateMode:false});
    map.pm.setGlobalOptions({layerGroup:fg,snappable:true,allowSelfIntersection:false});
    map.on('pm:create',e=>{e.layer.feature=e.layer.feature||{type:'Feature',properties:{}};e.layer.on('pm:edit pm:dragend pm:markerdragend',syncRows);syncRows()});
    map.on('pm:remove',syncRows);
    fg.eachLayer(l=>l.on('pm:edit pm:dragend',syncRows));
    return ()=>{map.remove();mapRef.current=null;fgRef.current=null};
  },[container,syncRows]);

  const toggleBasemap=next=>{
    const map=mapRef.current;if(!map)return;
    if(next==='satelit'){map.removeLayer(jalanRef.current);map.addLayer(satRef.current)}
    else{map.removeLayer(satRef.current);map.addLayer(jalanRef.current)}
    setBasemap(next);
  };

  const rename=(id,name)=>{const l=findLayer(id);if(!l)return;l.feature=l.feature||{type:'Feature',properties:{}};l.feature.properties.name=name;syncRows()};
  const zoomTo=id=>{const l=findLayer(id);if(!l)return;mapRef.current.fitBounds(l.getBounds?l.getBounds():L.latLng(l.getLatLng()).toBounds(80),{maxZoom:19})};
  const removeRow=id=>{const l=findLayer(id);if(!l)return;fgRef.current.removeLayer(l);syncRows()};
  const clearAll=()=>{fgRef.current.clearLayers();syncRows()};

  const addGeoJson=geojson=>{
    L.geoJSON(geojson).eachLayer(l=>fgRef.current.addLayer(l));
    syncRows();
    try{mapRef.current.fitBounds(fgRef.current.getBounds(),{maxZoom:19})}catch{/* mungkin kosong */}
  };

  const onUploadGeoJson=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{const text=await file.text();addGeoJson(JSON.parse(text));toast('Berkas GeoJSON dimuat ke peta')}
    catch(err){toast('Gagal membaca GeoJSON: '+(err.message||'format tidak valid'),1)}
    finally{e.target.value=''}
  };

  const onUploadShp=async e=>{
    const file=e.target.files[0];if(!file)return;
    setBusy(true);
    try{
      const buf=await file.arrayBuffer();
      const shp=(await import('shpjs')).default;
      let geojson=await shp(buf);
      if(Array.isArray(geojson))geojson={type:'FeatureCollection',features:geojson.flatMap(fc=>fc.features)};
      addGeoJson(geojson);
      toast('Shapefile dimuat ke peta');
    }catch(err){toast('Gagal membaca Shapefile: '+(err.message||'pastikan berkas .zip berisi .shp, .shx, .dbf'),1)}
    finally{setBusy(false);e.target.value=''}
  };

  const exportGeoJson=()=>{
    const data=fgRef.current.toGeoJSON();
    if(!data.features.length)return toast('Belum ada data untuk diekspor',1);
    downloadBlob(JSON.stringify(data,null,2),'application/geo+json','peta-sipandai.geojson');
  };

  const exportShp=async()=>{
    const data=fgRef.current.toGeoJSON();
    if(!data.features.length)return toast('Belum ada data untuk diekspor',1);
    setBusy(true);
    try{
      const mod=await import('@mapbox/shp-write');
      const shpwrite=mod.default||mod;
      const blob=await new Promise((resolve,reject)=>{
        shpwrite.zip(data,{outputType:'blob',compression:'DEFLATE',types:{point:'titik',polygon:'area',polyline:'garis'}},(err,content)=>err?reject(err):resolve(content));
      });
      downloadBlob(blob,'application/zip','peta-sipandai-shapefile.zip');
      toast('Shapefile diunduh — bisa dibuka langsung di QGIS');
    }catch(err){toast('Gagal mengekspor Shapefile: '+(err.message||'periksa data pada peta'),1)}
    finally{setBusy(false)}
  };

  const polyRows=rows.filter(r=>r.type==='area');
  const useForKebun=()=>{
    if(polyRows.length!==1)return toast('Pastikan tepat satu bidang Area yang digambar untuk dipakai sebagai kebun',1);
    const l=findLayer(polyRows[0].id);
    const ring=(l.getLatLngs()[0]||l.getLatLngs()).map(ll=>({lat:ll.lat,lng:ll.lng}));
    sessionStorage.setItem('gis-polygon-pts',JSON.stringify(toPts(ring)));
    nav('/kebun');
  };

  return <>
    <PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Kebun & Peta',to:'/kebun'},{l:'Alat GIS'}]} title="Alat GIS"
      desc="Gambar titik, garis, atau area langsung di peta, unggah Shapefile atau GeoJSON, lalu ekspor hasilnya untuk dipakai di QGIS atau aplikasi GIS lain."/>
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Panel className="!p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div className="flex overflow-hidden rounded-lg ring-1 ring-line">
            <button className={'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium '+(basemap==='satelit'?'bg-palm text-onpalm':'bg-surface hover:bg-tint')} onClick={()=>toggleBasemap('satelit')}><Satellite size={14}/>Satelit</button>
            <button className={'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium '+(basemap==='jalan'?'bg-palm text-onpalm':'bg-surface hover:bg-tint')} onClick={()=>toggleBasemap('jalan')}><MapPin size={14}/>Jalan</button>
          </div>
          <label className="btn btn-o !h-9 cursor-pointer text-xs"><Upload size={14}/>Unggah GeoJSON<input type="file" accept=".geojson,.json" className="hidden" onChange={onUploadGeoJson}/></label>
          <label className="btn btn-o !h-9 cursor-pointer text-xs"><FileUp size={14}/>Unggah Shapefile (.zip)<input type="file" accept=".zip" className="hidden" disabled={busy} onChange={onUploadShp}/></label>
          <span className="ml-auto flex flex-wrap gap-2">
            <button className="btn btn-o !h-9 text-xs" disabled={busy} onClick={exportGeoJson}><Download size={14}/>Ekspor GeoJSON</button>
            <button className="btn btn-b !h-9 text-xs" disabled={busy} onClick={exportShp}><Download size={14}/>Ekspor Shapefile (ZIP)</button>
            <button className="btn btn-r !h-9 text-xs" disabled={!rows.length} onClick={clearAll}><Trash2 size={14}/>Hapus semua</button>
          </span>
        </div>
        <div ref={setMapEl} className="h-[520px] w-full" role="img" aria-label="Peta GIS interaktif"/>
      </Panel>
      <div className="grid content-start gap-4">
        <Panel title={`Layer (${rows.length})`}>
          {rows.length===0?<p className="text-sm text-mute">Belum ada objek. Pakai alat gambar di pojok kiri atas peta, atau unggah berkas GeoJSON/Shapefile.</p>:
          <ul className="grid gap-2">{rows.map(r=><li key={r.id} className="rounded-xl bg-tint/60 p-3 text-sm">
            <div className="flex items-center justify-between gap-2"><span className="rounded-md bg-palm/15 px-2 py-0.5 text-[11px] font-medium text-palm">{r.label}</span>
              <div className="flex gap-1"><button className="btn btn-o !h-7 !px-2" aria-label="Perbesar ke objek ini" onClick={()=>zoomTo(r.id)}><Crosshair size={13}/></button><button className="btn btn-r !h-7 !px-2" aria-label="Hapus objek ini" onClick={()=>removeRow(r.id)}><Trash2 size={13}/></button></div></div>
            <input className="mt-2 inp !h-8 !py-1 text-sm" placeholder="Nama objek" value={r.name} onChange={e=>rename(r.id,e.target.value)}/>
            <p className="mt-1 font-mono text-xs text-mute">{r.measure}</p></li>)}</ul>}
        </Panel>
        {polyRows.length===1&&<Panel><p className="mb-3 text-sm text-mute">Satu bidang Area terdeteksi. Pakai sebagai poligon kebun baru?</p><button className="btn btn-p w-full" onClick={useForKebun}>Gunakan untuk kebun baru</button></Panel>}
      </div>
    </div>
  </>;
}
