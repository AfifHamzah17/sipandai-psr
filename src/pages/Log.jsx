import {useMemo} from 'react';
import {useStore} from '../store.jsx';
import {DataTable,PageHead,Panel} from '../components/ui.jsx';
export default function Log(){const {riw}=useStore(),rows=useMemo(()=>riw.filter(r=>/Login|Validasi|Verifikasi|EKSPOR|Reset|Nonaktifkan|Aktifkan|pengguna|kemitraan/.test(r.w)).map((r,i)=>({...r,_k:i})),[riw]);
return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Log Akses'}]} title="Log Akses" desc="Login, ekspor, keputusan validasi, dan perubahan hak akses."/>
<Panel title="Log akses"><DataTable size={10} cols={[{h:'Waktu',c:r=>r.t,n:1},{h:'Pengguna',c:r=>r.u},{h:'Aktivitas',c:r=>r.w}]} rows={rows}/></Panel></>}
