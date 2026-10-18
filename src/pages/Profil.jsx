import {useStore} from '../store.jsx';
import {roleLabel} from '../lib/utils.js';
import {PageHead,Panel} from '../components/ui.jsx';
const cakupan=u=>u.peran==='pengurus'?(u.namaOrganisasi||'Kelembagaan Anda'):u.peran==='pks'?'Kelembagaan mitra pasok PKS':u.peran==='admin'?'Seluruh data'
  :u.instansi==='dinas'?'Wilayah kewenangan Dinas Pertanian':u.instansi==='mitra'?'Kebun dalam kemitraan':'Sesuai kesepakatan akses BPDP';
export default function Profil(){const {user}=useStore();
return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Profil'}]} title="Profil akun"/>
<Panel><dl className="grid max-w-xl gap-5 text-sm">{[['Nama',user.nama],['Email',user.email],['Peran',roleLabel(user)],['Cakupan data',cakupan(user)]].map(([a,b])=><div key={a}><dt className="text-xs text-mute">{a}</dt><dd className="mt-1 font-medium">{b}</dd></div>)}</dl></Panel></>}
