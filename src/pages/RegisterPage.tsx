import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ApiError, apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { CheckCircle, Envelope, Eye, EyeSlash, LockKey, Waves } from "../icons";

export function RegisterPage() {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");
  const [error, setError] = useState("");
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirm_password"))) return setError("Konfirmasi password belum sama.");
    setSubmitting(true);
    setError("");
    try {
      const email = String(data.get("email"));
      await apiFetch("/users/register-web", { method: "POST", body: JSON.stringify({ name: data.get("name"), email, password }) });
      setCreatedEmail(email);
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 400 ? "Email sudah terdaftar." : cause instanceof Error ? cause.message : "Akun belum dapat dibuat.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="login-page">
    <section className="login-brand" aria-label="Tentang Aquanotes"><div className="brand-orbit"><Waves size={34} /></div><p className="eyebrow">MULAI DENGAN AQUANOTES</p><h1>Satu akun untuk tambak, perangkat, dan kualitas air.</h1><p>Buat akun pengguna untuk mulai menghubungkan device dan menyusun area budidaya Anda.</p><div className="telemetry-preview compact-preview"><span><Waves size={15} aria-hidden="true" />Data dalam satu konteks</span><strong>Tambak → Kolam → Device</strong><small>Struktur operasional yang jelas sejak hari pertama</small></div></section>
    <section className="login-form-wrap">
      {createdEmail ? <div className="login-form auth-result" role="status">
        <div className="auth-product-logo"><img src="/aquanotes-logo.PNG" alt="Aquanotes" /><span>Teknologi Aerasea</span></div>
        <div className="auth-result-icon"><Envelope size={30} /></div>
        <div><p className="eyebrow">VERIFIKASI EMAIL</p><h2>Periksa kotak masuk Anda</h2><p className="muted">Kami mengirim tautan verifikasi ke <strong>{createdEmail}</strong>. Tautan berlaku selama 30 menit.</p></div>
        <Link className="button primary" to="/login"><CheckCircle size={18} />Kembali ke halaman masuk</Link>
        <p className="auth-hint">Belum menerima email? Periksa folder spam atau <Link to={`/forgot-password?verify=${encodeURIComponent(createdEmail)}`}>kirim ulang tautan</Link>.</p>
      </div> : <form className="login-form register-form" onSubmit={submit}>
        <div className="auth-product-logo"><img src="/aquanotes-logo.PNG" alt="Aquanotes" /><span>Teknologi Aerasea</span></div>
        <div><p className="eyebrow">AKUN BARU</p><h2>Buat akun Aquanotes</h2><p className="muted">Gunakan email aktif untuk menerima tautan verifikasi.</p></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <label htmlFor="register-name">Nama lengkap</label><input id="register-name" name="name" autoComplete="name" required maxLength={100} />
        <label htmlFor="register-email">Email</label><input id="register-email" name="email" type="email" autoComplete="email" required placeholder="nama@perusahaan.com" />
        <label htmlFor="register-password">Password</label><div className="password-field"><input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword}>{showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}</button></div>
        <label htmlFor="register-confirm">Konfirmasi password</label><input id="register-confirm" name="confirm_password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} />
        <button className="button primary login-submit" disabled={submitting}>{submitting ? "Membuat akun…" : <><LockKey size={18} />Buat akun</>}</button>
        <p className="auth-switch">Sudah punya akun? <Link to="/login">Masuk</Link></p>
      </form>}
    </section>
  </main>;
}
