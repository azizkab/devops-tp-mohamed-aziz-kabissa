import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const ROLES = ["ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"];

const ROLE_COLORS = {
  ADMIN:     { bg: "#fef3c7", color: "#92400e" },
  DIRECTEUR: { bg: "#dbeafe", color: "#1e3a8a" },
  MANAGER:   { bg: "#f3e8ff", color: "#6b21a8" },
  FORMATEUR: { bg: "#dcfce7", color: "#166534" },
};

export default function Users() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("TOUS");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nom: "", prenom: "", motDePasse: "", role: "MANAGER" });

  const canManageUsers = ["ADMIN", "DIRECTEUR"].includes(user?.role);
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/users`, authHeaders);
      setUsers(res.data);
    } catch (e) {
      setErreur(e.response?.data?.message || "Erreur lors du chargement");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const resetForm = () => {
    setFormData({ nom: "", prenom: "", motDePasse: "", role: "MANAGER" });
    setEditingUser(null); setShowForm(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault(); setMessage(""); setErreur("");
    try {
      const res = await axios.post(`${API_URL}/users`, formData, authHeaders);
      setMessage(`Utilisateur créé : ${res.data.user.prenom} ${res.data.user.nom} (${res.data.user.identifiant})`);
      resetForm(); fetchUsers();
    } catch (e) { setErreur(e.response?.data?.message || "Erreur lors de la création"); }
  };

  const handleRoleChange = async (id, newRole) => {
    setMessage(""); setErreur("");
    try {
      await axios.patch(`${API_URL}/users/${id}/role`, { role: newRole }, authHeaders);
      setMessage("Rôle mis à jour avec succès"); fetchUsers();
    } catch (e) { setErreur(e.response?.data?.message || "Erreur"); }
  };

  const handleToggleStatus = async (id) => {
    setMessage(""); setErreur("");
    try {
      await axios.patch(`${API_URL}/users/${id}/toggle-status`, {}, authHeaders);
      setMessage("Statut utilisateur mis à jour"); fetchUsers();
    } catch (e) { setErreur(e.response?.data?.message || "Erreur"); }
  };

  const filteredUsers = useMemo(() => users.filter((item) => {
    const txt = `${item.nom} ${item.prenom} ${item.identifiant} ${item.role}`.toLowerCase();
    const matchSearch = txt.includes(search.toLowerCase());
    const matchRole = roleFilter === "TOUS" || item.role === roleFilter;
    const matchStatus = statusFilter === "TOUS" ? true : statusFilter === "ACTIF" ? item.actif : !item.actif;
    return matchSearch && matchRole && matchStatus;
  }), [users, search, roleFilter, statusFilter]);

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="us-page">
        {/* ── Header ── */}
        <header className="us-header">
          <div className="us-header-inner">
            <div>
              <h1 className="us-title">Gestion des <span className="us-title-accent">utilisateurs</span></h1>
              <p className="us-subtitle">Comptes autorisés à se connecter à l'application.</p>
            </div>
            {canManageUsers && (
              <button
                className={`us-btn-primary${showForm || editingUser ? " us-btn-primary--outline" : ""}`}
                onClick={() => (showForm || editingUser) ? resetForm() : setShowForm(true)}
              >
                {showForm || editingUser ? (
                  <>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16 }}>
                      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                    </svg>
                    Fermer
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16 }}>
                      <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                    </svg>
                    Nouvel utilisateur
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        <main className="us-main">
          {/* Alerts */}
          {message && (
            <div className="us-alert us-alert--success">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {message}
            </div>
          )}
          {erreur && (
            <div className="us-alert us-alert--error">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              {erreur}
            </div>
          )}

          {/* ── Create form ── */}
          {canManageUsers && (showForm || editingUser) && (
            <section className="us-card us-card--form">
              <h2 className="us-section-title">
                {editingUser ? "Actions sur l'utilisateur" : "Créer un utilisateur"}
              </h2>
              {!editingUser ? (
                <form onSubmit={handleCreateUser}>
                  <div className="us-form-grid">
                    {[
                      { name: "nom",        placeholder: "Nom",            type: "text"     },
                      { name: "prenom",     placeholder: "Prénom",         type: "text"     },
                      { name: "motDePasse", placeholder: "Mot de passe",   type: "password" },
                    ].map(({ name, placeholder, type }) => (
                      <div key={name} className="us-field">
                        <label className="us-label">{placeholder}</label>
                        <input className="us-input" type={type} name={name} placeholder={placeholder}
                          value={formData[name]} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))} required />
                      </div>
                    ))}
                    <div className="us-field">
                      <label className="us-label">Rôle</label>
                      <select className="us-input" name="role" value={formData.role}
                        onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="us-form-actions">
                    <button type="submit" className="us-btn-primary">Ajouter l'utilisateur</button>
                    <button type="button" className="us-btn-secondary" onClick={resetForm}>Annuler</button>
                  </div>
                </form>
              ) : (
                <div>
                  <p style={{ color: "var(--muted)", marginBottom: 16, fontSize: "0.9rem" }}>
                    Le changement de rôle et l'activation/désactivation se font directement dans le tableau.
                  </p>
                  <button className="us-btn-secondary" onClick={resetForm}>Fermer</button>
                </div>
              )}
            </section>
          )}

          {/* ── Filters ── */}
          <section className="us-card">
            <h2 className="us-section-title">Recherche et filtres</h2>
            <div className="us-filters-grid">
              <div className="us-search-wrap">
                <svg className="us-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="8.5" cy="8.5" r="5" /><path d="M13 13l3.5 3.5" strokeLinecap="round" />
                </svg>
                <input className="us-input us-input--search" type="text" placeholder="Nom, prénom, identifiant…"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button className="us-search-clear" onClick={() => setSearch("")}>×</button>}
              </div>
              <select className="us-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="TOUS">Tous les rôles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select className="us-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="TOUS">Tous les statuts</option>
                <option value="ACTIF">Actifs</option>
                <option value="INACTIF">Inactifs</option>
              </select>
            </div>
            <p className="us-count">{filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? "s" : ""} affiché{filteredUsers.length !== 1 ? "s" : ""}</p>
          </section>

          {/* ── Users list ── */}
          <section className="us-card">
            <h2 className="us-section-title">Liste des utilisateurs</h2>

            {loading ? (
              <div className="us-loader">
                <div className="us-spinner" />
                <p>Chargement…</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="us-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 40, opacity: 0.3 }}>
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" strokeLinecap="round" />
                </svg>
                <p>Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="us-table-wrap">
                  <table className="us-table">
                    <thead>
                      <tr>
                        {["Utilisateur", "Identifiant", "Rôle", "Statut", ...(canManageUsers ? ["Actions"] : [])].map((h) => (
                          <th key={h} className="us-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((item, i) => {
                        const rc = ROLE_COLORS[item.role] || { bg: "#f3f4f6", color: "#374151" };
                        return (
                          <tr key={item._id} className="us-tr" style={{ animationDelay: `${i * 40}ms` }}>
                            <td className="us-td">
                              <div className="us-user-cell">
                                <div className="us-avatar">{item.prenom?.[0]}{item.nom?.[0]}</div>
                                <div>
                                  <div className="us-user-name">{item.prenom} {item.nom}</div>
                                </div>
                              </div>
                            </td>
                            <td className="us-td">
                              <code className="us-identifiant">{item.identifiant}</code>
                            </td>
                            <td className="us-td">
                              {canManageUsers ? (
                                <select className="us-role-select" value={item.role}
                                  style={{ "--rc-bg": rc.bg, "--rc-color": rc.color }}
                                  onChange={(e) => handleRoleChange(item._id, e.target.value)}>
                                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                              ) : (
                                <span className="us-role-badge" style={{ background: rc.bg, color: rc.color }}>{item.role}</span>
                              )}
                            </td>
                            <td className="us-td">
                              <span className={`us-status-badge${item.actif ? " us-status-badge--active" : " us-status-badge--inactive"}`}>
                                <span className="us-status-dot" />
                                {item.actif ? "Actif" : "Inactif"}
                              </span>
                            </td>
                            {canManageUsers && (
                              <td className="us-td">
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button className="us-btn-sm us-btn-sm--ghost" onClick={() => { setEditingUser(item); setShowForm(true); setMessage(""); setErreur(""); }}>
                                    Voir actions
                                  </button>
                                  <button className={`us-btn-sm${item.actif ? " us-btn-sm--danger" : " us-btn-sm--success"}`}
                                    onClick={() => handleToggleStatus(item._id)}>
                                    {item.actif ? "Désactiver" : "Activer"}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="us-mobile-list">
                  {filteredUsers.map((item, i) => {
                    const rc = ROLE_COLORS[item.role] || { bg: "#f3f4f6", color: "#374151" };
                    return (
                      <div key={item._id} className="us-mobile-card" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="us-mobile-top">
                          <div className="us-user-cell">
                            <div className="us-avatar">{item.prenom?.[0]}{item.nom?.[0]}</div>
                            <div>
                              <div className="us-user-name">{item.prenom} {item.nom}</div>
                              <code className="us-identifiant">{item.identifiant}</code>
                            </div>
                          </div>
                          <span className={`us-status-badge${item.actif ? " us-status-badge--active" : " us-status-badge--inactive"}`}>
                            <span className="us-status-dot" />{item.actif ? "Actif" : "Inactif"}
                          </span>
                        </div>
                        <div className="us-mobile-role">
                          {canManageUsers ? (
                            <select className="us-role-select" value={item.role}
                              style={{ "--rc-bg": rc.bg, "--rc-color": rc.color, width: "100%" }}
                              onChange={(e) => handleRoleChange(item._id, e.target.value)}>
                              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className="us-role-badge" style={{ background: rc.bg, color: rc.color }}>{item.role}</span>
                          )}
                        </div>
                        {canManageUsers && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="us-btn-sm us-btn-sm--ghost" style={{ flex: 1 }} onClick={() => { setEditingUser(item); setShowForm(true); }}>Voir actions</button>
                            <button className={`us-btn-sm${item.actif ? " us-btn-sm--danger" : " us-btn-sm--success"}`} style={{ flex: 1 }}
                              onClick={() => handleToggleStatus(item._id)}>
                              {item.actif ? "Désactiver" : "Activer"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
  .us-page { min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }

  /* Header */
  .us-header { background: var(--accent); padding: clamp(24px,5vw,48px) clamp(16px,5vw,48px); }
  .us-header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .us-title { font-family: 'Syne', sans-serif; font-size: clamp(1.4rem,4vw,2.2rem); font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 6px; }
  .us-title-accent { color: var(--accent2); }
  .us-subtitle { font-size: 0.875rem; color: rgba(255,255,255,0.5); }

  /* Buttons */
  .us-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; background: #fff; color: var(--accent); border: none; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 700; letter-spacing: 0.02em; cursor: pointer; transition: background 0.18s, transform 0.15s; }
  .us-btn-primary:hover { background: #f4f3ef; }
  .us-btn-primary--outline { background: rgba(255,255,255,0.12); color: #fff; }
  .us-btn-primary--outline:hover { background: rgba(255,255,255,0.2); }
  .us-btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: var(--bg); color: var(--text); border: 1.5px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: border-color 0.18s; }
  .us-btn-secondary:hover { border-color: var(--accent); }

  /* Main */
  .us-main { max-width: 1100px; margin: 0 auto; padding: clamp(20px,4vw,40px) clamp(16px,5vw,48px); display: flex; flex-direction: column; gap: 18px; }

  /* Alerts */
  .us-alert { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 10px; font-size: 0.875rem; font-weight: 500; }
  .us-alert--success { background: #dcfce7; color: #166534; }
  .us-alert--error   { background: #fee2e2; color: #991b1b; }

  /* Card */
  .us-card { background: var(--surface); border-radius: var(--radius); padding: clamp(16px,3vw,28px); box-shadow: var(--shadow); }
  .us-card--form { border-top: 3px solid var(--accent2); }
  .us-section-title { font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 16px; }

  /* Form */
  .us-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,200px),1fr)); gap: 14px; margin-bottom: 18px; }
  .us-field { display: flex; flex-direction: column; gap: 6px; }
  .us-label { font-size: 0.8rem; font-weight: 600; color: var(--text); }
  .us-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: var(--text); outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
  .us-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,26,46,0.08); }
  .us-form-actions { display: flex; gap: 10px; flex-wrap: wrap; }

  /* Filters */
  .us-filters-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 10px; }
  .us-search-wrap { position: relative; }
  .us-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; color: var(--muted); pointer-events: none; }
  .us-input--search { padding-left: 38px; padding-right: 34px; }
  .us-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border-radius: 50%; background: var(--border); border: none; font-size: 0.95rem; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .us-count { font-size: 0.8rem; color: var(--muted); margin-top: 4px; }

  /* Loader / Empty */
  .us-loader { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 0; color: var(--muted); font-size: 0.9rem; }
  .us-spinner { width: 32px; height: 32px; border: 2.5px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: us-spin 0.7s linear infinite; }
  @keyframes us-spin { to { transform: rotate(360deg); } }
  .us-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 0; color: var(--muted); font-size: 0.9rem; }

  /* Table (desktop) */
  .us-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 10px; border: 1px solid var(--border); }
  .us-table { width: 100%; border-collapse: collapse; min-width: 600px; font-size: 0.875rem; }
  .us-th { padding: 11px 16px; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); background: var(--bg); border-bottom: 1px solid var(--border); white-space: nowrap; }
  .us-tr { animation: us-fadein 0.35s ease both; transition: background 0.15s; }
  .us-tr:hover { background: #faf9f6; }
  .us-td { padding: 12px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .us-tr:last-child .us-td { border-bottom: none; }
  @keyframes us-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

  /* User cell */
  .us-user-cell { display: flex; align-items: center; gap: 10px; }
  .us-avatar { width: 34px; height: 34px; background: var(--accent); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 0.72rem; font-weight: 700; color: #fff; flex-shrink: 0; }
  .us-user-name { font-weight: 500; color: var(--text); font-size: 0.875rem; }
  .us-identifiant { font-family: 'Courier New', monospace; font-size: 0.78rem; color: var(--muted); background: var(--bg); padding: 2px 7px; border-radius: 6px; border: 1px solid var(--border); }

  /* Role select */
  .us-role-select { padding: 5px 10px; border-radius: 999px; border: 1.5px solid transparent; font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none; background: var(--rc-bg, #f3f4f6); color: var(--rc-color, #374151); transition: opacity 0.18s; }
  .us-role-select:hover { opacity: 0.8; }
  .us-role-badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }

  /* Status badge */
  .us-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
  .us-status-badge--active   { background: #dcfce7; color: #166534; }
  .us-status-badge--inactive { background: #f3f4f6; color: #6b7280; }
  .us-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

  /* Action buttons */
  .us-btn-sm { padding: 7px 12px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 500; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; white-space: nowrap; }
  .us-btn-sm--ghost   { background: var(--bg); border-color: var(--border); color: var(--text); }
  .us-btn-sm--ghost:hover { border-color: var(--accent); }
  .us-btn-sm--danger  { background: #fee2e2; border-color: #fecaca; color: #991b1b; }
  .us-btn-sm--danger:hover { background: #fecaca; }
  .us-btn-sm--success { background: #dcfce7; border-color: #bbf7d0; color: #166534; }
  .us-btn-sm--success:hover { background: #bbf7d0; }

  /* Mobile cards */
  .us-mobile-list { display: none; flex-direction: column; gap: 12px; }
  .us-mobile-card { border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 12px; animation: us-fadein 0.35s ease both; }
  .us-mobile-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .us-mobile-role { display: flex; }

  /* Responsive */
  @media (max-width: 700px) {
    .us-filters-grid { grid-template-columns: 1fr; }
    .us-table-wrap { display: none; }
    .us-mobile-list { display: flex; }
  }
  @media (max-width: 480px) {
    .us-form-actions { flex-direction: column; }
    .us-btn-secondary, .us-btn-primary { width: 100%; justify-content: center; }
  }
`;