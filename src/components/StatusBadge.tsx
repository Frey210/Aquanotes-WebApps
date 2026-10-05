import { CheckCircle, ClockCountdown, MinusCircle, Wrench, XCircle } from "../icons";
import type { Connectivity, OperationalMode } from "../types";

const labels: Record<Connectivity, string> = {
  online: "Online",
  stale: "Data terlambat",
  offline: "Offline",
  never_seen: "Belum aktif",
};

export function StatusBadge({ status }: { status: Connectivity }) {
  const Icon = status === "online" ? CheckCircle : status === "stale" ? ClockCountdown : status === "offline" ? XCircle : MinusCircle;
  return <span className={`status-badge ${status}`}><Icon size={15} weight="fill" />{labels[status]}</span>;
}

export function ModeBadge({ mode }: { mode: OperationalMode }) {
  if (mode === "maintenance") return <span className="status-badge maintenance"><Wrench size={15} />Perawatan</span>;
  if (mode === "inactive") return <span className="status-badge inactive"><XCircle size={15} weight="fill" />Nonaktif</span>;
  return <span className="mode-active">Aktif</span>;
}
