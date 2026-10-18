// Halaman Role 2 — PKS: Dashboard PKS, Data Penerimaan TBS, Data Timbangan,
// Konfirmasi Transaksi, Riwayat Konfirmasi, Laporan Penerimaan.
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {api,apiBlob} from '../api.js';
import {useStore} from '../store.jsx';
import {PKS_HASIL,cn,fmt} from '../lib/utils.js';
import {Badge,DataTable,Field,PageHead,Panel,Sheet,Skeleton,inp} from '../components/ui.jsx';
import {useToast} from '../components/Toast.jsx';
import DeleteModal from '../components/DeleteModal.jsx';

function useLoad(path){
  const [d,setD]=useState(null),[err,setErr]=useState('');
  const load=useCallback(()=>api(path).then(x=>{setD(x);setErr('')}).catch(e=>setErr(e.message||'Gagal memuat data')),[path]);
  useEffect(()=>{setD(null);load()},[load]);
  return [d,load,err];
}
const Loading=({d,err,children})=>err?<Panel><p className="text-sm text-rose-700 dark:text-rose-300">{err}</p></Panel>:d===null?<Skeleton className="h-64 rounded-3xl"/>:children;
const hari=v=>(v||'').slice(0,10);
const today=()=>new Date().toISOString().slice(0,10);
const crumbs=l=>[{l:'SIPANDAI',to:'/dashboard'},{l}];

/* ---------- 1. Dashboard PKS ---------- */
export function PksDashboard(){
  const [d,,err]=useLoad('/pks/dashboard'),[tx]=useLoad('/pks/transaksi?status=belum');
  const stats=d&&[[d.tiketTimbang,'Tiket timbang tercatat'],[fmt(d.nettoBulanIniKg/1000)+' ton','Netto diterima bulan ini'],[d.transaksi,'Transaksi relevan'],[d.belumDikonfirmasi,'Belum dikonfirmasi'],[d.cocok,'Cocok'],[d.tidakCocok,'Tidak cocok'],[d.tidakDitemukan,'Tidak ditemukan']];
  return <><PageHead crumbs={crumbs('Dashboard PKS')} title="Dashboard PKS" desc="Ringkasan penerimaan TBS dan konfirmasi transaksi dari kelembagaan mitra."/>
  <div className="grid gap-6"><Loading d={d} err={err}>
    <Panel title="Penerimaan TBS dan konfirmasi"><dl className="grid grid-cols-2 gap-y-6 md:grid-cols-4 md:divide-x md:divide-line">{stats?.map(([v,l],i)=><div key={l} className={i%4?'md:pl-6':''}><dd className="font-mono text-3xl font-medium tracking-tighter tabular-nums">{v}</dd><dt className="mt-1 text-xs text-mute">{l}</dt></div>)}</dl></Panel></Loading>
    <Panel title="Transaksi yang menunggu konfirmasi PKS">
      {tx===null?<Skeleton className="h-32"/>:<DataTable size={5} rows={tx} cols={[{h:'Kode',c:r=>r.kodePanen},{h:'Kelembagaan',c:r=>r.snapshot?.namaOrganisasi||'-'},{h:'Tanggal',c:r=>hari(r.tanggalPanen),n:1},{h:'TBS dicatat (kg)',c:r=>fmt(r.beratTbsKg),n:1},{h:'Aksi',c:()=><Link className="btn btn-b !h-8" to="/konfirmasi">Konfirmasi</Link>}]}/>}
    </Panel></div></>;
}

/* ---------- 2. Data Penerimaan TBS ---------- */
export function Penerimaan(){
  const [st,setSt]=useState(''),[rows,,err]=useLoad('/pks/transaksi'+(st?`?status=${st}`:''));
  return <><PageHead crumbs={crumbs('Data Penerimaan TBS')} title="Data Penerimaan TBS" desc="Transaksi panen kelembagaan mitra yang sudah dikirim. Untuk mencocokkan dengan timbangan, buka Konfirmasi Transaksi."/>
  <Panel><label className="mb-3 flex items-center gap-2 text-sm text-mute">Konfirmasi PKS<select className="h-9 rounded-lg border border-line bg-surface px-2 text-ink" value={st} onChange={e=>setSt(e.target.value)}><option value="">Semua</option><option value="belum">Belum dikonfirmasi</option>{Object.entries(PKS_HASIL).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
  <Loading d={rows} err={err}><DataTable size={10} rows={rows||[]} cols={[
    {h:'Kode',c:r=>r.kodePanen},{h:'Kelembagaan',c:r=>r.snapshot?.namaOrganisasi||'-'},{h:'Kebun',c:r=>r.snapshot?.kodeKebun||'-'},{h:'Tanggal',c:r=>hari(r.tanggalPanen),n:1},
    {h:'TBS dicatat (kg)',c:r=>fmt(r.beratTbsKg),n:1},{h:'No. bukti',c:r=>r.nomorBukti||'-'},{h:'Status validasi',c:r=><Badge s={r.statusValidasi}/>},
    {h:'Konfirmasi PKS',c:r=>r.konfirmasiPks?<Badge s={r.konfirmasiPks.hasil}/>:<Badge s="belum_pks"/>}]}/></Loading></Panel></>;
}

/* ---------- 3. Data Timbangan (CRUD) ---------- */
const T0={organisasiId:'',nomorTiket:'',tanggal:'',beratBrutoKg:'',taraKg:'',platKendaraan:'',catatan:'',alasan:''};
export function Timbangan(){
  const {user,organisasi}=useStore(),toast=useToast(),[rows,load,err]=useLoad('/pks/timbangan');
  const [ed,setEd]=useState(null),[v,setV]=useState(T0),[er,setEr]=useState({}),[busy,setBusy]=useState(false),[del,setDel]=useState(null);
  const orgNama=id=>organisasi.find(o=>o._fid===id)?.nama||id;
  const netto=(+v.beratBrutoKg||0)-(+v.taraKg||0);
  const open=t=>{setEd(t||{});setEr({});setV(t?{...T0,...t,tanggal:hari(t.tanggal)}:{...T0,organisasiId:organisasi.length===1?organisasi[0]._fid:''})};
  const save=async()=>{
    const m={};
    if(!v.organisasiId)m.organisasiId='Kelembagaan wajib dipilih';
    if(!v.tanggal)m.tanggal='Tanggal wajib diisi';else if(v.tanggal>today())m.tanggal='Tanggal tidak boleh di masa depan';
    if(!(+v.beratBrutoKg>0))m.beratBrutoKg='Berat bruto harus lebih dari 0';
    if(!(+v.taraKg>=0)||v.taraKg==='')m.taraKg='Tara wajib diisi';else if(+v.taraKg>=+v.beratBrutoKg)m.taraKg='Tara harus lebih kecil dari bruto';
    if(ed.timbanganId&&!v.alasan.trim())m.alasan='Alasan perubahan wajib diisi';
    setEr(m);if(Object.keys(m).length)return;
    setBusy(true);
    try{
      const body={organisasiId:v.organisasiId,nomorTiket:v.nomorTiket,tanggal:v.tanggal,beratBrutoKg:+v.beratBrutoKg,taraKg:+v.taraKg,platKendaraan:v.platKendaraan,catatan:v.catatan};
      ed.timbanganId?await api(`/pks/timbangan/${ed.timbanganId}`,'PUT',{...body,alasanPerubahan:v.alasan}):await api('/pks/timbangan','POST',body);
      toast(ed.timbanganId?'Perubahan disimpan':'Data timbangan ditambahkan');setEd(null);load();
    }catch(e){toast(e.message||'Gagal menyimpan',1)}finally{setBusy(false)}
  };
  const remove=async alasan=>{
    setBusy(true);
    try{await api(`/pks/timbangan/${del.timbanganId}`,'DELETE',{alasanPerubahan:alasan||undefined});toast('Data timbangan dihapus');load()}
    catch(e){toast(e.message||'Gagal menghapus',1)}finally{setBusy(false);setDel(null)}
  };
  const milik=t=>user.peran==='admin'||t.pksUserId===user.id;
  const s=k=>e=>setV({...v,[k]:e.target.value});
  return <><PageHead crumbs={crumbs('Data Timbangan')} title="Data Timbangan" desc="Catatan penerimaan TBS dan penimbangan di PKS. Isi sesuai integrasi dan kewenangan yang disepakati." actions={<button className="btn btn-p" onClick={()=>open()}>Tambah timbangan</button>}/>
  <Panel title="Daftar tiket timbang"><Loading d={rows} err={err}><DataTable size={10} rows={rows||[]} cols={[
    {h:'Tanggal',c:r=>hari(r.tanggal),n:1},{h:'No. tiket',c:r=>r.nomorTiket||'-'},{h:'Kelembagaan',c:r=>orgNama(r.organisasiId)},
    {h:'Bruto (kg)',c:r=>fmt(r.beratBrutoKg),n:1},{h:'Tara (kg)',c:r=>fmt(r.taraKg),n:1},{h:'Netto (kg)',c:r=>fmt(r.beratNettoKg),n:1},{h:'Plat',c:r=>r.platKendaraan||'-'},
    {h:'Aksi',c:r=>milik(r)&&<div className="flex gap-2"><button className="btn btn-y !h-8" onClick={()=>open(r)}>Ubah</button><button className="btn btn-r !h-8" onClick={()=>setDel(r)}>Hapus</button></div>}]}/></Loading></Panel>
  <Sheet open={!!ed} onClose={()=>setEd(null)} title={ed?.timbanganId?'Ubah data timbangan':'Tambah data timbangan'}><div className="grid gap-5">
    <Field id="tk" label="Kelembagaan pemasok" required error={er.organisasiId}><select id="tk" className={inp(er.organisasiId)} value={v.organisasiId} onChange={s('organisasiId')} disabled={!!ed?.timbanganId}><option value="">Pilih</option>{organisasi.map(o=><option key={o._fid} value={o._fid}>{o.nama}</option>)}</select></Field>
    <Field id="tn" label="Nomor tiket" hint="Dipakai untuk mencocokkan dengan nomor bukti panen"><input id="tn" className={inp()} value={v.nomorTiket} onChange={s('nomorTiket')}/></Field>
    <Field id="tt" label="Tanggal penimbangan" required error={er.tanggal}><input id="tt" type="date" max={today()} className={inp(er.tanggal)} value={v.tanggal} onChange={s('tanggal')}/></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="tb" label="Berat bruto (kg)" required error={er.beratBrutoKg}><input id="tb" type="number" className={cn(inp(er.beratBrutoKg),'font-mono')} value={v.beratBrutoKg} onChange={s('beratBrutoKg')}/></Field>
      <Field id="ta" label="Tara (kg)" required error={er.taraKg}><input id="ta" type="number" className={cn(inp(er.taraKg),'font-mono')} value={v.taraKg} onChange={s('taraKg')}/></Field></div>
    <p className="text-sm"><b>Berat netto:</b> <span className="font-mono tabular-nums">{netto>0?fmt(netto):'0'}</span> kg (bruto − tara)</p>
    <Field id="tp" label="Plat kendaraan"><input id="tp" className={inp()} value={v.platKendaraan} onChange={s('platKendaraan')}/></Field>
    <Field id="tc" label="Catatan"><input id="tc" className={inp()} value={v.catatan} onChange={s('catatan')}/></Field>
    {ed?.timbanganId&&<Field id="tl" label="Alasan perubahan" required error={er.alasan}><input id="tl" className={inp(er.alasan)} value={v.alasan} onChange={s('alasan')}/></Field>}
    <div className="flex justify-end gap-2"><button className="btn btn-o" onClick={()=>setEd(null)}>Batal</button><button className="btn btn-p" disabled={busy} onClick={save}>{busy?'Menyimpan…':'Simpan'}</button></div>
  </div></Sheet>
  <DeleteModal open={!!del} onClose={()=>setDel(null)} title={`Hapus tiket ${del?.nomorTiket||''}?`} busy={busy} onConfirm={remove}>Tiket yang sudah dipakai untuk konfirmasi tidak bisa dihapus oleh PKS.</DeleteModal></>;
}

/* ---------- 4. Konfirmasi Transaksi (cocokkan) ---------- */
export function Konfirmasi(){
  const toast=useToast(),[st,setSt]=useState('belum'),[rows,load,err]=useLoad('/pks/transaksi'+(st?`?status=${st}`:''));
  const [sel,setSel]=useState(null),[kand,setKand]=useState(null),[pick,setPick]=useState(''),[ket,setKet]=useState(''),[er,setEr]=useState(''),[busy,setBusy]=useState(false);
  const open=p=>{setSel(p);setPick(p.konfirmasiPks?.timbanganId||'');setKet('');setEr('');setKand(null);
    api(`/pks/transaksi/${p.panenId}/kandidat`).then(setKand).catch(e=>{setKand([]);toast(e.message||'Gagal memuat tiket kandidat',1)})};
  const kirim=async hasil=>{
    if(hasil==='cocok'&&!pick)return setEr('Pilih tiket timbang yang cocok');
    if(hasil!=='cocok'&&!ket.trim())return setEr('Keterangan wajib diisi');
    setBusy(true);
    try{await api(`/pks/konfirmasi/${sel.panenId}`,'POST',{hasil,timbanganId:pick||undefined,keterangan:ket});toast('Konfirmasi tersimpan: '+PKS_HASIL[hasil]);setSel(null);load()}
    catch(e){toast(e.message||'Gagal menyimpan konfirmasi',1)}finally{setBusy(false)}
  };
  const k=useMemo(()=>(kand||[]).find(x=>x.timbanganId===pick),[kand,pick]);
  return <><PageHead crumbs={crumbs('Konfirmasi Transaksi')} title="Konfirmasi Transaksi" desc="Cocokkan catatan panen pengurus dengan tiket timbang di PKS. PKS tidak harus mengonfirmasi transaksi yang tidak tercatat di fasilitasnya; pilih 'Tidak ditemukan' bila memang tidak ada."/>
  <Panel><label className="mb-3 flex items-center gap-2 text-sm text-mute">Tampilkan<select className="h-9 rounded-lg border border-line bg-surface px-2 text-ink" value={st} onChange={e=>setSt(e.target.value)}><option value="belum">Belum dikonfirmasi</option><option value="">Semua</option>{Object.entries(PKS_HASIL).map(([x,l])=><option key={x} value={x}>{l}</option>)}</select></label>
  <Loading d={rows} err={err}><DataTable size={8} rows={rows||[]} cols={[
    {h:'Kode',c:r=>r.kodePanen},{h:'Kelembagaan',c:r=>r.snapshot?.namaOrganisasi||'-'},{h:'Tanggal',c:r=>hari(r.tanggalPanen),n:1},{h:'TBS dicatat (kg)',c:r=>fmt(r.beratTbsKg),n:1},{h:'No. bukti',c:r=>r.nomorBukti||'-'},
    {h:'Konfirmasi',c:r=>r.konfirmasiPks?<Badge s={r.konfirmasiPks.hasil}/>:<Badge s="belum_pks"/>},
    {h:'Aksi',c:r=><button className="btn btn-b !h-8" onClick={()=>open(r)}>{r.konfirmasiPks?'Ubah':'Cocokkan'}</button>}]}/></Loading></Panel>
  <Sheet open={!!sel} onClose={()=>setSel(null)} title={sel?`Cocokkan ${sel.kodePanen}`:''}>{sel&&<div className="grid gap-5 text-sm">
    <div className="rounded-xl bg-tint/60 p-4"><b>Catatan pengurus</b><br/>{sel.snapshot?.namaOrganisasi} · kebun {sel.snapshot?.kodeKebun}<br/>{hari(sel.tanggalPanen)} · <span className="font-mono">{fmt(sel.beratTbsKg)}</span> kg · bukti: {sel.nomorBukti||'-'}</div>
    <div><b>Tiket timbang kandidat</b><p className="mt-1 text-xs text-mute">Diurutkan dari yang nomor tiketnya sama, lalu tanggal sama. Periksa tanggal, tiket, bruto, tara, dan netto.</p>
      {kand===null?<Skeleton className="mt-3 h-24"/>:kand.length===0?<p className="mt-3 rounded-xl bg-amber-500/15 p-3 text-xs text-amber-900 dark:text-amber-200">Tidak ada tiket timbang untuk kelembagaan ini pada tanggal/nomor yang sama. Tambahkan di Data Timbangan, atau pilih "Tidak ditemukan".</p>
      :<ul className="mt-3 grid gap-2">{kand.map(t=><li key={t.timbanganId}><label className={cn('flex cursor-pointer gap-3 rounded-xl p-3 ring-1',pick===t.timbanganId?'bg-palm/10 ring-palm':'ring-line')}>
        <input type="radio" name="kand" checked={pick===t.timbanganId} onChange={()=>{setPick(t.timbanganId);setEr('')}}/>
        <span className="grid gap-0.5 text-xs"><span><b>{t.nomorTiket||'(tanpa nomor)'}</b> · {hari(t.tanggal)} {t.tiketSama&&<Badge s="cocok" label="Tiket sama"/>} {t.tanggalSama&&<Badge s="menunggu" label="Tanggal sama"/>}</span>
        <span>Bruto <span className="font-mono">{fmt(t.beratBrutoKg)}</span> · Tara <span className="font-mono">{fmt(t.taraKg)}</span> · Netto <span className="font-mono">{fmt(t.beratNettoKg)}</span> kg</span>
        <span className={Math.abs(t.persenSelisih)>5?'text-rose-700 dark:text-rose-300':'text-mute'}>Selisih dengan catatan pengurus: <span className="font-mono">{fmt(t.selisihKg)}</span> kg ({t.persenSelisih}%)</span></span></label></li>)}</ul>}
    </div>
    {k&&Math.abs(k.persenSelisih)>5&&<p className="rounded-xl bg-amber-500/15 p-3 text-xs text-amber-900 dark:text-amber-200">Selisih lebih dari 5%. Pertimbangkan "Tidak cocok" dan jelaskan di keterangan.</p>}
    <Field id="kk" label="Keterangan (wajib untuk Tidak cocok / Tidak ditemukan)" error={er}><textarea id="kk" rows="3" className={cn(inp(er),'!h-auto py-2.5')} value={ket} onChange={e=>{setKet(e.target.value);setEr('')}}/></Field>
    <div className="flex flex-wrap gap-2"><button className="btn btn-p" disabled={busy} onClick={()=>kirim('cocok')}>Cocok</button><button className="btn btn-r" disabled={busy} onClick={()=>kirim('tidak_cocok')}>Tidak cocok</button><button className="btn btn-y" disabled={busy} onClick={()=>kirim('tidak_ditemukan')}>Tidak ditemukan</button></div>
  </div>}</Sheet></>;
}

/* ---------- 5. Riwayat Konfirmasi ---------- */
export function RiwayatKonfirmasi(){
  const [rows,,err]=useLoad('/pks/riwayat');
  return <><PageHead crumbs={crumbs('Riwayat Konfirmasi')} title="Riwayat Konfirmasi"/>
  <Panel title="Transaksi yang pernah dikonfirmasi"><Loading d={rows} err={err}><DataTable size={10} rows={rows||[]} cols={[
    {h:'Waktu',c:r=>new Date(r.waktu).toLocaleString('id-ID'),n:1},{h:'Kode panen',c:r=>r.kodePanen},{h:'Hasil',c:r=><Badge s={r.hasil}/>},
    {h:'No. tiket',c:r=>r.timbangan?.nomorTiket||'-'},{h:'Netto (kg)',c:r=>r.timbangan?fmt(r.timbangan.beratNettoKg):'-',n:1},{h:'Dicatat (kg)',c:r=>fmt(r.beratPanenKg),n:1},{h:'Selisih (kg)',c:r=>r.selisihKg==null?'-':fmt(r.selisihKg),n:1},{h:'Keterangan',c:r=>r.keterangan||'-'}]}/></Loading></Panel></>;
}

/* ---------- 6. Laporan Penerimaan ---------- */
export function LaporanPenerimaan(){
  const {organisasi}=useStore(),toast=useToast(),[rows,,err]=useLoad('/pks/timbangan'),[per,setPer]=useState(''),[busy,setBusy]=useState(false);
  const months=useMemo(()=>[...new Set((rows||[]).map(t=>hari(t.tanggal).slice(0,7)))].sort(),[rows]);
  const fp=useMemo(()=>per?(rows||[]).filter(t=>hari(t.tanggal).startsWith(per)):(rows||[]),[rows,per]);
  const total=fp.reduce((a,t)=>a+(t.beratNettoKg||0),0);
  const org=id=>organisasi.find(o=>o._fid===id)?.nama||id;
  const unduh=async()=>{
    setBusy(true);
    try{const b=await apiBlob('/pks/laporan.xlsx'),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='laporan-penerimaan-tbs.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
    catch(e){toast(e.message||'Gagal mengunduh laporan',1)}finally{setBusy(false)}
  };
  return <><PageHead crumbs={crumbs('Laporan Penerimaan')} title="Laporan Penerimaan" desc="Penerimaan TBS per tiket timbang. Berkas Excel memuat seluruh periode." actions={<button className="btn btn-p" disabled={busy} onClick={unduh}>{busy?'Menyiapkan…':'Unduh Excel'}</button>}/>
  <Panel><div className="mb-5 flex flex-wrap items-end gap-6"><Field id="lpp" label="Periode"><select id="lpp" className={inp()} value={per} onChange={e=>setPer(e.target.value)}><option value="">Semua periode</option>{months.map(m=><option key={m}>{m}</option>)}</select></Field>
    <p className="text-sm"><b>Total netto:</b> <span className="font-mono tabular-nums">{fmt(total/1000)}</span> ton · {fp.length} tiket</p></div>
  <Loading d={rows} err={err}><DataTable size={10} rows={fp} cols={[{h:'Tanggal',c:r=>hari(r.tanggal),n:1},{h:'No. tiket',c:r=>r.nomorTiket||'-'},{h:'Kelembagaan',c:r=>org(r.organisasiId)},{h:'Bruto (kg)',c:r=>fmt(r.beratBrutoKg),n:1},{h:'Tara (kg)',c:r=>fmt(r.taraKg),n:1},{h:'Netto (kg)',c:r=>fmt(r.beratNettoKg),n:1}]}/></Loading></Panel></>;
}
