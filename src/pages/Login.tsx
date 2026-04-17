import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

// ─── INJECTED CSS ──────────────────────────────────────────────────────────────
const LOGIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap');

  .ont-login-page {
    min-height: 100dvh; display: flex;
    background: #F0EBE3; font-family: 'Plus Jakarta Sans', sans-serif;
    overflow: hidden;
  }

  /* ── Left decorative panel ── */
  .ont-login-panel {
    display: none;
  }
  @media (min-width: 1024px) {
    .ont-login-panel {
      display: flex; width: 50%; position: relative; overflow: hidden;
      align-items: center; justify-content: center;
      background: linear-gradient(135deg, #E6640A 0%, #C4520A 50%, #9E3D07 100%);
    }
  }
  .ont-login-panel-glow1 {
    position: absolute; top: 10%; left: 10%; width: 260px; height: 260px;
    border-radius: 50%; background: rgba(255,255,255,0.07); pointer-events: none;
  }
  .ont-login-panel-glow2 {
    position: absolute; bottom: 15%; right: 5%; width: 200px; height: 200px;
    border-radius: 50%; background: rgba(255,255,255,0.05); pointer-events: none;
  }
  .ont-login-panel-inner {
    position: relative; z-index: 2; text-align: center; padding: 0 48px; max-width: 440px;
  }
  .ont-login-panel-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; padding: 6px 16px; border-radius: 99px; margin-bottom: 24px;
  }
  .ont-login-panel-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.8);
  }
  .ont-login-panel-h2 {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 36px; font-weight: 800; color: #fff;
    line-height: 1.1; letter-spacing: -0.8px; margin-bottom: 16px;
  }
  .ont-login-panel-p {
    font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.75;
  }

  /* Panel logo lockup */
  .ont-login-panel-logo {
    display: flex; align-items: center; gap: 12px; margin-bottom: 32px;
    justify-content: center;
  }
  .ont-login-panel-logo-box {
    width: 48px; height: 48px; border-radius: 14px;
    background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .ont-login-panel-logo-on  { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 900; font-size: 14px; color: #fff; line-height: 1; }
  .ont-login-panel-logo-ett { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 9px; color: rgba(255,255,255,0.65); line-height: 1; }
  .ont-login-panel-logo-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: 22px; color: #fff; letter-spacing: -0.5px;
  }
  .ont-login-panel-logo-name em { color: rgba(255,255,255,0.65); font-style: normal; }

  /* ── Right form side ── */
  .ont-login-form-side {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 40px 24px; position: relative;
  }
  .ont-login-form-bg1 {
    position: absolute; top: 25%; right: 25%; width: 280px; height: 280px;
    border-radius: 50%; background: rgba(230,100,10,0.04); pointer-events: none;
  }
  .ont-login-form-bg2 {
    position: absolute; bottom: 25%; left: 25%; width: 200px; height: 200px;
    border-radius: 50%; background: rgba(230,100,10,0.04); pointer-events: none;
  }

  .ont-login-card {
    width: 100%; max-width: 460px; position: relative; z-index: 1;
    background: #FFFFFF; border: 1px solid rgba(0,0,0,0.09);
    border-radius: 28px; padding: 36px 32px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.06);
  }

  /* Logo in card */
  .ont-login-card-logo {
    display: inline-flex; align-items: center; gap: 9px;
    text-decoration: none; margin-bottom: 28px;
  }
  .ont-login-card-logo-box {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #E6640A, #C4520A);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .ont-login-card-logo-on  { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 900; font-size: 10px; color: #fff; line-height: 1; }
  .ont-login-card-logo-ett { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 7.5px; color: rgba(255,255,255,0.65); line-height: 1; }
  .ont-login-card-logo-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: 18px; color: #1A1A1A; letter-spacing: -0.3px;
  }
  .ont-login-card-logo-name em { color: #E6640A; font-style: normal; }

  .ont-login-heading {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 28px; font-weight: 800; color: #1A1A1A;
    letter-spacing: -0.6px; margin-bottom: 6px;
  }
  .ont-login-subheading {
    font-size: 13.5px; color: #9A9A9A; margin-bottom: 24px;
  }

  /* Role badge */
  .ont-login-role-badge {
    display: flex; align-items: center; gap: 12px;
    background: rgba(230,100,10,0.05); border: 1px solid rgba(230,100,10,0.15);
    border-radius: 14px; padding: 12px 16px; margin-bottom: 24px;
  }
  .ont-login-role-ico {
    width: 38px; height: 38px; border-radius: 11px;
    background: rgba(230,100,10,0.1);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ont-login-role-txt { font-size: 13px; color: #6A6A6A; }
  .ont-login-role-txt strong { color: #1A1A1A; font-weight: 700; }

  /* Fields */
  .ont-login-field { margin-bottom: 16px; }
  .ont-login-label {
    display: block; font-size: 10px; font-weight: 800; letter-spacing: 1px;
    text-transform: uppercase; color: #9A9A9A; margin-bottom: 7px;
  }
  .ont-login-input-wrap { position: relative; }
  .ont-login-input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: #C0C0C0; pointer-events: none;
    display: flex; align-items: center;
  }
  .ont-login-input {
    width: 100%; height: 48px;
    background: #FAFAF8; border: 1px solid rgba(0,0,0,0.1);
    border-radius: 13px; padding: 0 44px 0 44px;
    font-size: 13.5px; color: #1A1A1A; outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: border-color 0.15s, background 0.15s;
  }
  .ont-login-input:focus {
    border-color: rgba(230,100,10,0.5);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(230,100,10,0.08);
  }
  .ont-login-input::placeholder { color: #C0C0C0; }
  .ont-login-input-right {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #B0B0B0;
    display: flex; align-items: center; padding: 0;
    transition: color 0.15s;
  }
  .ont-login-input-right:hover { color: #6A6A6A; }

  /* Submit button */
  .ont-login-submit {
    width: 100%; height: 50px; border: none; border-radius: 14px;
    background: #E6640A; color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14.5px; font-weight: 800; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 20px;
    transition: background 0.15s, transform 0.1s;
  }
  .ont-login-submit:hover:not(:disabled) { background: #C4520A; transform: translateY(-1px); }
  .ont-login-submit:active:not(:disabled) { transform: translateY(0); }
  .ont-login-submit:disabled { background: #E0D8D0; color: #B0A898; cursor: not-allowed; }

  .ont-login-footer-text {
    text-align: center; font-size: 13px; color: #9A9A9A; margin-top: 20px;
  }
  .ont-login-footer-text a {
    color: #E6640A; font-weight: 700; text-decoration: none;
  }
  .ont-login-footer-text a:hover { text-decoration: underline; }
`;

function InjectLoginCSS() {
  const { useEffect } = require("react");
  useEffect(() => {
    const id = "ont-login-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = LOGIN_CSS;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

// ─── INLINE ICONS ─────────────────────────────────────────────────────────────
const IcoMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcoEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IcoCart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IcoSpark = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
    <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z"/>
  </svg>
);

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, false);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{LOGIN_CSS}</style>
      <div className="ont-login-page">

        {/* ── Left decorative panel ── */}
        <div className="ont-login-panel">
          <div className="ont-login-panel-glow1" />
          <div className="ont-login-panel-glow2" />
          <div className="ont-login-panel-inner">
            <div className="ont-login-panel-logo">
              <div className="ont-login-panel-logo-box">
                <div className="ont-login-panel-logo-on">ON</div>
                <div className="ont-login-panel-logo-ett">ETT</div>
              </div>
              <span className="ont-login-panel-logo-name">ONETT<em>.</em></span>
            </div>
            <div className="ont-login-panel-badge">
              <span className="ont-login-panel-badge-dot" />
              AI-Powered Marketplace
            </div>
            <h2 className="ont-login-panel-h2">
              Welcome back<br />to ONETT.
            </h2>
            <p className="ont-login-panel-p">
              Your AI-powered shopping companion. Get personalised recommendations,
              snap-to-search, and smart deals — all in one place.
            </p>
          </div>
        </div>

        {/* ── Right form side ── */}
        <div className="ont-login-form-side">
          <div className="ont-login-form-bg1" />
          <div className="ont-login-form-bg2" />

          <motion.div
            style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ont-login-card">

              {/* Logo */}
              <Link to="/" className="ont-login-card-logo">
                <div className="ont-login-card-logo-box">
                  <div className="ont-login-card-logo-on">ON</div>
                  <div className="ont-login-card-logo-ett">ETT</div>
                </div>
                <span className="ont-login-card-logo-name">ONETT<em>.</em></span>
              </Link>

              <h1 className="ont-login-heading">Sign in</h1>
              <p className="ont-login-subheading">Continue shopping smarter</p>

              {/* Role badge */}
              <div className="ont-login-role-badge">
                <div className="ont-login-role-ico">
                  <IcoCart />
                </div>
                <span className="ont-login-role-txt">
                  Signing in as a <strong>Buyer</strong>
                </span>
              </div>

              <form onSubmit={handleSubmit}>

                {/* Email */}
                <div className="ont-login-field">
                  <label htmlFor="ont-email" className="ont-login-label">Email</label>
                  <div className="ont-login-input-wrap">
                    <span className="ont-login-input-icon"><IcoMail /></span>
                    <input
                      id="ont-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="ont-login-input"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="ont-login-field">
                  <label htmlFor="ont-password" className="ont-login-label">Password</label>
                  <div className="ont-login-input-wrap">
                    <span className="ont-login-input-icon"><IcoLock /></span>
                    <input
                      id="ont-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="ont-login-input"
                    />
                    <button
                      type="button"
                      className="ont-login-input-right"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <IcoEyeOff /> : <IcoEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="ont-login-submit"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : <>Sign In <IcoArrow /></>}
                </button>
              </form>

              <p className="ont-login-footer-text">
                Don't have an account?{" "}
                <Link to="/register">Create one</Link>
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </>
  );
};

export default Login;
