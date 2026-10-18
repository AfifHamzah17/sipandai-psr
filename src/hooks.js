import {useEffect,useState} from 'react';
export function useDebounce(v,ms=250){const [d,setD]=useState(v);useEffect(()=>{const t=setTimeout(()=>setD(v),ms);return()=>clearTimeout(t)},[v,ms]);return d}
