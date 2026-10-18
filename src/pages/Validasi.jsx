import {lazy,Suspense,useEffect,useState} from 'react';
import {useDispatch,useStore} from '../store.jsx';
import {api} from '../api.js';
import {autocheck,cn,fmt,ST} from '../lib/utils.js';
import {Badge,DataTable,Field,Modal,PageHead,Panel,Sheet,Skeleton,inp} from '../components/ui.jsx';
import {useToast} from '../components/Toast.jsx';
const PdfViewer=lazy(()=>import('../components/PdfViewer.jsx'));

const Lampiran=({files})=>{
  const daftar=(files||[]).filter(f=>typeof f==='string'&&f);
  const [items,setItems]=useState(null),key=daftar.join('|');
  useEffect(()=>{
    if(!daftar.length)return;
    let hidup=true;
    Promise.all(daftar.map(f=>api(`/files/signed-url?path=${encodeURIComponent(f)}`).then(d=>({f,url:typeof d==='string'?d:d.url})).catch(()=>({f,url:null}))))
      .then(r=>{if(hidup)setItems(r)});
    return()=>{hidup=false};
  },[key]);
  if(!daftar.length)return <p className="text-xs text-mute">Tidak ada lampiran valid.</p>;
  if(!items)return <Skeleton className="h-64"/>;
  return <div className="flex gap-3 overflow-x-auto pb-1">{items.map(({f,url})=>{
    const nama=f.split('/').pop();
    if(!url)return <div key={f} className="min-w-[16rem] flex-1 rounded-xl bg-tint/60 px-3 py-2 text-xs text-mute">Lampiran gagal dimuat: {nama}</div>;
    return f.toLowerCase().endsWith('.pdf')
      ?<div key={f} className="min-w-[24rem] flex-1"><Suspense fallback={<Skeleton className="h-64"/>}><PdfViewer src={url}/></Suspense></div>
      :<a key={f} href={url} target="_blank" rel="noreferrer" className="min-w-[20rem] flex-1"><img src={url} alt={nama} className="h-64 w-full rounded-xl border border-line bg-white object-contain dark:bg-white/5"/></a>;
  })}</div>;
};

export default function Validasi(){
  const {kebun,panen}=useStore(),dp=useDispatch(),toast=useToast();
  const [id,setId]=useState(null),[cat,setCat]=useState(''),[er,setEr]=useState(''),[pdf,setPdf]=useState(false),[ask,setAsk]=useState(false),[busy,setBusy]=useState(false),[hist,setHist]=useState([]);
  const s=panen.find(p=>p.id===id),k=s&&kebun.find(x=>x.id===s.k);
  const berkas=Array.isArray(s?.file)?s.file.filter(f=>typeof f==='string'&&f):s?.file?[String(s.file)]:[];

  useEffect(()=>{
    if(!s?._fid){setHist([]);return}
    api(`/validasi/riwayat/${s._fid}`).then(setHist).catch(()=>setHist([]));
  },[s?._fid]);

  const open=p=>{setId(p.id);setCat('');setPdf(false)};
  const close=()=>{setId(null);setCat('');setEr('');setPdf(false);setAsk(false)};
  const decide=async(kp,confirmed)=>{
    if(kp!=='valid'&&!cat.trim())return setEr('Catatan wajib diisi');
    if(kp==='ditolak'&&!confirmed)return setAsk(true);
    setBusy(true);
    try{await dp({type:'decide',row:s,k:kp,cat:cat.trim()});toast('Keputusan tersimpan: '+ST[kp]);close()}
    catch(err){toast(err.message||'Gagal menyimpan keputusan',1)}
    finally{setBusy(false)}
  };

  return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Antrean Validasi Panen'}]} title="Antrean Validasi Panen"/>
  <Panel title="Antrean validasi"><DataTable cols={[
    {h:'Kode',c:r=>r.kode},{h:'Kelembagaan',c:r=>r.orgNama||'-'},{h:'Kebun',c:r=>r.k},{h:'Tanggal',c:r=>r.t,n:1},{h:'TBS (kg)',c:r=>fmt(r.kg),n:1},{h:'Status',c:r=><Badge s={r.st}/>},{h:'PKS',c:r=>r.pks?<Badge s={r.pks.hasil}/>:<Badge s="belum_pks"/>},
    {h:'Aksi',c:r=><button className="btn btn-b !h-8" onClick={()=>open(r)}>Periksa</button>}]} rows={panen.filter(p=>p.st==='menunggu')}/></Panel>

  <Sheet open={!!s} onClose={close} title={s?`Periksa ${s.kode}`:''}>{s&&k&&<div className="grid gap-5 text-sm">
    <div className="grid gap-4 sm:grid-cols-2">
      <div><b>Kebun</b><br/>{k.id} · {k.own} · <span className="font-mono">{fmt(k.luas)}</span> Ha<br/><br/><b>Panen</b><br/>{s.t} · <span className="font-mono">{fmt(s.kg)}</span> kg · {s.jj} janjang</div>
      <div><b>Bukti</b><br/>{s.no||'-'}<br/>{berkas.map(f=>f.split('/').pop()).join(', ')||'Tidak ada lampiran'}</div>
    </div>
    {berkas.length>0
      ?<div><button className="btn btn-b w-full" onClick={()=>setPdf(!pdf)}>{pdf?'Tutup dokumen':'Lihat Dokumen'}</button>{pdf&&<div className="mt-3"><Lampiran files={berkas}/></div>}</div>
      :<div><p className="mb-2 text-xs text-mute">Tidak ada lampiran — yang ditampilkan berikut adalah contoh tiket timbang.</p><Suspense fallback={<Skeleton className="h-64"/>}><PdfViewer src="/contoh-tiket-timbang.pdf"/></Suspense></div>}
    <div><b>Cek Konfirmasi PKS</b>
      {s.pks?<div className={cn('mt-2 rounded-xl px-3 py-2 text-xs',s.pks.hasil==='cocok'?'bg-palm/15 text-palm':s.pks.hasil==='tidak_cocok'?'bg-rose-500/15 text-rose-800 dark:text-rose-200':'bg-amber-500/15 text-amber-900 dark:text-amber-200')}>
        <Badge s={s.pks.hasil}/> {s.pks.tiket&&<>· tiket <span className="font-mono">{s.pks.tiket}</span> </>}{s.pks.netto!=null&&<>· netto <span className="font-mono">{fmt(s.pks.netto)}</span> kg · selisih <span className="font-mono">{fmt(s.pks.sel)}</span> kg </>}
        {s.pks.ket&&<p className="mt-1">{s.pks.ket}</p>}
        {s.pks.hasil!=='cocok'&&<p className="mt-1 font-medium">Periksa lagi sebelum menetapkan Valid. Keputusan tetap di tangan validator.</p>}</div>
      :<p className="mt-2 rounded-xl bg-tint/60 px-3 py-2 text-xs text-mute">Belum ada konfirmasi PKS. PKS tidak wajib mengonfirmasi transaksi yang tidak tercatat di fasilitasnya, jadi periksa bukti lain.</p>}</div>
    <ul className="grid gap-2">{autocheck(s,panen,kebun).map((r,i)=><li key={i} className={cn('rounded-xl px-3 py-2 text-xs',r.h==='gagal'?'bg-rose-500/15 text-rose-800 dark:text-rose-200':r.h==='warn'?'bg-amber-500/15 text-amber-900 dark:text-amber-200':'bg-palm/15 text-palm')}>{r.k}: {r.m}</li>)}</ul>
    {hist.length>0&&<div><b>Riwayat keputusan sebelumnya</b><ul className="mt-2 grid gap-2">{hist.map(h=><li key={h.validasiId} className="rounded-xl bg-tint/60 px-3 py-2 text-xs"><Badge s={h.keputusan}/> · revisi ke-{h.revisiKe} · {new Date(h.waktuValidasi).toLocaleString('id-ID')}{h.catatanValidasi&&<p className="mt-1 text-mute">{h.catatanValidasi}</p>}</li>)}</ul></div>}
    <Field id="vc" label="Alasan/catatan (wajib untuk Perlu klarifikasi dan Ditolak)" error={er}><textarea id="vc" rows="3" className={cn(inp(er),'!h-auto py-2.5')} aria-invalid={!!er} aria-describedby="vc-e" value={cat} onChange={e=>{setCat(e.target.value);setEr('')}}/></Field>
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-p" disabled={busy} onClick={()=>decide('valid')}>Valid</button>
      <button className="btn btn-y" disabled={busy} onClick={()=>decide('perlu_konfirmasi')}>Perlu klarifikasi/perbaikan</button>
      <button className="btn btn-r" disabled={busy} onClick={()=>decide('ditolak')}>Tolak</button>
    </div>
  </div>}</Sheet>
  <Modal open={ask} onClose={()=>setAsk(false)} title={`Tolak ${s?.kode}?`} actions={<><button className="btn btn-o" onClick={()=>setAsk(false)}>Batal</button><button className="btn btn-r" disabled={busy} onClick={()=>decide('ditolak',true)}>Tolak catatan</button></>}>Pengurus akan melihat catatan Anda. Riwayat keputusan tetap tersimpan.</Modal></>;
}