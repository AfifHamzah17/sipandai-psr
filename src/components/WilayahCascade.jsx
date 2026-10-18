import {useEffect,useState} from 'react';
import {Field,inp} from './ui.jsx';

// Chained dropdown Provinsi → Kabupaten/Kota → Kecamatan memakai dataset
// wilayah administratif Indonesia publik (emsifa). Kalau API-nya tidak bisa
// dihubungi (offline, diblokir jaringan, dsb), setiap tingkat otomatis
// berpindah ke input teks manual supaya form tetap bisa diisi (item 14).
const BASE='https://www.emsifa.com/api-wilayah-indonesia/api';

export default function WilayahCascade({value,onChange,errors={}}){
  const [provinces,setProvinces]=useState(null); // null = belum dicoba, [] = gagal→manual, [...] = berhasil
  const [regencies,setRegencies]=useState(null);
  const [districts,setDistricts]=useState(null);
  const [ids,setIds]=useState({prov:'',kab:'',kec:''});

  useEffect(()=>{
    fetch(`${BASE}/provinces.json`).then(r=>{if(!r.ok)throw 0;return r.json()}).then(setProvinces).catch(()=>setProvinces([]));
  },[]);

  const pickProv=e=>{
    const id=e.target.value,name=e.target.selectedOptions[0]?.text||'';
    setIds({prov:id,kab:'',kec:''});setRegencies(null);setDistricts(null);
    onChange({prov:name,kab:'',kec:''});
    if(id)fetch(`${BASE}/regencies/${id}.json`).then(r=>{if(!r.ok)throw 0;return r.json()}).then(setRegencies).catch(()=>setRegencies([]));
  };
  const pickKab=e=>{
    const id=e.target.value,name=e.target.selectedOptions[0]?.text||'';
    setIds(s=>({...s,kab:id,kec:''}));setDistricts(null);
    onChange({kab:name,kec:''});
    if(id)fetch(`${BASE}/districts/${id}.json`).then(r=>{if(!r.ok)throw 0;return r.json()}).then(setDistricts).catch(()=>setDistricts([]));
  };
  const pickKec=e=>onChange({kec:e.target.selectedOptions[0]?.text||''});

  const manualProv=provinces===null||provinces.length===0,manualKab=regencies===null||regencies.length===0||!ids.prov,manualKec=districts===null||districts.length===0||!ids.kab;

  return <div className="grid gap-4 sm:grid-cols-3">
    <Field id="wp" label="Provinsi" required error={errors.prov}>
      {manualProv?<input id="wp" className={inp(errors.prov)} placeholder={provinces===null?'Memuat…':'Tulis manual'} disabled={provinces===null} value={value.prov} onChange={e=>onChange({prov:e.target.value})}/>
      :<select id="wp" className={inp(errors.prov)} value={ids.prov} onChange={pickProv}><option value="">Pilih provinsi</option>{provinces.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}
    </Field>
    <Field id="wk" label="Kabupaten/Kota" required error={errors.kab}>
      {manualKab?<input id="wk" className={inp(errors.kab)} placeholder={ids.prov&&regencies===null?'Memuat…':'Tulis manual'} disabled={!!ids.prov&&regencies===null} value={value.kab} onChange={e=>onChange({kab:e.target.value})}/>
      :<select id="wk" className={inp(errors.kab)} value={ids.kab} onChange={pickKab}><option value="">Pilih kabupaten/kota</option>{regencies.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>}
    </Field>
    <Field id="wc" label="Kecamatan" required error={errors.kec}>
      {manualKec?<input id="wc" className={inp(errors.kec)} placeholder={ids.kab&&districts===null?'Memuat…':'Tulis manual'} disabled={!!ids.kab&&districts===null} value={value.kec} onChange={e=>onChange({kec:e.target.value})}/>
      :<select id="wc" className={inp(errors.kec)} onChange={pickKec} defaultValue=""><option value="">Pilih kecamatan</option>{districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>}
    </Field>
  </div>;
}
