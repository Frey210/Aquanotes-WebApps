import { ArrowClockwise, Database, SpinnerGap, WarningCircle } from "../icons";

export function PageLoader({ label = "Memuat data" }: { label?: string }) {
  return <div className="page-loader" role="status"><SpinnerGap className="spin" size={24} /><span>{label}…</span></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><Database size={28} /><h2>{title}</h2><p>{description}</p></div>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="error-state" role="alert"><WarningCircle size={24} /><div><strong>Data belum dapat dimuat</strong><p>{message}</p></div>{retry && <button className="button secondary" onClick={retry}><ArrowClockwise size={18} />Coba lagi</button>}</div>;
}
