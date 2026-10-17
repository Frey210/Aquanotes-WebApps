import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellRinging, Cpu, WarningCircle } from "../icons";
import { apiFetch } from "../api/client";
import { ErrorState, PageLoader } from "../components/States";
import { FleetHealth } from "../components/FleetHealth";
import type { DeviceStatus } from "../types";
import { formatRelative } from "../utils/format";

export function UserDashboard() {
  const [data, setData] = useState<{ status: DeviceStatus; unread: number } | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => { setError(""); Promise.all([apiFetch<DeviceStatus>("/devices/status/"), apiFetch<number>("/notifications/unread-count")]).then(([status, unread]) => setData({ status, unread })).catch((e: Error) => setError(e.message)); }, []);
  useEffect(load, [load]);
  if (!data && !error) return <PageLoader />;
  if (!data) return <ErrorState message={error} retry={load} />;
  const attention = data.status.devices.filter((device) => device.status !== "online");
  const total = data.status.devices.length;
  const online = data.status.devices.filter((device) => device.status === "online").length;
  const late = data.status.devices.filter((device) => device.status === "stale").length;
  const unknown = data.status.devices.filter((device) => device.status === "never_seen").length;
  const offline = data.status.devices.filter((device) => device.status === "offline").length;
  const maintenance = data.status.devices.filter((device) => device.status === "maintenance").length;
  const inactive = data.status.devices.filter((device) => device.status === "inactive").length;
  return <div className="page overview-page">
    <PageHeader eyebrow="PORTAL PENGGUNA" title="Tambak dalam pantauan" description="Lihat kondisi perangkat dan kualitas air Anda." />
    <div className="overview-grid">
      <FleetHealth title="Status perangkat" total={total} online={online} late={late} unknown={unknown} offline={offline} maintenance={maintenance} inactive={inactive} other={Math.max(0, total - online - late - unknown - offline - maintenance - inactive)} href="/app/monitoring" />
      <section className="overview-actions user-overview-actions" aria-label="Aktivitas Anda">
        <Link to="/app/alerts" className="overview-action blue"><BellRinging size={24} weight="duotone" /><strong>{data.unread}</strong><span>Notifikasi baru</span></Link>
        <Link to="/app/devices" className="overview-action amber"><WarningCircle size={24} weight="duotone" /><strong>{attention.length}</strong><span>Perlu perhatian</span></Link>
      </section>
    </div>
    <section className="priority-section">
      <div className="section-title"><h2>Perlu perhatian</h2><Link to="/app/devices">Semua perangkat</Link></div>
      {attention.length === 0 ? <div className="inline-success">Semua perangkat beroperasi normal.</div> : <div className="priority-list">{attention.slice(0, 4).map((device) => <Link to="/app/devices" className="priority-device" key={device.id}>
        <div className="priority-device-icon"><Cpu size={23} weight="duotone" aria-hidden="true" /></div>
        <div className="priority-device-copy"><strong>{device.name || device.uid}</strong><span>{device.name ? device.uid : `Interval ${device.connection_interval || 5} menit`}</span></div>
        <div className="priority-device-state"><span className={`legacy-status ${device.status}`}>{({ offline: "Offline", stale: "Terlambat", maintenance: "Perawatan", never_seen: "Belum aktif", inactive: "Nonaktif" } as Record<string, string>)[device.status || ""] || "Perlu diperiksa"}</span><small>{formatRelative(device.last_seen)}</small></div>
      </Link>)}</div>}
    </section>
  </div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="page-header" aria-label={eyebrow}><div><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}
