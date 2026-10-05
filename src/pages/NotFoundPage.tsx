import { Link } from "react-router-dom";
export function NotFoundPage() { return <main className="standalone-state"><span>404</span><h1>Halaman tidak ditemukan</h1><p>Alamat mungkin berubah atau Anda tidak memiliki akses.</p><Link className="button primary" to="/">Kembali ke dashboard</Link></main>; }
