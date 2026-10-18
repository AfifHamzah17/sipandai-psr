// Role 3 — Validator: Riwayat Validasi (identitas validator, waktu, keputusan, perubahan status).
import {useEffect,useMemo,useState} from 'react';
import {api} from '../api.js';
import {useStore} from '../store.jsx';
import {INSTANSI} from '../lib/utils.js';
import {Badge,DataTable,PageHead,Panel,Skeleton} from '../components/ui.jsx';

export default function RiwayatValidasi(){
  const {riw,users}=useStore(),[rows,setRows]=useState(null),[err,setErr]=useState('');
  useEffect(()=>{api('/validasi/riwayat').then(setRows).catch(e=>{setErr(e.message||'Gagal memuat riwayat');setRows([])})},[]);
  const kebunRiw=useMemo(()=>riw.filter(r=>r.w.startsWith('kebun')&&/statusVerifikasiKebun/.test(r.a)),[riw]);
  const nama=id=>users.find(u=>u._fid===id)?.nama||(id==='seed'?'Seed':'Validator');
  return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Riwayat Validasi'}]} title="Riwayat Validasi"/>
  <div className="grid gap-6">
    <Panel title="Keputusan validasi panen">{err&&<p className="mb-3 text-sm text-rose-700 dark:text-rose-300">{err}</p>}
      {rows===null?<Skeleton className="h-48"/>:<DataTable size={10} rows={rows} cols={[
        {h:'Waktu',c:r=>new Date(r.waktuValidasi).toLocaleString('id-ID'),n:1},{h:'Kode panen',c:r=>r.kodePanen||r.panenId},{h:'Validator',c:r=>nama(r.validatorId)+(r.instansi?' · '+INSTANSI[r.instansi]:'')},
        {h:'Keputusan',c:r=><Badge s={r.keputusan}/>},{h:'Revisi ke',c:r=>r.revisiKe,n:1},{h:'PKS saat itu',c:r=>r.konfirmasiPksSaatIni?<Badge s={r.konfirmasiPksSaatIni}/>:<Badge s="belum_pks"/>},{h:'Alasan',c:r=>r.catatanValidasi||'-'}]}/>}</Panel>
    <Panel title="Keputusan validasi kebun"><DataTable size={10} rows={kebunRiw.map((r,i)=>({...r,_k:i}))} cols={[{h:'Waktu',c:r=>r.t,n:1},{h:'Kebun',c:r=>r.w},{h:'Perubahan',c:r=>`${r.b} → ${r.a}`},{h:'Alasan',c:r=>r.why}]}/></Panel>
  </div></>;
}
