import { useCallback, useEffect, useState } from "react";
import { Check, Warning } from "../icons";
import { apiFetch } from "../api/client";
import { EmptyState, ErrorState, PageLoader } from "../components/States";
import type { NotificationItem } from "../types";
import { formatDateTime } from "../utils/format";
import { PageHeader } from "./UserDashboard";
import { Link } from "react-router-dom";

export function AlertsPage() {
  const [items, setItems] = useState<NotificationItem[] | null>(null); const [error, setError] = useState("");
  const load = useCallback(() => { apiFetch<NotificationItem[]>("/notifications/?days=30&limit=100").then(setItems).catch((e: Error) => setError(e.message)); }, []); useEffect(load, [load]);
  async function markRead(id: number) { await apiFetch(`/notifications/${id}/read`, { method: "PUT" }); load(); }
  if (!items && !error) return <PageLoader />; if (!items) return <ErrorState message={error} retry={load} />;
  return <div className="page"><PageHeader eyebrow="NOTIFIKASI" title="Alarm kualitas air" description="Nilai di luar batas aman dalam 30 hari terakhir." action={<Link className="button primary" to="/app/alerts/settings">Atur alarm</Link>} />{items.length === 0 ? <EmptyState title="Tidak ada notifikasi" description="Semua nilai masih berada dalam batas aman pada periode ini." /> : <div className="alert-list">{items.map((item) => <article className={item.is_read ? "read" : ""} key={item.id}><div className="alert-icon"><Warning size={20} weight="fill" /></div><div><div className="alert-title"><strong>{item.device_name}</strong><span>{formatDateTime(item.timestamp)}</span></div><p>{item.message}</p><small>{item.parameter}: {item.current_value} · batas {item.threshold_value}</small></div>{!item.is_read && <button className="icon-button bordered" onClick={() => void markRead(item.id)} aria-label={`Tandai notifikasi ${item.device_name} sudah dibaca`}><Check size={19} /></button>}</article>)}</div>}</div>;
}
