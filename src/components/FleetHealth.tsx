import { Link } from "react-router-dom";
import { ChartLine } from "../icons";

export function FleetHealth({ total, online, late = 0, offline, unknown = 0, maintenance = 0, inactive = 0, other = 0, title = "Koneksi perangkat", href }: {
  total: number; online: number; late?: number; offline: number; unknown?: number; maintenance?: number; inactive?: number; other?: number; title?: string; href: string;
}) {
  const segments = [
    { label: "Online", count: online, color: "#65ded2" },
    { label: "Terlambat", count: late, color: "#ffd17c" },
    { label: "Offline", count: offline, color: "#ffa89e" },
    { label: "Belum aktif", count: unknown, color: "#96b8dc" },
    ...[{ label: "Perawatan", count: maintenance, color: "#b6a6fa" }, { label: "Nonaktif", count: inactive, color: "#b5c4d5" }, { label: "Status lain", count: other, color: "#d6e0ec" }].filter((item) => item.count > 0),
  ];
  let offset = 0;
  return <section className="fleet-health" aria-label={title}>
    <div className="fleet-health-top"><h2>{title}</h2><span>{total} perangkat</span></div>
    <div className="fleet-health-body">
      <div className="fleet-health-chart">
        <svg viewBox="0 0 128 128" role="img" aria-label={segments.map((item) => `${item.count} ${item.label}`).join(", ")}>
          <circle cx="64" cy="64" r="52" fill="none" stroke="rgb(255 255 255 / .12)" strokeWidth="12" />
          {segments.filter((item) => item.count > 0).map((item) => {
            const length = total ? item.count / total * 100 : 0;
            const start = offset;
            offset += length;
            return <circle key={item.label} cx="64" cy="64" r="52" pathLength="100" fill="none" stroke={item.color} strokeWidth="12" strokeDasharray={`${Math.max(0, length - 1.5)} ${100 - Math.max(0, length - 1.5)}`} strokeDashoffset={-start} transform="rotate(-90 64 64)" />;
          })}
        </svg>
        <div className="fleet-health-number"><strong>{online}</strong><span>online</span></div>
      </div>
      <div className="fleet-health-legend">{segments.map((item) => <div key={item.label}><span><i style={{ background: item.color }} />{item.label}</span><strong>{item.count}</strong></div>)}</div>
    </div>
    <Link className="fleet-health-action" to={href}><ChartLine size={19} aria-hidden="true" />Buka monitoring</Link>
  </section>;
}
