import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Broadcast, CalendarBlank, Cpu, WarningCircle } from "../icons";
import { apiFetch } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { ErrorState, PageLoader } from "../components/States";
import { ModeBadge, StatusBadge } from "../components/StatusBadge";
import type { AdminSummary, FleetDevicePage } from "../types";
import { formatDateTime, formatRelative } from "../utils/format";
import { PageHeader } from "./UserDashboard";

export function AdminDashboard() {
  const [data, setData] = useState<{ summary: AdminSummary; fleet: FleetDevicePage } | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    Promise.all([apiFetch<AdminSummary>("/admin/summary"), apiFetch<FleetDevicePage>("/admin/fleet/devices?page_size=8")])
      .then(([summary, fleet]) => setData({ summary, fleet }))
      .catch((cause: Error) => setError(cause.message));
  }, []);
  useEffect(load, [load]);
  if (!data && !error) return <PageLoader />;
  if (!data) return <ErrorState message={error} retry={load} />;

  const attention = data.fleet.items.filter((item) => item.connectivity_status !== "online" || item.operational_mode !== "active" || item.deactivation_scheduled_at);
  return <div className="page">
    <PageHeader eyebrow="ADMIN" title="Ringkasan perangkat" description="Kondisi perangkat, permintaan perawatan, dan masa aktif sewa yang perlu ditangani." action={<Link className="button primary" to="/admin/monitoring">Buka monitoring sensor</Link>} />
    <div className="metrics-grid"><MetricCard icon={Cpu} label="Total device" value={data.summary.total} note={`${data.summary.unassigned} belum terhubung ke pengguna`} /><MetricCard icon={Broadcast} label="Online" value={data.summary.online} note="Mengirim data sesuai interval" tone="teal" /><MetricCard icon={WarningCircle} label="Tindakan operasional" value={data.summary.pending_maintenance + data.summary.inactive} note={`${data.summary.pending_maintenance} perawatan · ${data.summary.inactive} nonaktif`} tone="amber" /><MetricCard icon={CalendarBlank} label="Penonaktifan terjadwal" value={data.summary.scheduled_deactivation} note={`${data.summary.active_alerts} peringatan kualitas air`} tone="red" /></div>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">PEMERIKSAAN PERANGKAT</p><h2>Perlu perhatian</h2></div><span className="updated-at">Berdasarkan data terakhir dan status operasional</span></div>{attention.length === 0 ? <div className="inline-success">Tidak ada perangkat yang memerlukan tindakan.</div> : <div className="table-wrap"><table><thead><tr><th>Device</th><th>Konektivitas</th><th>Mode</th><th>Pemilik / lokasi</th><th>Jadwal nonaktif</th><th>Terakhir aktif</th></tr></thead><tbody>{attention.map((device) => <tr key={device.id}><td><strong>{device.name || "Tanpa nama"}</strong><code>{device.uid}</code></td><td><StatusBadge status={device.connectivity_status} /></td><td><ModeBadge mode={device.operational_mode} /></td><td>{device.user_name || "Belum dimiliki"}<small>{[device.tambak_name, device.kolam_name].filter(Boolean).join(" / ") || "Belum ditempatkan"}</small></td><td>{device.deactivation_scheduled_at ? formatDateTime(device.deactivation_scheduled_at) : "—"}</td><td>{formatRelative(device.last_seen)}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
