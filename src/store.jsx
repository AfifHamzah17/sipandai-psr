import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {api,setToken} from './api.js';
import {toPts,toKoord} from './lib/geoTransform.js';

// Adaptor: menjaga nama field yang sudah dipakai di seluruh halaman (own, luas, thn,
// tan, ver, pts, k, t, kg, jj, no, file, st, rev, cat, ...) supaya komponen UI
// tidak perlu diubah. `_fid` menyimpan id dokumen Firestore sungguhan untuk
// dipakai saat memanggil API (kode seperti "KEB-0001" tetap jadi `id` tampilan).
const mapKebun=(k,agtById)=>({id:k.kodeKebun,_fid:k.kebunId,org:k.organisasiId,vercat:k.verifikasi?.catatan||'',sumberLuas:k.sumberDataLuas||'',own:agtById[k.anggotaId]?.namaAnggota||'(anggota tidak ditemukan)',
  anggotaId:k.anggotaId,luas:k.luasHa,thn:k.tahunReplanting,tan:k.statusTanaman,sumber:k.sumberDataLuas,ver:k.statusVerifikasiKebun,pts:toPts(k.koordinat),koordinat:k.koordinat||[]});
// Ambil path GCS dari entri fileBukti — toleran string maupun objek {path,namaFile};
// buang entri warisan yang hanya nama tampilan (tidak ber-prefix "bukti/") karena
// tidak mungkin di-resolve menjadi signed URL.
const pathBukti=f=>typeof f==='string'?f:(f?.path||f?.gcsPath||'');
const mapPanen=p=>({id:p.kodePanen,_fid:p.panenId,kode:p.kodePanen,k:p.snapshot?.kodeKebun||p.kebunId,_kfid:p.kebunId,t:(p.tanggalPanen||'').slice(0,10),
  kg:p.beratTbsKg,jj:p.jumlahJanjang,sum:p.sumberBukti,no:p.nomorBukti,
  file:(p.fileBukti||[]).map(pathBukti).filter(f=>f&&f.startsWith('bukti/')),
  st:p.statusValidasi,rev:p.revisiKe,cat:p.validasiTerakhir?.catatan||'',
  orgNama:p.snapshot?.namaOrganisasi||'',own:p.snapshot?.namaAnggota||'',
  pks:p.konfirmasiPks?{hasil:p.konfirmasiPks.hasil,sel:p.konfirmasiPks.selisihKg,ket:p.konfirmasiPks.keterangan||'',t:p.konfirmasiPks.waktu,tiket:p.konfirmasiPks.timbangan?.nomorTiket||'',netto:p.konfirmasiPks.timbangan?.beratNettoKg??null}:null});
const mapOrg=o=>({id:o.kodeOrganisasi,_fid:o.organisasiId,nama:o.namaOrganisasi,jenis:o.jenisOrganisasi,desa:o.desa,kec:o.kecamatan,kab:o.kabupaten,prov:o.provinsi,
  pengurus:o.kontak?.namaPengurus||'',telp:o.kontak?.telepon||'',st:o.statusOrganisasi});
const mapAgt=a=>({id:a.kodeAnggota,_fid:a.anggotaId,org:a.organisasiId,nama:a.namaAnggota,nik:a.nik,telp:a.telepon||'',st:a.statusKeanggotaan});
const mapUser=u=>({id:u.userId,_fid:u.userId,nama:u.nama,email:u.email,peran:u.peran,instansi:u.instansi||'',namaPks:u.namaPks||'',org:u.organisasiId||'',cakupan:u.cakupanAkses&&Object.values(u.cakupanAkses).flat().filter(Boolean).join(', ')||'-',st:u.statusAkun});
const mapKem=k=>({id:k.kemitraanId,_fid:k.kemitraanId,org:k.organisasiId,mitra:k.mitraUserId,kebunIds:k.cakupanData?.kebunId||[],st:k.statusKemitraan});
const ringkas=o=>Object.entries(o||{}).map(([k,v])=>`${k}: ${v}`).join(', ')||'-';

const toUser=me=>({id:me.userId,nama:me.nama,email:me.email,peran:me.peran,instansi:me.instansi||null,organisasiId:me.organisasiId,namaOrganisasi:me.namaOrganisasi||'',label:me.labelPeran||''});

const S=createContext(null),D=createContext(()=>{});
export const useStore=()=>useContext(S);
export const useDispatch=()=>useContext(D);

const empty={kebun:[],panen:[],organisasi:[],anggota:[],users:[],kemitraan:[],riw:[]};

export function StoreProvider({children}){
  const [user,setUser]=useState(null);
  const [booting,setBooting]=useState(true); // true selagi mencoba pulihkan sesi dari cookie refresh token
  const [data,setData]=useState(empty);
  const nameById=useRef({});

  async function loadAll(peran){
    const [kebunR,panenR,orgR,agtR,riwR,logR,usersR,kemR]=await Promise.all([
      api('/kebun'),api('/panen'),api('/organisasi'),api('/anggota'),api('/riwayat'),api('/riwayat/log'),
      peran==='admin'?api('/users'):Promise.resolve([]),
      peran==='admin'?api('/kemitraan'):Promise.resolve([]),
    ]);
    const agtById=Object.fromEntries(agtR.map(a=>[a.anggotaId,a]));
    usersR.forEach(u=>nameById.current[u.userId]=u.nama);
    const uname=id=>nameById.current[id]||(id===user?.id?user?.nama:id)||'Pengguna';
    const riw=[
      ...riwR.map(r=>({t:r.waktuPerubahan,u:uname(r.penggunaId),w:`${r.jenisData} ${r.idData}`,b:ringkas(r.nilaiSebelum),a:ringkas(r.nilaiSesudah),why:r.alasanPerubahan||'-',_cat:'riwayat'})),
      ...logR.map(r=>({t:r.waktuAktivitas,u:uname(r.penggunaId),w:r.aktivitas,b:'-',a:r.objekData||'-',why:'-',_cat:'log'})),
    ].sort((a,b)=>new Date(b.t)-new Date(a.t));
    setData({kebun:kebunR.map(k=>mapKebun(k,agtById)),panen:panenR.map(mapPanen),organisasi:orgR.map(mapOrg),anggota:agtR.map(mapAgt),
      users:usersR.map(mapUser),kemitraan:kemR.map(mapKem),riw});
  }
  // Setelah aksi CRUD berhasil, muat ulang semua daftar. Kalau pemuatan ulang
  // ini sendiri gagal (mis. satu endpoint lagi bermasalah), jangan lempar
  // error itu sebagai "aksi gagal" — aksinya sendiri sudah sukses di server.
  async function reloadSoftly(peran){
    try{await loadAll(peran)}catch(e){console.warn('Gagal memuat ulang data setelah aksi (aksi itu sendiri berhasil):',e)}
  }

  useEffect(()=>{
    (async()=>{
      try{
        const d=await api('/auth/refresh','POST');
        setToken(d.accessToken);
        const me=await api('/auth/me');
        const u=toUser(me);
        nameById.current[u.id]=u.nama;
        setUser(u);
        await reloadSoftly(u.peran);
      }catch{/* tidak ada sesi tersimpan atau sudah kedaluwarsa — biarkan di halaman login */}
      finally{setBooting(false)}
    })();
  },[]);

  async function dispatch(a){
    switch(a.type){
      case 'login':{
        const d=await api('/auth/login','POST',{email:a.email,password:a.password});
        setToken(d.accessToken);
        const me=await api('/auth/me');
        const u=toUser(me);
        nameById.current[u.id]=u.nama;
        setUser(u);
        await loadAll(u.peran);
        return u;
      }
      case 'logout':{
        try{await api('/auth/logout','POST')}catch{/* best effort */}
        setToken(null);setUser(null);setData(empty);nameById.current={};
        return;
      }
      case 'addKebun':{
        const koordinat=toKoord(a.pts);
        // organisasiId TIDAK dikirim — backend menurunkannya dari anggota (pemilik)
        // yang dipilih, supaya tidak gagal untuk Admin (tidak punya organisasiId sendiri).
        await api('/kebun','POST',{anggotaId:a.meta.own,koordinat,
          tahunReplanting:+a.meta.thn,statusTanaman:a.meta.tan,sumberDataLuas:a.meta.sumber,metodeLuas:'peta_otomatis'});
        await reloadSoftly(user.peran);return;
      }
      case 'verif':{
        await api(`/kebun/${a.row._fid}/verifikasi`,'POST',{keputusan:a.keputusan||'terverifikasi',catatan:a.catatan||''});
        await reloadSoftly(user.peran);return;
      }
      case 'savePanen':{
        const {d,mode,row}=a,idem=a.idempotencyKey||crypto.randomUUID();
        if(row?._fid){
          if(mode==='draf')await api(`/panen/${row._fid}`,'PUT',{beratTbsKg:+d.kg,jumlahJanjang:+d.jj||0,sumberBukti:d.sum,nomorBukti:d.no,fileBukti:d.file,alasanPerubahan:'Perbaikan oleh pengurus'});
          else{await api(`/panen/${row._fid}`,'PUT',{beratTbsKg:+d.kg,jumlahJanjang:+d.jj||0,sumberBukti:d.sum,nomorBukti:d.no,fileBukti:d.file,alasanPerubahan:'Perbaikan oleh pengurus'});
            await api(`/panen/${row._fid}/kirim`,'POST',undefined,{'Idempotency-Key':idem});}
        }else{
          const kb=data.kebun.find(k=>k.id===d.k);
          await api('/panen','POST',{kebunId:kb?._fid,tanggalPanen:d.t,beratTbsKg:+d.kg,jumlahJanjang:+d.jj||0,sumberBukti:d.sum||'lainnya',nomorBukti:d.no,fileBukti:d.file,mode},{'Idempotency-Key':idem});
        }
        await reloadSoftly(user.peran);return;
      }
      case 'decide':{
        await api(`/validasi/${a.row._fid}`,'POST',{keputusan:a.k,catatan:a.cat});
        await reloadSoftly(user.peran);return;
      }
      case 'upsert':{
        const {k,item,ed}=a,fid=ed?._fid;
        if(k==='organisasi'){
          const body={namaOrganisasi:item.nama,jenisOrganisasi:item.jenis,desa:item.desa,kecamatan:item.kec,kabupaten:item.kab,provinsi:item.prov,namaPengurus:item.pengurus,telepon:item.telp};
          fid?await api(`/organisasi/${fid}`,'PUT',{...body,alasanPerubahan:item.alasan}):await api('/organisasi','POST',body);
        }else if(k==='anggota'){
          const body={organisasiId:item.org,namaAnggota:item.nama,nik:item.nik,telepon:item.telp};
          fid?await api(`/anggota/${fid}`,'PUT',{...body,alasanPerubahan:item.alasan}):await api('/anggota','POST',body);
        }else if(k==='users'){
          const body={nama:item.nama,email:item.email,peran:item.peran,instansi:item.peran==='validator'?item.instansi:null,namaPks:item.peran==='pks'?(item.namaPks||''):undefined,organisasiId:item.peran==='pengurus'?(item.org||null):(item.org||null)};
          fid?await api(`/users/${fid}`,'PUT',{...body,alasanPerubahan:item.alasan}):await api('/users','POST',body);
        }else if(k==='kemitraan'){
          const kebunIds=Array.isArray(item.kebunIds)?item.kebunIds:(item.kebunIds?[item.kebunIds]:[]);
          const body={organisasiId:item.org,mitraUserId:item.mitra,kebunId:kebunIds};
          fid?await api(`/kemitraan/${fid}`,'PUT',{...body,alasanPerubahan:item.alasan}):await api('/kemitraan','POST',body);
        }
        await reloadSoftly(user.peran);return;
      }
      case 'toggle':{
        const {k,row,to}=a,fid=row._fid,field={organisasi:'statusOrganisasi',anggota:'statusKeanggotaan',users:'statusAkun',kemitraan:'statusKemitraan'}[k];
        const path={organisasi:'organisasi',anggota:'anggota',users:'users',kemitraan:'kemitraan'}[k];
        await api(`/${path}/${fid}`,'PUT',{[field]:to});
        await reloadSoftly(user.peran);return;
      }
      case 'remove':{
        // hapus data (tiap CRUD). `berantai` hanya diterima backend dari administrator.
        const path={organisasi:'organisasi',anggota:'anggota',kebun:'kebun',panen:'panen',users:'users',kemitraan:'kemitraan'}[a.k];
        await api(`/${path}/${a.row._fid}${a.berantai?'?berantai=1':''}`,'DELETE',{alasanPerubahan:a.alasan||undefined});
        await reloadSoftly(user.peran);return;
      }
      case 'resetPassword':{
        return api(`/users/${a.row._fid}/reset-password`,'POST');
      }
      case 'refresh':{await reloadSoftly(user.peran);return;}
      default:return;
    }
  }

  return <S.Provider value={{user,booting,...data}}><D.Provider value={dispatch}>{children}</D.Provider></S.Provider>;
}