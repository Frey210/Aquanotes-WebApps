import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowClockwise, Broadcast, Play, WarningCircle, XCircle } from "../icons";
import { apiFetch } from "../api/client";
import { EmptyState, ErrorState, PageLoader } from "../components/States";
import type { FirmwareRelease, FleetDevicePage, OtaAssignment, OtaAssignmentBatch } from "../types";
import { formatDateTime } from "../utils/format";
import { PageHeader } from "./UserDashboard";

const activeStates = new Set(["assigned", "deferred", "downloading", "downloaded", "rebooting", "pending_verify"]);

function formatBytes(bytes: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(bytes / 1024 / 1024) + " MB";
}

function stateLabel(state: OtaAssignment["state"]) {
  return ({
    assigned: "Menunggu", deferred: "Ditunda", downloading: "Mengunduh", downloaded: "Terunduh",
    rebooting: "Reboot", pending_verify: "Verifikasi", success: "Berhasil", failed: "Gagal",
    rolled_back: "Rollback", cancelled: "Dibatalkan",
  } as const)[state];
}

function stateClass(state: OtaAssignment["state"]) {
  if (state === "success") return "online";
  if (state === "failed" || state === "rolled_back") return "offline";
  if (state === "cancelled") return "never_seen";
  return "stale";
}

export function AdminFirmwarePage() {
  const [releases, setReleases] = useState<FirmwareRelease[] | null>(null);
  const [assignments, setAssignments] = useState<OtaAssignment[]>([]);
  const [fleet, setFleet] = useState<FleetDevicePage | null>(null);
  const [selectedRelease, setSelectedRelease] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [artifact, setArtifact] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [releaseData, assignmentData, fleetData] = await Promise.all([
        apiFetch<FirmwareRelease[]>("/admin/ota/releases"),
        apiFetch<OtaAssignment[]>("/admin/ota/assignments?limit=200"),
        apiFetch<FleetDevicePage>("/admin/fleet/devices?page_size=100"),
      ]);
      setReleases(releaseData);
      setAssignments(assignmentData);
      setFleet(fleetData);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data OTA belum dapat dimuat.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!assignments.some((item) => activeStates.has(item.state))) return;
    const timer = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(timer);
  }, [assignments, load]);

  const readyReleases = useMemo(() => releases?.filter((release) => release.status === "ready") || [], [releases]);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!artifact || !signature) return setNotice("Pilih file firmware .bin dan tanda tangan .sig.");
    const body = new FormData();
    body.append("version", version.trim());
    body.append("release_notes", notes.trim());
    body.append("artifact", artifact);
    body.append("signature", signature);
    setBusy("upload"); setNotice("");
    try {
      await apiFetch<FirmwareRelease>("/admin/ota/releases", { method: "POST", body });
      setVersion(""); setNotes(""); setArtifact(null); setSignature(null);
      setNotice("Artifact bertanda tangan berhasil diunggah sebagai draft. Periksa hash, key ID, dan ukuran sebelum publish.");
      await load();
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Upload gagal."); }
    finally { setBusy(""); }
  }

  async function publish(release: FirmwareRelease) {
    if (!window.confirm(`Publish firmware ${release.version}? Artifact tidak dapat diganti setelah siap digunakan.`)) return;
    setBusy(`publish-${release.id}`); setNotice("");
    try {
      await apiFetch(`/admin/ota/releases/${release.id}/publish`, { method: "POST" });
      setNotice(`Firmware ${release.version} siap untuk canary.`); await load();
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Publish gagal."); }
    finally { setBusy(""); }
  }

  async function rollout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const release = readyReleases.find((item) => item.id === Number(selectedRelease));
    if (!release || selectedDevices.length === 0) return setNotice("Pilih release dan minimal satu perangkat canary.");
    if (!window.confirm(`Kirim ${release.version} ke ${selectedDevices.length} perangkat? Mulai dari satu canary yang mudah dijangkau.`)) return;
    setBusy("rollout"); setNotice("");
    try {
      const result = await apiFetch<OtaAssignmentBatch>("/admin/ota/assignments", {
        method: "POST",
        body: JSON.stringify({ release_id: release.id, device_ids: selectedDevices, mandatory: false, rollback: false }),
      });
      setSelectedDevices([]);
      setNotice(result.publish_failures.length
        ? `${result.items.length} assignment tersimpan, tetapi ${result.publish_failures.length} command belum terbit ke MQTT. Gunakan Retry.`
        : `${result.items.length} assignment berhasil dikirim.`);
      await load();
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Rollout gagal."); }
    finally { setBusy(""); }
  }

  async function action(assignment: OtaAssignment, kind: "retry" | "cancel") {
    if (kind === "cancel" && !window.confirm(`Batalkan OTA untuk ${assignment.device_uid}?`)) return;
    setBusy(`${kind}-${assignment.id}`); setNotice("");
    try {
      await apiFetch(`/admin/ota/assignments/${assignment.id}/${kind}`, { method: "POST" });
      setNotice(kind === "retry" ? "Command OTA diterbitkan kembali." : "Assignment dibatalkan.");
      await load();
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Tindakan gagal."); }
    finally { setBusy(""); }
  }

  if (!releases && !error) return <PageLoader label="Memuat pusat firmware" />;
  if (!releases) return <ErrorState message={error} retry={() => void load()} />;

  return <div className="page ota-page">
    <PageHeader eyebrow="ADMIN · OTA" title="Firmware & rollout" description="Kelola artifact secara immutable, uji satu canary, lalu pantau setiap perangkat sampai firmware baru tervalidasi." />
    {notice && <div className="ota-notice" role="status">{notice}</div>}
    <section className="ota-grid">
      <article className="panel">
        <div className="panel-heading"><div><p className="eyebrow">RELEASE BARU</p><h2>Upload firmware</h2></div><Broadcast size={24} aria-hidden="true" /></div>
        <form className="ota-form" onSubmit={upload}>
          <label>Versi SemVer<input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="2.1.1" pattern="[0-9]+\.[0-9]+\.[0-9]+.*" required /></label>
          <label>File application `.bin`<input type="file" accept=".bin,application/octet-stream" onChange={(event) => setArtifact(event.target.files?.[0] || null)} required /></label>
          <label>Tanda tangan `.sig`<input type="file" accept=".sig,application/octet-stream" onChange={(event) => setSignature(event.target.files?.[0] || null)} required /></label>
          <label className="full">Catatan release<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={5000} placeholder="Perubahan, risiko, dan langkah verifikasi" /></label>
          <button className="button primary" disabled={busy === "upload"}>{busy === "upload" ? "Mengunggah…" : "Upload sebagai draft"}</button>
        </form>
      </article>
      <article className="panel ota-safety">
        <div className="panel-heading"><div><p className="eyebrow">GATE PRODUKSI</p><h2>Sebelum rollout</h2></div><WarningCircle size={24} aria-hidden="true" /></div>
        <ol><li>Uji recovery USB dan power-loss di unit meja.</li><li>Publish hanya binary dari commit/tag yang diketahui.</li><li>Pilih satu canary yang mudah dijangkau.</li><li>Tunggu minimal 24 jam sebelum batch berikutnya.</li></ol>
      </article>
    </section>

    <section className="panel flush">
      <div className="panel-heading ota-heading"><div><p className="eyebrow">ARTIFACT IMMUTABLE</p><h2>Daftar release</h2></div></div>
      {releases.length === 0 ? <EmptyState title="Belum ada firmware" description="Upload application binary bertanda tangan dari build PlatformIO yang tervalidasi." /> : <div className="table-wrap"><table className="ota-table"><thead><tr><th>Versi</th><th>Status</th><th>Ukuran</th><th>SHA-256 / key</th><th>Dibuat</th><th>Aksi</th></tr></thead><tbody>{releases.map((release) => <tr key={release.id}><td><strong>{release.version}</strong><small>{release.release_notes || "Tanpa catatan"}</small></td><td><span className={`status-badge ${release.status === "ready" ? "online" : release.status === "retired" ? "never_seen" : "stale"}`}>{release.status}</span></td><td>{formatBytes(release.size_bytes)}</td><td><code title={release.sha256}>{release.sha256.slice(0, 12)}…</code><small>key {release.signing_key_id || "tidak ada"}</small></td><td>{formatDateTime(release.created_at)}</td><td>{release.status === "draft" ? <button className="button secondary small" disabled={busy === `publish-${release.id}`} onClick={() => void publish(release)}>Publish</button> : "—"}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="panel">
      <div className="panel-heading"><div><p className="eyebrow">CANARY FIRST</p><h2>Buat rollout</h2></div><Play size={24} aria-hidden="true" /></div>
      <form className="ota-rollout" onSubmit={rollout}>
        <label>Release siap<select value={selectedRelease} onChange={(event) => setSelectedRelease(event.target.value)} required><option value="">Pilih release</option>{readyReleases.map((release) => <option key={release.id} value={release.id}>{release.version}</option>)}</select></label>
        <fieldset><legend>Perangkat target ({selectedDevices.length} dipilih)</legend><div className="ota-device-list">{fleet?.items.map((device) => <label key={device.id}><input type="checkbox" checked={selectedDevices.includes(device.id)} onChange={(event) => setSelectedDevices((current) => event.target.checked ? [...current, device.id] : current.filter((id) => id !== device.id))} /><span><strong>{device.name || device.uid}</strong><small>{device.uid} · firmware {device.current_firmware_version || "belum diketahui"} · {device.connectivity_status}</small></span></label>)}</div></fieldset>
        <button className="button primary" disabled={busy === "rollout" || !selectedRelease || selectedDevices.length === 0}>{busy === "rollout" ? "Mengirim…" : `Kirim ke ${selectedDevices.length || 0} perangkat`}</button>
      </form>
    </section>

    <section className="panel flush">
      <div className="panel-heading ota-heading"><div><p className="eyebrow">STATUS PER PERANGKAT</p><h2>Riwayat assignment</h2></div><button className="button ghost small" onClick={() => void load()}><ArrowClockwise size={17} aria-hidden="true" />Segarkan</button></div>
      {assignments.length === 0 ? <EmptyState title="Belum ada rollout" description="Assignment akan tampil setelah canary pertama dikirim." /> : <div className="table-wrap"><table className="ota-table"><thead><tr><th>Device</th><th>Versi</th><th>Status</th><th>Progress</th><th>Waktu</th><th>Aksi</th></tr></thead><tbody>{assignments.map((assignment) => <tr key={assignment.id}><td><strong>{assignment.device_uid}</strong><small>Dari {assignment.from_version || "belum diketahui"}</small></td><td>{assignment.version}</td><td><span className={`status-badge ${stateClass(assignment.state)}`}>{stateLabel(assignment.state)}</span>{assignment.last_error_code && <small className="ota-error">{assignment.last_error_code}</small>}</td><td>{assignment.progress == null ? "—" : <div className="ota-progress"><progress value={assignment.progress} max={100} /><span>{assignment.progress}%</span></div>}</td><td>{formatDateTime(assignment.requested_at)}</td><td><div className="device-actions">{assignment.state !== "success" && <button className="button secondary small" disabled={busy === `retry-${assignment.id}`} onClick={() => void action(assignment, "retry")}><ArrowClockwise size={15} aria-hidden="true" />Retry</button>}{activeStates.has(assignment.state) && <button className="button danger small" disabled={busy === `cancel-${assignment.id}`} onClick={() => void action(assignment, "cancel")}><XCircle size={15} aria-hidden="true" />Batal</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
