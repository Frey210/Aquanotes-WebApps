import { Envelope, IdentificationCard } from "../icons";
import { useAuth } from "../auth/AuthProvider";
import { PageHeader } from "./UserDashboard";

export function ProfilePage() { const { user } = useAuth(); return <div className="page"><PageHeader eyebrow="AKUN" title="Profil" description="Identitas yang digunakan pada sesi Aquanotes ini." /><section className="profile-panel"><div className="profile-mark">{user?.name.slice(0, 1).toUpperCase()}</div><div><h2>{user?.name}</h2><p className="profile-line"><Envelope size={18} />{user?.email}</p><p className="profile-line"><IdentificationCard size={18} />Akses: {user?.role === "admin" ? "Administrator" : "Pengguna"}</p></div></section></div>; }
