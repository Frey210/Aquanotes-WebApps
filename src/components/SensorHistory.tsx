import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { SensorReading } from "../types";
import { formatDateTimeExact } from "../utils/format";

type Parameter = Exclude<keyof SensorReading, "timestamp">;
interface HistoryPage { readings: SensorReading[]; next_before_id: number | null }

export function useSensorHistory(deviceId: number | null, parameter: Parameter, latestTimestamp: string | null | undefined, fallback: SensorReading[]) {
  const scope = `${deviceId}:${parameter}`;
  const [cursor, setCursor] = useState<{ scope: string; id: number } | null>(null);
  const beforeId = cursor?.scope === scope ? cursor.id : null;
  const key = `${scope}:${beforeId}`;
  const [result, setResult] = useState<{ key: string; page: HistoryPage } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!deviceId) return;
    const controller = new AbortController();
    setPending(true);
    setError("");
    apiFetch<HistoryPage>(`/monitoring/devices/${deviceId}/history?parameter=${parameter}&limit=24${beforeId ? `&before_id=${beforeId}` : ""}`, { signal: controller.signal })
      .then((page) => { if (!controller.signal.aborted) setResult({ key, page }); })
      .catch((cause: Error) => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setPending(false); });
    return () => controller.abort();
  }, [deviceId, parameter, latestTimestamp, beforeId, key, retry]);
  const page = result?.key === key ? result.page : null;
  return {
    readings: page?.readings ?? (beforeId ? [] : fallback), pending, error, older: beforeId !== null,
    more: page?.next_before_id ? () => setCursor({ scope, id: page.next_before_id! }) : null,
    reset: () => setCursor(null), retry: () => setRetry((value) => value + 1),
  };
}

export function SensorHistoryControls({ history, unavailable, parameter }: {
  history: ReturnType<typeof useSensorHistory>; unavailable: boolean; parameter: Parameter;
}) {
  const lastValid = [...history.readings].reverse().find((reading) => reading[parameter] != null);
  return <div className="sensor-history-controls">
    {unavailable && <div className="history-notice" role="status"><strong>Data parameter saat ini tidak tersedia</strong><span>{lastValid ? `Grafik menampilkan histori, bukan nilai terkini. Pembacaan terakhir pada halaman ini: ${formatDateTimeExact(lastValid.timestamp)}.` : "Sensor mungkin tidak terpasang atau belum mengirim nilai. Riwayat yang pernah diterima tetap tersimpan."}</span></div>}
    <div className="history-navigation"><span aria-live="polite">{history.pending ? "Memuat riwayat…" : history.older ? "Riwayat lebih lama" : "Riwayat terakhir tersedia"}</span><div>
      {history.older && <button className="button secondary small" onClick={history.reset} disabled={history.pending}>Riwayat terbaru</button>}
      {history.more && <button className="button secondary small" onClick={history.more} disabled={history.pending}>Lebih lama</button>}
    </div></div>
    {history.error && <div className="history-error" role="alert"><span>Riwayat belum dapat dimuat: {history.error}</span><button className="button secondary small" onClick={history.retry}>Coba lagi</button></div>}
  </div>;
}
