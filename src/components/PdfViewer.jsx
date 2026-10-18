import {useEffect,useRef,useState} from 'react';
import {Document,Page,pdfjs} from 'react-pdf';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {Skeleton} from './ui.jsx';
pdfjs.GlobalWorkerOptions.workerSrc=workerSrc;
export default function PdfViewer({src}){const ref=useRef(),[w,setW]=useState(320),[n,setN]=useState(0),[p,setP]=useState(1);
useEffect(()=>{const ro=new ResizeObserver(([e])=>setW(Math.floor(e.contentRect.width)));ro.observe(ref.current);return()=>ro.disconnect()},[]);
return <div ref={ref} className="overflow-hidden rounded-2xl ring-1 ring-line"><Document file={src} onLoadSuccess={d=>setN(d.numPages)} loading={<Skeleton className="h-64 rounded-none"/>} error={<p className="p-4 text-sm text-rose-700">Dokumen tidak bisa dibuka. Coba lagi.</p>}><Page pageNumber={p} width={w} loading={<Skeleton className="h-64 rounded-none"/>}/></Document>
{n>1&&<div className="flex items-center justify-center gap-3 border-t border-line p-2 text-xs"><button className="btn btn-o !h-8 !px-2" disabled={p<=1} onClick={()=>setP(p-1)} aria-label="Halaman sebelumnya"><ChevronLeft size={16}/></button><span className="font-mono">{p}/{n}</span><button className="btn btn-o !h-8 !px-2" disabled={p>=n} onClick={()=>setP(p+1)} aria-label="Halaman berikutnya"><ChevronRight size={16}/></button></div>}</div>}
