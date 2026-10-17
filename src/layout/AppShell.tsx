import { useEffect, useRef, useState } from "react";
import { Bell, Broadcast, ChartLine, Cpu, Gauge, House, List, Pulse, SignOut, UserCircle, UsersThree, Waves, X } from "../icons";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const userLinks = [
  { to: "/app", label: "Ringkasan", icon: House, end: true },
  { to: "/app/monitoring", label: "Monitoring", icon: ChartLine },
  { to: "/app/farms", label: "Tambak & Kolam", icon: Waves },
  { to: "/app/devices", label: "Device", icon: Cpu },
  { to: "/app/alerts", label: "Alarm", icon: Bell },
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
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 860px)").matches);
  const sidebarRef = useRef<HTMLElement>(null);
  const location = useLocation();
  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    setOpen(false);
    document.getElementById("main-content")?.focus();
  }, [location.pathname]);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const path = window.location.pathname;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const elements = [...(sidebarRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") || [])];
      const target = event.shiftKey && document.activeElement === elements[0] ? elements.at(-1) : !event.shiftKey && document.activeElement === elements.at(-1) ? elements[0] : null;
      if (target) { event.preventDefault(); target.focus(); }
    };
    window.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener("keydown", keyboard);
      document.body.style.overflow = previousOverflow;
      if (window.location.pathname === path && previous?.isConnected) previous.focus();
    };
  }, [open, mobile]);
  const links = user?.role === "admin" ? adminLinks : userLinks;
  const currentPage = links.find((link) => link.to === location.pathname)?.label || "Aquanotes";

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
    <aside ref={sidebarRef} className={`sidebar ${open ? "open" : ""}`} inert={mobile && !open} role={mobile && open ? "dialog" : undefined} aria-modal={mobile && open ? true : undefined} aria-label="Navigasi utama">
      <div className="brand-row"><span className="sidebar-brand"><img src="/aquanotes-transparant.png" alt="Aquanotes" /></span><button className="icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Tutup navigasi"><X size={22} /></button></div>
      <div className="role-label">{user?.role === "admin" ? "Administrator" : "Portal pengguna"}</div>
      <nav>{links.map(({ icon: Icon, ...link }) => <NavLink key={link.to} to={link.to} end={link.end}><Icon size={20} /><span>{link.label}</span></NavLink>)}</nav>
      <div className="sidebar-endorsement"><img src="/logo-Aerasea-putih%20transparant.png" alt="Aerasea" /><span>Teknologi untuk budidaya</span></div>
      <div className="sidebar-user"><div className="avatar" aria-hidden="true">{user?.name.slice(0, 1).toUpperCase()}</div><div><strong>{user?.name}</strong><span>{user?.email}</span></div></div>
      <button className="sidebar-logout mobile-only" onClick={() => void logout()}><SignOut size={18} aria-hidden="true" />Keluar</button>
    </aside>
    {open && <button className="sidebar-scrim" aria-label="Tutup navigasi" onClick={() => setOpen(false)} />}
    <div className="app-stage">
      <header className="topbar"><NavLink className="mobile-brand mobile-only" to={user?.role === "admin" ? "/admin" : "/app"}><img src="/aquanotes-logo.PNG" alt="Aquanotes" /></NavLink><div className="connection-note"><span>Aquanotes</span><span aria-hidden="true">/</span><strong>{currentPage}</strong></div><NavLink className="mobile-profile mobile-only" aria-label="Profil saya" to={user?.role === "admin" ? "/admin/profile" : "/app/profile"}>{user?.name.slice(0, 1).toUpperCase()}</NavLink><button className="button ghost" onClick={() => void logout()}><SignOut size={18} />Keluar</button></header>
      <main id="main-content" tabIndex={-1}><div className="route-view" key={location.pathname}><Outlet /></div></main>
    </div>
    <nav className="mobile-dock" aria-label="Navigasi cepat">
      {[links[0]!, links[1]!, links.find((link) => link.to.endsWith("/devices"))!].map(({ icon: Icon, ...link }, index) => <NavLink key={link.to} to={link.to} end={link.end}><Icon size={23} weight="duotone" aria-hidden="true" /><span>{["Ringkasan", "Monitoring", "Perangkat"][index]}</span></NavLink>)}
      <button onClick={() => setOpen((value) => !value)} aria-label="Buka navigasi" aria-expanded={open}><List size={23} aria-hidden="true" /><span>Menu</span></button>
    </nav>
  </div>;
}
