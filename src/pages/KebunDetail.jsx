import {Suspense,lazy} from 'react';
import {Link,Navigate,useParams} from 'react-router-dom';
import {useStore} from '../store.jsx';
import {fmt,produktivitas} from '../lib/utils.js';
import {Badge,DataTable,PageHead,Panel,Skeleton} from '../components/ui.jsx';
const MiniMap=lazy(()=>import('../components/MiniMap.jsx'));

export default function KebunDetail(){
  const {id}=useParams(),{kebun,panen}=useStore(),k=kebun.find(x=>x.id===id);
  if(!k)return <Navigate to="/kebun" replace/>;
  const riwayat=panen.filter(p=>p.k===id),prod=produktivitas(kebun,panen).find(r=>r.id===id);
  return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Kebun & Peta',to:'/kebun'},{l:k.id}]} title={k.id} desc={`Pemilik ${k.own} · ${fmt(k.luas)} Ha · replanting ${k.thn}`}/>
  <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
    <Panel title="Detail kebun"><dl className="grid grid-cols-2 gap-5 text-sm">
      {[['Pemilik',k.own],['Luas',fmt(k.luas)+' Ha'],['Tahun replanting',k.thn],['Status tanaman',k.tan==='sudah_menghasilkan'?'Sudah menghasilkan':'Belum menghasilkan'],['Sumber data luas',k.sumber||'-'],['Verifikasi',<Badge key="v" s={k.ver}/>]].map(([a,b])=><div key={a}><dt className="text-xs text-mute">{a}</dt><dd className="mt-1 font-medium">{b}</dd></div>)}</dl>
      <div className="mt-5 rounded-2xl bg-tint/50 p-4"><p className="text-xs text-mute">Produktivitas</p>{prod.ket?<Badge className="mt-2" s={prod.ket==='Belum Menghasilkan'||prod.ket==='Belum Ada Catatan Panen'?'belum':'warn'} label={prod.ket}/>:<p className="mt-1 font-mono text-xl tabular-nums">{fmt(prod.kgha)} kg/ha</p>}</div></Panel>
    <Panel title="Peta poligon"><Suspense fallback={<Skeleton className="h-[280px] rounded-2xl"/>}><MiniMap items={[{id:k.id,label:k.id,koordinat:k.koordinat}]} height={280}/></Suspense></Panel>
  </div>
  <Panel title="Riwayat panen kebun ini" className="mt-6"><DataTable cols={[{h:'Kode',c:r=><Link className="font-medium text-palm hover:underline" to={'/panen/'+r.id}>{r.kode}</Link>},{h:'Tanggal',c:r=>r.t,n:1},{h:'TBS (kg)',c:r=>fmt(r.kg),n:1},{h:'Status',c:r=><Badge s={r.st}/>}]} rows={riwayat}/></Panel></>;
}
