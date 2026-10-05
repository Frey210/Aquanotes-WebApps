export function parseApiDate(value: string) {
  return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "belum ada data";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(parseApiDate(value));
}

export function formatDateTimeExact(value?: string | null) {
  if (!value) return "Belum ada data";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short",
  }).format(parseApiDate(value));
}

export function formatRelative(value?: string | null) {
  if (!value) return "Belum pernah aktif";
  const minutes = Math.max(0, Math.round((Date.now() - parseApiDate(value).getTime()) / 60_000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return formatDateTime(value);
}

export function formatNumber(value?: number | null) {
  return value == null || Number.isNaN(value) ? "N/A" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}
