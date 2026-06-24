import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const MEDAL = ["🥇", "🥈", "🥉"];

const MEDAL_BG = [
  { border: "#fde68a", bg: "#fffbeb" },
  { border: "#e5e3db", bg: "#f9f8f5" },
  { border: "#fed7aa", bg: "#fff7ed" },
];

const ROLE_META = {
  ADMIN:     { label: "Admin",     bg: "#fef3c7", color: "#92400e" },
  DIRECTEUR: { label: "Directeur", bg: "#dbeafe", color: "#1e3a8a" },
  MANAGER:   { label: "Manager",   bg: "#f3e8ff", color: "#6b21a8" },
  FORMATEUR: { label: "Formateur", bg: "#dcfce7", color: "#166534" },
};

const NAV_LINKS = [
  { label: "Utilisateurs",     to: "/users",               roles: ["ADMIN","DIRECTEUR","MANAGER"], primary: true },
  { label: "Équipiers",        to: "/equipiers-restaurent", roles: ["ADMIN","DIRECTEUR","MANAGER"] },
  { label: "Brief / Débrief",  to: "/brief-debrief",        roles: ["ADMIN","DIRECTEUR","MANAGER"] },
  { label: "Statistiques",     to: "/stats",                roles: ["ADMIN","DIRECTEUR","MANAGER"] },
  { label: "Formations",       to: "/formations",           roles: ["ADMIN","DIRECTEUR","FORMATEUR"] },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [bestShift, setBestShift] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const h = { headers: { Authorization: `Bearer ${token}` } };
        const [bsr, lbr] = await Promise.all([
          axios.get("http://localhost:5000/api/stats/my-best-shift", h),
          axios.get("http://localhost:5000/api/stats/leaderboard", h),
        ]);
        setBestShift(bsr.data);
        setLeaderboard(lbr.data);
      } catch (e) { console.error("Erreur dashboard :", e); }
    };
    fetchData();
  }, []);

  const roleMeta = ROLE_META[user?.role] || { label: user?.role, bg: "#f3f4f6", color: "#374151" };
  const accessLinks = NAV_LINKS.filter((l) => l.roles.includes(user?.role));

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="db-page">
        {/* ── Hero header ── */}
        <header className="db-header">
          <div className="db-header-inner">
            <div className="db-hero">
              <div className="db-hero-avatar">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <div className="db-hero-text">
                <p className="db-hero-welcome">Bienvenue,</p>
                <h1 className="db-hero-name">
                  {user?.prenom} <span className="db-hero-name-accent">{user?.nom}</span>
                </h1>
                <span className="db-role-badge" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {roleMeta.label}
                </span>
              </div>
            </div>

            {/* Best shift pill */}
            {bestShift?.caMax > 0 && (
              <div className="db-bestshift">
                <p className="db-bestshift-label">⭐ Meilleur shift</p>
                <p className="db-bestshift-ca">{bestShift.caMax} €</p>
                <p className="db-bestshift-sub">
                  {bestShift.transactions} tx · {bestShift.rushDu === "midi" ? "Midi" : "Soir"} · {bestShift.dateRush ? new Date(bestShift.dateRush).toLocaleDateString("fr-FR") : "-"}
                </p>
              </div>
            )}
          </div>
        </header>

        <main className="db-main">
          {/* ── Access cards ── */}
          <section>
            <h2 className="db-section-title">Accès rapide</h2>
            <div className="db-access-grid">
              {accessLinks.map(({ label, to, primary }) => (
                <Link key={to} to={to} className={`db-access-card${primary ? " db-access-card--primary" : ""}`}>
                  <span className="db-access-label">{label}</span>
                  <svg className="db-access-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Leaderboard ── */}
          <section className="db-card">
            <h2 className="db-card-title">🏆 Classement managers</h2>
            {leaderboard.length === 0 ? (
              <div className="db-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 36, opacity: 0.3 }}>
                  <path d="M3 3l18 18M8.5 5H17a2 2 0 012 2v3.5M14 14l-2 5-3-3-5 3 3-5" strokeLinecap="round" />
                </svg>
                <p>Aucun débrief disponible pour le classement.</p>
              </div>
            ) : (
              <div className="db-leaderboard">
                {leaderboard.slice(0, 5).map((mgr, i) => {
                  const mb = MEDAL_BG[i] || { border: "#e5e3db", bg: "#fff" };
                  return (
                    <div
                      key={mgr.userId || `${mgr.managerPrenom}-${mgr.managerNom}`}
                      className="db-lb-row"
                      style={{ borderColor: mb.border, background: mb.bg, animationDelay: `${i * 70}ms` }}
                    >
                      <div className="db-lb-medal">{i < 3 ? MEDAL[i] : <span className="db-lb-rank">#{i+1}</span>}</div>
                      <div className="db-lb-info">
                        <div className="db-lb-name">{mgr.managerPrenom} {mgr.managerNom}</div>
                        <div className="db-lb-debriefs">{mgr.nombreDebriefs} débrief{mgr.nombreDebriefs !== 1 ? "s" : ""}</div>
                      </div>
                      <div className="db-lb-stats">
                        <div className="db-lb-stat">
                          <span className="db-lb-stat-label">Meilleur CA</span>
                          <span className="db-lb-stat-value">{mgr.meilleurCA} €</span>
                        </div>
                        <div className="db-lb-stat">
                          <span className="db-lb-stat-label">CA moyen</span>
                          <span className="db-lb-stat-value">{mgr.moyenneCA} €</span>
                        </div>
                        <div className="db-lb-stat">
                          <span className="db-lb-stat-label">Tx moyen</span>
                          <span className="db-lb-stat-value">{mgr.moyenneTransactions}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Permissions summary ── */}
          <section className="db-card">
            <h2 className="db-card-title">Vos permissions</h2>
            <div className="db-perms-grid">
              {[
                { label: "Utilisateurs",    ok: ["ADMIN","DIRECTEUR","MANAGER"].includes(user?.role), detail: ["ADMIN","DIRECTEUR"].includes(user?.role) ? "Gestion complète" : "Consultation" },
                { label: "Équipiers",       ok: ["ADMIN","DIRECTEUR","MANAGER"].includes(user?.role), detail: "Consultation et gestion" },
                { label: "Brief / Débrief", ok: ["ADMIN","DIRECTEUR","MANAGER"].includes(user?.role), detail: "Saisie et suivi des rushs" },
                { label: "Statistiques",    ok: ["ADMIN","DIRECTEUR","MANAGER"].includes(user?.role), detail: "Analyse des performances" },
                { label: "Formations",      ok: ["ADMIN","DIRECTEUR","FORMATEUR"].includes(user?.role), detail: "Suivi et évaluation" },
              ].map(({ label, ok, detail }) => (
                <div key={label} className={`db-perm${ok ? " db-perm--ok" : " db-perm--no"}`}>
                  <div className="db-perm-icon">{ok ? "✓" : "✗"}</div>
                  <div>
                    <div className="db-perm-label">{label}</div>
                    <div className="db-perm-detail">{ok ? detail : "Aucun accès"}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --accent: #1a1a2e; --accent2: #e8572a;
    --bg: #f4f3ef; --surface: #ffffff;
    --border: #e5e3db; --text: #1a1a2e; --muted: #6b7280;
    --radius: 16px; --shadow: 0 2px 20px rgba(26,26,46,0.07);
  }
  .db-page { min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }

  /* ── Header ── */
  .db-header {
    background: var(--accent);
    padding: clamp(28px,6vw,56px) clamp(16px,5vw,48px);
    position: relative; overflow: hidden;
  }
  .db-header::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 20%, rgba(232,87,42,0.15) 0%, transparent 60%);
  }
  .db-header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; position: relative; }

  .db-hero { display: flex; align-items: center; gap: clamp(14px,3vw,24px); }
  .db-hero-avatar {
    width: clamp(56px,8vw,76px); height: clamp(56px,8vw,76px);
    border-radius: 50%; background: var(--accent2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: clamp(1.1rem,2.5vw,1.5rem); font-weight: 800;
    color: #fff; flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(255,255,255,0.15);
  }
  .db-hero-welcome { font-size: 0.8rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .db-hero-name { font-family: 'Syne', sans-serif; font-size: clamp(1.4rem,4vw,2.2rem); font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 10px; }
  .db-hero-name-accent { color: var(--accent2); }
  .db-role-badge { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.04em; }

  /* Best shift */
  .db-bestshift {
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px; padding: clamp(14px,2vw,20px) clamp(18px,3vw,28px);
    text-align: center; flex-shrink: 0;
  }
  .db-bestshift-label { font-size: 0.72rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
  .db-bestshift-ca { font-family: 'Syne', sans-serif; font-size: clamp(1.6rem,4vw,2.2rem); font-weight: 800; color: #fff; line-height: 1; }
  .db-bestshift-sub { font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-top: 5px; }

  /* ── Main ── */
  .db-main { max-width: 1100px; margin: 0 auto; padding: clamp(24px,5vw,48px) clamp(16px,5vw,48px); display: flex; flex-direction: column; gap: 24px; }

  .db-section-title { font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 14px; }

  /* Access grid */
  .db-access-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,200px),1fr)); gap: clamp(10px,2vw,14px); }
  .db-access-card {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 16px 18px; border-radius: 14px;
    background: var(--surface); border: 1.5px solid var(--border);
    text-decoration: none; color: var(--text);
    font-weight: 500; font-size: 0.9rem;
    box-shadow: var(--shadow);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }
  .db-access-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(26,26,46,0.11); border-color: #c8c5bc; }
  .db-access-card--primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  .db-access-card--primary:hover { background: #2d2d50; border-color: #2d2d50; }
  .db-access-label { font-family: 'DM Sans', sans-serif; font-weight: 500; }
  .db-access-arrow { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.6; transition: transform 0.18s ease, opacity 0.18s; }
  .db-access-card:hover .db-access-arrow { transform: translateX(3px); opacity: 1; }

  /* Card */
  .db-card { background: var(--surface); border-radius: var(--radius); padding: clamp(18px,3vw,28px); box-shadow: var(--shadow); }
  .db-card-title { font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 18px; }
  .db-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px 0; color: var(--muted); font-size: 0.875rem; }

  /* Leaderboard */
  .db-leaderboard { display: flex; flex-direction: column; gap: 10px; }
  .db-lb-row {
    display: flex; align-items: center; gap: clamp(12px,2vw,20px);
    padding: clamp(12px,2vw,16px); border-radius: 14px; border: 1.5px solid;
    animation: db-fadein 0.4s ease both;
    transition: box-shadow 0.18s ease;
    flex-wrap: wrap;
  }
  .db-lb-row:hover { box-shadow: 0 4px 18px rgba(26,26,46,0.09); }
  @keyframes db-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .db-lb-medal { font-size: clamp(1.4rem,3vw,1.8rem); line-height: 1; flex-shrink: 0; width: 40px; text-align: center; }
  .db-lb-rank { font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 800; color: var(--muted); }
  .db-lb-info { flex: 1; min-width: 130px; }
  .db-lb-name { font-weight: 600; font-size: clamp(0.875rem,2vw,0.95rem); color: var(--text); margin-bottom: 2px; }
  .db-lb-debriefs { font-size: 0.75rem; color: var(--muted); }
  .db-lb-stats { display: flex; gap: clamp(12px,2vw,24px); flex-wrap: wrap; }
  .db-lb-stat { display: flex; flex-direction: column; gap: 2px; }
  .db-lb-stat-label { font-size: 0.68rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
  .db-lb-stat-value { font-family: 'Syne', sans-serif; font-size: clamp(0.9rem,2vw,1.05rem); font-weight: 800; color: var(--text); }

  /* Permissions */
  .db-perms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,220px),1fr)); gap: 12px; }
  .db-perm { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; border: 1.5px solid; }
  .db-perm--ok  { border-color: #bbf7d0; background: #f0fdf4; }
  .db-perm--no  { border-color: var(--border); background: var(--bg); }
  .db-perm-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; flex-shrink: 0; }
  .db-perm--ok .db-perm-icon  { background: #dcfce7; color: #166534; }
  .db-perm--no .db-perm-icon  { background: #f3f4f6; color: var(--muted); }
  .db-perm-label  { font-size: 0.875rem; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .db-perm-detail { font-size: 0.75rem; color: var(--muted); }

  @media (max-width: 480px) { .db-bestshift { width: 100%; text-align: left; } }
`;