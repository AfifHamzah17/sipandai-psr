import {useMemo} from 'react';
import {useStore} from '../store.jsx';
import {DataTable,PageHead,Panel} from '../components/ui.jsx';
export default function Riwayat(){const {riw}=useStore(),rows=useMemo(()=>riw.map((r,i)=>({...r,_k:riw.length-i})),[riw]);
return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Riwayat & Log'}]} title="Riwayat & Log"/>
<Panel title="Riwayat perubahan dan log akses"><DataTable size={10} cols={[{h:'Waktu',c:r=>r.t,n:1},{h:'Pengguna',c:r=>r.u},{h:'Aktivitas',c:r=>r.w},{h:'Sebelum',c:r=>r.b},{h:'Sesudah',c:r=>r.a},{h:'Alasan',c:r=>r.why}]} rows={rows}/></Panel></>}
