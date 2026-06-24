import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

const API_URL = "http://localhost:5000/api/formations";

export default function FormationsEquipiers() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [equipiers, setEquipiers] = useState([]);
  const [erreur, setErreur] = useState("");
  const [search, setSearch] = useState("");

  const fetchEquipiers = async () => {
    try {
      const res = await axios.get(`${API_URL}/equipiers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipiers(res.data);
    } catch (error) {
      setErreur("Erreur lors du chargement des équipiers");
    }
  };

  useEffect(() => {
    fetchEquipiers();
  }, []);

  const filtered = equipiers.filter((e) =>
    `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  /* XP level label */
  const xpLabel = (pct) => {
    if (pct >= 80) return { label: "Expert", color: "#166534", bg: "#dcfce7" };
    if (pct >= 50) return { label: "Confirmé", color: "#92400e", bg: "#fef3c7" };
    return { label: "Débutant", color: "#1e3a8a", bg: "#dbeafe" };
  };

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="fe-page">
        {/* ── Header ── */}
        <header className="fe-header">
          <div className="fe-header-inner">
            <div className="fe-header-text">
              <h1 className="fe-title">
                Formations{" "}
                <span className="fe-title-accent">équipiers</span>
              </h1>
              <p className="fe-subtitle">
                Suivi du niveau d'expérience et des formations validées.
              </p>
            </div>

            {equipiers.length > 0 && (
              <div className="fe-stats">
                <div className="fe-stat">
                  <span className="fe-stat-value">{equipiers.length}</span>
                  <span className="fe-stat-label">équipiers</span>
                </div>
                <div className="fe-stat-divider" />
                <div className="fe-stat">
                  <span className="fe-stat-value">
                    {Math.round(
                      equipiers.reduce((s, e) => s + e.experience, 0) /
                        equipiers.length
                    )}%
                  </span>
                  <span className="fe-stat-label">XP moyen</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="fe-main">
          {erreur && (
            <div className="fe-error" role="alert">
              <svg viewBox="0 0 20 20" fill="currentColor" className="fe-error-icon">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              {erreur}
            </div>
          )}

          {/* ── Search ── */}
          {equipiers.length > 0 && (
            <div className="fe-search-wrap">
              <svg className="fe-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="8.5" cy="8.5" r="5" />
                <path d="M13 13l3.5 3.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="fe-search"
                placeholder="Rechercher un équipier…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="fe-search-clear" onClick={() => setSearch("")} aria-label="Effacer">
                  ×
                </button>
              )}
            </div>
          )}

          {/* ── Grid ── */}
          <div className="fe-grid">
            {filtered.map((equipier, i) => {
              const xp = xpLabel(equipier.experience);
              return (
                <article
                  key={equipier._id}
                  className="fe-card"
                  style={{ animationDelay: `${i * 55}ms` }}
                  onClick={() => navigate(`/formations/equipier/${equipier._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/formations/equipier/${equipier._id}`)}
                >
                  {/* Avatar */}
                  <div className="fe-card-top">
                    <div className="fe-avatar">
                      {equipier.prenom?.[0]}{equipier.nom?.[0]}
                    </div>
                    <span
                      className="fe-badge"
                      style={{ color: xp.color, background: xp.bg }}
                    >
                      {xp.label}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="fe-card-name">
                    <span className="fe-prenom">{equipier.prenom}</span>{" "}
                    <span className="fe-nom">{equipier.nom}</span>
                  </div>

                  {/* Formations count */}
                  <p className="fe-card-count">
                    {equipier.formationsValidees} / {equipier.totalFormations} formations validées
                  </p>

                  {/* XP bar */}
                  <div className="fe-xp-row">
                    <div className="fe-xp-bar-wrap">
                      <div
                        className="fe-xp-bar"
                        style={{ "--xp": `${equipier.experience}%` }}
                      />
                    </div>
                    <span className="fe-xp-value">{equipier.experience}%</span>
                  </div>

                  {/* Arrow */}
                  <div className="fe-card-arrow">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </article>
              );
            })}

            {filtered.length === 0 && !erreur && (
              <div className="fe-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="fe-empty-icon">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
                <p>Aucun équipier trouvé</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --accent:  #1a1a2e;
    --accent2: #e8572a;
    --bg:      #f4f3ef;
    --surface: #ffffff;
    --border:  #e5e3db;
    --text:    #1a1a2e;
    --muted:   #6b7280;
    --radius:  16px;
    --shadow:  0 2px 20px rgba(26,26,46,0.07);
  }

  .fe-page {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  /* ── Header ── */
  .fe-header {
    background: var(--accent);
    padding: clamp(24px, 5vw, 48px) clamp(16px, 5vw, 48px);
  }
  .fe-header-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }
  .fe-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.5rem, 4vw, 2.2rem);
    font-weight: 800;
    color: #fff;
    line-height: 1.1;
    margin-bottom: 8px;
  }
  .fe-title-accent { color: var(--accent2); }
  .fe-subtitle {
    font-size: clamp(0.8rem, 2vw, 0.95rem);
    color: rgba(255,255,255,0.55);
  }

  /* Stats pills in header */
  .fe-stats {
    display: flex;
    align-items: center;
    gap: 20px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 14px 24px;
    flex-shrink: 0;
  }
  .fe-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .fe-stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }
  .fe-stat-label { font-size: 0.72rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.08em; }
  .fe-stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.12); }

  /* ── Main ── */
  .fe-main {
    max-width: 1100px;
    margin: 0 auto;
    padding: clamp(24px, 5vw, 40px) clamp(16px, 5vw, 48px);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ── Error ── */
  .fe-error {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 14px;
    border-radius: 10px;
    background: #fee2e2;
    color: #991b1b;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .fe-error-icon { width: 18px; height: 18px; flex-shrink: 0; }

  /* ── Search ── */
  .fe-search-wrap {
    position: relative;
    max-width: 360px;
  }
  .fe-search-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    width: 17px; height: 17px; color: var(--muted); pointer-events: none;
  }
  .fe-search {
    width: 100%;
    padding: 11px 40px 11px 42px;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: var(--text);
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .fe-search::placeholder { color: #b0aaa0; }
  .fe-search:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(26,26,46,0.08);
  }
  .fe-search-clear {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    width: 22px; height: 22px;
    display: flex; align-items: center; justify-content: center;
    background: var(--border); border: none; border-radius: 50%;
    font-size: 1rem; line-height: 1;
    color: var(--muted); cursor: pointer;
    transition: background 0.15s;
  }
  .fe-search-clear:hover { background: #d1cfc8; }

  /* ── Grid ── */
  .fe-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr));
    gap: clamp(12px, 2vw, 20px);
  }

  /* ── Card ── */
  .fe-card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: clamp(16px, 3vw, 22px);
    box-shadow: var(--shadow);
    border: 1.5px solid transparent;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    overflow: hidden;
    animation: fe-fadein 0.4s ease both;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .fe-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent2), var(--accent));
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .fe-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 36px rgba(26,26,46,0.13);
    border-color: var(--border);
  }
  .fe-card:hover::before { opacity: 1; }
  .fe-card:focus-visible {
    outline: 2px solid var(--accent2);
    outline-offset: 2px;
  }

  @keyframes fe-fadein {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Card internals */
  .fe-card-top {
    display: flex; align-items: center; justify-content: space-between;
  }
  .fe-avatar {
    width: 42px; height: 42px;
    background: var(--accent);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }
  .fe-badge {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    letter-spacing: 0.02em;
  }

  .fe-card-name {
    font-size: clamp(0.95rem, 2vw, 1.05rem);
    line-height: 1.2;
  }
  .fe-prenom { font-weight: 500; color: var(--text); }
  .fe-nom {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    color: var(--text);
  }

  .fe-card-count {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .fe-xp-row {
    display: flex; align-items: center; gap: 10px;
  }
  .fe-xp-bar-wrap {
    flex: 1; height: 6px;
    background: #e5e3db;
    border-radius: 999px;
    overflow: hidden;
  }
  .fe-xp-bar {
    height: 100%;
    width: var(--xp);
    background: var(--accent);
    border-radius: 999px;
    transition: width 0.8s cubic-bezier(.4,0,.2,1);
  }
  .fe-xp-value {
    font-size: 0.8rem;
    font-weight: 600;
    min-width: 34px;
    text-align: right;
    color: var(--text);
  }

  .fe-card-arrow {
    display: flex; justify-content: flex-end;
    color: var(--muted);
    transition: color 0.18s ease, transform 0.18s ease;
  }
  .fe-card-arrow svg { width: 18px; height: 18px; }
  .fe-card:hover .fe-card-arrow {
    color: var(--accent2);
    transform: translateX(3px);
  }

  /* ── Empty state ── */
  .fe-empty {
    grid-column: 1 / -1;
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; padding: 60px 24px;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .fe-empty-icon { width: 48px; height: 48px; opacity: 0.4; }

  /* ── Mobile ── */
  @media (max-width: 500px) {
    .fe-stats { display: none; }
  }
`;