import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarBlank,
  LinkBreak,
  MagnifyingGlass,
  Plus,
  Power,
  Warning,
  Wrench,
} from "../icons";
import { useSearchParams } from "react-router-dom";
import { apiFetch, ApiError } from "../api/client";
import { EmptyState, ErrorState, PageLoader } from "../components/States";
import { ModeBadge, StatusBadge } from "../components/StatusBadge";
import type {
  FleetDevice,
  FleetDevicePage,
  MaintenanceRequest,
  MqttCredential,
} from "../types";
import { formatDateTime, formatRelative } from "../utils/format";
import { PageHeader } from "./UserDashboard";

type Confirmation = {
  kind: "schedule" | "deactivate" | "unassign";
  title: string;
  description: string;
  detail: string;
  confirmLabel: string;
  action: () => Promise<void>;
};

function ConfirmDialog({
  confirmation,
  busy,
  close,
  confirm,
}: {
  confirmation: Confirmation;
  busy: boolean;
  close: () => void;
  confirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const Icon =
    confirmation.kind === "schedule"
      ? CalendarBlank
      : confirmation.kind === "unassign"
        ? LinkBreak
        : Warning;
  return (
    <dialog
      ref={ref}
      className={`confirm-dialog ${confirmation.kind}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) close();
      }}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
    >
      <div className="confirm-icon">
        <Icon size={24} aria-hidden="true" />
      </div>
      <div className="confirm-copy">
        <p className="eyebrow">KONFIRMASI</p>
        <h2 id="confirm-title">{confirmation.title}</h2>
        <p id="confirm-description">{confirmation.description}</p>
        <strong>{confirmation.detail}</strong>
      </div>
      <div className="confirm-actions">
        <button
          className="button secondary"
          onClick={close}
          disabled={busy}
          autoFocus
        >
          Batal
        </button>
        <button
          className={`button ${confirmation.kind === "schedule" ? "primary" : "danger"}`}
          onClick={confirm}
          disabled={busy}
        >
          {busy ? "Memproses…" : confirmation.confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

function CredentialDialog({
  credential,
  close,
}: {
  credential: MqttCredential;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  function download() {
    const url = URL.createObjectURL(
      new Blob([credential.secrets_h], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "secrets.h";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      aria-labelledby="mqtt-title"
    >
      <div className="confirm-copy">
        <p className="eyebrow">CREDENTIAL MQTT</p>
        <h2 id="mqtt-title">{credential.uid} siap diprogram</h2>
        <p>
          Password hanya ditampilkan kali ini. Unduh <code>secrets.h</code> dan
          simpan dengan aman.
        </p>
        <label>
          Password MQTT
          <input
            readOnly
            value={credential.mqtt_password}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      </div>
      <div className="confirm-actions">
        <button
          className="button secondary"
          onClick={() =>
            void navigator.clipboard.writeText(credential.mqtt_password)
          }
        >
          Salin password
        </button>
        <button className="button primary" onClick={download}>
          Unduh secrets.h
        </button>
        <button className="button ghost" onClick={close}>
          Selesai
        </button>
      </div>
    </dialog>
  );
}

export function AdminDevicesPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<FleetDevicePage | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [credential, setCredential] = useState<MqttCredential | null>(null);
  const query = params.toString();

  const load = useCallback(() => {
    setError("");
    Promise.all([
      apiFetch<FleetDevicePage>(`/admin/fleet/devices?${query}`),
      apiFetch<MaintenanceRequest[]>("/admin/maintenance-requests"),
    ])
      .then(([fleet, maintenance]) => {
        setData(fleet);
        setRequests(maintenance);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [query]);
  useEffect(load, [load]);

  function filter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of [
      "search",
      "connectivity",
      "assignment",
      "operational_mode",
    ]) {
      const value = String(values.get(key) || "");
      if (value) next.set(key, value);
    }
    setParams(next);
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const form = event.currentTarget;
    const values = new FormData(form);
    const uid = String(values.get("uid") || "").trim();
    const power_profile = String(values.get("power_profile") || "portable");
    try {
      const result = await apiFetch<MqttCredential>("/admin/fleet/devices", {
        method: "POST",
        body: JSON.stringify({ uid, power_profile }),
      });
      form.reset();
      setCredential(result);
      setNotice(`Device ID ${uid} berhasil ditambahkan dan siap untuk MQTT.`);
      load();
    } catch (cause) {
      setNotice(
        cause instanceof ApiError
          ? cause.message
          : "Device belum dapat ditambahkan.",
      );
    }
  }

  async function setPowerProfile(
    device: FleetDevice,
    power_profile: FleetDevice["power_profile"],
  ) {
    await apiFetch(`/admin/fleet/devices/${device.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        power_profile,
        reason: "Profil daya diperbarui oleh admin",
      }),
    });
    setNotice(`Profil daya ${device.uid} berhasil diperbarui.`);
    load();
  }

  async function provisionMqtt(device: FleetDevice) {
    try {
      const result = await apiFetch<MqttCredential>(
        `/admin/fleet/devices/${device.id}/mqtt-credential`,
        { method: "POST" },
      );
      setCredential(result);
      setNotice(`Credential MQTT ${device.uid} berhasil dibuat.`);
      load();
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Credential MQTT belum dapat dibuat.",
      );
    }
  }

  async function setMode(device: FleetDevice) {
    const deactivate = device.operational_mode !== "inactive";
    const update = async () => {
      await apiFetch(`/admin/fleet/devices/${device.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          operational_mode: deactivate ? "inactive" : "active",
          reason: deactivate
            ? "Masa sewa dihentikan oleh admin"
            : "Device diaktifkan kembali oleh admin",
        }),
      });
      setNotice(
        deactivate
          ? "Device berhasil dinonaktifkan."
          : "Device berhasil diaktifkan kembali.",
      );
      load();
    };
    if (!deactivate) return update();
    setConfirmation({
      kind: "deactivate",
      title: "Nonaktifkan perangkat sekarang?",
      description:
        "Perangkat tidak dapat mengirim data sensor sampai diaktifkan kembali.",
      detail: device.name || device.uid,
      confirmLabel: "Nonaktifkan",
      action: update,
    });
  }

  async function schedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const deviceId = Number(values.get("device_id"));
    const localDate = String(values.get("deactivation_at") || "");
    const deviceName =
      data?.items.find((device) => device.id === deviceId)?.name ||
      data?.items.find((device) => device.id === deviceId)?.uid ||
      "Perangkat";
    setConfirmation({
      kind: "schedule",
      title: "Jadwalkan penonaktifan?",
      description: `${deviceName} akan berhenti menerima data sensor pada waktu berikut.`,
      detail: new Date(localDate).toLocaleString("id-ID", {
        dateStyle: "full",
        timeStyle: "short",
      }),
      confirmLabel: "Simpan jadwal",
      action: async () => {
        await apiFetch(`/admin/fleet/devices/${deviceId}`, {
          method: "PATCH",
          body: JSON.stringify({
            deactivation_scheduled_at: new Date(localDate).toISOString(),
            reason: "Akhir masa sewa terjadwal",
          }),
        });
        form.reset();
        setNotice("Jadwal penonaktifan berhasil disimpan.");
        load();
      },
    });
  }

  function unassign(device: FleetDevice) {
    setConfirmation({
      kind: "unassign",
      title: "Lepas penyandingan device?",
      description:
        "Device akan dilepas dari akun dan kolam pengguna. Riwayat sensor tetap tersimpan.",
      detail: `${device.name || device.uid}${device.user_name ? ` · ${device.user_name}` : ""}`,
      confirmLabel: "Lepas penyandingan",
      action: async () => {
        await apiFetch(`/admin/fleet/devices/${device.id}/unassign`, {
          method: "POST",
        });
        setNotice("Penyandingan device berhasil dilepas.");
        load();
      },
    });
  }

  async function confirmAction() {
    if (!confirmation) return;
    setConfirming(true);
    try {
      await confirmation.action();
      setConfirmation(null);
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Tindakan belum dapat diproses.",
      );
      setConfirmation(null);
    } finally {
      setConfirming(false);
    }
  }

  async function cancelSchedule(device: FleetDevice) {
    await apiFetch(`/admin/fleet/devices/${device.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        deactivation_scheduled_at: null,
        reason: "Jadwal penonaktifan dibatalkan",
      }),
    });
    setNotice("Jadwal penonaktifan dibatalkan.");
    load();
  }

  async function updateRequest(
    event: React.FormEvent<HTMLFormElement>,
    item: MaintenanceRequest,
  ) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const status = item.status === "requested" ? "in_progress" : "completed";
    await apiFetch(`/admin/maintenance-requests/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        technician_name: values.get("technician_name") || item.technician_name,
        admin_note: values.get("admin_note") || null,
      }),
    });
    setNotice(
      status === "in_progress"
        ? "Permintaan diteruskan ke teknisi."
        : "Pekerjaan teknisi ditandai selesai.",
    );
    load();
  }

  if (!data && !error) return <PageLoader />;
  if (!data) return <ErrorState message={error} retry={load} />;

  return (
    <div className="page">
      {confirmation && (
        <ConfirmDialog
          confirmation={confirmation}
          busy={confirming}
          close={() => setConfirmation(null)}
          confirm={() => void confirmAction()}
        />
      )}
      {credential && (
        <CredentialDialog
          credential={credential}
          close={() => setCredential(null)}
        />
      )}
      <PageHeader
        eyebrow="ADMIN"
        title="Daftar device"
        description={`${data.total} device terdaftar. Atur masa aktif sewa dan tindak lanjuti permintaan perawatan.`}
      />
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      <section className="panel registry-create">
        <div>
          <p className="eyebrow">PENDAFTARAN</p>
          <h2>Tambah Device ID</h2>
          <p>Device baru belum terhubung ke akun pengguna.</p>
        </div>
        <form onSubmit={create}>
          <label>
            UID device
            <input
              name="uid"
              required
              minLength={3}
              placeholder="Masukkan UID unik"
            />
          </label>
          <label>
            Sumber daya
            <select name="power_profile" defaultValue="portable">
              <option value="portable">Portable / baterai</option>
              <option value="panel">Panel / DC 24/7</option>
            </select>
          </label>
          <button className="button primary">
            <Plus size={18} />
            Tambah device
          </button>
        </form>
      </section>

      <section className="panel operation-panel">
        <div>
          <p className="eyebrow">MASA SEWA</p>
          <h2>Jadwalkan penonaktifan</h2>
          <p>
            Setelah waktu tercapai, data sensor dari device akan ditolak sampai
            admin mengaktifkannya kembali.
          </p>
        </div>
        <form onSubmit={schedule}>
          <label>
            Device
            <select name="device_id" required defaultValue="">
              <option value="" disabled>
                Pilih device
              </option>
              {data.items
                .filter((device) => device.operational_mode !== "inactive")
                .map((device) => (
                  <option value={device.id} key={device.id}>
                    {device.name || device.uid}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Waktu penonaktifan
            <input
              name="deactivation_at"
              type="datetime-local"
              required
              min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            />
          </label>
          <button className="button secondary">
            <CalendarBlank size={18} />
            Simpan jadwal
          </button>
        </form>
      </section>

      <section className="panel maintenance-queue">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">PERMINTAAN PENGGUNA</p>
            <h2>Perawatan lapangan</h2>
          </div>
          <span className="updated-at">
            {requests.length} perlu ditindaklanjuti
          </span>
        </div>
        {requests.length === 0 ? (
          <div className="inline-success">
            Tidak ada permintaan perawatan aktif.
          </div>
        ) : (
          <div className="maintenance-list">
            {requests.map((item) => (
              <article key={item.id}>
                <div className="request-icon">
                  <Wrench size={21} />
                </div>
                <div>
                  <strong>{item.device_name}</strong>
                  <p>
                    {item.user_name} · diminta {formatRelative(item.created_at)}
                  </p>
                  <span
                    className={`status-badge ${item.status === "requested" ? "stale" : "maintenance"}`}
                  >
                    {item.status === "requested"
                      ? "Menunggu teknisi"
                      : "Sedang ditangani"}
                  </span>
                </div>
                <form onSubmit={(event) => void updateRequest(event, item)}>
                  {item.status === "requested" ? (
                    <label>
                      Nama teknisi
                      <input
                        name="technician_name"
                        required
                        placeholder="Teknisi lapangan"
                      />
                    </label>
                  ) : (
                    <span className="assigned-tech">
                      Teknisi:{" "}
                      <strong>{item.technician_name || "Belum dicatat"}</strong>
                    </span>
                  )}
                  <label>
                    Catatan
                    <input name="admin_note" placeholder="Opsional" />
                  </label>
                  <button className="button secondary small">
                    {item.status === "requested"
                      ? "Teruskan ke teknisi"
                      : "Tandai selesai"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <form className="filterbar admin-filterbar" onSubmit={filter}>
        <label className="search-field">
          <span className="sr-only">Cari device</span>
          <MagnifyingGlass size={19} />
          <input
            name="search"
            defaultValue={params.get("search") || ""}
            placeholder="Cari UID, device, atau pemilik"
          />
        </label>
        <label>
          <span className="sr-only">Filter konektivitas</span>
          <select
            name="connectivity"
            defaultValue={params.get("connectivity") || ""}
          >
            <option value="">Semua konektivitas</option>
            <option value="online">Online</option>
            <option value="stale">Data terlambat</option>
            <option value="offline">Offline</option>
            <option value="never_seen">Belum aktif</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filter mode</span>
          <select
            name="operational_mode"
            defaultValue={params.get("operational_mode") || ""}
          >
            <option value="">Semua mode</option>
            <option value="active">Aktif</option>
            <option value="maintenance">Perawatan</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filter kepemilikan</span>
          <select
            name="assignment"
            defaultValue={params.get("assignment") || ""}
          >
            <option value="">Semua kepemilikan</option>
            <option value="assigned">Sudah dimiliki</option>
            <option value="unassigned">Belum dimiliki</option>
          </select>
        </label>
        <button className="button secondary">Terapkan</button>
      </form>

      {data.items.length === 0 ? (
        <EmptyState
          title="Tidak ada device"
          description="Ubah filter atau tambahkan Device ID baru."
        />
      ) : (
        <section className="panel flush">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Konektivitas</th>
                  <th>MQTT</th>
                  <th>Mode</th>
                  <th>Pemilik / lokasi</th>
                  <th>Jadwal nonaktif</th>
                  <th>Terakhir aktif</th>
                  <th>
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((device) => (
                  <tr key={device.id}>
                    <td>
                      <strong>{device.name || "Tanpa nama"}</strong>
                      <code>{device.uid}</code>
                      <select
                        aria-label={`Profil daya ${device.uid}`}
                        value={device.power_profile}
                        onChange={(event) =>
                          void setPowerProfile(
                            device,
                            event.target.value as FleetDevice["power_profile"],
                          )
                        }
                      >
                        <option value="portable">Portable / baterai</option>
                        <option value="panel">Panel / DC</option>
                      </select>
                    </td>
                    <td>
                      <StatusBadge status={device.connectivity_status} />
                    </td>
                    <td>
                      <span
                        className={`status-badge ${device.mqtt_credential_status === "active" ? "online" : device.mqtt_credential_status === "error" ? "offline" : "stale"}`}
                      >
                        {device.mqtt_credential_status === "active"
                          ? "Aktif"
                          : device.mqtt_credential_status === "ready"
                            ? "Siap"
                            : device.mqtt_credential_status === "error"
                              ? "Gagal"
                              : "Belum dibuat"}
                      </span>
                    </td>
                    <td>
                      <ModeBadge mode={device.operational_mode} />
                    </td>
                    <td>
                      {device.user_name || "Belum dimiliki"}
                      <small>
                        {[device.tambak_name, device.kolam_name]
                          .filter(Boolean)
                          .join(" / ") || "Belum ditempatkan"}
                      </small>
                    </td>
                    <td>
                      {device.deactivation_scheduled_at ? (
                        <>
                          {formatDateTime(device.deactivation_scheduled_at)}
                          <button
                            className="text-button"
                            onClick={() => void cancelSchedule(device)}
                          >
                            Batalkan
                          </button>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{formatRelative(device.last_seen)}</td>
                    <td>
                      <div className="device-actions">
                        {["unprovisioned", "error"].includes(
                          device.mqtt_credential_status,
                        ) && (
                          <button
                            className="button secondary small"
                            onClick={() => void provisionMqtt(device)}
                          >
                            Siapkan MQTT
                          </button>
                        )}
                        <button
                          className={`button small ${device.operational_mode === "inactive" ? "secondary" : "danger"}`}
                          onClick={() => void setMode(device)}
                        >
                          <Power size={17} />
                          {device.operational_mode === "inactive"
                            ? "Aktifkan"
                            : "Nonaktifkan"}
                        </button>
                        {device.user_id != null && (
                          <button
                            className="button secondary small"
                            onClick={() => unassign(device)}
                          >
                            <LinkBreak size={17} />
                            Lepas user
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>
              Halaman {data.page} · {data.total} device
            </span>
            <div>
              <button
                className="button ghost small"
                disabled={data.page <= 1}
                onClick={() => {
                  params.set("page", String(data.page - 1));
                  setParams(params);
                }}
              >
                Sebelumnya
              </button>
              <button
                className="button ghost small"
                disabled={data.page * data.page_size >= data.total}
                onClick={() => {
                  params.set("page", String(data.page + 1));
                  setParams(params);
                }}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
