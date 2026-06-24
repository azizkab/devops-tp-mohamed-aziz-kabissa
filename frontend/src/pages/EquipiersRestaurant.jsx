import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/api";

export default function EquipiersRestaurant() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const [equipiers, setEquipiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("TOUS");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nom: "", prenom: "", dateEntree: "", statut: "", telephone: "", email: "" });

  const canManage = ["ADMIN", "DIRECTEUR"].includes(user?.role);
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const resetForm = () => {
    setFormData({ nom: "", prenom: "", dateEntree: "", statut: "", telephone: "", email: "" });
    setEditingId(null); setShowForm(false);
  };

  const fetchEquipiers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/equipiers`, authHeaders);
      setEquipiers(res.data);
    } catch (e) { setErreur(e.response?.data?.message || "Erreur lors du chargement"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEquipiers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage(""); setErreur("");
    try {
      if (editingId) {
        await axios.put(`${API_URL}/equipiers/${editingId}`, formData, authHeaders);
        setMessage("Équipier modifié avec succès");
      } else {
        await axios.post(`${API_URL}/equipiers`, formData, authHeaders);
        setMessage("Équipier ajouté avec succès");
      }
      resetForm(); fetchEquipiers();
    } catch (e) { setErreur(e.response?.data?.message || "Erreur lors de l'enregistrement"); }
  };

  const handleEdit = (eq) => {
    setEditingId(eq._id); setShowForm(true);
    setFormData({
      nom: eq.nom || "", prenom: eq.prenom || "",
      dateEntree: eq.dateEntree ? new Date(eq.dateEntree).toISOString().split("T")[0] : "",
      statut: eq.statut || "", telephone: eq.telephone || "", email: eq.email || "",
    });
    setMessage(""); setErreur("");
  };

  const handleToggleStatus = async (id) => {
    setMessage(""); setErreur("");
    try {
      await axios.patch(`${API_URL}/equipiers/${id}/toggle-status`, {}, authHeaders);
      setMessage("Statut mis à jour"); fetchEquipiers();
    } catch (e) { setErreur(e.response?.data?.message || "Erreur"); }
  };

  const uniqueStatuts = useMemo(() => {
    const vals = equipiers.map((e) => e.statut?.trim()).filter(Boolean);
    return [...new Set(vals)].sort((a, b) => a.localeCompare(b));
  }, [equipiers]);

  const filtered = useMemo(() => equipiers.filter((eq) => {
    const txt = `${eq.nom} ${eq.prenom} ${eq.telephone} ${eq.email}`.toLowerCase();
    return txt.includes(search.toLowerCase()) && (statutFilter === "TOUS" || eq.statut === statutFilter);
  }), [equipiers, search, statutFilter]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "";

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="er-page">
        {/* ── Header ── */}
        <header className="er-header">
          <div className="er-header-inner">
            <div>
              <h1 className="er-title">Équipiers du <span className="er-title-accent">restaurant</span></h1>
              <p className="er-subtitle">Suivi et gestion de l'équipe.</p>
            </div>
            {canManage && (
              <button
                className={`er-btn-primary${showForm || editingId ? " er-btn-primary--outline" : ""}`}
                onClick={() => (showForm || editingId) ? resetForm() : setShowForm(true)}
              >
                {showForm || editingId ? (
                  <><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16 }}><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg> Fermer</>
                ) : (
                  <><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16 }}><path d="M10 4v12M4 10h12" strokeLinecap="round" /></svg> Nouvel équipier</>
                )}
              </button>
            )}
          </div>
        </header>

        <main className="er-main">
          {message && (
            <div className="er-alert er-alert--success">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {message}
            </div>
          )}
          {erreur && (
            <div className="er-alert er-alert--error">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              {erreur}
            </div>
          )}

          {/* ── Form ── */}
          {canManage && (showForm || editingId) && (
            <section className="er-card er-card--form">
              <h2 className="er-section-title">{editingId ? "Modifier un équipier" : "Ajouter un équipier"}</h2>
              <form onSubmit={handleSubmit}>
                <div className="er-form-grid">
                  {[
                    { name: "nom",       placeholder: "Nom",        type: "text",  required: true },
                    { name: "prenom",    placeholder: "Prénom",     type: "text",  required: true },
                    { name: "statut",    placeholder: "Statut",     type: "text" },
                    { name: "dateEntree",placeholder: "Date d'entrée", type: "date" },
                    { name: "telephone", placeholder: "Téléphone",  type: "text" },
                    { name: "email",     placeholder: "Email",      type: "email" },
                  ].map(({ name, placeholder, type, required }) => (
                    <div key={name} className="er-field">
                      <label className="er-label">{placeholder}</label>
                      <input className="er-input" type={type} name={name} placeholder={placeholder}
                        value={formData[name]} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))}
                        required={required} />
                    </div>
                  ))}
                </div>
                <div className="er-form-actions">
                  <button type="submit" className="er-btn-dark">
                    {editingId ? "Enregistrer les modifications" : "Ajouter l'équipier"}
                  </button>
                  <button type="button" className="er-btn-secondary" onClick={resetForm}>Annuler</button>
                </div>
              </form>
            </section>
          )}

          {/* ── Filters ── */}
          <section className="er-card">
            <h2 className="er-section-title">Recherche et filtres</h2>
            <div className="er-filters-grid">
              <div className="er-search-wrap">
                <svg className="er-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="8.5" cy="8.5" r="5" /><path d="M13 13l3.5 3.5" strokeLinecap="round" />
                </svg>
                <input className="er-input er-input--search" type="text" placeholder="Nom, prénom, téléphone, email…"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button className="er-search-clear" onClick={() => setSearch("")}>×</button>}
              </div>
              <select className="er-input" value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
                <option value="TOUS">Tous les statuts</option>
                {uniqueStatuts.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <p className="er-count">{filtered.length} équipier{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}</p>
          </section>

          {/* ── List ── */}
          <section className="er-card">
            <h2 className="er-section-title">Liste des équipiers</h2>

            {loading ? (
              <div className="er-loader"><div className="er-spinner" /><p>Chargement…</p></div>
            ) : filtered.length === 0 ? (
              <div className="er-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 40, opacity: 0.3 }}>
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" strokeLinecap="round" />
                </svg>
                <p>Aucun équipier trouvé</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="er-table-wrap">
                  <table className="er-table">
                    <thead>
                      <tr>
                        {["Équipier", "Statut poste", "Date d'entrée", "Téléphone", "Email", "État", ...(canManage ? ["Actions"] : [])].map((h) => (
                          <th key={h} className="er-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((eq, i) => (
                        <tr key={eq._id} className="er-tr" style={{ animationDelay: `${i * 40}ms` }}>
                          <td className="er-td">
                            <div className="er-user-cell">
                              <div className="er-avatar">{eq.prenom?.[0]}{eq.nom?.[0]}</div>
                              <div>
                                <div className="er-user-name">{eq.prenom} {eq.nom}</div>
                              </div>
                            </div>
                          </td>
                          <td className="er-td">
                            {eq.statut ? <span className="er-statut-badge">{eq.statut}</span> : <span className="er-td-muted">—</span>}
                          </td>
                          <td className="er-td er-td-muted">{fmtDate(eq.dateEntree) || "—"}</td>
                          <td className="er-td">
                            {eq.telephone
                              ? <a href={`tel:${eq.telephone}`} className="er-link">{eq.telephone}</a>
                              : <span className="er-td-muted">—</span>}
                          </td>
                          <td className="er-td">
                            {eq.email
                              ? <a href={`mailto:${eq.email}`} className="er-link er-link--break">{eq.email}</a>
                              : <span className="er-td-muted">—</span>}
                          </td>
                          <td className="er-td">
                            <span className={`er-status-badge${eq.actif ? " er-status-badge--active" : " er-status-badge--inactive"}`}>
                              <span className="er-status-dot" />{eq.actif ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          {canManage && (
                            <td className="er-td">
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button className="er-btn-sm er-btn-sm--ghost" onClick={() => handleEdit(eq)}>Modifier</button>
                                <button className={`er-btn-sm${eq.actif ? " er-btn-sm--danger" : " er-btn-sm--success"}`}
                                  onClick={() => handleToggleStatus(eq._id)}>
                                  {eq.actif ? "Désactiver" : "Activer"}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="er-mobile-list">
                  {filtered.map((eq, i) => (
                    <div key={eq._id} className="er-mobile-card" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="er-mobile-top">
                        <div className="er-user-cell">
                          <div className="er-avatar">{eq.prenom?.[0]}{eq.nom?.[0]}</div>
                          <div>
                            <div className="er-user-name">{eq.prenom} {eq.nom}</div>
                            {eq.statut && <div className="er-mobile-sub">{eq.statut}</div>}
                          </div>
                        </div>
                        <span className={`er-status-badge${eq.actif ? " er-status-badge--active" : " er-status-badge--inactive"}`}>
                          <span className="er-status-dot" />{eq.actif ? "Actif" : "Inactif"}
                        </span>
                      </div>

                      <div className="er-mobile-details">
                        {eq.dateEntree && <><span className="er-mobile-key">Entrée</span><span>{fmtDate(eq.dateEntree)}</span></>}
                        {eq.telephone && <><span className="er-mobile-key">Tél.</span><a href={`tel:${eq.telephone}`} className="er-link">{eq.telephone}</a></>}
                        {eq.email && <><span className="er-mobile-key">Email</span><a href={`mailto:${eq.email}`} className="er-link er-link--break">{eq.email}</a></>}
                      </div>

                      {canManage && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="er-btn-sm er-btn-sm--ghost" style={{ flex: 1 }} onClick={() => handleEdit(eq)}>Modifier</button>
                          <button className={`er-btn-sm${eq.actif ? " er-btn-sm--danger" : " er-btn-sm--success"}`}
                            style={{ flex: 1 }} onClick={() => handleToggleStatus(eq._id)}>
                            {eq.actif ? "Désactiver" : "Activer"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
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
  .er-page { min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
  .er-header { background: var(--accent); padding: clamp(24px,5vw,48px) clamp(16px,5vw,48px); }
  .er-header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .er-title { font-family: 'Syne', sans-serif; font-size: clamp(1.4rem,4vw,2.2rem); font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 6px; }
  .er-title-accent { color: var(--accent2); }
  .er-subtitle { font-size: 0.875rem; color: rgba(255,255,255,0.5); }
  .er-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; background: #fff; color: var(--accent); border: none; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: background 0.18s; white-space: nowrap; }
  .er-btn-primary:hover { background: #f4f3ef; }
  .er-btn-primary--outline { background: rgba(255,255,255,0.12); color: #fff; }
  .er-btn-primary--outline:hover { background: rgba(255,255,255,0.2); }
  .er-main { max-width: 1100px; margin: 0 auto; padding: clamp(20px,4vw,40px) clamp(16px,5vw,48px); display: flex; flex-direction: column; gap: 18px; }
  .er-alert { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 10px; font-size: 0.875rem; font-weight: 500; }
  .er-alert--success { background: #dcfce7; color: #166534; }
  .er-alert--error   { background: #fee2e2; color: #991b1b; }
  .er-card { background: var(--surface); border-radius: var(--radius); padding: clamp(16px,3vw,28px); box-shadow: var(--shadow); }
  .er-card--form { border-top: 3px solid var(--accent2); }
  .er-section-title { font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 16px; }
  .er-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,200px),1fr)); gap: 14px; margin-bottom: 18px; }
  .er-field { display: flex; flex-direction: column; gap: 6px; }
  .er-label { font-size: 0.8rem; font-weight: 600; color: var(--text); }
  .er-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: var(--text); outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
  .er-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,26,46,0.08); }
  .er-form-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .er-btn-dark { display: inline-flex; align-items: center; gap: 6px; padding: 11px 18px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: background 0.18s; }
  .er-btn-dark:hover { background: #2d2d50; }
  .er-btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: var(--bg); color: var(--text); border: 1.5px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; cursor: pointer; transition: border-color 0.18s; }
  .er-btn-secondary:hover { border-color: var(--accent); }
  .er-filters-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 10px; }
  .er-search-wrap { position: relative; }
  .er-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; color: var(--muted); pointer-events: none; }
  .er-input--search { padding-left: 38px; padding-right: 34px; }
  .er-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border-radius: 50%; background: var(--border); border: none; font-size: 0.95rem; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .er-count { font-size: 0.8rem; color: var(--muted); }
  .er-loader { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 0; color: var(--muted); font-size: 0.9rem; }
  .er-spinner { width: 32px; height: 32px; border: 2.5px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: er-spin 0.7s linear infinite; }
  @keyframes er-spin { to { transform: rotate(360deg); } }
  .er-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 0; color: var(--muted); font-size: 0.9rem; }
  .er-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 10px; border: 1px solid var(--border); }
  .er-table { width: 100%; border-collapse: collapse; min-width: 680px; font-size: 0.875rem; }
  .er-th { padding: 11px 16px; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); background: var(--bg); border-bottom: 1px solid var(--border); white-space: nowrap; }
  .er-tr { animation: er-fadein 0.35s ease both; transition: background 0.15s; }
  .er-tr:hover { background: #faf9f6; }
  .er-td { padding: 12px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .er-tr:last-child .er-td { border-bottom: none; }
  .er-td-muted { color: var(--muted); font-size: 0.85rem; }
  @keyframes er-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .er-user-cell { display: flex; align-items: center; gap: 10px; }
  .er-avatar { width: 34px; height: 34px; background: var(--accent); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 0.72rem; font-weight: 700; color: #fff; flex-shrink: 0; }
  .er-user-name { font-weight: 500; font-size: 0.875rem; color: var(--text); }
  .er-statut-badge { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; background: rgba(26,26,46,0.07); color: var(--text); }
  .er-link { color: var(--accent); text-decoration: none; font-size: 0.875rem; transition: color 0.15s; }
  .er-link:hover { color: var(--accent2); }
  .er-link--break { word-break: break-all; }
  .er-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
  .er-status-badge--active   { background: #dcfce7; color: #166534; }
  .er-status-badge--inactive { background: #f3f4f6; color: #6b7280; }
  .er-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .er-btn-sm { padding: 7px 12px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 500; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; white-space: nowrap; }
  .er-btn-sm--ghost   { background: var(--bg); border-color: var(--border); color: var(--text); }
  .er-btn-sm--ghost:hover { border-color: var(--accent); }
  .er-btn-sm--danger  { background: #fee2e2; border-color: #fecaca; color: #991b1b; }
  .er-btn-sm--danger:hover { background: #fecaca; }
  .er-btn-sm--success { background: #dcfce7; border-color: #bbf7d0; color: #166534; }
  .er-btn-sm--success:hover { background: #bbf7d0; }
  .er-mobile-list { display: none; flex-direction: column; gap: 12px; }
  .er-mobile-card { border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 12px; animation: er-fadein 0.35s ease both; }
  .er-mobile-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .er-mobile-sub { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
  .er-mobile-details { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 0.8rem; }
  .er-mobile-key { color: var(--muted); }
  @media (max-width: 700px) {
    .er-filters-grid { grid-template-columns: 1fr; }
    .er-table-wrap { display: none; }
    .er-mobile-list { display: flex; }
  }
  @media (max-width: 480px) {
    .er-form-actions { flex-direction: column; }
    .er-btn-dark, .er-btn-secondary { width: 100%; justify-content: center; }
  }
`;