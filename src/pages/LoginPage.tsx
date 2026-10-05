import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { Eye, EyeSlash, LockKey } from "../icons";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const session = await login(String(data.get("email")), String(data.get("password")));
      const requested = (location.state as { from?: string } | null)?.from;
      navigate(requested || (session.role === "admin" ? "/admin" : "/app"), { replace: true });
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 401
          ? "Email atau password tidak sesuai."
          : cause instanceof ApiError && cause.status === 403
            ? "Email belum diverifikasi. Periksa kotak masuk atau kirim ulang tautan verifikasi."
            : cause instanceof Error ? cause.message : "Login belum berhasil.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="login-page">
    <section className="login-brand" aria-label="Tentang Aquanotes">
      <div className="auth-parent-brand"><img src="/logo-Aerasea-putih transparant.png" alt="Aerasea" /></div>
      <p className="eyebrow">AQUACULTURE INTELLIGENCE</p>
      <h1>Kondisi air yang terbaca. Keputusan yang lebih tenang.</h1>
      <p>Pantau perangkat, kualitas air, dan anomali operasional dalam satu ruang kerja.</p>
      <div className="telemetry-preview"><div><span>KUALITAS AIR</span><strong><b>6</b> parameter utama</strong></div><div className="parameter-list"><span>Suhu</span><span>pH</span><span>DO</span><span>TDS</span><span>Amonia</span><span>Salinitas</span></div></div>
    </section>
    <section className="login-form-wrap">
      <form className="login-form" onSubmit={submit}>
        <div className="auth-product-logo"><img src="/aquanotes-logo.PNG" alt="Aquanotes" /><span>Teknologi Aerasea</span></div>
        <div><p className="eyebrow">SELAMAT DATANG</p><h2>Masuk ke dashboard</h2><p className="muted">Pantau tambak dan kualitas air Anda dari satu tempat.</p></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <label htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required placeholder="nama@perusahaan.com" />
        <div className="field-heading"><label htmlFor="login-password">Password</label><Link to="/forgot-password">Lupa password?</Link></div>
        <div className="password-field">
          <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword}>{showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}</button>
        </div>
        <button className="button primary login-submit" disabled={submitting}>{submitting ? "Memeriksa akun…" : <><LockKey size={18} />Masuk</>}</button>
        <p className="auth-switch">Belum punya akun? <Link to="/register">Buat akun</Link></p>
        <p className="login-footer">Aquanotes <span>by Aerasea</span></p>
      </form>
    </section>
  </main>;
}
