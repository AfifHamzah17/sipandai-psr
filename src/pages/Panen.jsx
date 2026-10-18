import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useDispatch,useStore} from '../store.jsx';
import {api,uploadToSignedUrl} from '../api.js';
import {ST,cn,fmt} from '../lib/utils.js';
import {Badge,DataTable,Field,PageHead,Panel,inp} from '../components/ui.jsx';
import {useToast} from '../components/Toast.jsx';
import DeleteModal from '../components/DeleteModal.jsx';

const SUMBER=[['tiket_timbang','Tiket timbang'],['nota','Nota'],['rekap_panen','Rekap panen'],['lainnya','Lainnya']];
const E0={k:'KEB-0001',t:'',kg:'',jj:'',sum:'tiket_timbang',no:'',file:[]};

export default function Panen(){
  const {user,kebun,panen}=useStore(),dp=useDispatch(),toast=useToast(),ref=useRef(),[del,setDel]=useState(null);
  const [e,setE]=useState(null),[x,setX]=useState(E0),[c,setC]=useState([]),[er,setEr]=useState({}),[fs,setFs]=useState(''),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false);
  const idemRef=useRef(crypto.randomUUID());
  const s=k=>ev=>setX({...x,[k]:ev.target.value});
  // kebun default = kebun pertama yang tersedia untuk akun ini (bukan KEB-0001 yang tetap)
  useEffect(()=>{if(kebun.length&&!kebun.some(k=>k.id===x.k))setX(v=>({...v,k:kebun[0].id}))},[kebun]);
  const bisaHapus=r=>user.peran==='admin'||['draf','perlu_konfirmasi','ditolak'].includes(r.st);
  const remove=async(alasan)=>{
    setBusy(true);
    try{await dp({type:'remove',k:'panen',row:del,alasan});toast('Catatan '+del.kode+' dihapus')}
    catch(err){toast(err.message||'Gagal menghapus catatan',1)}finally{setBusy(false);setDel(null)}
  };

  const edit=p=>{setE(p);setX({k:p.k,t:p.t,kg:p.kg,jj:p.jj,sum:p.sum,no:p.no,file:Array.isArray(p.file)?p.file.filter(f=>typeof f==='string'&&f.startsWith('bukti/')):[]});setC([]);setEr({});ref.current.scrollIntoView({behavior:'smooth'})};  
  const cancelEdit=()=>{setE(null);setX(E0);setC([]);setEr({})};

  const onFiles=async ev=>{
    const files=[...ev.target.files];if(!files.length)return;
    const kb=kebun.find(k=>k.id===x.k);
    setUploading(true);
    const paths=[];
    try{
      for(const f of files){
        try{
          const {uploadUrl,path}=await api('/files/signed-url','POST',{kebunId:kb?._fid,namaFile:f.name,tipe:f.type,ukuran:f.size});
          await uploadToSignedUrl(uploadUrl,f);
          paths.push(path);          // ← path GCS, bukan f.name
        }catch(err){toast('Gagal mengunggah '+f.name+': '+(err.message||'periksa koneksi'),1)}
      }
    }finally{setUploading(false)}
    if(paths.length)setX(v=>({...v,file:[...v.file,...paths]}));
    ev.target.value='';              // supaya file yang sama bisa dipilih ulang
  };

  const send=async mode=>{
    const d={k:x.k,t:x.t,kg:+x.kg,jj:+x.jj||0,sum:x.sum,no:x.no.trim(),file:x.file};
    const today=new Date().toISOString().slice(0,10);
    const m={};if(!x.t)m.t='Tanggal panen wajib diisi';else if(x.t>today)m.t='Tanggal panen tidak boleh lebih dari hari ini';if(!(d.kg>0))m.kg='Berat TBS harus lebih dari 0';
    setEr(m);if(Object.keys(m).length)return;
    setBusy(true);setC([]);
    try{
      await dp({type:'savePanen',d,mode,row:e,idempotencyKey:idemRef.current});
      toast(mode==='kirim'?'Dikirim untuk validasi':'Draf disimpan');
      idemRef.current=crypto.randomUUID();
      cancelEdit();
    }catch(err){
      if(err.status)idemRef.current=crypto.randomUUID(); // kegagalan bisnis (validasi/pemeriksaan): percobaan berikutnya pakai kunci baru
      if(err.status===422&&err.detail?.length){setC(err.detail.map(r=>({k:r.kode,h:r.hasil==='gagal'?'gagal':r.hasil==='peringatan'?'warn':'ok',m:r.pesan})));toast('Pengiriman diblokir, perbaiki pemeriksaan yang gagal',1)}
      else toast(err.message||'Gagal menyimpan catatan, coba lagi — pengiriman ganda sudah dicegah',1);
    }finally{setBusy(false)}
  };

  return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Input Panen'}]} title="Input Panen"/>
  <div className="grid gap-6">
    <div ref={ref} className="scroll-mt-24"><Panel title={e?`Perbaiki catatan ${e.kode} (revisi ke-${e.rev+1})`:'Catat panen baru'}>
      {e?.cat&&<p className="mb-5 rounded-xl bg-amber-500/15 p-4 text-sm text-amber-900 dark:text-amber-200">Catatan validator: {e.cat}</p>}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid content-start gap-5">
          <Field id="fk" label="Kebun"><select id="fk" className={inp()} value={x.k} onChange={s('k')} disabled={!!e}>{kebun.map(k=><option key={k.id}>{k.id}</option>)}</select></Field>
          <Field id="ft" label="Tanggal panen" required error={er.t}><input id="ft" type="date" max={new Date().toISOString().slice(0,10)} className={inp(er.t)} aria-invalid={!!er.t} aria-describedby="ft-e" value={x.t} onChange={s('t')}/></Field>
          <Field id="fb" label="Berat TBS (kg)" required error={er.kg}><input id="fb" type="number" className={cn(inp(er.kg),'font-mono')} aria-invalid={!!er.kg} aria-describedby="fb-e" value={x.kg} onChange={s('kg')}/></Field>
        </div>
        <div className="grid content-start gap-5">
          <Field id="fj" label="Jumlah janjang (opsional)"><input id="fj" type="number" className={cn(inp(),'font-mono')} value={x.jj} onChange={s('jj')}/></Field>
          <Field id="fs" label="Sumber bukti"><select id="fs" className={inp()} value={x.sum} onChange={s('sum')}>{SUMBER.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
          <Field id="fn" label="Nomor bukti"><input id="fn" className={inp()} placeholder="mis. TT-2026-1005" value={x.no} onChange={s('no')}/></Field>
          <Field id="ff" label="Lampiran bukti (PDF/JPG/PNG, maks 10 MB)" hint={uploading?'Mengunggah…':x.file.length?x.file.map(f=>f.split('/').pop()).join(', '):undefined}><input id="ff" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" disabled={uploading} className={cn(inp(),'!h-auto py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-tint file:px-3 file:py-1.5 file:text-sm')} onChange={onFiles}/></Field>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button className="btn btn-o" disabled={busy||uploading} onClick={()=>send('draf')}>Simpan draf</button>
        <button className="btn btn-p" disabled={busy||uploading} onClick={()=>send('kirim')}>{busy?'Mengirim…':'Kirim untuk validasi'}</button>
        {e&&<button className="btn btn-o" onClick={cancelEdit}>Batal</button>}
      </div>
      {c.length>0&&<ul className="mt-5 grid gap-2">{c.map((r,i)=><li key={i} className={cn('rounded-xl px-3 py-2 text-xs',r.h==='gagal'?'bg-rose-500/15 text-rose-800 dark:text-rose-200':r.h==='warn'?'bg-amber-500/15 text-amber-900 dark:text-amber-200':'bg-palm/15 text-palm')}>{r.k}: {r.m}</li>)}</ul>}
    </Panel></div>
    <Panel title="Catatan panen">
      <label className="mb-3 flex items-center gap-2 text-sm text-mute">Status<select className="h-9 rounded-lg border border-line bg-surface px-2 text-ink" value={fs} onChange={ev=>setFs(ev.target.value)}><option value="">Semua</option>{Object.entries(ST).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
      <DataTable cols={[
        {h:'Kode',c:r=><Link className="font-medium text-palm hover:underline" to={'/panen/'+r.id}>{r.kode}</Link>},
        {h:'Kebun',c:r=>r.k},{h:'Tanggal',c:r=>r.t,n:1},{h:'TBS (kg)',c:r=>fmt(r.kg),n:1},{h:'Bukti',c:r=>r.no||'-'},{h:'Rev',c:r=>r.rev,n:1},{h:'Status',c:r=><Badge s={r.st}/>},{h:'PKS',c:r=>r.pks?<Badge s={r.pks.hasil}/>:<Badge s="belum_pks"/>},
        {h:'Aksi',c:r=><div className="flex gap-2">{(r.st==='perlu_konfirmasi'||r.st==='draf')&&<button className="btn btn-y !h-8" onClick={()=>edit(r)}>{r.st==='draf'?'Lanjutkan':'Perbaiki'}</button>}{bisaHapus(r)&&<button className="btn btn-r !h-8" onClick={()=>setDel(r)}>Hapus</button>}</div>}]}
        rows={fs?panen.filter(p=>p.st===fs):panen} size={5}/>
    </Panel>
  </div>
  <DeleteModal open={!!del} onClose={()=>setDel(null)} title={`Hapus catatan ${del?.kode}?`} busy={busy} onConfirm={remove}>Hanya catatan draf, perlu klarifikasi, atau ditolak yang bisa dihapus pengurus. Catatan yang sedang diperiksa atau sudah valid dikunci supaya perhitungan produktivitas tetap benar.</DeleteModal></>;
}
