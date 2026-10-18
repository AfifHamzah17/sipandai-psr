// Role 3 — Validator: Cek Konfirmasi PKS (hanya baca) beserta riwayat konfirmasinya.
import {useEffect,useMemo,useState} from 'react';
import {api} from '../api.js';
import {useStore} from '../store.jsx';
import {PKS_HASIL,ST,cn,fmt} from '../lib/utils.js';
import {Badge,DataTable,PageHead,Panel,Sheet,Skeleton} from '../components/ui.jsx';

export default function KonfirmasiPks(){
  const {panen}=useStore(),[f,setF]=useState(''),[sel,setSel]=useState(null),[hist,setHist]=useState(null);
  const rows=useMemo(()=>panen.filter(p=>p.st!=='draf').filter(p=>f==='belum'?!p.pks:f?p.pks?.hasil===f:true),[panen,f]);
  useEffect(()=>{
    if(!sel){setHist(null);return}
    setHist(null);api(`/validasi/konfirmasi-pks/${sel._fid}`).then(setHist).catch(()=>setHist([]));
  },[sel?._fid]);
  return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Konfirmasi PKS'}]} title="Konfirmasi PKS" desc="Hasil pencocokan PKS atas catatan panen pengurus. PKS hanya memberi konfirmasi; keputusan validasi tetap ditetapkan validator."/>
  <Panel><label className="mb-3 flex items-center gap-2 text-sm text-mute">Konfirmasi PKS<select className="h-9 rounded-lg border border-line bg-surface px-2 text-ink" value={f} onChange={e=>setF(e.target.value)}><option value="">Semua</option><option value="belum">Belum dikonfirmasi</option>{Object.entries(PKS_HASIL).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
  <DataTable size={10} rows={rows} cols={[
    {h:'Kode',c:r=>r.kode},{h:'Kelembagaan',c:r=>r.orgNama||'-'},{h:'Kebun',c:r=>r.k},{h:'Tanggal',c:r=>r.t,n:1},{h:'TBS (kg)',c:r=>fmt(r.kg),n:1},
    {h:'Konfirmasi PKS',c:r=>r.pks?<Badge s={r.pks.hasil}/>:<Badge s="belum_pks"/>},{h:'Selisih (kg)',c:r=>r.pks?.sel==null?'-':fmt(r.pks.sel),n:1},{h:'Status validasi',c:r=><Badge s={r.st}/>},
    {h:'Aksi',c:r=><button className="btn btn-o !h-8" onClick={()=>setSel(r)}>Detail</button>}]}/></Panel>
  <Sheet open={!!sel} onClose={()=>setSel(null)} title={sel?`Konfirmasi PKS ${sel.kode}`:''}>{sel&&<div className="grid gap-4 text-sm">
    <div className="rounded-xl bg-tint/60 p-4">{sel.orgNama} · kebun {sel.k}<br/>{sel.t} · <span className="font-mono">{fmt(sel.kg)}</span> kg · status validasi: {ST[sel.st]}</div>
    {hist===null?<Skeleton className="h-24"/>:hist.length===0?<p className="rounded-xl bg-tint/60 px-3 py-2 text-xs text-mute">Belum ada konfirmasi PKS untuk transaksi ini.</p>
    :<ul className="grid gap-2">{hist.map(h=><li key={h.konfirmasiId} className={cn('rounded-xl px-3 py-2 text-xs',h.hasil==='cocok'?'bg-palm/15 text-palm':h.hasil==='tidak_cocok'?'bg-rose-500/15 text-rose-800 dark:text-rose-200':'bg-amber-500/15 text-amber-900 dark:text-amber-200')}>
      <Badge s={h.hasil}/> · {new Date(h.waktu).toLocaleString('id-ID')}{h.timbangan&&<p className="mt-1">Tiket {h.timbangan.nomorTiket||'-'} · bruto {fmt(h.timbangan.beratBrutoKg)} · tara {fmt(h.timbangan.taraKg)} · netto {fmt(h.timbangan.beratNettoKg)} kg · selisih {fmt(h.selisihKg)} kg</p>}{h.keterangan&&<p className="mt-1">{h.keterangan}</p>}</li>)}</ul>}
  </div>}</Sheet></>;
}
