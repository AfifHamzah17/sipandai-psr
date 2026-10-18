import {useStore} from '../store.jsx';
import Master from '../components/Master.jsx';
export default function Kemitraan(){const {kemitraan,organisasi,users,kebun}=useStore();
const F=[{k:'org',label:'Organisasi',req:1,opts:organisasi.map(o=>[o._fid,o.nama])},{k:'mitra',label:'Akun mitra / PKS',req:1,opts:users.filter(u=>(u.peran==='validator'&&u.instansi==='mitra')||u.peran==='pks').map(u=>[u._fid,u.email])},{k:'kebunIds',label:'Kebun dalam kemitraan',req:1,multi:true,hint:'Tahan Ctrl/Cmd untuk memilih lebih dari satu',opts:kebun.map(k=>[k._fid,k.id+' — '+k.own])}];
return <Master k="kemitraan" title="Kemitraan" noun="kemitraan" fields={F} can canDelete rows={kemitraan} cols={[
  {h:'Organisasi',c:r=>organisasi.find(o=>o._fid===r.org)?.nama||r.org},
  {h:'Akun mitra / PKS',c:r=>users.find(u=>u._fid===r.mitra)?.email||r.mitra},
  {h:'Kebun',c:r=>r.kebunIds.map(id=>kebun.find(k=>k._fid===id)?.id||id).join(', ')||'-'}]}/>}
