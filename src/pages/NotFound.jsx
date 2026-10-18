import {Link} from 'react-router-dom';
import {PageHead} from '../components/ui.jsx';
export default function NotFound(){return <><PageHead crumbs={[{l:'SIPANDAI',to:'/dashboard'},{l:'Tidak ditemukan'}]} title="Halaman tidak ditemukan" desc="Alamat yang Anda buka tidak ada atau sudah dipindahkan."/><Link to="/dashboard" className="btn btn-p">Kembali ke Dashboard</Link></>}
