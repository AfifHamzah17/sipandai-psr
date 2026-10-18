import {useStore} from '../store.jsx';
import Master from '../components/Master.jsx';
export default function Anggota(){
  const {user,anggota,organisasi}=useStore(),nik=['validator','admin'].includes(user.peran);
  const F=[{k:'org',label:'Kelembagaan',req:1,d:user.peran==='pengurus'?(user.organisasiId||''):'',opts:organisasi.map(o=>[o._fid,o.nama])},{k:'nama',label:'Nama anggota',req:1},
    {k:'nik',label:'NIK',hint:'16 digit angka (opsional)',numeric:true,maxLength:16},{k:'telp',label:'Telepon',numeric:true,maxLength:15}];
  return <Master k="anggota" title="Anggota" noun="anggota" fields={F} can={user.peran==='admin'||user.peran==='pengurus'} canDelete={user.peran==='admin'||user.peran==='pengurus'} rows={anggota}
    cols={[{h:'Kode',c:r=>r.id},{h:'Nama',c:r=>r.nama},{h:'Kelembagaan',c:r=>organisasi.find(o=>o._fid===r.org)?.nama||'-'},
      {h:'NIK',c:r=>nik?r.nik||'-':'••••••••••••••••',n:1},{h:'Telepon',c:r=>r.telp||'-',n:1}]}/>;
}
