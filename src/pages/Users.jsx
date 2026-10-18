import {useDispatch,useStore} from '../store.jsx';
import {INSTANSI,RN} from '../lib/utils.js';
import Master from '../components/Master.jsx';
import {useToast} from '../components/Toast.jsx';
export default function Users(){const {user,users,organisasi}=useStore(),dp=useDispatch(),toast=useToast();
const F=[{k:'nama',label:'Nama',req:1},{k:'email',label:'Email',req:1},{k:'peran',label:'Peran',req:1,opts:Object.entries(RN)},
{k:'instansi',label:'Instansi validator',hint:'Wajib untuk Validator: Dinas Pertanian, Kemitraan, atau BPDP',opts:Object.entries(INSTANSI)},
{k:'namaPks',label:'Nama PKS',hint:'Khusus akun PKS (opsional)'},
{k:'org',label:'Kelembagaan (poktan/gapoktan/koperasi)',hint:'Wajib untuk Pengurus',opts:organisasi.map(o=>[o._fid,o.nama])}];
const validateExtra=v=>{const e={};
  if(v.peran==='validator'&&!v.instansi)e.instansi='Instansi validator wajib dipilih';
  if(v.peran==='pengurus'&&!v.org)e.org='Pengurus wajib dikaitkan dengan satu kelembagaan';
  return e};
const resetPw=async r=>{try{const d=await dp({type:'resetPassword',row:r});toast('Kata sandi sementara: '+d.sandiSementara)}catch(e){toast(e.message||'Gagal mereset kata sandi',1)}};
const peranTxt=r=>r.peran==='validator'?'Validator '+(INSTANSI[r.instansi]||''):RN[r.peran];
return <Master k="users" title="Pengguna" noun="pengguna" fields={F} can canDelete rows={users.map(u=>({...u,_self:u._fid===user.id}))} validateExtra={validateExtra}
cols={[{h:'Nama',c:r=>r.nama},{h:'Email',c:r=>r.email},{h:'Peran',c:r=>peranTxt(r)},{h:'Kelembagaan',c:r=>organisasi.find(o=>o._fid===r.org)?.nama||'-'},{h:'Cakupan',c:r=>r.cakupan||'-'}]}
extra={r=><button className="btn btn-o !h-8" onClick={()=>resetPw(r)}>Reset sandi</button>}/>}
