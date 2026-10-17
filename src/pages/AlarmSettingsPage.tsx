import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, Check, ThermometerSimple, Flask, Waves, Gauge, WarningDiamond } from "../icons";
import { apiFetch } from "../api/client";
import { EmptyState, ErrorState, PageLoader } from "../components/States";
import type { Device, DeviceThresholds } from "../types";
import { PageHeader } from "./UserDashboard";

const parameters = [
  { key: "suhu", label: "Suhu", unit: "°C", min: "temp_min", max: "temp_max", icon: ThermometerSimple },
  { key: "ph", label: "pH", unit: "pH", min: "ph_min", max: "ph_max", icon: Flask },
  { key: "do", label: "Oksigen terlarut", unit: "mg/L", min: "do_min", max: null, icon: Waves },
  { key: "tds", label: "TDS", unit: "ppm", min: null, max: "tds_max", icon: Gauge },
  { key: "ammonia", label: "Amonia", unit: "mg/L", min: null, max: "ammonia_max", icon: WarningDiamond },
  { key: "salinitas", label: "Salinitas", unit: "ppt", min: "salinitas_min", max: "salinitas_max", icon: Waves },
] as const;
type Field = Exclude<keyof DeviceThresholds, "device_id" | "device_name">;
type Draft = Record<Field, string>;

function ThresholdForm({ device }: { device: Device }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<DeviceThresholds>(`/devices/${device.id}/thresholds`, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      const next = {} as Draft;
      const states: Record<string, boolean> = {};
      for (const item of parameters) {
        const fields = [item.min, item.max].filter((field): field is Field => field !== null);
        states[item.key] = fields.some((field) => data[field] != null);
        for (const field of fields) next[field] = data[field] == null ? "" : String(data[field]);
      }
      setDraft(next); setEnabled(states); setError("");
    }).catch((cause: Error) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [device.id, reload]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setMessage(""); setError("");
    const values: Partial<Record<Field, number | null>> = {};
    for (const item of parameters) {
      const fields = [item.min, item.max].filter((field): field is Field => field !== null);
      if (enabled[item.key] && fields.every((field) => draft[field].trim() === "")) {
        setError(`Isi setidaknya satu batas untuk ${item.label}, atau matikan alarmnya.`); return;
      }
      for (const field of fields) {
        const value = !enabled[item.key] || draft[field].trim() === "" ? null : Number(draft[field]);
        if (value !== null && (!Number.isFinite(value) || value < 0 || (item.key === "ph" && value > 14))) {
          setError(`Batas ${item.label} tidak valid.`); return;
        }
        values[field] = value;
      }
      if (item.min && item.max && values[item.min] != null && values[item.max] != null && values[item.min]! > values[item.max]!) {
        setError(`Batas minimum ${item.label} tidak boleh melebihi maksimum.`); return;
      }
    }
    setBusy(true);
    try {
      await apiFetch(`/devices/${device.id}/thresholds`, { method: "PUT", body: JSON.stringify(values) });
      setMessage("Pengaturan alarm berhasil disimpan. Berlaku juga untuk notifikasi aplikasi mobile.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Pengaturan belum dapat disimpan."); }
    finally { setBusy(false); }
  }
  if (!draft) return error ? <ErrorState message={error} retry={() => setReload((value) => value + 1)} /> : <PageLoader label="Memuat batas alarm" />;
  return <form className="alarm-settings-form" onSubmit={save}>
    <div className="alarm-settings-intro"><Bell size={22} aria-hidden="true" /><p>Aktifkan hanya parameter yang ingin dipantau. Alarm tidak dipicu saat nilai sensor kosong. Nilai 0 tetap merupakan batas yang valid.</p></div>
    <fieldset disabled={busy} className="alarm-parameters"><legend className="sr-only">Batas alarm per parameter</legend>
      {parameters.map((item) => { const Icon = item.icon; return <section className={`alarm-parameter ${enabled[item.key] ? "enabled" : "disabled"}`} key={item.key}>
        <div className="alarm-parameter-heading"><Icon size={25} aria-hidden="true" /><div><h2>{item.label}</h2><p>{enabled[item.key] ? "Notifikasi di luar batas" : "Alarm dimatikan"}</p></div><label className="alarm-toggle"><input type="checkbox" role="switch" aria-label={`Alarm ${item.label}`} checked={enabled[item.key]} onChange={(event) => { setEnabled({ ...enabled, [item.key]: event.target.checked }); setMessage(""); }} /><span aria-hidden="true" /></label></div>
        {enabled[item.key] && <div className="alarm-fields">{([item.min, item.max] as const).filter((field): field is Field => field !== null).map((field) => <label key={field}>{field === item.min ? "Minimum" : "Maksimum"} ({item.unit})<input type="number" inputMode="decimal" min="0" max={item.key === "ph" ? 14 : undefined} step="any" value={draft[field]} aria-label={`${item.label} ${field === item.min ? "minimum" : "maksimum"}`} placeholder="Tidak dibatasi" onChange={(event) => { setDraft({ ...draft, [field]: event.target.value }); setMessage(""); }} /></label>)}</div>}
      </section>; })}
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="alarm-save-success" role="status"><Check size={18} aria-hidden="true" />{message}</p>}
    <div className="alarm-save-bar"><p>Perubahan berlaku setelah disimpan.</p><button className="button primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan pengaturan"}</button></div>
  </form>;
}

export function AlarmSettingsPage() {
  const [search, setSearch] = useSearchParams();
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => { apiFetch<Device[]>("/devices/").then((next) => { setDevices(next); setError(""); }).catch((cause: Error) => setError(cause.message)); }, [reload]);
  const selected = devices?.find((device) => device.id === Number(search.get("device"))) || devices?.[0];
  return <div className="page alarm-settings-page"><PageHeader eyebrow="ALARM" title="Pengaturan alarm" description="Batas kualitas air, sesuai kebutuhan setiap perangkat." action={<Link className="button secondary" to="/app/alerts">Riwayat alarm</Link>} />
    {!devices ? error ? <ErrorState message={error} retry={() => setReload((value) => value + 1)} /> : <PageLoader /> : !selected ? <EmptyState title="Belum ada perangkat" description="Hubungkan perangkat terlebih dahulu untuk mengatur alarm kualitas air." /> : <>
      <section className="panel alarm-device-picker"><label>Perangkat<select value={selected.id} onChange={(event) => setSearch({ device: event.target.value })}>{devices.map((device) => <option key={device.id} value={device.id}>{device.name || device.uid} · {device.uid}</option>)}</select></label><span>Pengaturan disimpan per perangkat, bukan per browser.</span></section>
      <ThresholdForm key={selected.id} device={selected} />
    </>}
  </div>;
}
