import {useState} from 'react';
import {useDispatch} from '../store.jsx';
import {Badge,DataTable,Field,Modal,PageHead,Panel,Sheet,inp} from './ui.jsx';
import {useToast} from './Toast.jsx';
import DeleteModal from './DeleteModal.jsx';

export default function Master({k,title,noun,cols,fields,rows,can,canAdd,canEdit,canToggle,canDelete=false,cascade=false,extra,renderExtraFields,validateExtra}){
  const dp=useDispatch(),toast=useToast();
  const [ed,setEd]=useState(null),[v,setV]=useState({}),[er,setEr]=useState({}),[ask,setAsk]=useState(null),[busy,setBusy]=useState(false),[del,setDel]=useState(null);
  const aAdd=canAdd??can,aEdit=canEdit??can,aToggle=canToggle??can;

  const open=r=>{setEd(r||{});setV(r?{...r,alasan:''}:Object.fromEntries(fields.map(f=>[f.k,f.d??''])));setEr({})};
  const onField=f=>e=>{
    let val=e.target.value;
    if(f.numeric)val=val.replace(/\\D/g,'');
    if(f.maxLength)val=val.slice(0,f.maxLength);
    setV({...v,[f.k]:val});
  };
  const save=async()=>{
    const m={};fields.forEach(f=>{if(f.req&&!String(v[f.k]??'').trim())m[f.k]=f.label+' wajib diisi'});
    if(validateExtra)Object.assign(m,validateExtra(v));
    if(ed.id&&!String(v.alasan).trim())m.alasan='Alasan perubahan wajib diisi';
    setEr(m);if(Object.keys(m).length)return;
    setBusy(true);
    try{await dp({type:'upsert',k,item:v,ed});toast(ed.id?'Perubahan disimpan':'Ditambahkan: '+noun);setEd(null)}
    catch(e){toast(e.message||'Gagal menyimpan',1)}
    finally{setBusy(false)}
  };
  const toggle=async()=>{
    setBusy(true);
    try{await dp({type:'toggle',k,row:ask,to:ask.st==='aktif'?'nonaktif':'aktif'});toast('Status '+noun+' diperbarui')}
    catch(e){toast(e.message||'Gagal memperbarui status',1)}
    finally{setBusy(false);setAsk(null)}
  };

  const remove=async(alasan,berantai)=>{
    setBusy(true);
    try{await dp({type:'remove',k,row:del,alasan,berantai});toast(noun[0].toUpperCase()+noun.slice(1)+' dihapus')}
    catch(e){toast(e.message||'Gagal menghapus',1)}
    finally{setBusy(false);setDel(null)}
  };
  const showAksi=aEdit||aToggle||canDelete;
  const all=[...cols,{h:'Status',c:r=><Badge s={r.st==='aktif'?'valid':'belum'} label={r.st==='aktif'?'Aktif':'Nonaktif'}/>},
    ...(showAksi?[{h:'Aksi',c:r=><div className="flex gap-2">{aEdit&&<button className="btn btn-y !h-8" onClick={()=>open(r)}>Ubah</button>}{extra&&extra(r)}{aToggle&&<button className={'btn !h-8 '+(r.st==='aktif'?'btn-r':'btn-p')} onClick={()=>setAsk(r)}>{r.st==='aktif'?'Nonaktifkan':'Aktifkan'}</button>}{canDelete&&<button className="btn btn-r !h-8" onClick={()=>setDel(r)}>Hapus</button>}</div>}]:[])];

  return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:title}]} title={title} actions={aAdd&&<button className="btn btn-p" onClick={()=>open()}>Tambah {noun}</button>}/>
  <Panel title={'Daftar '+noun}><DataTable cols={all} rows={rows}/></Panel>
  <Sheet open={!!ed} onClose={()=>setEd(null)} title={ed?.id?'Ubah '+noun:'Tambah '+noun}><div className="grid gap-5">
    {fields.map(f=><Field key={f.k} id={'f-'+f.k} label={f.label} required={f.req} error={er[f.k]} hint={f.hint}>
      {f.multi?<select id={'f-'+f.k} multiple size={Math.min(f.opts.length,5)} className={inp(er[f.k])} value={v[f.k]||[]} onChange={e=>setV({...v,[f.k]:[...e.target.selectedOptions].map(o=>o.value)})}>{f.opts.map(o=>Array.isArray(o)?<option key={o[0]} value={o[0]}>{o[1]}</option>:<option key={o}>{o}</option>)}</select>
      :f.opts?<select id={'f-'+f.k} className={inp(er[f.k])} value={v[f.k]??''} onChange={e=>setV({...v,[f.k]:e.target.value})}><option value="">Pilih</option>{f.opts.map(o=>Array.isArray(o)?<option key={o[0]} value={o[0]}>{o[1]}</option>:<option key={o}>{o}</option>)}</select>
      :<input id={'f-'+f.k} inputMode={f.numeric?'numeric':undefined} maxLength={f.maxLength} className={inp(er[f.k])} aria-invalid={!!er[f.k]} aria-describedby={'f-'+f.k+'-e'} value={v[f.k]??''} onChange={onField(f)}/>}</Field>)}
    {renderExtraFields&&renderExtraFields(v,setV,er)}
    {ed?.id&&<Field id="f-alasan" label="Alasan perubahan" required error={er.alasan}><input id="f-alasan" className={inp(er.alasan)} value={v.alasan} onChange={e=>setV({...v,alasan:e.target.value})}/></Field>}
    <div className="flex justify-end gap-2"><button className="btn btn-o" onClick={()=>setEd(null)}>Batal</button><button className="btn btn-p" disabled={busy} onClick={save}>{busy?'Menyimpan…':'Simpan'}</button></div>
  </div></Sheet>
  <Modal open={!!ask} onClose={()=>setAsk(null)} title={`${ask?.st==='aktif'?'Nonaktifkan':'Aktifkan'} ${noun}?`} actions={<><button className="btn btn-o" onClick={()=>setAsk(null)}>Batal</button><button className="btn btn-p" disabled={busy} onClick={toggle}>Ya, lanjutkan</button></>}>Data tidak dihapus. Riwayat tetap tersimpan dan statusnya bisa dikembalikan.</Modal>
  <DeleteModal open={!!del} onClose={()=>setDel(null)} title={`Hapus ${noun}?`} busy={busy} cascade={cascade} onConfirm={remove}>{noun[0].toUpperCase()+noun.slice(1)} ini akan dihapus permanen. Jika masih dipakai data lain, penghapusan akan ditolak.</DeleteModal></>;
}
