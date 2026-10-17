import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowClockwise, Pause, Play, WarningCircle } from "../icons";
import { apiFetch } from "../api/client";
import { EmptyState, ErrorState, PageLoader } from "../components/States";
import { ModeBadge, StatusBadge } from "../components/StatusBadge";
import type { AdminSensorOverview, SensorReading } from "../types";
import { formatDateTimeExact, formatNumber, formatRelative, parseApiDate } from "../utils/format";
import { getTelemetryFreshness } from "../utils/telemetry";
import { PageHeader } from "./UserDashboard";
import { DeviceNavigator } from "../components/DeviceNavigator";

const parameterMeta = {
  suhu: { label: "Suhu", unit: "°C" },
  ph: { label: "pH", unit: "" },
  do: { label: "Oksigen terlarut", unit: "mg/L" },
  tds: { label: "TDS", unit: "ppm" },
  ammonia: { label: "Amonia", unit: "mg/L" },
  salinitas: { label: "Salinitas", unit: "ppt" },
} satisfies Record<Exclude<keyof SensorReading, "timestamp">, { label: string; unit: string }>;

type Parameter = keyof typeof parameterMeta;

export function AdminMonitoringPage() {
  const [data, setData] = useState<AdminSensorOverview | null>(null);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [parameter, setParameter] = useState<Parameter>("suhu");

  const load = useCallback(async () => {
    try {
      const next = await apiFetch<AdminSensorOverview>("/admin/sensors?last_n=24");
      setData(next);
      setDeviceId((current) => next.devices.some((device) => device.id === current) ? current : next.devices.find((device) => device.latest_data)?.id ?? next.devices[0]?.id ?? null);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data sensor belum dapat dimuat.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 30_000);
    return () => window.clearInterval(timer);
  }, [load, paused]);

  const selected = data?.devices.find((device) => device.id === deviceId);
  const meta = parameterMeta[parameter];
  const selectedSummaries = useMemo(() => (Object.keys(parameterMeta) as Parameter[]).map((key) => {
    const values = (selected?.historical_data || []).map((reading) => reading[key]).filter((value): value is number => typeof value === "number");
    return {
      key,
      ...parameterMeta[key],
      value: selected?.latest_data?.[key],
      minimum: values.length ? Math.min(...values) : null,
      maximum: values.length ? Math.max(...values) : null,
      attention: selected?.attention_parameters.includes(key) || false,
    };
  }), [selected]);
  const samples = useMemo(() => (selected?.historical_data || []).flatMap((reading) => {
    const time = reading.timestamp ? parseApiDate(reading.timestamp).getTime() : Number.NaN;
    const value = reading[parameter];
    return Number.isFinite(time) ? [{ time, value: value != null && Number.isFinite(value) ? value : null }] : [];
  }), [selected, parameter]);
  const chartData = samples.some((reading) => reading.value != null) ? samples : [];

  if (!data && !error) return <PageLoader label="Memuat monitoring sensor" />;
  if (!data) return <ErrorState message={error} retry={load} />;

  return <div className="page admin-monitoring">
    <PageHeader
      eyebrow="MONITORING ADMIN"
      title="Monitoring sensor"
      description="Pilih perangkat, pantau kualitas air, dan telusuri tren pengukuran."
      action={<div className="header-actions"><button className="button secondary" onClick={() => setPaused((value) => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}{paused ? "Lanjutkan" : "Jeda pembaruan"}</button><button className="icon-button bordered" onClick={() => void load()} aria-label="Perbarui data sensor"><ArrowClockwise size={20} /></button></div>}
    />

    {error && <ErrorState message={error} retry={load} />}
    {!data.devices.length ? <EmptyState title="Belum ada perangkat" description="Daftarkan perangkat untuk mulai memantau data sensor." /> : <div className="monitor-workspace">
      <DeviceNavigator devices={data.devices.map((device) => ({ id: device.id, name: device.name || device.uid, uid: device.uid, location: [device.tambak_name, device.kolam_name].filter(Boolean).join(" / "), status: device.connectivity_status }))} selectedId={deviceId} onSelect={setDeviceId} />
      {selected && <div className="monitor-detail">
      <div className="monitor-device-heading">
        <div><h2>{selected.name || selected.uid}</h2><p>{selected.user_name || "Belum dimiliki"} · {[selected.tambak_name, selected.kolam_name].filter(Boolean).join(" / ") || "Belum ditempatkan"}</p><code>{selected.uid}</code></div>
        <div className="monitor-device-status"><StatusBadge status={selected.connectivity_status} /><ModeBadge mode={selected.operational_mode} /><span>Data {formatRelative(selected.latest_data?.timestamp)}</span></div>
      </div>
      {getTelemetryFreshness(selected.latest_data?.timestamp, selected.connection_interval) !== "fresh" && <div className="monitor-data-notice" role="status">Menampilkan data terakhir yang tersimpan. {selected.latest_data ? `Pengukuran: ${formatDateTimeExact(selected.latest_data.timestamp)}.` : "Perangkat belum mengirim data sensor."}</div>}
      <div className="admin-parameter-grid" aria-label={`Parameter terbaru ${selected.name || selected.uid}`}>
        {selectedSummaries.map((item) => <button aria-pressed={parameter === item.key} onClick={() => setParameter(item.key)} className={`sensor-choice ${parameter === item.key ? "selected" : ""} ${item.attention ? "attention" : ""}`} key={item.key}><span className="sensor-choice-label">{item.label}{item.attention && <WarningCircle size={16} weight="fill" aria-label="Perlu diperiksa" />}</span><strong>{formatNumber(item.value)} <small>{item.unit}</small></strong><span className="sensor-choice-note">{item.value == null ? "Tidak ada pembacaan" : item.attention ? "Perlu diperiksa" : "Data tersedia"}</span></button>)}
      </div>

    <section className="panel chart-panel">
      <div className="chart-heading"><div><h2>Tren {meta.label.toLocaleLowerCase("id")}</h2><p>24 pengukuran terakhir · {meta.unit || "skala pH"}</p></div><div className="chart-timestamps"><strong>{formatNumber(selected.latest_data?.[parameter])} {meta.unit}</strong><small>{formatDateTimeExact(selected.latest_data?.timestamp)}</small></div></div>
      {chartData.length === 0 ? <EmptyState title={`Sensor ${meta.label} belum mengirim data`} description="Sensor mungkin belum terpasang atau perlu diperiksa koneksinya." /> : <div className="chart" role="img" aria-label={`Grafik ${meta.label} untuk ${selected.name || selected.uid}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 18, right: 18, left: 2, bottom: 8 }}><defs><linearGradient id="adminSensorFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#147fe2" stopOpacity={.16} /><stop offset="100%" stopColor="#147fe2" stopOpacity={.01} /></linearGradient></defs><CartesianGrid stroke="#d9e3ee" strokeDasharray="4 6" vertical={false} /><XAxis dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} minTickGap={40} tickFormatter={(value) => new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))} tickLine={false} tickMargin={10} /><YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={52} tickFormatter={(value) => formatNumber(Number(value))} /><Tooltip labelFormatter={(value) => formatDateTimeExact(new Date(Number(value)).toISOString())} formatter={(value) => [`${formatNumber(Number(value))} ${meta.unit}`, meta.label]} /><Area type="linear" dataKey="value" stroke="#147fe2" strokeWidth={2.5} fill="url(#adminSensorFill)" dot={false} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>}
      <div className="chart-axis-note"><span>Waktu pengukuran lokal</span><span>{meta.label} ({meta.unit || "skala pH"})</span></div>
      <details className="chart-data-table"><summary>Lihat angka pengukuran</summary><div className="table-wrap"><table><thead><tr><th>Waktu pengukuran</th><th>{meta.label} ({meta.unit || "skala pH"})</th></tr></thead><tbody>{chartData.map((reading, index) => <tr key={index}><td>{formatDateTimeExact(new Date(reading.time).toISOString())}</td><td>{formatNumber(reading.value)}</td></tr>)}</tbody></table></div></details>
    </section>
      </div>}
    </div>}

    {data.devices.length > 0 && <details className="panel flush fleet-disclosure">
      <summary><span>Bandingkan semua perangkat <small>{data.devices.length} perangkat</small></span><span className="disclosure-hint">Buka tabel</span></summary>
      <div className="panel-heading admin-table-heading"><div><p className="eyebrow">NILAI TERBARU</p><h2>Semua device</h2></div><span className="updated-at">Diperbarui {formatDateTimeExact(data.generated_at)}</span></div>
      <div className="table-wrap"><table><thead><tr><th>Device</th><th>Status</th>{Object.values(parameterMeta).map((item) => <th key={item.label}>{item.label}</th>)}<th>Terakhir aktif</th></tr></thead><tbody>{data.devices.map((device) => {
        const freshness = getTelemetryFreshness(device.latest_data?.timestamp, device.connection_interval);
        return <tr className={device.attention_parameters.length ? "sensor-attention-row" : ""} key={device.id}><td><button className="device-link" onClick={() => setDeviceId(device.id)}><strong>{device.name || device.uid}</strong><small>{device.kolam_name || "Belum ditempatkan"}</small></button></td><td><StatusBadge status={device.connectivity_status} /><ModeBadge mode={device.operational_mode} /></td>{(Object.keys(parameterMeta) as Parameter[]).map((key) => <td className={device.attention_parameters.includes(key) ? "value-alert" : ""} key={key}>{formatNumber(device.latest_data?.[key])}<small>{parameterMeta[key].unit}</small></td>)}<td>{formatRelative(device.last_seen)}{freshness === "clock_error" && <small>Waktu perangkat tidak sinkron</small>}</td></tr>;
      })}</tbody></table></div>
    </details>}
  </div>;
}
