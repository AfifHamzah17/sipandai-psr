import {Suspense,lazy,useEffect,useMemo,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useDispatch,useStore} from '../store.jsx';
import {area,fmt} from '../lib/utils.js';
import {Badge,DataTable,Field,Modal,PageHead,Panel,Skeleton,inp} from '../components/ui.jsx';
import {useToast} from '../components/Toast.jsx';
import DeleteModal from '../components/DeleteModal.jsx';
const MiniMap=lazy(()=>import('../components/MiniMap.jsx'));

const VER_COLOR={terverifikasi:'#16a34a',perlu_konfirmasi:'#f59e0b',belum:'#dc2626'};

export default function Kebun(){
  const {user,kebun,anggota}=useStore(),dp=useDispatch(),toast=useToast(),nav=useNavigate();
  const [del,setDel]=useState(null),[busy,setBusy]=useState(false);
  const [pending,setPending]=useState(null); // pts dari Alat GIS, menunggu dilengkapi & disimpan
  const [m,setM]=useState({own:'',thn:'',tan:'belum_menghasilkan',sumber:''});
  const can=user.peran==='pengurus'||user.peran==='admin',val=user.peran==='validator';
  const ar=useMemo(()=>pending?.length>2?area(pending):0,[pending]);

  useEffect(()=>{
    const raw=sessionStorage.getItem('gis-polygon-pts');
    if(raw){try{setPending(JSON.parse(raw))}catch{} sessionStorage.removeItem('gis-polygon-pts')}
  },[]);

  const mapItems=useMemo(()=>kebun.map(k=>({id:k.id,label:`${k.id} — ${k.own}`,koordinat:k.koordinat,color:VER_COLOR[k.ver]||'#e5484d'})),[kebun]);
  const pendingItem=useMemo(()=>pending?[{id:'pending',label:'Bidang baru',koordinat:pending.map(([x,y])=>({lat:1.8039-y*.5/111320,lng:100.1336+x*.5/111320})),color:'#228be6'}]:[],[pending]);

  const save=async()=>{
    if(!m.own||!m.thn)return toast('Pemilik dan tahun replanting wajib diisi',1);
    setBusy(true);
    try{await dp({type:'addKebun',pts:pending,meta:m});setPending(null);setM({own:'',thn:'',tan:'belum_menghasilkan',sumber:''});toast('Kebun disimpan, menunggu verifikasi')}
    catch(e){toast(e.message||'Gagal menyimpan kebun',1)}finally{setBusy(false)}
  };
  const remove=async(alasan,berantai)=>{
    setBusy(true);
    try{await dp({type:'remove',k:'kebun',row:del,alasan,berantai});toast('Kebun '+del.id+' dihapus')}
    catch(e){toast(e.message||'Gagal menghapus kebun',1)}finally{setBusy(false);setDel(null)}
  };

  return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Kebun & Peta'}]} title="Kebun & Peta"
    actions={can&&<button className="btn btn-p" onClick={()=>nav('/kebun/peta')}>Buka Alat GIS</button>}/>
  <div className="grid gap-6">
    <Panel title="Daftar kebun"><DataTable cols={[
      {h:'Kode',c:r=><Link className="font-medium text-palm hover:underline" to={'/kebun/'+r.id}>{r.id}</Link>},
      {h:'Pemilik',c:r=>r.own},{h:'Luas',c:r=>fmt(r.luas)+' Ha',n:1},{h:'Replanting',c:r=>r.thn,n:1},
      {h:'Status tanaman',c:r=>r.tan==='sudah_menghasilkan'?'Sudah menghasilkan':'Belum menghasilkan'},
      {h:'Verifikasi',c:r=><Badge s={r.ver} label={r.ver==='perlu_konfirmasi'?'Perlu klarifikasi':undefined}/>},
      {h:'Aksi',c:r=><div className="flex gap-2">{val&&r.ver!=='terverifikasi'&&<Link to="/validasi-kebun" className="btn btn-b !h-8">Periksa</Link>}{can&&<button className="btn btn-r !h-8" onClick={()=>setDel(r)}>Hapus</button>}</div>}]} rows={kebun}/></Panel>

    <Panel title="Peta kebun terdaftar">
      <p className="mb-3 max-w-[65ch] text-sm text-mute">Hijau = terverifikasi, kuning = perlu konfirmasi, merah = belum diverifikasi. Klik bidang untuk membuka detailnya.</p>
      <Suspense fallback={<Skeleton className="h-[360px] rounded-2xl"/>}>
        <MiniMap items={mapItems} onSelect={id=>nav('/kebun/'+id)} emptyText="Belum ada kebun dengan koordinat untuk ditampilkan."/>
      </Suspense>
    </Panel>

    {can&&(pending?<Panel title="Lengkapi kebun baru">
      <p className="mb-3 max-w-[65ch] text-sm text-mute">Bidang digambar lewat Alat GIS. Lengkapi datanya lalu simpan — luas sebenarnya dihitung ulang oleh server dari koordinat ini.</p>
      <Suspense fallback={<Skeleton className="h-[260px] rounded-2xl"/>}><MiniMap items={pendingItem} height={260}/></Suspense>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="kp" label="Pemilik (anggota)" required><select id="kp" className={inp()} value={m.own} onChange={e=>setM({...m,own:e.target.value})}><option value="">Pilih anggota</option>{anggota.map(a=><option key={a._fid} value={a._fid}>{a.nama}</option>)}</select></Field>
        <Field id="kt" label="Tahun replanting" required><input id="kt" type="number" className={inp()+' font-mono'} value={m.thn} onChange={e=>setM({...m,thn:e.target.value})}/></Field>
        <Field id="ks" label="Status tanaman"><select id="ks" className={inp()} value={m.tan} onChange={e=>setM({...m,tan:e.target.value})}><option value="belum_menghasilkan">Belum menghasilkan</option><option value="sudah_menghasilkan">Sudah menghasilkan</option></select></Field>
        <Field id="kd" label="Sumber data luas" hint="mis. SHM, SPT"><input id="kd" className={inp()} value={m.sumber} onChange={e=>setM({...m,sumber:e.target.value})}/></Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm"><b>Perkiraan luas:</b> <span className="font-mono tabular-nums">{ar?fmt(ar.toFixed(4)):'0'}</span> Ha</p>
        <div className="flex gap-2"><button className="btn btn-o" onClick={()=>setPending(null)}>Batal</button><button className="btn btn-p" disabled={busy} onClick={save}>{busy?'Menyimpan…':'Simpan kebun'}</button></div>
      </div>
    </Panel>:<Panel><p className="text-sm text-mute">Belum ada bidang baru yang digambar. Buka Alat GIS untuk menggambar poligon kebun, lalu kembali ke sini untuk melengkapi datanya.</p></Panel>)}
  </div>
  <DeleteModal open={!!del} onClose={()=>setDel(null)} title={`Hapus kebun ${del?.id}?`} busy={busy} cascade onConfirm={remove}>Kebun yang masih punya catatan panen tidak bisa dihapus (kecuali hapus berantai oleh administrator). Jejak penghapusan tetap tersimpan.</DeleteModal></>;
}
