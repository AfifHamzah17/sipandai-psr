import {createContext,useCallback,useContext,useRef,useState} from 'react';
import {cn} from '../lib/utils.js';
const C=createContext(()=>{});
export const useToast=()=>useContext(C);
export function ToastProvider({children}){const [m,setM]=useState(null),t=useRef();
const show=useCallback((x,err)=>{clearTimeout(t.current);setM({x,err});t.current=setTimeout(()=>setM(null),2800)},[]);
return <C.Provider value={show}>{children}<div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">{m&&<div className={cn('animate-pop rounded-xl px-4 py-3 text-sm shadow-xl',m.err?'bg-rose-700 text-white':'bg-forest text-white')}>{m.x}</div>}</div></C.Provider>}
