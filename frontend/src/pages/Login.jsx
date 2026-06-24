import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        identifiant,
        motDePasse,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.location.href = "/dashboard";
    } catch (error) {
      setErreur(error.response?.data?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="lg-page">
        {/* Left decorative panel */}
        <div className="lg-panel" aria-hidden="true">
          <div className="lg-panel-inner">
            <div className="lg-brand-logo">GR</div>
            <p className="lg-panel-tagline">
              Gérez votre équipe,<br />
              <strong>simplement.</strong>
            </p>
            <div className="lg-dots">
              {[...Array(12)].map((_, i) => (
                <span key={i} className="lg-dot" style={{ animationDelay: `${i * 180}ms` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="lg-form-side">
          <div className="lg-form-wrap">
            <div className="lg-header">
              <div className="lg-mobile-logo">GR</div>
              <h1 className="lg-title">
                Gestion <span className="lg-title-accent">Restau</span>
              </h1>
              <p className="lg-desc">
                Connectez-vous à votre espace de gestion.
              </p>
            </div>

            {erreur && (
              <div className="lg-error" role="alert">
                <svg viewBox="0 0 20 20" fill="currentColor" className="lg-error-icon">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                {erreur}
              </div>
            )}

            <form onSubmit={handleSubmit} className="lg-form" noValidate>
              <div className="lg-field">
                <label htmlFor="identifiant" className="lg-label">
                  Identifiant
                </label>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M10 10a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" />
                    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" strokeLinecap="round" />
                  </svg>
                  <input
                    id="identifiant"
                    type="text"
                    value={identifiant}
                    onChange={(e) => setIdentifiant(e.target.value)}
                    placeholder="nom.prenom"
                    className="lg-input"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="motDePasse" className="lg-label">
                  Mot de passe
                </label>
                <div className="lg-input-wrap">
                  <svg className="lg-input-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="9" width="14" height="10" rx="2" />
                    <path d="M7 9V7a3 3 0 016 0v2" strokeLinecap="round" />
                  </svg>
                  <input
                    id="motDePasse"
                    type={showPass ? "text" : "password"}
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="lg-input lg-input--pass"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="lg-toggle-pass"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Masquer" : "Afficher"}
                  >
                    {showPass ? (
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M3 10s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
                        <circle cx="10" cy="10" r="2" />
                        <path d="M3 3l14 14" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M3 10s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
                        <circle cx="10" cy="10" r="2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`lg-btn${loading ? " lg-btn--loading" : ""}`}
              >
                {loading ? (
                  <>
                    <span className="lg-btn-spinner" />
                    Connexion…
                  </>
                ) : (
                  <>
                    Se connecter
                    <svg className="lg-btn-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --accent:    #1a1a2e;
    --accent2:   #e8572a;
    --bg:        #f4f3ef;
    --surface:   #ffffff;
    --border:    #e5e3db;
    --text:      #1a1a2e;
    --muted:     #6b7280;
    --invalid:   #991b1b;
    --invalid-bg:#fee2e2;
    --radius:    14px;
  }

  /* ── Layout ── */
  .lg-page {
    min-height: 100vh;
    display: flex;
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
  }

  /* ── Left panel ── */
  .lg-panel {
    flex: 0 0 42%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    position: relative;
    overflow: hidden;
  }
  .lg-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 70% 30%, rgba(232,87,42,0.18) 0%, transparent 65%);
  }
  .lg-panel-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .lg-brand-logo {
    width: 64px; height: 64px;
    background: var(--accent2);
    border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.04em;
  }
  .lg-panel-tagline {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    line-height: 1.3;
  }
  .lg-panel-tagline strong {
    color: #fff;
    font-weight: 800;
  }
  .lg-dots {
    display: grid;
    grid-template-columns: repeat(6, 8px);
    gap: 10px;
  }
  .lg-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    animation: lg-pulse 2.4s ease-in-out infinite;
  }
  @keyframes lg-pulse {
    0%, 100% { background: rgba(255,255,255,0.12); }
    50%       { background: rgba(232,87,42,0.6); }
  }

  /* ── Right form side ── */
  .lg-form-side {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(24px, 6vw, 64px) clamp(16px, 6vw, 64px);
  }
  .lg-form-wrap {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    animation: lg-fadein 0.5s ease both;
  }
  @keyframes lg-fadein {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Mobile logo (hidden on desktop) */
  .lg-mobile-logo {
    display: none;
    width: 48px; height: 48px;
    background: var(--accent2);
    border-radius: 14px;
    align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem;
    font-weight: 800;
    color: #fff;
    margin-bottom: 4px;
  }

  /* ── Header text ── */
  .lg-header { display: flex; flex-direction: column; gap: 8px; }
  .lg-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    font-weight: 800;
    color: var(--text);
    line-height: 1.1;
  }
  .lg-title-accent { color: var(--accent2); }
  .lg-desc { font-size: 0.95rem; color: var(--muted); line-height: 1.5; }

  /* ── Error ── */
  .lg-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--invalid-bg);
    color: var(--invalid);
    font-size: 0.875rem;
    font-weight: 500;
  }
  .lg-error-icon { width: 18px; height: 18px; flex-shrink: 0; }

  /* ── Form ── */
  .lg-form { display: flex; flex-direction: column; gap: 20px; }
  .lg-field { display: flex; flex-direction: column; gap: 7px; }
  .lg-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.01em;
  }
  .lg-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .lg-input-icon {
    position: absolute;
    left: 14px;
    width: 17px; height: 17px;
    color: var(--muted);
    pointer-events: none;
    flex-shrink: 0;
  }
  .lg-input {
    width: 100%;
    padding: 13px 14px 13px 42px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    color: var(--text);
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  .lg-input::placeholder { color: #b0aaa0; }
  .lg-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(26,26,46,0.08);
  }
  .lg-input--pass { padding-right: 46px; }

  .lg-toggle-pass {
    position: absolute;
    right: 12px;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--muted);
    border-radius: 6px;
    transition: color 0.15s ease;
  }
  .lg-toggle-pass:hover { color: var(--text); }
  .lg-toggle-pass svg { width: 18px; height: 18px; }

  /* ── Submit button ── */
  .lg-btn {
    margin-top: 4px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 20px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: var(--radius);
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: background 0.18s ease, transform 0.15s ease;
  }
  .lg-btn:hover:not(:disabled) { background: #2d2d50; transform: scale(1.01); }
  .lg-btn:active:not(:disabled) { transform: scale(0.98); }
  .lg-btn--loading { opacity: 0.8; cursor: default; }
  .lg-btn-arrow { width: 16px; height: 16px; }
  .lg-btn-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lg-spin 0.7s linear infinite;
  }
  @keyframes lg-spin { to { transform: rotate(360deg); } }

  /* ── Responsive ── */
  @media (max-width: 720px) {
    .lg-panel { display: none; }
    .lg-mobile-logo { display: flex; }
    .lg-form-side { background: var(--bg); }
    .lg-form-wrap { max-width: 100%; }
  }
`;