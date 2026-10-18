import {useMemo,useState} from 'react';
import {useStore} from '../store.jsx';
import {fmt,groupBy,periodLabel,produktivitas} from '../lib/utils.js';
import {Badge,DataTable,Field,PageHead,Panel,inp} from '../components/ui.jsx';

export default function Analisis(){
  const {kebun,panen,organisasi}=useStore();
  const [gr,setGr]=useState('bulanan'),[prov,setProv]=useState(''),[kab,setKab]=useState(''),[kec,setKec]=useState('');

  const provs=useMemo(()=>[...new Set(organisasi.map(o=>o.prov).filter(Boolean))].sort(),[organisasi]);
  const kabs=useMemo(()=>[...new Set(organisasi.filter(o=>!prov||o.prov===prov).map(o=>o.kab).filter(Boolean))].sort(),[organisasi,prov]);
  const kecs=useMemo(()=>[...new Set(organisasi.filter(o=>(!prov||o.prov===prov)&&(!kab||o.kab===kab)).map(o=>o.kec).filter(Boolean))].sort(),[organisasi,prov,kab]);

  const wilayahAktif=!!(prov||kab||kec);
  const orgIds=useMemo(()=>new Set(organisasi.filter(o=>(!prov||o.prov===prov)&&(!kab||o.kab===kab)&&(!kec||o.kec===kec)).map(o=>o._fid)),[organisasi,prov,kab,kec]);
  const kebunF=useMemo(()=>wilayahAktif?kebun.filter(k=>orgIds.has(k.org)):kebun,[kebun,wilayahAktif,orgIds]);
  const kebunOrgByKode=useMemo(()=>Object.fromEntries(kebun.map(k=>[k.id,k.org])),[kebun]);
  const panenF=useMemo(()=>wilayahAktif?panen.filter(p=>orgIds.has(kebunOrgByKode[p.k])):panen,[panen,wilayahAktif,orgIds,kebunOrgByKode]);

  const rows=useMemo(()=>produktivitas(kebunF,panenF),[kebunF,panenF]);
  const trend=useMemo(()=>{const v=panenF.filter(p=>p.st==='valid'),g=groupBy(v,p=>p.t.slice(0,7),gr);return Object.keys(g).sort().map(k=>({k:periodLabel(k,gr),kg:g[k].reduce((a,p)=>a+p.kg,0)}))},[panenF,gr]);
  const prev=trend.at(-2)?.kg??0,last=trend.at(-1)?.kg??0,delta=last-prev;

  return <>
    <PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Analisis'}]} title="Analisis" actions={
      <div className="flex flex-wrap items-center gap-3">
        <Field id="ag" label=""><select id="ag" className={inp()} value={gr} onChange={e=>setGr(e.target.value)}><option value="bulanan">Bulanan</option><option value="semester">Semester</option><option value="tahunan">Tahunan</option></select></Field>
        <Field id="ap" label=""><select id="ap" className={inp()} value={prov} onChange={e=>{setProv(e.target.value);setKab('');setKec('')}}><option value="">Semua provinsi</option>{provs.map(p=><option key={p}>{p}</option>)}</select></Field>
        <Field id="ak" label=""><select id="ak" className={inp()} value={kab} onChange={e=>{setKab(e.target.value);setKec('')}}><option value="">Semua kabupaten</option>{kabs.map(k=><option key={k}>{k}</option>)}</select></Field>
        <Field id="ac" label=""><select id="ac" className={inp()} value={kec} onChange={e=>setKec(e.target.value)}><option value="">Semua kecamatan</option>{kecs.map(k=><option key={k}>{k}</option>)}</select></Field>
      </div>}/>
    <Panel title="Tren produksi" className="mb-6">
      <p className="mb-3 text-sm text-mute">Perubahan antarperiode: <b className={delta>=0?'text-palm':'text-rose-600'}>{delta>=0?'+':''}{fmt(delta)} kg</b> dibanding periode sebelumnya.{wilayahAktif&&<span className="ml-1 text-xs">(disaring per wilayah)</span>}</p>
      <div className="flex items-end gap-3 overflow-x-auto pb-1">{trend.map(t=><div key={t.k} className="flex w-16 shrink-0 flex-col items-center gap-1 text-center text-xs text-mute"><span className="font-mono">{fmt(t.kg)}</span><i className="w-6 rounded-t bg-palm/70" style={{height:Math.max(6,t.kg/(Math.max(...trend.map(x=>x.kg),1))*90)}}/><span>{t.k}</span></div>)}</div>
    </Panel>
    <Panel title="Produktivitas per kebun">
      <p className="mb-4 max-w-[65ch] text-sm text-mute text-pretty">Hanya TBS berstatus Valid dan kebun terverifikasi yang dihitung. Kebun tanpa catatan menampilkan keterangan status, bukan 0.</p>
      <DataTable cols={[{h:'Kebun',c:r=>r.id},{h:'Pemilik',c:r=>r.own},{h:'Total TBS valid',c:r=>`${fmt(r.kg)} kg (${r.n} valid)`,n:1},
        {h:'Produktivitas',c:r=>r.ket?<Badge s={r.ket==='Belum Menghasilkan'||r.ket==='Belum Ada Catatan Panen'?'belum':'warn'} label={r.ket}/>:<><b className="font-mono tabular-nums">{fmt(r.kgha)}</b> kg/ha, Jul–Okt 2026<br/><small className="text-mute">dasar: luas terverifikasi {fmt(r.luas)} Ha</small></>}]} rows={rows}/>
    </Panel>
  </>;
}
