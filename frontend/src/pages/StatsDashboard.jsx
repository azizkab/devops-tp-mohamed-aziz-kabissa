import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from "recharts";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:5000/api/stats/rush";

const todayISO = () => new Date().toISOString().split("T")[0];
const daysAgoISO = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().split("T")[0]; };
const monthStartISO = () => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; };
const formatDate = (date) => date ? new Date(date).toLocaleDateString("fr-FR") : "-";

const QUICK_FILTERS = [
  { key: "ALL",  label: "Tout" },
  { key: "7J",   label: "7 jours" },
  { key: "30J",  label: "30 jours" },
  { key: "MOIS", label: "Ce mois" },
];

/* Custom tooltip for recharts */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a2e", border: "none", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "0 0 6px", fontFamily: "DM Sans, sans-serif" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: 12, margin: "2px 0", fontFamily: "DM Sans, sans-serif" }}>
          <span style={{ color: "rgba(255,255,255,0.7)" }}>{p.name}: </span>{p.value}
        </p>
      ))}
    </div>
  );
}

export default function StatsDashboard() {
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [activeQuick, setActiveQuick] = useState("ALL");

  const [filters, setFilters] = useState({ rushDu: "TOUS", dateDebut: "", dateFin: "" });

  const fetchStats = async (customFilters = filters) => {
    try {
      setLoading(true); setErreur("");
      const params = new URLSearchParams();
      if (customFilters.rushDu !== "TOUS") params.append("rushDu", customFilters.rushDu);
      if (customFilters.dateDebut) params.append("dateDebut", customFilters.dateDebut);
      if (customFilters.dateFin) params.append("dateFin", customFilters.dateFin);
      const res = await axios.get(`${API_URL}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (e) {
      setErreur(e.response?.data?.message || "Erreur lors du chargement des statistiques");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const applyQuickFilter = (key) => {
    setActiveQuick(key);
    let next = { ...filters };
    if (key === "ALL")  next = { ...filters, dateDebut: "", dateFin: "" };
    if (key === "7J")   next = { ...filters, dateDebut: daysAgoISO(7), dateFin: todayISO() };
    if (key === "30J")  next = { ...filters, dateDebut: daysAgoISO(30), dateFin: todayISO() };
    if (key === "MOIS") next = { ...filters, dateDebut: monthStartISO(), dateFin: todayISO() };
    setFilters(next); fetchStats(next);
  };

  const chartData = stats?.analyses?.map((a) => ({
    date: new Date(a.dateRush).toLocaleDateString("fr-FR"),
    CA_Brief: a.caBrief, CA_Debrief: a.caDebrief, Ecart_CA: a.ecartCA,
    Staffing_Brief: a.staffingBrief, Staffing_Debrief: a.staffingDebrief,
    Alertes: a.alertes.length,
  })) || [];

  const CHART_COLORS = { primary: "#e8572a", secondary: "#1a1a2e", tertiary: "#6366f1", warn: "#f59e0b" };

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="sd-page">
        {/* ── Header ── */}
        <header className="sd-header">
          <div className="sd-header-inner">
            <div>
              <h1 className="sd-title">Dashboard <span className="sd-title-accent">statistiques</span></h1>
              <p className="sd-subtitle">Analyse des performances, écarts et tendances des rushs.</p>
            </div>
            {stats && (
              <div className="sd-header-kpis">
                <div className="sd-hkpi">
                  <span className="sd-hkpi-val">{stats.totals.totalBriefs}</span>
                  <span className="sd-hkpi-lbl">briefs</span>
                </div>
                <div className="sd-hkpi-sep" />
                <div className="sd-hkpi">
                  <span className="sd-hkpi-val">{stats.totals.moyenneCA}€</span>
                  <span className="sd-hkpi-lbl">CA moyen</span>
                </div>
                <div className="sd-hkpi-sep" />
                <div className="sd-hkpi">
                  <span className="sd-hkpi-val" style={stats.totals.rushsEnDifficulte > 0 ? { color: "#e8572a" } : {}}>
                    {stats.totals.rushsEnDifficulte}
                  </span>
                  <span className="sd-hkpi-lbl">en difficulté</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="sd-main">
          {erreur && (
            <div className="sd-error">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              {erreur}
            </div>
          )}

          {/* ── Filters ── */}
          <section className="sd-card">
            <h2 className="sd-section-title">Filtres</h2>

            <div className="sd-quick-filters">
              {QUICK_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`sd-qbtn${activeQuick === key ? " sd-qbtn--active" : ""}`}
                  onClick={() => applyQuickFilter(key)}
                >{label}</button>
              ))}
            </div>

            <div className="sd-filter-grid">
              <div className="sd-field">
                <label className="sd-label">Rush</label>
                <select className="sd-input" name="rushDu" value={filters.rushDu}
                  onChange={(e) => setFilters((p) => ({ ...p, rushDu: e.target.value }))}>
                  <option value="TOUS">Tous</option>
                  <option value="midi">Midi</option>
                  <option value="soir">Soir</option>
                </select>
              </div>
              <div className="sd-field">
                <label className="sd-label">Date début</label>
                <input className="sd-input" type="date" name="dateDebut" value={filters.dateDebut}
                  onChange={(e) => setFilters((p) => ({ ...p, dateDebut: e.target.value }))} />
              </div>
              <div className="sd-field">
                <label className="sd-label">Date fin</label>
                <input className="sd-input" type="date" name="dateFin" value={filters.dateFin}
                  onChange={(e) => setFilters((p) => ({ ...p, dateFin: e.target.value }))} />
              </div>
            </div>

            <button className="sd-btn-primary" onClick={() => fetchStats()}>
              {loading ? <><span className="sd-spinner" /> Chargement…</> : "Actualiser"}
            </button>
          </section>

          {loading && !stats && (
            <div className="sd-loader">
              <div className="sd-spinner sd-spinner--lg" />
              <p>Chargement des statistiques…</p>
            </div>
          )}

          {stats && (
            <>
              {/* ── KPI Grid ── */}
              <div className="sd-kpi-grid">
                {[
                  { label: "Briefs",           value: stats.totals.totalBriefs },
                  { label: "Débriefs",          value: stats.totals.totalDebriefs },
                  { label: "CA moyen",          value: `${stats.totals.moyenneCA} €` },
                  { label: "Transactions moy.", value: stats.totals.moyenneTransactions },
                  { label: "Staffing moyen",    value: stats.totals.moyenneStaffing },
                  { label: "En difficulté",     value: stats.totals.rushsEnDifficulte, danger: stats.totals.rushsEnDifficulte > 0 },
                ].map((k, i) => (
                  <div key={i} className={`sd-kpi${k.danger ? " sd-kpi--danger" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="sd-kpi-label">{k.label}</span>
                    <span className="sd-kpi-value">{k.value}</span>
                  </div>
                ))}
              </div>

              {/* ── Charts ── */}
              {[
                { title: "CA Brief vs Débrief", type: "bar", keys: [{ k: "CA_Brief", c: CHART_COLORS.primary }, { k: "CA_Debrief", c: CHART_COLORS.secondary }] },
                { title: "Tendance du CA", type: "line", keys: [{ k: "CA_Brief", c: CHART_COLORS.primary }, { k: "CA_Debrief", c: CHART_COLORS.secondary }] },
                { title: "Tendance de l'écart CA", type: "line", keys: [{ k: "Ecart_CA", c: CHART_COLORS.tertiary }] },
                { title: "Staffing Brief vs Débrief", type: "bar", keys: [{ k: "Staffing_Brief", c: CHART_COLORS.primary }, { k: "Staffing_Debrief", c: CHART_COLORS.secondary }] },
                { title: "Tendance staffing", type: "line", keys: [{ k: "Staffing_Brief", c: CHART_COLORS.primary }, { k: "Staffing_Debrief", c: CHART_COLORS.secondary }] },
                { title: "Tendance des alertes", type: "line", keys: [{ k: "Alertes", c: CHART_COLORS.warn }] },
              ].map(({ title, type, keys }) => (
                <section key={title} className="sd-card">
                  <h2 className="sd-section-title">{title}</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    {type === "bar" ? (
                      <BarChart data={chartData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "DM Sans, sans-serif", fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans, sans-serif", fill: "#9ca3af" }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(26,26,46,0.04)" }} />
                        <Legend wrapperStyle={{ fontSize: 12, fontFamily: "DM Sans, sans-serif" }} />
                        {keys.map(({ k, c }) => <Bar key={k} dataKey={k} fill={c} radius={[4, 4, 0, 0]} />)}
                      </BarChart>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "DM Sans, sans-serif", fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans, sans-serif", fill: "#9ca3af" }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, fontFamily: "DM Sans, sans-serif" }} />
                        {keys.map(({ k, c }) => <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2.5} dot={{ r: 3, fill: c }} activeDot={{ r: 5 }} />)}
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </section>
              ))}

              {/* ── Table ── */}
              <section className="sd-card">
                <h2 className="sd-section-title">Analyse des rushs</h2>
                {stats.analyses.length === 0 ? (
                  <p className="sd-empty-text">Aucune analyse disponible.</p>
                ) : (
                  <div className="sd-table-wrap">
                    <table className="sd-table">
                      <thead>
                        <tr>
                          {["Date","Rush","Manager","CA Brief","CA Débrief","Écart CA","Staffing","R2P","Alertes"].map((h) => (
                            <th key={h} className="sd-th">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.analyses.map((item) => (
                          <tr key={item.id} className="sd-tr">
                            <td className="sd-td">{formatDate(item.dateRush)}</td>
                            <td className="sd-td">
                              <span className="sd-rush-badge">{item.rushDu === "midi" ? "Midi" : "Soir"}</span>
                            </td>
                            <td className="sd-td">{item.manager || "-"}</td>
                            <td className="sd-td sd-td--num">{item.caBrief} €</td>
                            <td className="sd-td sd-td--num">{item.caDebrief} €</td>
                            <td className="sd-td">
                              <span className={`sd-ecart-badge${item.ecartCA < 0 ? " sd-ecart-badge--neg" : " sd-ecart-badge--pos"}`}>
                                {item.ecartCA > 0 ? `+${item.ecartCA}` : item.ecartCA} €
                              </span>
                            </td>
                            <td className="sd-td">{item.staffingBrief} → {item.staffingDebrief}</td>
                            <td className="sd-td">{item.r2pBrief} → {item.r2pDebrief}</td>
                            <td className="sd-td">
                              {item.alertes.length === 0
                                ? <span className="sd-ok-badge">OK</span>
                                : item.alertes.map((a, idx) => (
                                    <span key={idx} className="sd-alert-badge">{a}</span>
                                  ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
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
  .sd-page { min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }

  /* Header */
  .sd-header { background: var(--accent); padding: clamp(24px,5vw,48px) clamp(16px,5vw,48px); }
  .sd-header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .sd-title { font-family: 'Syne', sans-serif; font-size: clamp(1.4rem,4vw,2.2rem); font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 6px; }
  .sd-title-accent { color: var(--accent2); }
  .sd-subtitle { font-size: clamp(0.8rem,2vw,0.9rem); color: rgba(255,255,255,0.5); }
  .sd-header-kpis { display: flex; align-items: center; gap: 20px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px 24px; flex-shrink: 0; }
  .sd-hkpi { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .sd-hkpi-val { font-family: 'Syne', sans-serif; font-size: 1.35rem; font-weight: 800; color: #fff; line-height: 1; }
  .sd-hkpi-lbl { font-size: 0.68rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em; }
  .sd-hkpi-sep { width: 1px; height: 36px; background: rgba(255,255,255,0.12); }

  /* Main */
  .sd-main { max-width: 1200px; margin: 0 auto; padding: clamp(20px,4vw,40px) clamp(16px,5vw,48px); display: flex; flex-direction: column; gap: 20px; }

  /* Error */
  .sd-error { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 10px; background: #fee2e2; color: #991b1b; font-size: 0.875rem; font-weight: 500; }

  /* Card / Section */
  .sd-card { background: var(--surface); border-radius: var(--radius); padding: clamp(16px,3vw,28px); box-shadow: var(--shadow); }
  .sd-section-title { font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 18px; }

  /* Quick filters */
  .sd-quick-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
  .sd-qbtn { padding: 8px 16px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--bg); font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.18s ease; }
  .sd-qbtn:hover { border-color: var(--accent); color: var(--accent); }
  .sd-qbtn--active { background: var(--accent); border-color: var(--accent); color: #fff; }

  /* Filter grid */
  .sd-filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 14px; margin-bottom: 18px; }
  .sd-field { display: flex; flex-direction: column; gap: 6px; }
  .sd-label { font-size: 0.8rem; font-weight: 600; color: var(--text); }
  .sd-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: var(--text); outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
  .sd-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,26,46,0.08); }

  /* Buttons */
  .sd-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 700; letter-spacing: 0.03em; cursor: pointer; transition: background 0.18s, transform 0.15s; }
  .sd-btn-primary:hover { background: #2d2d50; }

  /* Loader */
  .sd-loader { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px 0; color: var(--muted); font-size: 0.9rem; }
  .sd-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: sd-spin 0.7s linear infinite; }
  .sd-spinner--lg { width: 36px; height: 36px; border-color: var(--border); border-top-color: var(--accent); }
  @keyframes sd-spin { to { transform: rotate(360deg); } }

  /* KPI Grid */
  .sd-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,170px),1fr)); gap: clamp(10px,2vw,16px); }
  .sd-kpi { background: var(--surface); border-radius: 14px; padding: clamp(14px,2vw,20px); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 8px; border: 1.5px solid transparent; animation: sd-fadein 0.4s ease both; }
  .sd-kpi--danger { border-color: #fecaca; background: #fff8f8; }
  .sd-kpi-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
  .sd-kpi-value { font-family: 'Syne', sans-serif; font-size: clamp(1.4rem,3vw,1.9rem); font-weight: 800; color: var(--text); line-height: 1; }
  .sd-kpi--danger .sd-kpi-value { color: #991b1b; }
  @keyframes sd-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  /* Table */
  .sd-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 10px; border: 1px solid var(--border); }
  .sd-table { width: 100%; border-collapse: collapse; min-width: 700px; font-size: 0.875rem; }
  .sd-th { padding: 11px 14px; text-align: left; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); background: var(--bg); border-bottom: 1px solid var(--border); white-space: nowrap; }
  .sd-tr { transition: background 0.15s; }
  .sd-tr:hover { background: #faf9f6; }
  .sd-td { padding: 11px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; color: var(--text); }
  .sd-td--num { font-family: 'Syne', sans-serif; font-weight: 600; }
  .sd-tr:last-child .sd-td { border-bottom: none; }

  /* Table badges */
  .sd-rush-badge { display: inline-block; padding: 3px 9px; border-radius: 999px; background: rgba(26,26,46,0.08); font-size: 0.75rem; font-weight: 600; color: var(--text); }
  .sd-ecart-badge { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
  .sd-ecart-badge--pos { background: #dcfce7; color: #166534; }
  .sd-ecart-badge--neg { background: #fee2e2; color: #991b1b; }
  .sd-ok-badge { display: inline-block; padding: 3px 9px; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 0.75rem; font-weight: 600; }
  .sd-alert-badge { display: inline-block; margin: 2px 3px 2px 0; padding: 3px 8px; border-radius: 999px; background: #fee2e2; color: #991b1b; font-size: 0.72rem; font-weight: 600; }
  .sd-empty-text { color: var(--muted); font-size: 0.9rem; }

  @media (max-width: 500px) { .sd-header-kpis { display: none; } }
`;