import { useEffect, useState } from "react";
import { Bell, Broadcast, ChartLine, Cpu, Gauge, House, List, Pulse, SignOut, UserCircle, UsersThree, Waves, X } from "../icons";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const userLinks = [
  { to: "/app", label: "Ringkasan", icon: House, end: true },
  { to: "/app/monitoring", label: "Monitoring", icon: ChartLine },
  { to: "/app/farms", label: "Tambak & Kolam", icon: Waves },
  { to: "/app/devices", label: "Device", icon: Cpu },
  { to: "/app/alerts", label: "Notifikasi", icon: Bell },
  { to: "/app/profile", label: "Profil", icon: UserCircle },
];
const adminLinks = [
  { to: "/admin", label: "Ringkasan perangkat", icon: Gauge, end: true },
  { to: "/admin/monitoring", label: "Monitoring sensor", icon: Pulse },
  { to: "/admin/devices", label: "Daftar device", icon: Cpu },
  { to: "/admin/firmware", label: "Firmware & OTA", icon: Broadcast },
  { to: "/admin/users", label: "Daftar user", icon: UsersThree },
  { to: "/admin/profile", label: "Profil", icon: UserCircle },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    document.getElementById("main-content")?.focus();
  }, [location.pathname]);
  const links = user?.role === "admin" ? adminLinks : userLinks;

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
    <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Navigasi utama">
      <div className="brand-row"><span className="sidebar-brand"><img src="/aquanotes-transparant.png" alt="Aquanotes" /></span><button className="icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Tutup navigasi"><X size={22} /></button></div>
      <div className="role-label">{user?.role === "admin" ? "Administrator" : "Portal pengguna"}</div>
      <nav>{links.map(({ icon: Icon, ...link }) => <NavLink key={link.to} to={link.to} end={link.end}><Icon size={20} /><span>{link.label}</span></NavLink>)}</nav>
      <div className="sidebar-user"><div className="avatar" aria-hidden="true">{user?.name.slice(0, 1).toUpperCase()}</div><div><strong>{user?.name}</strong><span>{user?.email}</span></div></div>
    </aside>
    {open && <button className="sidebar-scrim" aria-label="Tutup navigasi" onClick={() => setOpen(false)} />}
    <div className="app-stage">
      <header className="topbar"><button className="icon-button mobile-only" onClick={() => setOpen(true)} aria-label="Buka navigasi"><List size={23} /></button><div className="connection-note"><Waves size={17} aria-hidden="true" />Platform Aquanotes</div><button className="button ghost" onClick={() => void logout()}><SignOut size={18} />Keluar</button></header>
      <main id="main-content" tabIndex={-1}><Outlet /></main>
    </div>
  </div>;
}
