import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, apiFetch } from "../api/client";
import { CheckCircle, Envelope, Eye, EyeSlash, LockKey } from "../icons";

function AuthFrame({ children }: { children: React.ReactNode }) {
  return <main className="login-page">
    <section className="login-brand" aria-label="Tentang Aquanotes">
      <div className="auth-parent-brand"><img src="/logo-Aerasea-putih transparant.png" alt="Aerasea" /></div>
      <p className="eyebrow">AKUN AQUANOTES</p>
      <h1>Akses aman untuk data tambak Anda.</h1>
      <p>Verifikasi dan pemulihan akun membantu menjaga data operasional tetap berada di tangan yang tepat.</p>
    </section>
    <section className="login-form-wrap">{children}</section>
  </main>;
}

function ProductLogo() {
  return <div className="auth-product-logo"><img src="/aquanotes-logo.PNG" alt="Aquanotes" /><span>Teknologi Aerasea</span></div>;
}

export function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const verificationMode = params.has("verify");
  const [email, setEmail] = useState(params.get("verify") || "");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiFetch(verificationMode ? "/users/email-verification/request" : "/users/password-reset/request", { method: "POST", body: JSON.stringify({ email }) });
      setSent(true);
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 429 ? cause.message : "Permintaan belum dapat diproses. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthFrame>{sent ? <div className="login-form auth-result" role="status">
    <ProductLogo /><div className="auth-result-icon"><Envelope size={30} /></div>
    <div><p className="eyebrow">EMAIL DIKIRIM</p><h2>Periksa kotak masuk Anda</h2><p className="muted">Jika email sesuai dengan akun Aquanotes, tautan {verificationMode ? "verifikasi" : "reset password"} akan segera diterima.</p></div>
    <Link className="button primary" to="/login">Kembali ke halaman masuk</Link>
  </div> : <form className="login-form" onSubmit={submit}>
    <ProductLogo />
    <div><p className="eyebrow">{verificationMode ? "VERIFIKASI EMAIL" : "PEMULIHAN AKUN"}</p><h2>{verificationMode ? "Kirim ulang tautan" : "Lupa password?"}</h2><p className="muted">Masukkan email akun Anda. Kami akan mengirim tautan yang berlaku selama 30 menit.</p></div>
    {error && <div className="form-error" role="alert">{error}</div>}
    <label htmlFor="recovery-email">Email</label><input id="recovery-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@perusahaan.com" />
    <button className="button primary login-submit" disabled={submitting}>{submitting ? "Mengirim…" : <><Envelope size={18} />Kirim tautan</>}</button>
    <p className="auth-switch"><Link to="/login">Kembali ke halaman masuk</Link></p>
  </form>}</AuthFrame>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(token ? "" : "Tautan reset tidak lengkap.");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirm_password"))) return setError("Konfirmasi password belum sama.");
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/users/password-reset/confirm", { method: "POST", body: JSON.stringify({ token, password }) });
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password belum dapat diubah.");
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthFrame>{success ? <div className="login-form auth-result" role="status">
    <ProductLogo /><div className="auth-result-icon success"><CheckCircle size={30} /></div>
    <div><p className="eyebrow">PASSWORD DIPERBARUI</p><h2>Akun Anda siap digunakan</h2><p className="muted">Semua sesi lama telah dikeluarkan. Silakan masuk menggunakan password baru.</p></div>
    <Link className="button primary" to="/login">Masuk ke Aquanotes</Link>
  </div> : <form className="login-form" onSubmit={submit}>
    <ProductLogo /><div><p className="eyebrow">PASSWORD BARU</p><h2>Atur ulang password</h2><p className="muted">Gunakan minimal 8 karakter yang tidak mudah ditebak.</p></div>
    {error && <div className="form-error" role="alert">{error}</div>}
    <label htmlFor="reset-password">Password baru</label><div className="password-field"><input id="reset-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} disabled={!token} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword}>{showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}</button></div>
    <label htmlFor="reset-confirm">Konfirmasi password</label><input id="reset-confirm" name="confirm_password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} disabled={!token} />
    <button className="button primary login-submit" disabled={submitting || !token}>{submitting ? "Menyimpan…" : <><LockKey size={18} />Simpan password baru</>}</button>
  </form>}</AuthFrame>;
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const started = useRef(false);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Memverifikasi alamat email Anda…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState("error");
      setMessage("Tautan verifikasi tidak lengkap.");
      return;
    }
    apiFetch<{ message: string }>("/users/email-verification/confirm", { method: "POST", body: JSON.stringify({ token }) })
      .then((response) => { setState("success"); setMessage(response.message); })
      .catch((cause) => { setState("error"); setMessage(cause instanceof Error ? cause.message : "Email belum dapat diverifikasi."); });
  }, [token]);

  return <AuthFrame><div className="login-form auth-result" role="status" aria-live="polite">
    <ProductLogo /><div className={`auth-result-icon ${state === "success" ? "success" : state === "error" ? "error" : "loading"}`}>{state === "success" ? <CheckCircle size={30} /> : state === "error" ? <LockKey size={30} /> : <Envelope size={30} />}</div>
    <div><p className="eyebrow">VERIFIKASI EMAIL</p><h2>{state === "loading" ? "Mohon tunggu" : state === "success" ? "Email berhasil diverifikasi" : "Tautan tidak dapat digunakan"}</h2><p className="muted">{message}</p></div>
    {state !== "loading" && <Link className="button primary" to={state === "success" ? "/login" : "/forgot-password"}>{state === "success" ? "Masuk ke Aquanotes" : "Minta tautan baru"}</Link>}
  </div></AuthFrame>;
}
