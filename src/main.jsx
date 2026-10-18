// Polyfill Buffer di browser untuk shpjs/@mapbox/shp-write (keduanya ditulis untuk Node.js).
import {Buffer} from 'buffer';
window.Buffer=window.Buffer||Buffer;
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './index.css';
import App from './App.jsx';
createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><App/></BrowserRouter></StrictMode>);
window.addEventListener('load',()=>import('virtual:pwa-register').then(m=>m.registerSW({immediate:true})));
