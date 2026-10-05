import type { Icon } from "@phosphor-icons/react";

export function MetricCard({ label, value, note, icon: Icon, tone = "blue" }: { label: string; value: string | number; note: string; icon: Icon; tone?: string }) {
  return <article className={`metric metric-${tone}`}><div className="metric-icon"><Icon size={22} /></div><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></article>;
}
