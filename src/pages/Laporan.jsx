import {useMemo,useState} from 'react';
import {useDispatch,useStore} from '../store.jsx';
import {ST,fmt,now} from '../lib/utils.js';
import {DataTable,Field,PageHead,Panel,inp} from '../components/ui.jsx';
import {useToast} from '../components/Toast.jsx';
export default function Laporan(){const {kebun,panen}=useStore(),dp=useDispatch(),toast=useToast(),[jn,setJ]=useState('produksi'),[per,setP]=useState('');
const months=useMemo(()=>[...new Set(panen.map(p=>p.t.slice(0,7)))].sort(),[panen]),fp=useMemo(()=>per?panen.filter(p=>p.t.startsWith(per)):panen,[panen,per]);
const R=useMemo(()=>jn==='produksi'?{h:['Kebun','Pemilik','Periode','Total TBS valid (kg)','Catatan valid'],rows:kebun.map(k=>{const v=fp.filter(p=>p.k===k.id&&p.st==='valid');return{id:k.id,c:[k.id,k.own,per||'Semua periode',v.reduce((a,p)=>a+p.kg,0),v.length]}})}
:{h:['Kode','Kebun','Tanggal','TBS (kg)','Status validasi'],rows:fp.map(p=>({id:p.id,c:[p.kode,p.k,p.t,p.kg,ST[p.st]]}))},[jn,kebun,fp,per]);
const dl=()=>{const csv=[R.h,...R.rows.map(r=>r.c)].map(l=>l.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n'),a=document.createElement('a');
a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download=`laporan-${jn}-${per||'semua'}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
dp({type:'log',w:'EKSPOR_LAPORAN laporan/'+jn+'?periode='+(per||'semua'),t:now()});toast('Laporan diunduh sebagai CSV. Excel tersedia setelah backend tersambung.')};
return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Laporan'}]} title="Laporan" desc="Hasil ekspor mengikuti filter yang sedang aktif. Laporan kelengkapan data disembunyikan sampai definisinya disepakati stakeholder." actions={<button className="btn btn-p" onClick={dl}>Unduh CSV</button>}/>
<Panel><div className="mb-5 grid max-w-xl gap-4 sm:grid-cols-2"><Field id="lj" label="Jenis laporan"><select id="lj" className={inp()} value={jn} onChange={e=>setJ(e.target.value)}><option value="produksi">Produksi per kebun</option><option value="validasi">Status validasi</option></select></Field>
<Field id="lp" label="Periode"><select id="lp" className={inp()} value={per} onChange={e=>setP(e.target.value)}><option value="">Semua periode</option>{months.map(m=><option key={m}>{m}</option>)}</select></Field></div>
<DataTable cols={R.h.map((h,i)=>({h,c:r=>typeof r.c[i]==='number'?fmt(r.c[i]):r.c[i],n:typeof R.rows[0]?.c[i]==='number'}))} rows={R.rows} size={10}/></Panel></>}
