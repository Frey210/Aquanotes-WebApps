import { useCallback, useEffect, useState } from "react";
import { BellRinging, Broadcast, Cpu, WarningCircle } from "../icons";
import { apiFetch } from "../api/client";
import { ErrorState, PageLoader } from "../components/States";
import { MetricCard } from "../components/MetricCard";
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
  return <div className="page"><PageHeader eyebrow="PORTAL PENGGUNA" title="Ringkasan kondisi perangkat" description="Status terakhir dari perangkat yang terhubung ke akun Anda." /><div className="metrics-grid"><MetricCard icon={Cpu} label="Total device" value={data.status.devices.length} note="Terdaftar di akun" /><MetricCard icon={Broadcast} label="Online" value={data.status.online} note="Mengirim sesuai interval" tone="teal" /><MetricCard icon={WarningCircle} label="Perlu perhatian" value={data.status.offline + data.status.maintenance} note="Offline atau dalam perawatan" tone="amber" /><MetricCard icon={BellRinging} label="Notifikasi baru" value={data.unread} note="Belum dibaca" tone="red" /></div><section className="panel"><div className="panel-heading"><div><p className="eyebrow">PRIORITAS</p><h2>Perangkat perlu perhatian</h2></div></div>{attention.length === 0 ? <div className="inline-success">Semua perangkat beroperasi normal.</div> : <div className="table-wrap"><table><thead><tr><th>Device</th><th>Status</th><th>Terakhir aktif</th><th>Interval</th></tr></thead><tbody>{attention.map((device) => <tr key={device.id}><td><strong>{device.name || "Tanpa nama"}</strong><code>{device.uid}</code></td><td><span className={`legacy-status ${device.status}`}>{device.status}</span></td><td>{formatRelative(device.last_seen)}</td><td>{device.connection_interval || 5} menit</td></tr>)}</tbody></table></div>}</section></div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}
