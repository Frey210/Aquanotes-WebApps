import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Envelope, MagnifyingGlass, UserCircle, UsersThree } from "../icons";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { EmptyState, ErrorState, PageLoader } from "../components/States";
import type { AdminUserPage } from "../types";
import { formatDateTime, formatRelative } from "../utils/format";
import { PageHeader } from "./UserDashboard";

export function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<AdminUserPage | null>(null);
  const [error, setError] = useState("");
  const query = params.toString();
  const load = useCallback(() => {
    setError("");
    apiFetch<AdminUserPage>(`/admin/users?${query}`).then(setData).catch((cause: Error) => setError(cause.message));
  }, [query]);
  useEffect(load, [load]);

  function filter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["search", "role", "verification"]) {
      const value = String(values.get(key) || "");
      if (value) next.set(key, value);
    }
    setParams(next);
  }

  if (!data && !error) return <PageLoader label="Memuat daftar user" />;
  if (!data) return <ErrorState message={error} retry={load} />;

  return <div className="page">
    <PageHeader eyebrow="ADMIN" title="Daftar user" description="Pantau akun yang terdaftar, status verifikasi email, serta kepemilikan tambak dan perangkat." />
    <section className="metrics-grid" aria-label="Ringkasan user">
      <article className="metric"><div className="metric-icon"><UsersThree size={22} aria-hidden="true" /></div><div><p>Total akun</p><strong>{data.all_users}</strong><small>Seluruh akun terdaftar</small></div></article>
      <article className="metric metric-teal"><div className="metric-icon"><CheckCircle size={22} aria-hidden="true" /></div><div><p>Email terverifikasi</p><strong>{data.verified}</strong><small>Dapat masuk ke dashboard web</small></div></article>
      <article className="metric metric-amber"><div className="metric-icon"><Envelope size={22} aria-hidden="true" /></div><div><p>Belum verifikasi</p><strong>{data.unverified}</strong><small>Menunggu konfirmasi email</small></div></article>
      <article className="metric"><div className="metric-icon"><MagnifyingGlass size={22} aria-hidden="true" /></div><div><p>Hasil filter</p><strong>{data.total}</strong><small>Akun sesuai pencarian</small></div></article>
    </section>
    <form className="filterbar user-filterbar" onSubmit={filter}>
      <label className="search-field"><span className="sr-only">Cari user</span><MagnifyingGlass size={19} aria-hidden="true" /><input name="search" defaultValue={params.get("search") || ""} placeholder="Cari nama atau email" /></label>
      <label><span className="sr-only">Filter akses</span><select name="role" defaultValue={params.get("role") || ""}><option value="">Semua akses</option><option value="user">User</option><option value="admin">Administrator</option></select></label>
      <label><span className="sr-only">Filter verifikasi</span><select name="verification" defaultValue={params.get("verification") || ""}><option value="">Semua verifikasi</option><option value="verified">Terverifikasi</option><option value="unverified">Belum verifikasi</option></select></label>
      <button className="button secondary">Terapkan</button>
    </form>
    {data.items.length === 0 ? <EmptyState title="User tidak ditemukan" description="Ubah kata pencarian atau filter verifikasi." /> : <section className="panel flush">
      <p className="table-scroll-hint">Geser tabel untuk melihat informasi lainnya.</p><div className="table-wrap" tabIndex={0} aria-label="Daftar user, geser horizontal untuk melihat semua kolom"><table className="user-table"><thead><tr><th>User</th><th>Akses</th><th>Verifikasi email</th><th>Device</th><th>Tambak</th><th>Bergabung</th><th>Login terakhir</th></tr></thead><tbody>{data.items.map((user) => <tr key={user.id}><td><div className="user-cell"><span aria-hidden="true"><UserCircle size={24} /></span><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td><td><span className={`status-badge ${user.role === "admin" ? "maintenance" : "never_seen"}`}>{user.role === "admin" ? "Administrator" : "User"}</span></td><td><span className={`status-badge ${user.email_verified ? "online" : "stale"}`}>{user.email_verified ? "Terverifikasi" : "Belum verifikasi"}</span></td><td>{user.device_count}</td><td>{user.tambak_count}</td><td>{formatDateTime(user.created_at)}</td><td>{user.last_login ? formatRelative(user.last_login) : "Belum pernah login"}</td></tr>)}</tbody></table></div>
      <div className="pagination"><span>Halaman {data.page} · {data.total} user</span><div><button className="button ghost small" disabled={data.page <= 1} onClick={() => { params.set("page", String(data.page - 1)); setParams(params); }}>Sebelumnya</button><button className="button ghost small" disabled={data.page * data.page_size >= data.total} onClick={() => { params.set("page", String(data.page + 1)); setParams(params); }}>Berikutnya</button></div></div>
    </section>}
  </div>;
}
