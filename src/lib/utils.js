export const fmt=n=>(+n).toLocaleString('id-ID',{maximumFractionDigits:4});
export const cn=(...a)=>a.filter(Boolean).join(' ');
export const now=()=>new Date().toLocaleString('id-ID');
export const RN={pengurus:'Pengurus Poktan',pks:'PKS',validator:'Validator',admin:'Administrator'};
export const INSTANSI={dinas:'Dinas Pertanian',mitra:'Kemitraan',bpdp:'BPDP'};
// Label akun untuk tampilan: "Pengurus Poktan {nama poktan}", "Validator BPDP", dst. (dibentuk backend)
export const roleLabel=u=>u?.label||RN[u?.peran]||'';
export const ALL={dashboard:'Dashboard',organisasi:'Kelembagaan',anggota:'Anggota',kebun:'Kebun & Peta',panen:'Input Panen',
  validasi:'Antrean Validasi Panen','validasi-kebun':'Validasi Data Kebun','konfirmasi-pks':'Konfirmasi PKS','riwayat-validasi':'Riwayat Validasi',
  penerimaan:'Data Penerimaan TBS',timbangan:'Data Timbangan',konfirmasi:'Konfirmasi Transaksi','riwayat-konfirmasi':'Riwayat Konfirmasi','laporan-penerimaan':'Laporan Penerimaan',
  analisis:'Analisis',laporan:'Laporan',riwayat:'Riwayat & Log',users:'Pengguna',kemitraan:'Kemitraan',log:'Log Akses'};
// Role 1 pengurus · Role 2 pks · Role 3 validator (Dinas Pertanian / Kemitraan / BPDP) · Role 4 admin (semua)
export const MENU={
  pengurus:['dashboard','organisasi','anggota','kebun','panen','laporan','riwayat'],
  pks:['dashboard','penerimaan','timbangan','konfirmasi','riwayat-konfirmasi','laporan-penerimaan'],
  validator:['dashboard','validasi-kebun','validasi','konfirmasi-pks','riwayat-validasi','kebun','organisasi','anggota','analisis','laporan'],
  admin:['dashboard','organisasi','anggota','kebun','panen','validasi-kebun','validasi','konfirmasi-pks','riwayat-validasi','penerimaan','timbangan','konfirmasi','riwayat-konfirmasi','laporan-penerimaan','analisis','laporan','riwayat','users','kemitraan','log']};
// Pengelompokan menu untuk navbar: grup dengan >1 item terlihat dirender sebagai dropdown.
export const NAV_GROUPS=[
  {label:'Dashboard',items:['dashboard']},
  {label:'Data',items:['organisasi','anggota','penerimaan','timbangan']},
  {label:'Pendataan',items:['kebun','panen']},
  {label:'Validasi',items:['validasi-kebun','validasi','konfirmasi-pks','riwayat-validasi']},
  {label:'Konfirmasi',items:['konfirmasi','riwayat-konfirmasi']},
  {label:'Laporan',items:['analisis','laporan','laporan-penerimaan','riwayat','log']},
  {label:'Admin',items:['users','kemitraan']},
];
export const ST={draf:'Draf',menunggu:'Menunggu',perlu_konfirmasi:'Perlu klarifikasi',valid:'Valid',ditolak:'Ditolak',cocok:'Cocok',tidak_cocok:'Tidak cocok',tidak_ditemukan:'Tidak ditemukan',belum_pks:'Belum dikonfirmasi'};
export const PKS_HASIL={cocok:'Cocok',tidak_cocok:'Tidak cocok',tidak_ditemukan:'Tidak ditemukan'};
export const ORG='Perkumpulan Kelompok Tani Perkebunan Pasir Tuntung Jaya';
export const sq=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
export function area(p){let a=0;p.forEach((q,i)=>{const n=p[(i+1)%p.length];a+=q[0]*n[1]-n[0]*q[1]});return Math.abs(a)/2*0.25/10000}
export function fit(pts,w,h,pad=8){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),y0=Math.min(...ys),k=Math.min((w-2*pad)/(Math.max(...xs)-x0||1),(h-2*pad)/(Math.max(...ys)-y0||1));return pts.map(p=>[pad+(p[0]-x0)*k,pad+(p[1]-y0)*k].join(',')).join(' ')}
export function autocheck(p,panen,kebun){const r=[],o=(k,h,m)=>r.push({k,h,m}),kb=kebun.find(k=>k.id===p.k);
if(!p.k||!p.t||!p.kg)o('R1','gagal','Kolom wajib belum lengkap');else o('R1','ok','Kolom wajib terisi');
if(!(p.kg>0))o('R2','gagal','Berat TBS harus lebih dari 0');
if(p.t&&new Date(p.t)>new Date())o('R3','gagal','Tanggal panen tidak boleh di masa depan');
if(!kb)o('R4','gagal','Kebun di luar cakupan');
if(p.no&&panen.some(x=>x.id!==p.id&&x.no===p.no))o('R5','warn','Nomor bukti terindikasi duplikat');
if(!(p.file||[]).length&&!p.no)o('R6','gagal','Bukti wajib dilampirkan (BUKTI_WAJIB=true)');
if(kb&&p.kg/kb.luas/30>30)o('R7','warn','TBS harian per hektar melebihi ambang wajar 30 kg');
if(!r.some(x=>x.h!=='ok'))o('Semua','ok','Semua pemeriksaan lolos');return r}
export function produktivitas(kebun,panen){return kebun.map(k=>{const all=panen.filter(p=>p.k===k.id),v=all.filter(p=>p.st==='valid'),kg=v.reduce((a,p)=>a+p.kg,0);let ket=null;
if(k.tan==='belum_menghasilkan')ket='Belum Menghasilkan';else if(!all.length)ket='Belum Ada Catatan Panen';else if(k.ver!=='terverifikasi')ket='Data Belum Terverifikasi';else if(!v.length)ket='Data Belum Lengkap';
return{id:k.id,own:k.own,luas:k.luas,kg,n:v.length,ket,kgha:ket?null:kg/k.luas}})}

export function semester(ym){const[y,m]=ym.split('-').map(Number);return y+'-S'+(m<=6?1:2)}
export function periodKey(ym,g){return g==='tahunan'?ym.slice(0,4):g==='semester'?semester(ym):ym}
export function periodLabel(k,g){return g==='semester'?k.replace('-S','  Semester '):k}
export function groupBy(items,getYm,g){const m={};items.forEach(it=>{const ym=getYm(it),k=periodKey(ym,g);(m[k]=m[k]||[]).push(it)});return m}
