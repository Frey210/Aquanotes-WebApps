import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowClockwise, Flask, Gauge, Pause, Play, ThermometerSimple, WarningDiamond, Waves } from "../icons";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiFetch } from "../api/client";
import { EmptyState, ErrorState, PageLoader } from "../components/States";
import type { Device, DeviceThresholds, MonitoringDevice, MonitoringResponse, SensorReading } from "../types";
import { formatDateTime, formatDateTimeExact, formatNumber, formatRelative, parseApiDate } from "../utils/format";
import { getReadingVisual } from "../utils/readingStatus";
import { getTelemetryFreshness, type TelemetryFreshness } from "../utils/telemetry";
import { PageHeader } from "./UserDashboard";

const parameters = [
  { key: "suhu", label: "Suhu", unit: "°C", icon: ThermometerSimple },
  { key: "ph", label: "pH", unit: "", icon: Flask },
  { key: "do", label: "Oksigen terlarut", unit: "mg/L", icon: Waves },
  { key: "tds", label: "TDS", unit: "ppm", icon: Gauge },
  { key: "ammonia", label: "Amonia", unit: "mg/L", icon: WarningDiamond },
  { key: "salinitas", label: "Salinitas", unit: "ppt", icon: Waves },
] as const;

function limitLabel(min: number | null | undefined, max: number | null | undefined, unit: string) {
  const suffix = unit ? ` ${unit}` : "";
  if (min != null && max != null) return `Batas ${formatNumber(min)}–${formatNumber(max)}${suffix}`;
  if (min != null) return `Minimum ${formatNumber(min)}${suffix}`;
  if (max != null) return `Maksimum ${formatNumber(max)}${suffix}`;
  return "Batas belum diatur";
}

const freshnessLabel: Record<TelemetryFreshness, string> = {
  fresh: "Data terbaru",
  late: "Data terlambat",
  silent: "Tidak ada data baru",
  unknown: "Belum ada data",
  clock_error: "Timestamp perlu diperiksa",
};

const freshnessTone: Record<TelemetryFreshness, string> = {
  fresh: "online",
  late: "stale",
  silent: "offline",
  unknown: "never_seen",
  clock_error: "stale",
};

export function MonitoringPage() {
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [registry, setRegistry] = useState<Device[]>([]);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [parameter, setParameter] = useState<Exclude<keyof SensorReading, "timestamp">>("suhu");
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<DeviceThresholds | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [monitoring, devices] = await Promise.all([
        apiFetch<MonitoringResponse>("/monitoring?last_n=24"),
        apiFetch<Device[]>("/devices/"),
      ]);
      setData(monitoring);
      setRegistry(devices);
      setDeviceId((current) => current ?? monitoring.current_device_id);
      setSyncedAt(new Date().toISOString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data monitoring belum dapat dimuat.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!deviceId) { setThresholds(null); return; }
    let active = true;
    apiFetch<DeviceThresholds>(`/devices/${deviceId}/thresholds`).then((value) => { if (active) setThresholds(value); }).catch(() => { if (active) setThresholds(null); });
    return () => { active = false; };
  }, [deviceId]);
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => { if (!document.hidden) void load(); }, 60_000);
    return () => window.clearInterval(id);
  }, [load, paused]);

  const devices = useMemo(
    () => data?.kolam_list.flatMap((kolam) => kolam.devices.map((device) => ({ ...device, kolam: kolam.nama }))) || [],
    [data],
  );
  const selected = devices.find((device) => device.id === deviceId) as (MonitoringDevice & { kolam: string }) | undefined;
  const selectedRegistry = registry.find((device) => device.id === deviceId);
  const meta = parameters.find((item) => item.key === parameter)!;
  const lastTimestamp = selected?.latest_data?.timestamp;
  const interval = selectedRegistry?.connection_interval || 5;
  const freshness = getTelemetryFreshness(lastTimestamp, interval);
  const chartData = useMemo(() => (selected?.historical_data || []).flatMap((reading) => {
    const time = reading.timestamp ? parseApiDate(reading.timestamp).getTime() : Number.NaN;
    const value = reading[parameter];
    return Number.isFinite(time) && value != null && Number.isFinite(value) ? [{ time, value }] : [];
  }), [selected, parameter]);
  const firstTimestamp = chartData[0]?.time;
  const lastChartTimestamp = chartData.at(-1)?.time;
  const spansDays = Boolean(firstTimestamp && lastChartTimestamp && new Date(firstTimestamp).toDateString() !== new Date(lastChartTimestamp).toDateString());

  if (!data && !error) return <PageLoader />;
  if (!data) return <ErrorState message={error} retry={load} />;

  return <div className="page">
    <PageHeader
      eyebrow="MONITORING"
      title="Kualitas air dan data sensor"
      description="Data diperiksa setiap 60 detik. Status dihitung dari waktu pengukuran terakhir, bukan dari waktu halaman diperbarui."
      action={<div className="header-actions">
        <button className="button secondary" onClick={() => setPaused((value) => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}{paused ? "Lanjutkan update" : "Jeda update"}</button>
        <button className="icon-button bordered" onClick={() => void load()} aria-label="Refresh sekarang"><ArrowClockwise size={20} /></button>
      </div>}
    />
    {devices.length === 0 ? <EmptyState title="Belum ada data monitoring" description="Hubungkan device ke kolam dan tunggu data sensor pertama." /> : <>
      <div className="monitor-context">
        <div className="monitor-toolbar">
          <label>Device<select value={deviceId ?? ""} onChange={(event) => setDeviceId(Number(event.target.value))}>{devices.map((device) => <option key={device.id} value={device.id}>{device.name} · {device.kolam}</option>)}</select></label>
          <div className="parameter-tabs" aria-label="Parameter sensor">{parameters.map((item) => <button key={item.key} className={parameter === item.key ? "active" : ""} aria-pressed={parameter === item.key} onClick={() => setParameter(item.key)}>{item.label}</button>)}</div>
        </div>
        <aside className={`telemetry-freshness ${freshnessTone[freshness]}`} aria-label="Status pembaruan data sensor">
          <span className={`status-badge ${freshnessTone[freshness]}`}>{freshnessLabel[freshness]}</span>
          <strong>{lastTimestamp ? formatRelative(lastTimestamp) : "Belum pernah menerima data"}</strong>
          <small>Data sensor: {formatDateTimeExact(lastTimestamp)}</small>
          <small>Interval diharapkan: setiap {interval} menit</small>
        </aside>
      </div>
      {freshness !== "fresh" && <div className={`telemetry-warning ${freshnessTone[freshness]}`} role="status"><strong>{freshnessLabel[freshness]}.</strong> Nilai dan grafik menampilkan data terakhir yang tersimpan, bukan kondisi saat ini.</div>}
      <div className={`reading-grid ${freshness !== "fresh" ? "reading-stale" : ""}`}>{parameters.map((item) => {
        const value = selected?.latest_data?.[item.key];
        const visual = getReadingVisual(item.key, value, thresholds);
        const Icon = item.icon;
        const meterStyle = { "--reading-position": `${visual.position}%`, "--reading-min": `${visual.minPosition ?? 0}%`, "--reading-max": `${visual.maxPosition ?? 100}%` } as CSSProperties;
        return <article className={`reading-card ${visual.status}`} key={item.key}>
          <div className="reading-icon" aria-hidden="true"><Icon size={23} weight={visual.status === "normal" ? "duotone" : "fill"} /></div>
          <div className="reading-copy"><span>{item.label}</span><strong>{formatNumber(value)} <small>{item.unit}</small></strong></div>
          <div className="reading-state"><b>{visual.label}</b><small>{limitLabel(visual.min, visual.max, item.unit)}</small></div>
          {(visual.min != null || visual.max != null) && value != null && <div className="reading-meter" role="meter" aria-label={`Posisi ${item.label}`} aria-valuemin={visual.rangeMin} aria-valuemax={visual.rangeMax} aria-valuenow={value} aria-valuetext={`${formatNumber(value)} ${item.unit}, ${visual.label}`} style={meterStyle}><i />{visual.min != null && <span className="reading-limit min" />}{visual.max != null && <span className="reading-limit max" />}</div>}
        </article>;
      })}</div>
      <section className="panel chart-panel">
        <div className="chart-heading">
          <div>
            <p className="eyebrow">TREN 24 DATA TERAKHIR</p>
            <h2>{meta.label} <small>{meta.unit || "skala pH"}</small></h2>
            <p>{selected?.name} · {selected?.kolam}</p>
          </div>
          <div className="chart-timestamps">
            <span className={`status-badge ${freshnessTone[freshness]}`}>{freshnessLabel[freshness]}</span>
            <strong>{formatDateTimeExact(lastTimestamp)}</strong>
            <small>Halaman diperbarui: {paused ? "dijeda" : formatDateTime(syncedAt)}</small>
          </div>
        </div>
        <div className="chart-legend"><span><i />{meta.label} aktual</span><small>{firstTimestamp && lastChartTimestamp ? `${formatDateTime(new Date(firstTimestamp).toISOString())} - ${formatDateTime(new Date(lastChartTimestamp).toISOString())}` : "Belum ada rentang waktu"}</small></div>
        {chartData.length === 0 ? <EmptyState title={`Sensor ${meta.label} belum mengirim data`} description="Sensor mungkin belum terpasang atau perlu diperiksa koneksinya." /> : <div className="chart" role="img" aria-label={`Grafik tren ${meta.label}. ${freshnessLabel[freshness]}. Data terakhir ${formatDateTimeExact(lastTimestamp)}.`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 18, left: 2, bottom: 8 }}>
              <defs><linearGradient id="telemetryFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#198AFF" stopOpacity={0.22} /><stop offset="100%" stopColor="#198AFF" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke="#d9e3ee" strokeDasharray="4 6" vertical />
              <XAxis dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} tickCount={6} minTickGap={34} tickFormatter={(value) => new Intl.DateTimeFormat("id-ID", spansDays ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" }).format(new Date(value))} tickLine={false} axisLine={{ stroke: "#b8c6d5" }} tickMargin={12} />
              <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={52} tickMargin={8} tickFormatter={(value) => formatNumber(Number(value))} label={{ value: meta.unit || "pH", angle: -90, position: "insideLeft", fill: "#718096", fontSize: 11 }} />
              <Tooltip labelFormatter={(value) => formatDateTimeExact(new Date(Number(value)).toISOString())} formatter={(value) => [`${formatNumber(Number(value))}${meta.unit ? ` ${meta.unit}` : ""}`, meta.label]} contentStyle={{ border: "1px solid #cbd7e4", borderRadius: 10, boxShadow: "0 12px 30px rgb(15 23 42 / .12)" }} cursor={{ stroke: "#8ba1b8", strokeDasharray: "4 4" }} />
              {lastChartTimestamp && <ReferenceLine x={lastChartTimestamp} stroke={freshness === "fresh" ? "#087d78" : "#9a5800"} strokeDasharray="3 5" label={{ value: "Data terakhir", position: "insideTopRight", fill: freshness === "fresh" ? "#087d78" : "#9a5800", fontSize: 11 }} />}
              <Area type="monotone" dataKey="value" name={meta.label} stroke="#198AFF" strokeWidth={2.5} fill="url(#telemetryFill)" dot={{ r: 3, fill: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={!window.matchMedia("(prefers-reduced-motion: reduce)").matches} />
            </AreaChart>
          </ResponsiveContainer>
        </div>}
        <div className="chart-axis-note"><span>Sumbu X: waktu pengukuran lokal</span><span>Sumbu Y: {meta.label} ({meta.unit || "skala pH"})</span></div>
      </section>
    </>}
  </div>;
}
