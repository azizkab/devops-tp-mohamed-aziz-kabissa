import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:5000/api/formations/dashboard";
const MEDAL = ["🥇", "🥈", "🥉"];

export default function DashboardFormation() {
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true); setErreur("");
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch { setErreur("Erreur lors du chargement du dashboard formation"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const pct = data?.totals?.progressionGlobale ?? 0;
  const ring = 2 * Math.PI * 54;
  const ringOffset = ring - (pct / 100) * ring;

  return (
    <>
      <style>{styles}</style>
      <Navbar />
      <div className="df-page">
        <header className="df-header">
          <div className="df-header-inner">
            <div className="df-header-text">
              <h1 className="df-title">Dashboard <span className="df-title-accent">formation</span></h1>
              <p className="df-subtitle">Vue globale du niveau de formation des équipiers.</p>
            </div>
            {data && (
              <div className="df-ring-wrap">
                <svg viewBox="0 0 120 120" className="df-ring-svg">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent2)"
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={ring} strokeDashoffset={ringOffset}
                    transform="rotate(-90 60 60)" className="df-ring-progress" />
                </svg>
                <div className="df-ring-label">
                  <span className="df-ring-pct">{pct}%</span>
                  <span className="df-ring-sub">global</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="df-main">
          {erreur && (
            <div className="df-error">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              {erreur}
            </div>
          )}

          {loading || !data ? (
            <div className="df-loader"><div className="df-spinner" /><p>Chargement du dashboard…</p></div>
          ) : (
            <>
              <div className="df-kpi-grid">
                {[
                  { label: "Équipiers",     value: data.totals.totalEquipiers },
                  { label: "Formations",    value: data.totals.totalFormations },
                  { label: "Validations",   value: data.totals.totalValidees },
                  { label: "Niveau global", value: `${pct}%`, danger: pct < 50 },
                ].map((k, i) => (
                  <div key={i} className={`df-kpi${k.danger ? " df-kpi--danger" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="df-kpi-label">{k.label}</span>
                    <span className="df-kpi-value">{k.value}</span>
                  </div>
                ))}
              </div>

              <div className="df-grid-2">
                <section className="df-card">
                  <h2 className="df-section-title"><span className="df-section-icon">🏆</span> Top équipiers</h2>
                  {data.topEquipiers.length === 0 ? (
                    <p className="df-empty">Aucune donnée disponible.</p>
                  ) : (
                    <div className="df-ranking">
                      {data.topEquipiers.map((e, i) => (
                        <div key={e.id} className={`df-rank-row${i === 0 ? " df-rank-row--gold" : ""}`} style={{ animationDelay: `${i * 55}ms` }}>
                          <div className="df-rank-medal">{i < 3 ? MEDAL[i] : <span className="df-rank-num">#{i+1}</span>}</div>
                          <div className="df-rank-info">
                            <div className="df-rank-name">{e.prenom} {e.nom}</div>
                            <div className="df-rank-sub">{e.formationsValidees}/{e.totalFormations} formations</div>
                          </div>
                          <div className="df-rank-right">
                            <div className="df-rank-score">{e.experience}%</div>
                            <div className="df-mini-bar-wrap"><div className="df-mini-bar" style={{ "--w": `${e.experience}%` }} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="df-card">
                  <h2 className="df-section-title"><span className="df-section-icon">⚠️</span> À former en priorité</h2>
                  {data.equipiersPrioritaires.length === 0 ? (
                    <p className="df-empty">Aucun équipier prioritaire.</p>
                  ) : (
                    <div className="df-priority-list">
                      {data.equipiersPrioritaires.map((e, i) => (
                        <div key={e.id} className="df-priority-row" style={{ animationDelay: `${i * 55}ms` }}>
                          <div className="df-priority-avatar">{e.prenom?.[0]}{e.nom?.[0]}</div>
                          <div className="df-priority-info">
                            <div className="df-priority-name">{e.prenom} {e.nom}</div>
                            <div className="df-mini-bar-wrap"><div className="df-mini-bar df-mini-bar--danger" style={{ "--w": `${e.experience}%` }} /></div>
                          </div>
                          <span className="df-priority-pct">{e.experience}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="df-grid-2">
                <section className="df-card">
                  <h2 className="df-section-title"><span className="df-section-icon">📉</span> Moins maîtrisées</h2>
                  <div className="df-formation-list">
                    {data.formationsFaibles.map((f, i) => <FormationBar key={f.code} f={f} danger delay={i * 50} />)}
                  </div>
                </section>
                <section className="df-card">
                  <h2 className="df-section-title"><span className="df-section-icon">✅</span> Mieux maîtrisées</h2>
                  <div className="df-formation-list">
                    {data.formationsFortes.map((f, i) => <FormationBar key={f.code} f={f} delay={i * 50} />)}
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

function FormationBar({ f, danger, delay }) {
  return (
    <div className="df-formation-row" style={{ animationDelay: `${delay}ms` }}>
      <div className="df-formation-info">
        <span className="df-formation-titre">{f.titre}</span>
        <span className="df-formation-count">{f.validations}/{f.totalEquipiers} validations</span>
      </div>
      <div className="df-formation-bar-area">
        <div className="df-mini-bar-wrap" style={{ flex: 1 }}>
          <div className={`df-mini-bar${danger ? " df-mini-bar--danger" : ""}`} style={{ "--w": `${f.tauxValidation}%` }} />
        </div>
        <span className={`df-formation-pct${danger ? " df-formation-pct--danger" : ""}`}>{f.tauxValidation}%</span>
      </div>
    </div>
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
    --danger: #dc2626; --danger-bg: #fee2e2; --danger-border: #fecaca;
  }
  .df-page { min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
  .df-header { background: var(--accent); padding: clamp(24px,5vw,48px) clamp(16px,5vw,48px); }
  .df-header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .df-header-text { flex: 1; }
  .df-title { font-family: 'Syne', sans-serif; font-size: clamp(1.5rem,4vw,2.2rem); font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 8px; }
  .df-title-accent { color: var(--accent2); }
  .df-subtitle { font-size: clamp(0.8rem,2vw,0.9rem); color: rgba(255,255,255,0.5); }
  .df-ring-wrap { position: relative; width: clamp(90px,12vw,110px); flex-shrink: 0; }
  .df-ring-svg { width: 100%; height: auto; display: block; }
  .df-ring-progress { transition: stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1); }
  .df-ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .df-ring-pct { font-family: 'Syne', sans-serif; font-size: clamp(1rem,2.5vw,1.35rem); font-weight: 800; color: #fff; line-height: 1; }
  .df-ring-sub { font-size: 0.62rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.1em; }
  .df-main { max-width: 1100px; margin: 0 auto; padding: clamp(20px,4vw,40px) clamp(16px,5vw,48px); display: flex; flex-direction: column; gap: 20px; }
  .df-error { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 10px; background: var(--danger-bg); color: var(--danger); font-size: 0.875rem; font-weight: 500; }
  .df-loader { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px 0; color: var(--muted); font-size: 0.9rem; }
  .df-spinner { width: 32px; height: 32px; border: 2.5px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: df-spin 0.7s linear infinite; }
  @keyframes df-spin { to { transform: rotate(360deg); } }
  .df-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,160px),1fr)); gap: clamp(10px,2vw,16px); }
  .df-kpi { background: var(--surface); border-radius: 14px; padding: clamp(14px,2vw,20px); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 8px; border: 1.5px solid transparent; animation: df-fadein 0.4s ease both; }
  .df-kpi--danger { border-color: var(--danger-border); background: #fff8f8; }
  .df-kpi-label { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
  .df-kpi-value { font-family: 'Syne', sans-serif; font-size: clamp(1.5rem,3vw,2rem); font-weight: 800; color: var(--text); line-height: 1; }
  .df-kpi--danger .df-kpi-value { color: var(--danger); }
  @keyframes df-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .df-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%,440px),1fr)); gap: 20px; }
  .df-card { background: var(--surface); border-radius: var(--radius); padding: clamp(16px,3vw,28px); box-shadow: var(--shadow); }
  .df-section-title { font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 18px; display: flex; align-items: center; gap: 7px; }
  .df-section-icon { font-size: 1rem; }
  .df-empty { color: var(--muted); font-size: 0.9rem; }
  .df-mini-bar-wrap { width: 100%; height: 6px; background: var(--border); border-radius: 999px; overflow: hidden; }
  .df-mini-bar { height: 100%; width: var(--w); background: var(--accent); border-radius: 999px; transition: width 0.9s cubic-bezier(.4,0,.2,1); }
  .df-mini-bar--danger { background: var(--danger); }
  .df-ranking { display: flex; flex-direction: column; gap: 10px; }
  .df-rank-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 12px; animation: df-fadein 0.4s ease both; transition: box-shadow 0.18s; }
  .df-rank-row:hover { box-shadow: 0 4px 16px rgba(26,26,46,0.08); }
  .df-rank-row--gold { border-color: #fde68a; background: #fffbeb; }
  .df-rank-medal { font-size: 1.4rem; text-align: center; line-height: 1; }
  .df-rank-num { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; color: var(--muted); }
  .df-rank-name { font-weight: 600; font-size: 0.9rem; color: var(--text); margin-bottom: 4px; }
  .df-rank-sub { font-size: 0.75rem; color: var(--muted); }
  .df-rank-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; min-width: 70px; }
  .df-rank-score { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; color: var(--text); }
  .df-priority-list { display: flex; flex-direction: column; gap: 10px; }
  .df-priority-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1.5px solid var(--danger-border); background: #fff8f8; border-radius: 12px; animation: df-fadein 0.4s ease both; }
  .df-priority-avatar { width: 34px; height: 34px; border-radius: 10px; background: var(--danger); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 0.72rem; font-weight: 700; color: #fff; flex-shrink: 0; }
  .df-priority-info { flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  .df-priority-name { font-weight: 600; font-size: 0.875rem; color: var(--danger); }
  .df-priority-pct { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; color: var(--danger); min-width: 44px; text-align: right; }
  .df-formation-list { display: flex; flex-direction: column; gap: 12px; }
  .df-formation-row { display: flex; flex-direction: column; gap: 7px; animation: df-fadein 0.4s ease both; }
  .df-formation-info { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .df-formation-titre { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .df-formation-count { font-size: 0.75rem; color: var(--muted); white-space: nowrap; }
  .df-formation-bar-area { display: flex; align-items: center; gap: 10px; }
  .df-formation-pct { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; min-width: 38px; text-align: right; color: var(--text); }
  .df-formation-pct--danger { color: var(--danger); }
  @media (max-width: 480px) { .df-ring-wrap { display: none; } }
`;