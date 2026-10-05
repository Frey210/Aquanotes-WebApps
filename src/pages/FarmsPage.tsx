import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, ChartLine, Check, Cpu, House, MapPin, Plus, Waves } from "../icons";
import { apiFetch, ApiError } from "../api/client";
import { EmptyState, ErrorState, PageLoader } from "../components/States";
import { MetricCard } from "../components/MetricCard";
import type { Device, Kolam, MonitoringResponse, Tambak } from "../types";
import { PageHeader } from "./UserDashboard";

type FarmDraft = Omit<Tambak, "id">;
type FarmData = {
  farms: Tambak[];
  ponds: Record<number, Kolam[]>;
  devices: Device[];
  assignedDeviceIds: Set<number>;
};
type Region = { id: string; name: string };

const REGION_API = "https://www.emsifa.com/api-wilayah-indonesia/api";

const emptyDraft: FarmDraft = { name: "", country: "Indonesia", province: "", city: "", district: "", village: "", address: "", cultivation_type: "Udang Vaname" };

export function FarmsPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<FarmData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showFarmForm, setShowFarmForm] = useState(false);
  const [draft, setDraft] = useState<FarmDraft | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState<{ provinces: Region[]; cities: Region[]; districts: Region[]; villages: Region[] }>({ provinces: [], cities: [], districts: [], villages: [] });
  const [regionIds, setRegionIds] = useState({ province: "", city: "", district: "", village: "" });
  const [regionFallback, setRegionFallback] = useState(false);
  const [pondType, setPondType] = useState("Bundar");

  const load = useCallback(async () => {
    setError("");
    try {
      const [farms, devices, monitoring] = await Promise.all([
        apiFetch<Tambak[]>("/tambak/"), apiFetch<Device[]>("/devices/"), apiFetch<MonitoringResponse>("/monitoring?last_n=1"),
      ]);
      const pondPairs = await Promise.all(farms.map(async (farm) => [farm.id, await apiFetch<Kolam[]>(`/kolam/?tambak_id=${farm.id}`)] as const));
      const assignedDeviceIds = new Set(monitoring.kolam_list.flatMap((pond) => pond.devices.map((device) => device.id)));
      setData({ farms, devices, assignedDeviceIds, ponds: Object.fromEntries(pondPairs) });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Data tambak belum dapat dimuat."); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!showFarmForm || regions.provinces.length || regionFallback) return;
    fetch(`${REGION_API}/provinces.json`).then((response) => {
      if (!response.ok) throw new Error();
      return response.json() as Promise<Region[]>;
    }).then((provinces) => setRegions((current) => ({ ...current, provinces }))).catch(() => setRegionFallback(true));
  }, [regionFallback, regions.provinces.length, showFarmForm]);

  async function selectRegion(level: "province" | "city" | "district" | "village", id: string) {
    const resets = level === "province" ? { city: "", district: "", village: "" } : level === "city" ? { district: "", village: "" } : level === "district" ? { village: "" } : {};
    setRegionIds((current) => ({ ...current, [level]: id, ...resets }));
    if (level === "village" || !id) return;
    const endpoint = level === "province" ? "regencies" : level === "city" ? "districts" : "villages";
    const target = level === "province" ? "cities" : level === "city" ? "districts" : "villages";
    try {
      const response = await fetch(`${REGION_API}/${endpoint}/${id}.json`);
      if (!response.ok) throw new Error();
      const items = await response.json() as Region[];
      setRegions((current) => ({ ...current, [target]: items, ...(level === "province" ? { districts: [], villages: [] } : level === "city" ? { villages: [] } : {}) }));
    } catch { setRegionFallback(true); }
  }

  function regionName(level: keyof typeof regionIds) {
    const collection = level === "province" ? regions.provinces : level === "city" ? regions.cities : level === "district" ? regions.districts : regions.villages;
    return collection.find((region) => region.id === regionIds[level])?.name || "";
  }
  const selectedId = Number(params.get("tambak")) || data?.farms[0]?.id || 0;
  const selectedFarm = data?.farms.find((farm) => farm.id === selectedId) || null;
  const ponds = data?.ponds[selectedId] || [];
  const availableDevices = useMemo(() => data?.devices.filter((device) => !data.assignedDeviceIds.has(device.id)) || [], [data]);

  function reviewFarm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setDraft(Object.fromEntries([...values].map(([key, value]) => [key, String(value).trim()])) as FarmDraft);
    setReviewing(true);
  }

  async function createFarm() {
    if (!draft) return;
    setSaving(true); setNotice("");
    try {
      const created = await apiFetch<Tambak>("/tambak/", { method: "POST", body: JSON.stringify(draft) });
      setShowFarmForm(false); setDraft(null); setReviewing(false); setParams({ tambak: String(created.id) });
      setNotice(`Tambak ${created.name} berhasil dibuat.`); await load();
    } catch (cause) { setNotice(cause instanceof ApiError ? cause.message : "Tambak belum dapat dibuat."); }
    finally { setSaving(false); }
  }

  async function createPond(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setNotice("");
    const form = event.currentTarget; const values = new FormData(form);
    try {
      const tipe = String(values.get("tipe"));
      const diameter = Number(values.get("diameter"));
      await apiFetch<Kolam>("/kolam/", { method: "POST", body: JSON.stringify({
        nama: values.get("nama"), tipe, panjang: tipe === "Bundar" ? diameter : Number(values.get("panjang")), lebar: tipe === "Bundar" ? diameter : Number(values.get("lebar")),
        kedalaman: Number(values.get("kedalaman")), komoditas: values.get("komoditas"), tambak_id: selectedId, device_id: Number(values.get("device_id")),
      }) });
      form.reset(); setPondType("Bundar"); setNotice("Kolam berhasil dibuat dan device telah dipasangkan."); await load();
    } catch (cause) { setNotice(cause instanceof ApiError ? cause.message : "Kolam belum dapat dibuat."); }
    finally { setSaving(false); }
  }

  if (!data && !error) return <PageLoader />;
  if (!data) return <ErrorState message={error} retry={load} />;

  return <div className="page">
    <PageHeader eyebrow="OPERASI BUDIDAYA" title="Tambak & Kolam" description="Pilih konteks kerja, kelola struktur budidaya, dan pasangkan device ke kolam." action={<button className="button primary" onClick={() => { setShowFarmForm(true); setDraft(null); setReviewing(false); setRegionIds({ province: "", city: "", district: "", village: "" }); }}><Plus size={18} />Tambah tambak</button>} />
    <section className="context-bar" aria-label="Konteks tambak aktif">
      <label>Tambak<select value={selectedId || ""} onChange={(event) => setParams({ tambak: event.target.value })} disabled={data.farms.length === 0}><option value="">Pilih tambak</option>{data.farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label>
      <div className="context-meta"><span>{selectedFarm ? `${selectedFarm.city}, ${selectedFarm.province}` : "Belum ada lokasi aktif"}</span><strong>{selectedFarm?.cultivation_type || "Tambahkan tambak pertama"}</strong></div>
      <nav className="activity-shortcuts" aria-label="Aktivitas konteks"><Link to="/app/monitoring"><ChartLine size={18} />Monitoring</Link><Link to="/app/devices"><Cpu size={18} />Device</Link><Link to="/app/alerts"><Bell size={18} />Notifikasi</Link></nav>
    </section>
    <div className="metrics-grid farm-metrics"><MetricCard icon={House} label="Total tambak" value={data.farms.length} note="Milik akun Anda" /><MetricCard icon={Waves} label="Kolam aktif" value={Object.values(data.ponds).flat().length} note="Semua tambak" tone="teal" /><MetricCard icon={Cpu} label="Device tersedia" value={availableDevices.length} note="Belum dipasangkan" tone="amber" /></div>
    {notice && <p className="form-notice" role="status">{notice}</p>}
    {showFarmForm && <section className="panel farm-wizard" aria-labelledby="farm-form-title">
      <div className="stepper" aria-label={reviewing ? "Langkah 2 dari 2" : "Langkah 1 dari 2"}><span className={reviewing ? "done" : "active"}>{reviewing ? <Check size={16} /> : "1"} Informasi tambak</span><i /><span className={reviewing ? "active" : ""}>2&nbsp; Konfirmasi</span></div>
      {!reviewing ? <><div className="panel-heading"><div><p className="eyebrow">LANGKAH 1 DARI 2</p><h2 id="farm-form-title">Informasi tambak</h2></div><button className="button ghost" onClick={() => setShowFarmForm(false)}>Batal</button></div><form className="farm-form" onSubmit={reviewFarm}>
        <label>Nama tambak<input name="name" required maxLength={100} defaultValue={draft?.name || emptyDraft.name} placeholder="Contoh: Tambak Bahari" /></label><label>Jenis budidaya<input name="cultivation_type" required maxLength={100} defaultValue={draft?.cultivation_type || emptyDraft.cultivation_type} /></label><label>Negara<input name="country" required maxLength={100} defaultValue={draft?.country || emptyDraft.country} /></label>
        {regionFallback ? <><label>Provinsi<input name="province" required maxLength={100} defaultValue={draft?.province} /></label><label>Kabupaten / kota<input name="city" required maxLength={100} defaultValue={draft?.city} /></label><label>Kecamatan<input name="district" required maxLength={100} defaultValue={draft?.district} /></label><label>Desa / kelurahan<input name="village" required maxLength={100} defaultValue={draft?.village} /></label><p className="region-note full">Daftar wilayah sedang tidak tersedia. Lokasi tetap dapat diisi manual.</p></> : <>
          <label>Provinsi<select required value={regionIds.province} onChange={(event) => void selectRegion("province", event.target.value)}><option value="">{regions.provinces.length ? "Pilih provinsi" : "Memuat provinsi…"}</option>{regions.provinces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="hidden" name="province" value={regionName("province")} /></label>
          <label>Kabupaten / kota<select required disabled={!regionIds.province} value={regionIds.city} onChange={(event) => void selectRegion("city", event.target.value)}><option value="">Pilih kabupaten / kota</option>{regions.cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="hidden" name="city" value={regionName("city")} /></label>
          <label>Kecamatan<select required disabled={!regionIds.city} value={regionIds.district} onChange={(event) => void selectRegion("district", event.target.value)}><option value="">Pilih kecamatan</option>{regions.districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="hidden" name="district" value={regionName("district")} /></label>
          <label>Desa / kelurahan<select required disabled={!regionIds.district} value={regionIds.village} onChange={(event) => void selectRegion("village", event.target.value)}><option value="">Pilih desa / kelurahan</option>{regions.villages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="hidden" name="village" value={regionName("village")} /></label>
          <p className="region-note full">Pilihan wilayah berikutnya otomatis disaring berdasarkan lokasi di atas.</p>
        </>}
        <label className="full">Alamat lengkap<input name="address" required maxLength={255} defaultValue={draft?.address} placeholder="Nama jalan, nomor, atau penanda lokasi" /></label><div className="form-actions full"><button type="button" className="button secondary" onClick={() => setShowFarmForm(false)}>Batal</button><button className="button primary">Tinjau data</button></div>
      </form></> : draft && <div className="farm-review"><div><p className="eyebrow">LANGKAH 2 DARI 2</p><h2 id="farm-form-title">Konfirmasi tambak</h2><p>Periksa konteks lokasi sebelum menyimpan.</p></div><dl><div><dt>Tambak</dt><dd>{draft.name}</dd></div><div><dt>Budidaya</dt><dd>{draft.cultivation_type}</dd></div><div><dt>Lokasi</dt><dd>{draft.village}, {draft.district}, {draft.city}, {draft.province}</dd></div><div><dt>Alamat</dt><dd>{draft.address}</dd></div></dl><div className="map-preview"><MapPin size={22} /><div><strong>Periksa titik lokasi</strong><span>{draft.address}, {draft.city}</span></div><a className="button secondary small" href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${draft.address}, ${draft.village}, ${draft.city}, ${draft.province}, Indonesia`)}`} target="_blank" rel="noreferrer">Buka peta</a></div><div className="form-actions"><button className="button secondary" onClick={() => setReviewing(false)}>Kembali</button><button className="button primary" disabled={saving} onClick={() => void createFarm()}>{saving ? "Menyimpan…" : "Buat tambak"}</button></div></div>}
    </section>}
    {data.farms.length === 0 ? <EmptyState title="Belum ada tambak" description="Tambahkan tambak pertama untuk mulai membuat kolam dan memasangkan device." /> : <div className="farm-workspace">
      <section className="panel pond-list"><div className="panel-heading"><div><p className="eyebrow">{selectedFarm?.name.toUpperCase()}</p><h2>Daftar kolam</h2></div><span className="updated-at">{ponds.length} kolam</span></div>{ponds.length === 0 ? <EmptyState title="Belum ada kolam" description="Hubungkan device terlebih dahulu, lalu buat kolam pertama di tambak ini." /> : <div className="pond-grid">{ponds.map((pond) => <article key={pond.id}><div className="pond-icon"><Waves size={22} /></div><div><strong>{pond.nama}</strong><span>{pond.komoditas}</span></div><Link to="/app/monitoring" className="button ghost small">Lihat data</Link></article>)}</div>}</section>
      <section className="panel pond-create"><div><p className="eyebrow">TAMBAH KOLAM</p><h2>Pasangkan kolam dan device</h2><p>Pilih device yang akan memantau kolam ini.</p></div>{availableDevices.length === 0 ? <div className="inline-note"><span>Semua device yang tersedia sudah dipasangkan ke kolam.</span><Link to="/app/devices" className="button secondary small">Kelola device</Link></div> : <form onSubmit={createPond}><label>Nama kolam<input name="nama" required maxLength={100} placeholder="Contoh: Kolam A1" /></label><label>Tipe kolam<select name="tipe" required value={pondType} onChange={(event) => setPondType(event.target.value)}><option value="Bundar">Bundar</option><option value="Persegi">Persegi</option></select></label>{pondType === "Bundar" ? (<label>Diameter (m)<input name="diameter" type="number" min="0.1" step="0.1" required /></label>) : (<><label>Panjang (m)<input name="panjang" type="number" min="0.1" step="0.1" required /></label><label>Lebar (m)<input name="lebar" type="number" min="0.1" step="0.1" required /></label></>)}<label>Kedalaman (m)<input name="kedalaman" type="number" min="0.1" step="0.1" required /></label><label>Komoditas<input name="komoditas" required defaultValue={selectedFarm?.cultivation_type || "Udang Vaname"} /></label><label className="full">Device<select name="device_id" required>{availableDevices.map((device) => <option key={device.id} value={device.id}>{device.name || device.uid} · {device.uid}</option>)}</select></label><button className="button primary full" disabled={saving}><Plus size={18} />{saving ? "Menyimpan…" : "Tambah kolam"}</button></form>}</section>
    </div>}
  </div>;
}
