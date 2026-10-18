const BASE=import.meta.env.VITE_API_BASE_URL||'https://sipandai-backend-12093920737.asia-southeast2.run.app/api/v1';
let token=null;
export const setToken=t=>{token=t};
export const getToken=()=>token;
async function parse(r){
  const ct=r.headers.get('content-type')||'';
  if(!ct.includes('application/json')){
    if(!r.ok)throw Object.assign(new Error(`Server error ${r.status}`),{status:r.status});
    return r;
  }
  const j=await r.json();
  if(!j.success){const e=new Error(j.error?.message||'Permintaan gagal');e.code=j.error?.code;e.detail=j.error?.detail;e.status=r.status;throw e}
  return j.data;
}

export async function api(path,method='GET',body,extraHeaders){
  const r=await fetch(BASE+path,{method,credentials:'include',headers:{'Content-Type':'application/json',...(token&&{Authorization:'Bearer '+token}),...extraHeaders},body:body!==undefined?JSON.stringify(body):undefined});
  if(r.status===401&&token&&path!=='/auth/refresh'){
    try{const d=await refresh();setToken(d.accessToken);
      const r2=await fetch(BASE+path,{method,credentials:'include',headers:{'Content-Type':'application/json',Authorization:'Bearer '+d.accessToken,...extraHeaders},body:body!==undefined?JSON.stringify(body):undefined});
      return parse(r2);
    }catch{setToken(null);throw Object.assign(new Error('Sesi berakhir, silakan masuk lagi'),{status:401})}
  }
  return parse(r);
}
export async function refresh(){
  const r=await fetch(BASE+'/auth/refresh',{method:'POST',credentials:'include'});
  return parse(r);
}
export async function apiBlob(path){
  const r=await fetch(BASE+path,{credentials:'include',headers:{...(token&&{Authorization:'Bearer '+token})}});
  if(!r.ok){let m='Gagal mengunduh laporan';try{const j=await r.json();m=j.error?.message||m}catch{}throw new Error(m)}
  return r.blob();
}
export async function uploadToSignedUrl(uploadUrl,file){
  const r=await fetch(uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});
  if(!r.ok)throw new Error('Gagal mengunggah berkas ke penyimpanan');
}
