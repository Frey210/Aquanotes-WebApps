import { useCallback, useEffect, useRef, useState } from "react";
import { LinkBreak, Plus, Warning, Wrench } from "../icons";
import { apiFetch, ApiError } from "../api/client";
import { EmptyState, ErrorState, PageLoader } from "../components/States";
import type { Device } from "../types";
import { formatRelative } from "../utils/format";
import { PageHeader } from "./UserDashboard";

function RemoveDialog({ device, busy, close, confirm }: { device: Device; busy: boolean; close: () => void; confirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="confirm-dialog deactivate" onCancel={(event) => { event.preventDefault(); if (!busy) close(); }}>
    <div className="confirm-icon"><Warning size={24} /></div><div className="confirm-copy"><p className="eyebrow">KONFIRMASI</p><h2>Lepas perangkat dari akun?</h2><p>Perangkat tidak lagi terhubung ke akun ini. Riwayat sensor tetap tersimpan.</p><strong>{device.name || device.uid}</strong></div>
    <div className="confirm-actions"><button className="button secondary" onClick={close} disabled={busy} autoFocus>Batal</button><button className="button danger" onClick={confirm} disabled={busy}>{busy ? "Memproses…" : "Lepas device"}</button></div>
  </dialog>;
}

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Device | null>(null);
  const [removingBusy, setRemovingBusy] = useState(false);
  const load = useCallback(() => { setError(""); apiFetch<Device[]>("/devices/").then(setDevices).catch((cause: Error) => setError(cause.message)); }, []);
  useEffect(load, [load]);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAdding(true); setMessage("");
    const form = event.currentTarget; const values = new FormData(form);
    try { await apiFetch("/devices/", { method: "POST", body: JSON.stringify({ uid: values.get("uid"), name: values.get("name") }) }); form.reset(); setMessage("Device berhasil dihubungkan ke akun."); load(); }
    catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "Device belum dapat ditambahkan."); }
    finally { setAdding(false); }
  }

  async function toggle(device: Device) {
    const maintenance = device.status === "maintenance";
    try { await apiFetch(`/devices/${device.id}/${maintenance ? "online" : "maintenance"}`, { method: "PUT" }); setMessage(maintenance ? "Permintaan perawatan dibatalkan." : "Permintaan perawatan dikirim ke admin."); load(); }
    catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "Status device belum dapat diubah."); }
  }
  async function removeDevice() {
    if (!removing) return;
    setRemovingBusy(true);
    try { await apiFetch(`/devices/${encodeURIComponent(removing.uid)}`, { method: "DELETE" }); setMessage("Device berhasil dilepas dari akun."); setRemoving(null); load(); }
    catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "Device belum dapat dilepas."); }
    finally { setRemovingBusy(false); }
  }

  if (!devices && !error) return <PageLoader />;
  if (!devices) return <ErrorState message={error} retry={load} />;
  return <div className="page">{removing && <RemoveDialog device={removing} busy={removingBusy} close={() => setRemoving(null)} confirm={() => void removeDevice()} />}<PageHeader eyebrow="DEVICE" title="Perangkat Anda" description="Hubungkan Device ID, pantau status, atau ajukan perawatan lapangan." /><section className="panel compact-form"><div><p className="eyebrow">HUBUNGKAN DEVICE</p><h2>Hubungkan device</h2></div><form onSubmit={add}><label>Nama device<input name="name" required placeholder="Contoh: Sensor Kolam A" /></label><label>Device ID<input name="uid" required placeholder="UID pada perangkat" /></label><button className="button primary" disabled={adding}><Plus size={18} />{adding ? "Menghubungkan…" : "Hubungkan"}</button></form>{message && <p className="form-notice" role="status">{message}</p>}</section>{devices.length === 0 ? <EmptyState title="Belum ada device" description="Masukkan Device ID untuk menghubungkan perangkat pertama." /> : <section className="panel"><div className="table-wrap"><table><thead><tr><th>Device</th><th>Status</th><th>Terakhir aktif</th><th>Interval</th><th><span className="sr-only">Aksi</span></th></tr></thead><tbody>{devices.map((device) => <tr key={device.id}><td><strong>{device.name}</strong><code>{device.uid}</code></td><td><span className={`legacy-status ${device.status}`}>{device.status === "maintenance" ? "Perawatan" : device.status === "inactive" ? "Nonaktif" : device.status}</span></td><td>{formatRelative(device.last_seen)}</td><td>{device.connection_interval || 5} menit</td><td><div className="device-actions"><button className="button ghost small" disabled={device.status === "inactive"} onClick={() => void toggle(device)}><Wrench size={17} />{device.status === "maintenance" ? "Batalkan perawatan" : device.status === "inactive" ? "Dinonaktifkan admin" : "Ajukan perawatan"}</button><button className="button danger small" onClick={() => setRemoving(device)}><LinkBreak size={17} />Lepas device</button></div></td></tr>)}</tbody></table></div></section>}</div>;
}
