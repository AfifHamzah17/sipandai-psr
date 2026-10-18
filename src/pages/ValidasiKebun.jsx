// Role 3 — Validator: Validasi Data Kebun Kelembagaan.
import {Suspense,lazy,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {useDispatch,useStore} from '../store.jsx';
import {cn,fmt} from '../lib/utils.js';
import {Badge,DataTable,Field,Modal,PageHead,Panel,Sheet,Skeleton,inp} from '../components/ui.jsx';
import {useToast} from '../components/Toast.jsx';
const MiniMap=lazy(()=>import('../components/MiniMap.jsx'));

const KEP={terverifikasi:'Terverifikasi',perlu_konfirmasi:'Perlu klarifikasi',ditolak:'Ditolak'};
export default function ValidasiKebun(){
  const {kebun,anggota,organisasi}=useStore(),dp=useDispatch(),toast=useToast();
  const [f,setF]=useState('antre'),[sel,setSel]=useState(null),[cat,setCat]=useState(''),[er,setEr]=useState(''),[busy,setBusy]=useState(false),[ask,setAsk]=useState(false);
  const rows=useMemo(()=>f==='antre'?kebun.filter(k=>k.ver==='belum'||k.ver==='perlu_konfirmasi'):f?kebun.filter(k=>k.ver===f):kebun,[kebun,f]);
  const org=sel&&organisasi.find(o=>o._fid===sel.org),agt=sel&&anggota.find(a=>a._fid===sel.anggotaId);
  const cek=sel&&[
    ['Identitas kelembagaan lengkap',!!(org&&org.nama&&org.desa&&org.kec&&org.kab)],
    ['Anggota (pemilik) terdaftar',!!agt],
    ['Luas kebun lebih dari 0 Ha',sel.luas>0],
    ['Koordinat lokasi minimal 3 titik',(sel.koordinat||[]).length>=3],
    ['Tahun replanting terisi',!!sel.thn],
    ['Sumber data luas / dokumen pendukung terisi',!!sel.sumberLuas],
  ];
  const open=k=>{setSel(k);setCat('');setEr('');setAsk(false)};
  const close=()=>{setSel(null);setAsk(false)};
  const decide=async(keputusan,ok)=>{
    if(keputusan!=='terverifikasi'&&!cat.trim())return setEr('Alasan wajib diisi untuk keputusan ini');
    if(keputusan==='ditolak'&&!ok)return setAsk(true);
    setBusy(true);
    try{await dp({type:'verif',row:sel,keputusan,catatan:cat.trim()});toast(`Kebun ${sel.id}: ${KEP[keputusan]}`);close()}
    catch(e){toast(e.message||'Gagal menyimpan keputusan',1)}finally{setBusy(false)}
  };
  return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Validasi Data Kebun'}]} title="Validasi Data Kebun Kelembagaan" desc="Periksa identitas kelembagaan, anggota, luas kebun, tahun replanting, lokasi, dan dokumen pendukung. Hanya kebun terverifikasi yang dipakai menghitung produktivitas."/>
  <Panel><label className="mb-3 flex items-center gap-2 text-sm text-mute">Tampilkan<select className="h-9 rounded-lg border border-line bg-surface px-2 text-ink" value={f} onChange={e=>setF(e.target.value)}><option value="antre">Antrean (belum / perlu klarifikasi)</option><option value="">Semua</option><option value="terverifikasi">Terverifikasi</option><option value="ditolak">Ditolak</option></select></label>
  <DataTable size={8} rows={rows} cols={[
    {h:'Kode',c:r=><Link className="font-medium text-palm hover:underline" to={'/kebun/'+r.id}>{r.id}</Link>},{h:'Kelembagaan',c:r=>organisasi.find(o=>o._fid===r.org)?.nama||'-'},{h:'Pemilik',c:r=>r.own},
    {h:'Luas',c:r=>fmt(r.luas)+' Ha',n:1},{h:'Replanting',c:r=>r.thn,n:1},{h:'Status',c:r=><Badge s={r.ver} label={r.ver==='perlu_konfirmasi'?'Perlu klarifikasi':undefined}/>},
    {h:'Aksi',c:r=><button className="btn btn-b !h-8" onClick={()=>open(r)}>Periksa</button>}]}/></Panel>

  <Sheet open={!!sel} onClose={close} title={sel?`Periksa kebun ${sel.id}`:''}>{sel&&<div className="grid gap-5 text-sm">
    <div className="grid gap-4 sm:grid-cols-2">
      <div><b>Kelembagaan</b><br/>{org?.nama||'-'}<br/><span className="text-mute">{org?`${org.jenis} · ${org.desa}, ${org.kec}, ${org.kab}`:''}</span></div>
      <div><b>Anggota (pemilik)</b><br/>{sel.own}<br/><span className="text-mute">NIK: {agt?.nik||'-'}</span></div>
      <div><b>Kebun</b><br/><span className="font-mono">{fmt(sel.luas)}</span> Ha · replanting {sel.thn||'-'}<br/><span className="text-mute">{sel.tan==='sudah_menghasilkan'?'Sudah menghasilkan':'Belum menghasilkan'}</span></div>
      <div><b>Sumber data luas</b><br/>{sel.sumberLuas||'-'}</div>
    </div>
    <Suspense fallback={<Skeleton className="h-[240px] rounded-2xl"/>}><MiniMap items={[{id:sel.id,label:sel.id,koordinat:sel.koordinat,color:'#228be6'}]} height={240} emptyText="Kebun ini belum punya koordinat."/></Suspense>
    <ul className="grid gap-2">{cek.map(([l,oke])=><li key={l} className={cn('rounded-xl px-3 py-2 text-xs',oke?'bg-palm/15 text-palm':'bg-amber-500/15 text-amber-900 dark:text-amber-200')}>{oke?'✓':'!'} {l}</li>)}</ul>
    {sel.vercat&&<p className="rounded-xl bg-tint/60 px-3 py-2 text-xs"><b>Catatan keputusan sebelumnya:</b> {sel.vercat}</p>}
    <Field id="vkc" label="Alasan/catatan (wajib untuk Perlu klarifikasi dan Ditolak)" error={er}><textarea id="vkc" rows="3" className={cn(inp(er),'!h-auto py-2.5')} value={cat} onChange={e=>{setCat(e.target.value);setEr('')}}/></Field>
    <div className="flex flex-wrap gap-2"><button className="btn btn-p" disabled={busy} onClick={()=>decide('terverifikasi')}>Terverifikasi</button><button className="btn btn-y" disabled={busy} onClick={()=>decide('perlu_konfirmasi')}>Perlu klarifikasi/perbaikan</button><button className="btn btn-r" disabled={busy} onClick={()=>decide('ditolak')}>Tolak</button></div>
  </div>}</Sheet>
  <Modal open={ask} onClose={()=>setAsk(false)} title={`Tolak kebun ${sel?.id}?`} actions={<><button className="btn btn-o" onClick={()=>setAsk(false)}>Batal</button><button className="btn btn-r" disabled={busy} onClick={()=>decide('ditolak',true)}>Tolak kebun</button></>}>Pengurus akan melihat alasan Anda. Riwayat keputusan tetap tersimpan.</Modal></>;
}
