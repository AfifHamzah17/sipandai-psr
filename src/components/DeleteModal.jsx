import {useEffect,useState} from 'react';
import {Modal,inp} from './ui.jsx';
import {useStore} from '../store.jsx';

// Dialog konfirmasi hapus yang dipakai semua CRUD. Penghapusan permanen, tetapi
// jejaknya tetap tercatat di Riwayat. `cascade`: tampilkan opsi "hapus berantai"
// (hanya administrator) untuk data yang punya turunan (kebun, panen, anggota).
export default function DeleteModal({open,onClose,title,children,onConfirm,cascade=false,busy}){
  const {user}=useStore(),[alasan,setAlasan]=useState(''),[berantai,setBerantai]=useState(false);
  useEffect(()=>{if(open){setAlasan('');setBerantai(false)}},[open]);
  return <Modal open={open} onClose={onClose} title={title}
    actions={<><button className="btn btn-o" onClick={onClose}>Batal</button><button className="btn btn-r" disabled={busy} onClick={()=>onConfirm(alasan.trim(),berantai)}>{busy?'Menghapus…':'Ya, hapus'}</button></>}>
    <div className="grid gap-4">
      <p>{children||'Data yang dihapus tidak bisa dikembalikan. Jejak penghapusan tetap tersimpan di Riwayat.'}</p>
      <label className="grid gap-1.5 text-sm"><span className="font-medium">Alasan (opsional)</span><input className={inp()} value={alasan} onChange={e=>setAlasan(e.target.value)}/></label>
      {cascade&&user?.peran==='admin'&&<label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={berantai} onChange={e=>setBerantai(e.target.checked)}/><span>Hapus berantai: ikut hapus data turunannya (kebun, panen, dan seterusnya).</span></label>}
    </div>
  </Modal>;
}
