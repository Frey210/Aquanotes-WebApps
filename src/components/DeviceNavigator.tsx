import { useMemo, useState } from "react";
import { MagnifyingGlass } from "../icons";
import { StatusBadge } from "./StatusBadge";
import type { Connectivity } from "../types";

export interface NavigatorDevice {
  id: number;
  name: string;
  uid: string;
  location: string;
  status: Connectivity;
}

export function DeviceNavigator({ devices, selectedId, onSelect }: {
  devices: NavigatorDevice[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => devices.filter((device) => {
    const matches = `${device.name} ${device.uid} ${device.location}`.toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id"));
    return matches && (filter === "all" || (filter === "online" ? device.status === "online" : device.status !== "online"));
  }), [devices, query, filter]);

  return <aside className="device-navigator" aria-label="Pemilih perangkat">
    <label className="mobile-device-select">Perangkat dipantau
      <select value={selectedId ?? ""} onChange={(event) => onSelect(Number(event.target.value))}>
        {devices.map((device) => <option key={device.id} value={device.id}>{device.name}{device.location && device.location !== device.name ? ` · ${device.location}` : ""}</option>)}
      </select>
    </label>
    <div className="navigator-desktop">
      <div className="navigator-heading"><h2>Perangkat</h2><span>{devices.length}</span></div>
      <label className="search-field"><span className="sr-only">Cari perangkat atau lokasi</span><MagnifyingGlass size={18} aria-hidden="true" /><input type="search" placeholder="Cari nama, UID, lokasi" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <label className="navigator-filter"><span className="sr-only">Filter konektivitas perangkat</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option><option value="online">Online</option><option value="attention">Perlu perhatian</option></select></label>
      <div className="navigator-results" aria-label="Hasil pencarian perangkat">
        {filtered.map((device) => <button key={device.id} className={`navigator-device ${selectedId === device.id ? "selected" : ""}`} aria-pressed={selectedId === device.id} onClick={() => onSelect(device.id)}>
          <span className="navigator-device-title"><strong>{device.name}</strong><StatusBadge status={device.status} /></span>
          <span className="navigator-location">{device.location || "Belum ditempatkan"}</span>
          <span className="navigator-uid">{device.uid}</span>
        </button>)}
        {!filtered.length && <p className="navigator-empty">Perangkat tidak ditemukan. Coba nama, UID, atau status lain.</p>}
      </div>
      <p className="navigator-footnote">Pilih perangkat untuk melihat data dan grafiknya.</p>
    </div>
  </aside>;
}
