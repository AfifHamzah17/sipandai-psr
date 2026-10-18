import {useStore} from '../store.jsx';
import Master from '../components/Master.jsx';
import WilayahCascade from '../components/WilayahCascade.jsx';
const F=[{k:'nama',label:'Nama organisasi',req:1},{k:'jenis',label:'Jenis organisasi',opts:['gapoktan','poktan','koperasi'],req:1},{k:'desa',label:'Desa',req:1,hint:'Ditulis manual'},{k:'pengurus',label:'Nama pengurus',req:1},{k:'telp',label:'Telepon'}];
export default function Organisasi(){
  const {user,organisasi}=useStore();
  const admin=user.peran==='admin',pengurus=user.peran==='pengurus';
  const validateExtra=v=>{const e={};if(!v.prov)e.prov='Provinsi wajib diisi';if(!v.kab)e.kab='Kabupaten/kota wajib diisi';if(!v.kec)e.kec='Kecamatan wajib diisi';return e};
  return <Master k="organisasi" title="Data Kelembagaan" noun="kelembagaan" fields={F}
    canAdd={admin} canEdit={admin||pengurus} canToggle={admin} canDelete={admin} cascade
    rows={organisasi}
    cols={[{h:'Kode',c:r=>r.id},{h:'Nama',c:r=>r.nama},{h:'Jenis',c:r=>r.jenis},{h:'Wilayah',c:r=>`${r.desa}, ${r.kec}, ${r.kab}`},{h:'Pengurus',c:r=>r.pengurus}]}
    renderExtraFields={(v,setV,er)=><WilayahCascade value={{prov:v.prov||'',kab:v.kab||'',kec:v.kec||''}} onChange={patch=>setV({...v,...patch})} errors={er}/>}
    validateExtra={validateExtra}/>;
}
