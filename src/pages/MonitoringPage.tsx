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
import { DeviceNavigator } from "../components/DeviceNavigator";

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
  const [thresholds, setThresholds] = useState<{ deviceId: number; values: DeviceThresholds } | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [monitoring, devices] = await Promise.all([
        apiFetch<MonitoringResponse>("/monitoring?last_n=24"),
        apiFetch<Device[]>("/devices/"),
      ]);
      setData(monitoring);
      setRegistry(devices);
      const available = monitoring.kolam_list.flatMap((kolam) => kolam.devices);
      setDeviceId((current) => available.some((device) => device.id === current) ? current : monitoring.current_device_id ?? available[0]?.id ?? null);
      setSyncedAt(new Date().toISOString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data monitoring belum dapat dimuat.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!deviceId) { setThresholds(null); return; }
    let active = true;
    apiFetch<DeviceThresholds>(`/devices/${deviceId}/thresholds`).then((values) => { if (active) setThresholds({ deviceId, values }); }).catch(() => { if (active) setThresholds(null); });
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
    return Number.isFinite(time) ? [{ time, value: value != null && Number.isFinite(value) ? value : null }] : [];
  }), [selected, parameter]);
  const firstTimestamp = chartData[0]?.time;
  const lastChartTimestamp = chartData.at(-1)?.time;
  const spansDays = Boolean(firstTimestamp && lastChartTimestamp && new Date(firstTimestamp).toDateString() !== new Date(lastChartTimestamp).toDateString());

  if (!data && !error) return <PageLoader />;
  if (!data) return <ErrorState message={error} retry={load} />;

  return <div className="page user-monitoring">
    <PageHeader
      eyebrow="MONITORING"
      title="Monitoring kualitas air"
      description="Kualitas air, dalam satu pantauan."
      action={<div className="header-actions">
        <button className="button secondary" aria-label={paused ? "Lanjutkan update" : "Jeda update"} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}<span>{paused ? "Lanjutkan" : "Jeda"}</span></button>
        <button className="icon-button bordered" onClick={() => void load()} aria-label="Refresh sekarang"><ArrowClockwise size={20} /></button>
      </div>}
    />
    {error && <ErrorState message={error} retry={load} />}
    {devices.length === 0 ? <EmptyState title="Belum ada data monitoring" description="Hubungkan device ke kolam dan tunggu data sensor pertama." /> : <div className="monitor-workspace">
      <DeviceNavigator devices={devices.map((device) => { const registered = registry.find((item) => item.id === device.id); const state = getTelemetryFreshness(device.latest_data?.timestamp, registered?.connection_interval || 5); return { id: device.id, name: device.name || registered?.uid || "Tanpa nama", uid: registered?.uid || "", location: device.kolam, status: state === "fresh" ? "online" : state === "unknown" ? "never_seen" : state === "silent" ? "offline" : "stale" }; })} selectedId={deviceId} onSelect={setDeviceId} />
      <div className="monitor-detail">
      <div className="monitor-device-heading">
        <div><h2>{selected?.name || selectedRegistry?.uid}</h2><p>{selected?.kolam}</p><small className="sensor-availability">{parameters.filter((item) => selected?.latest_data?.[item.key] != null).length}/6 sensor terbaca</small></div>
        <div className="monitor-device-status"><span className={`status-badge ${freshnessTone[freshness]}`}>{freshnessLabel[freshness]}</span></div>
      </div>
      {freshness !== "fresh" && <div className="monitor-data-notice" role="status"><WarningDiamond size={19} aria-hidden="true" /><span>Data tersimpan · {lastTimestamp ? formatRelative(lastTimestamp) : "belum ada pengukuran"}</span></div>}
      <div className={`reading-grid ${freshness !== "fresh" ? "reading-stale" : ""}`}>{parameters.map((item) => {
        const value = selected?.latest_data?.[item.key];
        const visual = getReadingVisual(item.key, value, thresholds?.deviceId === deviceId ? thresholds.values : null);
        const Icon = item.icon;
        const meterStyle = { "--reading-position": `${visual.position}%`, "--reading-min": `${visual.minPosition ?? 0}%`, "--reading-max": `${visual.maxPosition ?? 100}%` } as CSSProperties;
        return <button title={limitLabel(visual.min, visual.max, item.unit)} aria-label={`${item.label}: ${value == null ? "Belum terbaca" : `${formatNumber(value)} ${item.unit}, ${visual.label}`}`} aria-pressed={parameter === item.key} onClick={() => setParameter(item.key)} className={`reading-card sensor-choice sensor-${item.key} ${visual.status} ${value == null ? "unavailable" : ""} ${parameter === item.key ? "selected" : ""}`} key={item.key}>
          <div className="reading-icon" aria-hidden="true"><Icon size={23} weight={visual.status === "normal" ? "duotone" : "fill"} /></div>
          <Icon className="sensor-symbol" size={22} weight="duotone" aria-hidden="true" />
          {(visual.status === "high" || visual.status === "low") && <span className="sensor-alert"><WarningDiamond size={12} weight="fill" aria-hidden="true" />{visual.status === "high" ? "Tinggi" : "Rendah"}</span>}
          <div className="reading-copy"><span>{item.label}</span><strong>{value == null ? "—" : formatNumber(value)} <small>{value == null ? "" : item.unit}</small></strong></div>
          <div className="reading-state"><b>{visual.label}</b><small>{limitLabel(visual.min, visual.max, item.unit)}</small></div>
          {(visual.min != null || visual.max != null) && value != null && <div className="reading-meter" role="meter" aria-label={`Posisi ${item.label}`} aria-valuemin={visual.rangeMin} aria-valuemax={visual.rangeMax} aria-valuenow={value} aria-valuetext={`${formatNumber(value)} ${item.unit}, ${visual.label}`} style={meterStyle}><i />{visual.min != null && <span className="reading-limit min" />}{visual.max != null && <span className="reading-limit max" />}</div>}
        </button>;
      })}</div>
      <section className="panel chart-panel" key={`${deviceId}-${parameter}`}>
        <div className="chart-heading">
          <div>
            <h2>Tren {meta.label.toLocaleLowerCase("id")} <small>{meta.unit || "skala pH"}</small></h2>
            <p>24 pengukuran terakhir · {paused ? "Pembaruan dijeda" : `Diperbarui ${formatDateTime(syncedAt)}`}</p>
          </div>
          <div className="chart-timestamps">
            <strong>{formatNumber(selected?.latest_data?.[parameter])} {meta.unit}</strong>
            <small>{formatDateTimeExact(lastTimestamp)}</small>
          </div>
        </div>
        {!chartData.some((reading) => reading.value != null) ? <EmptyState title={`Sensor ${meta.label} belum mengirim data`} description="Sensor mungkin belum terpasang atau perlu diperiksa koneksinya." /> : <div className="chart" role="img" aria-label={`Grafik tren ${meta.label}. ${freshnessLabel[freshness]}. Data terakhir ${formatDateTimeExact(lastTimestamp)}.`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 18, left: 2, bottom: 8 }}>
              <defs><linearGradient id="telemetryFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#198AFF" stopOpacity={0.22} /><stop offset="100%" stopColor="#198AFF" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke="#d9e3ee" strokeDasharray="4 6" vertical />
              <XAxis dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} tickCount={6} minTickGap={34} tickFormatter={(value) => new Intl.DateTimeFormat("id-ID", spansDays ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" }).format(new Date(value))} tickLine={false} axisLine={{ stroke: "#b8c6d5" }} tickMargin={12} />
              <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={52} tickMargin={8} tickFormatter={(value) => formatNumber(Number(value))} label={{ value: meta.unit || "pH", angle: -90, position: "insideLeft", fill: "#718096", fontSize: 11 }} />
              <Tooltip labelFormatter={(value) => formatDateTimeExact(new Date(Number(value)).toISOString())} formatter={(value) => [`${formatNumber(Number(value))}${meta.unit ? ` ${meta.unit}` : ""}`, meta.label]} contentStyle={{ border: "1px solid #cbd7e4", borderRadius: 10, boxShadow: "0 12px 30px rgb(15 23 42 / .12)" }} cursor={{ stroke: "#8ba1b8", strokeDasharray: "4 4" }} />
              {lastChartTimestamp && <ReferenceLine x={lastChartTimestamp} stroke={freshness === "fresh" ? "#087d78" : "#9a5800"} strokeDasharray="3 5" label={{ value: "Data terakhir", position: "insideTopRight", fill: freshness === "fresh" ? "#087d78" : "#9a5800", fontSize: 11 }} />}
              <Area type="monotoneX" dataKey="value" name={meta.label} stroke="#198AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="url(#telemetryFill)" dot={false} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive="auto" animationDuration={750} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>}
        <div className="chart-axis-note"><span>Sumbu X: waktu pengukuran lokal</span><span>Sumbu Y: {meta.label} ({meta.unit || "skala pH"})</span></div>
        <details className="chart-data-table"><summary>Lihat angka pengukuran</summary><div className="table-wrap"><table><thead><tr><th>Waktu pengukuran</th><th>{meta.label} ({meta.unit || "skala pH"})</th></tr></thead><tbody>{chartData.map((reading, index) => <tr key={index}><td>{formatDateTimeExact(new Date(reading.time).toISOString())}</td><td>{formatNumber(reading.value)}</td></tr>)}</tbody></table></div></details>
      </section>
      </div>
    </div>}
  </div>;
}
