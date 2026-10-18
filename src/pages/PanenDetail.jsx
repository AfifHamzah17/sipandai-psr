import {lazy,Suspense,useState} from 'react';
import {Link,Navigate,useParams} from 'react-router-dom';
import {useStore} from '../store.jsx';
import {autocheck,cn,fmt} from '../lib/utils.js';
import {Badge,PageHead,Panel,Skeleton} from '../components/ui.jsx';
const PdfViewer=lazy(()=>import('../components/PdfViewer.jsx'));
export default function PanenDetail(){const {id}=useParams(),{kebun,panen}=useStore(),p=panen.find(x=>String(x.id)===id),[pdf,setPdf]=useState(false);
if(!p)return <Navigate to="/panen" replace/>;
const k=kebun.find(x=>x.id===p.k),c=autocheck(p,panen,kebun);
return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Input Panen',to:'/panen'},{l:p.kode}]} title={p.kode} desc={<>Kebun <Link className="text-palm hover:underline" to={'/kebun/'+p.k}>{p.k}</Link> · {p.t} · revisi ke-{p.rev}</>}/>
<div className="grid gap-6 lg:grid-cols-2"><Panel title="Detail panen"><dl className="grid grid-cols-2 gap-5 text-sm">
{[['Kebun',k?.id],['Pemilik',k?.own],['Tanggal',p.t],['Berat TBS',fmt(p.kg)+' kg'],['Janjang',p.jj],['Nomor bukti',p.no||'-'],['Status',<Badge key="s" s={p.st}/>],['Revisi ke',p.rev]].map(([a,b])=><div key={a}><dt className="text-xs text-mute">{a}</dt><dd className="mt-1 font-medium">{b}</dd></div>)}</dl>
{p.cat&&<p className="mt-5 rounded-xl bg-amber-500/15 p-4 text-sm text-amber-900 dark:text-amber-200">Catatan validator: {p.cat}</p>}
{p.file.length>0&&<button className="btn btn-b mt-5" onClick={()=>setPdf(!pdf)}>{pdf?'Tutup dokumen':'Lihat Dokumen'}</button>}
{pdf&&<div className="mt-3"><Suspense fallback={<Skeleton className="h-64"/>}><PdfViewer src="/contoh-tiket-timbang.pdf"/></Suspense></div>}</Panel>
<Panel title="Riwayat pemeriksaan otomatis"><ul className="grid gap-2">{c.map((r,i)=><li key={i} className={cn('rounded-xl px-3 py-2 text-xs',r.h==='gagal'?'bg-rose-500/15 text-rose-800 dark:text-rose-200':r.h==='warn'?'bg-amber-500/15 text-amber-900 dark:text-amber-200':'bg-palm/15 text-palm')}>{r.k}: {r.m}</li>)}</ul></Panel></div></>}
