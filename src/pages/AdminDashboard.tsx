import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellRinging, CalendarBlank, Cpu, UsersThree, Wrench } from "../icons";
import { apiFetch } from "../api/client";
import { FleetHealth } from "../components/FleetHealth";
import { ErrorState, PageLoader } from "../components/States";
import { ModeBadge, StatusBadge } from "../components/StatusBadge";
import type { AdminSummary, FleetDevicePage } from "../types";
import { formatRelative } from "../utils/format";
import { PageHeader } from "./UserDashboard";

export function AdminDashboard() {
  const [data, setData] = useState<{ summary: AdminSummary; fleet: FleetDevicePage } | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    Promise.all([apiFetch<AdminSummary>("/admin/summary"), apiFetch<FleetDevicePage>("/admin/fleet/devices?page_size=8")])
      .then(([summary, fleet]) => setData({ summary, fleet }))
      .catch((cause: Error) => setError(cause.message));
  }, []);
  useEffect(load, [load]);
  if (!data && !error) return <PageLoader />;
  if (!data) return <ErrorState message={error} retry={load} />;
  const summary = data.summary;
  const attention = data.fleet.items.filter((item) => item.connectivity_status !== "online" || item.operational_mode !== "active" || item.deactivation_scheduled_at);
  return <div className="page overview-page">
    <PageHeader eyebrow="ADMIN" title="Ringkasan perangkat" description="Pantau koneksi. Tangani yang perlu perhatian." />
    <div className="overview-grid">
      <FleetHealth total={summary.total} online={summary.online} late={summary.stale} offline={summary.offline} unknown={summary.never_seen} href="/admin/monitoring" />
      <section className="overview-actions" aria-label="Aktivitas operasional">
        <Link to="/admin/monitoring" className="overview-action amber"><BellRinging size={24} weight="duotone" /><strong>{summary.active_alerts}</strong><span>Peringatan sensor</span></Link>
        <Link to="/admin/devices" className="overview-action violet"><Wrench size={24} weight="duotone" /><strong>{summary.pending_maintenance}</strong><span>Permintaan perawatan</span></Link>
        <Link to="/admin/devices" className="overview-action blue"><UsersThree size={24} weight="duotone" /><strong>{summary.unassigned}</strong><span>Belum dimiliki</span></Link>
        <Link to="/admin/devices" className="overview-action slate"><CalendarBlank size={24} weight="duotone" /><strong>{summary.scheduled_deactivation}</strong><span>Jadwal nonaktif</span></Link>
      </section>
    </div>
    <section className="priority-section">
      <div className="section-title"><h2>Perlu perhatian</h2><Link to="/admin/devices">Semua perangkat</Link></div>
      {attention.length === 0 ? <div className="inline-success">Tidak ada prioritas pada cuplikan perangkat terbaru. Lihat semua perangkat untuk pemeriksaan lengkap.</div> : <>
        <div className="priority-list">{attention.slice(0, 4).map((device) => <Link to="/admin/devices" className="priority-device" key={device.id}>
          <div className={`priority-device-icon ${device.connectivity_status}`}><Cpu size={23} weight="duotone" aria-hidden="true" /></div>
          <div className="priority-device-copy"><strong>{device.name || device.uid}</strong><span>{[device.tambak_name, device.kolam_name].filter(Boolean).join(" / ") || "Lokasi belum diatur"}</span></div>
          <div className="priority-device-state"><StatusBadge status={device.connectivity_status} />{device.operational_mode !== "active" && <ModeBadge mode={device.operational_mode} />}<small>{formatRelative(device.last_seen)}</small></div>
        </Link>)}</div>
        <p className="priority-footnote">Cuplikan perangkat terbaru. <Link to="/admin/devices">Kelola seluruh perangkat</Link></p>
      </>}
    </section>
  </div>;
}
