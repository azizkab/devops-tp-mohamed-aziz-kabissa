import { useMemo, useState, useEffect,useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import html2canvas from "html2canvas";

const API_URL = "http://localhost:5000/api/placements";
const todayISO = () => new Date().toISOString().split("T")[0];

const initialPostes = {
  caisse: "", satLad: "", boissons: "", verif: "",
  initiationL1: "", uhc1: "", initiationL2: "", uhc2: "",
  frites: "", produitsFrits: "", oat: "", viandes: "",
};

const postesConfig = [
  {
    group: "Service", className: "pe-left",
    postes: [
      { key: "caisse",  label: "Caisse",   icon: "💰", color: "blue"   },
      { key: "satLad",  label: "SAT/LAD",  icon: "🛵", color: "purple" },
    ],
  },
  {
    group: "Production", className: "pe-center",
    postes: [
      { key: "boissons", label: "Boissons", icon: "🥤", color: "blue", wide: true },
      { key: "verif",    label: "Vérif",    icon: "✅", color: "orange" },
      { type: "double", left: { key: "initiationL1", label: "Initiation", sub: "L1" }, right: { key: "uhc1", label: "UHC1", sub: "Cuisson" } },
      { type: "double", left: { key: "initiationL2", label: "Initiation", sub: "L2" }, right: { key: "uhc2", label: "UHC2", sub: "Cuisson" } },
      { type: "pair", items: [
        { key: "frites",       label: "Frites",    icon: "🍟", color: "orange" },
        { key: "produitsFrits",label: "Pdts Frits",icon: "🍗", color: "orange" },
      ]},
    ],
  },
  {
    group: "Support", className: "pe-right",
    postes: [
      { key: "oat",    label: "OAT",    icon: "⚙️", color: "red" },
      { key: "viandes",label: "Viandes",icon: "🥩", color: "red" },
    ],
  },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "";

export default function PlacementEquipe() {
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [date, setDate]               = useState(todayISO());
  const [rushDu, setRushDu]           = useState("midi");
  const [postes, setPostes]           = useState(initialPostes);
  const [placementId, setPlacementId] = useState(null);
  const [message, setMessage]         = useState("");
  const [erreur, setErreur]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [editingKey, setEditingKey]   = useState(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [historique, setHistorique]   = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);

  const filledCount = useMemo(() => Object.values(postes).filter((v) => v.trim()).length, [postes]);
  const totalPostes = Object.keys(initialPostes).length;
  const pct = Math.round((filledCount / totalPostes) * 100);
  const boardRef = useRef(null);

  /* ── Historique ── */
  const loadHistorique = async () => {
    try {
      setLoadingHist(true);
      const res = await axios.get(API_URL, authHeaders);
      setHistorique(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingHist(false); }
  };

  useEffect(() => { loadHistorique(); }, []);

  /* ── Editor ── */
  const openEditor  = (key, label) => { setEditingKey(key); setEditingLabel(label); setEditingValue(postes[key] || ""); };
  const closeEditor = () => { setEditingKey(null); setEditingLabel(""); setEditingValue(""); };
  const confirmEdit = () => { if (!editingKey) return; setPostes((p) => ({ ...p, [editingKey]: editingValue.trim() })); closeEditor(); };
  const clearSlot   = () => { if (!editingKey) return; setPostes((p) => ({ ...p, [editingKey]: "" })); closeEditor(); };

  const resetPlacement = () => {
    if (!window.confirm("Voulez-vous vider tout le placement ?")) return;
    setPostes(initialPostes); setPlacementId(null); setMessage(""); setErreur("");
  };

  /* ── API ── */
  const savePlacement = async () => {
    try {
      setLoading(true); setMessage(""); setErreur("");
      const payload = { date, rushDu, postes };
      let res;
      if (placementId) { res = await axios.put(`${API_URL}/${placementId}`, payload, authHeaders); }
      else { res = await axios.post(API_URL, payload, authHeaders); setPlacementId(res.data.placement._id); }
      setMessage(res.data.message || "Placement enregistré avec succès");
      loadHistorique();
    } catch (e) { setErreur(e.response?.data?.message || "Erreur lors de l'enregistrement"); }
    finally { setLoading(false); }
  };

  const sendToDiscord = async () => {
  try {
    setLoading(true);
    setMessage("");
    setErreur("");

    let id = placementId;

    // Sauvegarde auto si le placement n'existe pas encore
    if (!id) {
      const saveRes = await axios.post(
        API_URL,
        {
          date,
          rushDu,
          postes,
        },
        authHeaders
      );

      id = saveRes.data.placement._id;

      setPlacementId(id);

      await loadHistorique();
    }

    // Vérification tableau
    if (!boardRef.current) {
      setErreur("Tableau placement introuvable");
      return;
    }

    // Génération image
    const canvas = await html2canvas(boardRef.current, {
      scale: 2,
      backgroundColor: "#fff8f0",
      useCORS: true,
    });

    const imageBase64 = canvas.toDataURL("image/png");

    // Envoi backend
    const discordRes = await axios.post(
      `${API_URL}/${id}/discord-image`,
      {
        imageBase64,
      },
      authHeaders
    );

    setMessage(
      discordRes.data.message ||
        "Image du placement envoyée sur Discord"
    );
  } catch (e) {
    console.error(e);

    setErreur(
      e.response?.data?.message ||
        "Erreur lors de l'envoi de l'image Discord"
    );
  } finally {
    setLoading(false);
  }
};

  const openPlacement = (p) => {
    setPlacementId(p._id); setDate(new Date(p.date).toISOString().split("T")[0]);
    setRushDu(p.rushDu); setPostes({ ...initialPostes, ...(p.postes || {}) });
    window.scrollTo({ top: 0, behavior: "smooth" }); setMessage("Placement chargé");
  };

  const duplicatePlacement = async (id) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/${id}/duplicate`, { date, rushDu }, authHeaders);
      setMessage("Placement copié avec succès"); await loadHistorique(); openPlacement(res.data.placement);
    } catch (e) { setErreur(e.response?.data?.message || "Erreur lors de la copie"); }
    finally { setLoading(false); }
  };

  const deletePlacement = async (id) => {
    if (!window.confirm("Voulez-vous supprimer ce placement ?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/${id}`, authHeaders);
      setMessage("Placement supprimé");
      if (placementId === id) resetPlacement();
      await loadHistorique();
    } catch (e) { setErreur(e.response?.data?.message || "Erreur lors de la suppression"); }
    finally { setLoading(false); }
  };

  const resendDiscord = async (id) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/${id}/discord`, {}, authHeaders);
      setMessage("Placement renvoyé sur Discord");
    } catch (e) { setErreur(e.response?.data?.message || "Erreur lors de l'envoi Discord"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="pe-page">
        {/* ── Header ── */}
        <header className="pe-header">
          <div className="pe-header-inner">
            <div className="pe-header-text">
              <p className="pe-kicker">Organisation terrain</p>
              <h1 className="pe-title">Placement <span className="pe-title-accent">équipe</span></h1>
              <p className="pe-subtitle">Assigne les équipiers aux postes du rush en un clic.</p>
            </div>

            {/* Progress ring */}
            <div className="pe-progress-ring">
              <svg viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e8572a"
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 - (pct / 100) * 2 * Math.PI * 34}
                  transform="rotate(-90 40 40)"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div className="pe-ring-label">
                <span className="pe-ring-count">{filledCount}</span>
                <span className="pe-ring-total">/{totalPostes}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="pe-main">
          {message && (
            <div className="pe-alert pe-alert--success">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 17, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {message}
            </div>
          )}
          {erreur && (
            <div className="pe-alert pe-alert--error">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 17, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              {erreur}
            </div>
          )}

          {/* ── Toolbar ── */}
          <section className="pe-toolbar">
            <div className="pe-field">
              <label className="pe-field-label">Date</label>
              <input className="pe-input" type="date" value={date} onChange={(e) => { setDate(e.target.value); setPlacementId(null); }} />
            </div>
            <div className="pe-field">
              <label className="pe-field-label">Rush</label>
              <select className="pe-input" value={rushDu} onChange={(e) => { setRushDu(e.target.value); setPlacementId(null); }}>
                <option value="midi">☀️ Midi</option>
                <option value="soir">🌙 Soir</option>
              </select>
            </div>
            <div className="pe-toolbar-actions">
              <button className="pe-btn pe-btn--ghost" onClick={resetPlacement} disabled={loading}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15 }}>
                  <path d="M4 4l12 12M9 4H5a1 1 0 00-1 1v3m11 8h-4a1 1 0 01-1-1v-3" strokeLinecap="round" />
                </svg>
                Vider
              </button>
              <button className="pe-btn pe-btn--dark" onClick={savePlacement} disabled={loading}>
                {loading ? <><span className="pe-spinner" />Enreg…</> : <>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15 }}>
                    <path d="M5 13l4 4L15 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Enregistrer
                </>}
              </button>
              <button className="pe-btn pe-btn--discord" onClick={sendToDiscord} disabled={loading}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15 }}>
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                Discord
              </button>
            </div>
          </section>

          {/* ── Board ── */}
          <section className="pe-board" ref={boardRef}>
            <div className="pe-board-header">
              <span className="pe-board-emoji">🍔</span>
              <strong className="pe-board-title">Rush {rushDu === "midi" ? "Midi ☀️" : "Soir 🌙"}</strong>
              {placementId && <span className="pe-board-saved-badge">✓ Sauvegardé</span>}
            </div>

            <div className="pe-layout">
              {postesConfig.map((col) => (
                <div key={col.group} className={`pe-column ${col.className}`}>
                  <h2 className="pe-col-title">{col.group}</h2>
                  {col.postes.map((poste, i) => {
                    if (poste.type === "double") return (
                      <DoubleBox key={`${poste.left.key}-${poste.right.key}`} left={poste.left} right={poste.right} postes={postes} onEdit={openEditor} />
                    );
                    if (poste.type === "pair") return (
                      <div key={i} className="pe-pair">
                        {poste.items.map((item) => <PosteBox key={item.key} poste={item} value={postes[item.key]} onEdit={openEditor} />)}
                      </div>
                    );
                    return <PosteBox key={poste.key} poste={poste} value={postes[poste.key]} onEdit={openEditor} />;
                  })}
                </div>
              ))}
            </div>
          </section>

          {/* ── Historique ── */}
          <section className="pe-history-section">
            <div className="pe-history-head">
              <h2 className="pe-history-title">Historique des placements</h2>
              <button className="pe-btn pe-btn--ghost pe-btn--sm" onClick={loadHistorique}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14 }}>
                  <path d="M4 4v5h5M16 16v-5h-5M4.5 9A7.5 7.5 0 0115.5 9M15.5 11a7.5 7.5 0 01-11 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Actualiser
              </button>
            </div>

            {loadingHist ? (
              <div className="pe-history-empty"><span className="pe-spinner pe-spinner--dark" /> Chargement…</div>
            ) : historique.length === 0 ? (
              <div className="pe-history-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 36, opacity: 0.3 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12h8M12 8v8" strokeLinecap="round" />
                </svg>
                <p>Aucun placement enregistré</p>
              </div>
            ) : (
              <div className="pe-history-list">
                {historique.map((p, i) => (
                  <div key={p._id} className={`pe-history-card${placementId === p._id ? " pe-history-card--active" : ""}`} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="pe-history-info">
                      <div className="pe-history-rush">
                        <span className="pe-history-rush-badge">{p.rushDu === "midi" ? "☀️ Midi" : "🌙 Soir"}</span>
                        <span className="pe-history-date">{fmtDate(p.date)}</span>
                        {placementId === p._id && <span className="pe-active-badge">En cours</span>}
                      </div>
                      <p className="pe-history-author">
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 13, display: "inline", marginRight: 4 }}>
                          <circle cx="10" cy="7" r="3" /><path d="M4 17c0-3 2.686-5 6-5s6 2 6 5" strokeLinecap="round" />
                        </svg>
                        {p.auteurPrenom} {p.auteurNom}
                      </p>
                    </div>
                    <div className="pe-history-actions">
                      <button className="pe-icon-btn" title="Ouvrir" onClick={() => openPlacement(p)}>
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 4H5a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-5M14 4h2v2M10 10l6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <button className="pe-icon-btn" title="Dupliquer" onClick={() => duplicatePlacement(p._id)}>
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M3 13V5a2 2 0 012-2h8" strokeLinecap="round" /></svg>
                      </button>
                      <button className="pe-icon-btn pe-icon-btn--discord" title="Discord" onClick={() => resendDiscord(p._id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14 }}>
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                        </svg>
                      </button>
                      <button className="pe-icon-btn pe-icon-btn--danger" title="Supprimer" onClick={() => deletePlacement(p._id)}>
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ── Modal ── */}
      {editingKey && (
        <div className="pe-modal-backdrop" onMouseDown={closeEditor}>
          <div className="pe-modal" onMouseDown={(e) => e.stopPropagation()}>
            <p className="pe-modal-kicker">Assigner un équipier</p>
            <h3 className="pe-modal-title">{editingLabel}</h3>
            <input
              autoFocus className="pe-modal-input"
              type="text" placeholder="Prénom de l'équipier…" maxLength={30}
              value={editingValue} onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") closeEditor(); }}
            />
            <div className="pe-modal-actions">
              <button className="pe-btn pe-btn--ghost pe-btn--sm" onClick={clearSlot}>Effacer</button>
              <button className="pe-btn pe-btn--ghost pe-btn--sm" onClick={closeEditor}>Annuler</button>
              <button className="pe-btn pe-btn--dark" onClick={confirmEdit}>Valider</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function PosteBox({ poste, value, onEdit }) {
  return (
    <button type="button" className={`pe-box${poste.wide ? " pe-box--wide" : ""}${value ? " pe-box--filled" : ""}`} onClick={() => onEdit(poste.key, poste.label)}>
      <span className="pe-box-icon">{poste.icon}</span>
      <span className="pe-box-label">{poste.label}</span>
      <span className={`pe-slot${value ? " pe-slot--filled" : ""}`}>
        {value ? `👤 ${value}` : "+ Équipier"}
      </span>
    </button>
  );
}

function DoubleBox({ left, right, postes, onEdit }) {
  return (
    <div className="pe-double">
      <button type="button" className={`pe-double-btn${postes[left.key] ? " pe-double-btn--filled" : ""}`} onClick={() => onEdit(left.key, `${left.label} ${left.sub}`)}>
        <small className="pe-double-sub">{left.sub}</small>
        <strong className="pe-double-name">{left.label}</strong>
        <span className={`pe-slot${postes[left.key] ? " pe-slot--filled" : ""}`}>{postes[left.key] ? `👤 ${postes[left.key]}` : "+ Équipier"}</span>
      </button>
      <div className="pe-sep" />
      <button type="button" className={`pe-double-btn${postes[right.key] ? " pe-double-btn--filled" : ""}`} onClick={() => onEdit(right.key, `${right.label} ${right.sub}`)}>
        <small className="pe-double-sub">{right.sub}</small>
        <strong className="pe-double-name">{right.label}</strong>
        <span className={`pe-slot${postes[right.key] ? " pe-slot--filled" : ""}`}>{postes[right.key] ? `👤 ${postes[right.key]}` : "+ Équipier"}</span>
      </button>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --accent:  #1a1a2e; --accent2: #e8572a;
    --bg:      #f4f3ef; --surface: #ffffff;
    --border:  #e5e3db; --text: #1a1a2e; --muted: #6b7280;
    --orange:  #c45c00; --orange-light: #fff8f0; --orange-border: #ffe0c0;
    --discord: #5865f2;
    --radius:  16px; --shadow: 0 2px 20px rgba(26,26,46,0.07);
  }
  .pe-page { min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }

  /* ── Header ── */
  .pe-header { background: var(--accent); padding: clamp(24px,5vw,48px) clamp(16px,5vw,48px); }
  .pe-header-inner { max-width: 1180px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .pe-kicker { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent2); margin-bottom: 6px; }
  .pe-title { font-family: 'Syne', sans-serif; font-size: clamp(1.5rem,4vw,2.4rem); font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 8px; }
  .pe-title-accent { color: var(--accent2); }
  .pe-subtitle { font-size: 0.875rem; color: rgba(255,255,255,0.5); }

  /* Progress ring */
  .pe-progress-ring { position: relative; width: clamp(80px,10vw,96px); flex-shrink: 0; }
  .pe-progress-ring svg { width: 100%; height: auto; display: block; }
  .pe-ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .pe-ring-count { font-family: 'Syne', sans-serif; font-size: clamp(1.1rem,2.5vw,1.4rem); font-weight: 800; color: #fff; line-height: 1; }
  .pe-ring-total { font-size: 0.65rem; color: rgba(255,255,255,0.4); }

  /* ── Main ── */
  .pe-main { max-width: 1180px; margin: 0 auto; padding: clamp(20px,4vw,36px) clamp(16px,5vw,48px); display: flex; flex-direction: column; gap: 20px; }

  /* Alerts */
  .pe-alert { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 10px; font-size: 0.875rem; font-weight: 500; }
  .pe-alert--success { background: #dcfce7; color: #166534; }
  .pe-alert--error   { background: #fee2e2; color: #991b1b; }

  /* Toolbar */
  .pe-toolbar { background: var(--surface); border: 1.5px solid var(--orange-border); border-radius: var(--radius); padding: 16px; display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; box-shadow: var(--shadow); }
  .pe-field { display: flex; flex-direction: column; gap: 6px; }
  .pe-field-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--orange); }
  .pe-input { min-height: 40px; border: 1.5px solid var(--orange-border); background: var(--orange-light); border-radius: 10px; padding: 0 12px; outline: none; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: var(--text); font-weight: 500; transition: border-color 0.18s; }
  .pe-input:focus { border-color: var(--orange); }
  .pe-toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-left: auto; }

  /* Buttons */
  .pe-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 16px; border-radius: 10px; border: none; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.18s ease; white-space: nowrap; }
  .pe-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .pe-btn--dark { background: var(--accent); color: #fff; }
  .pe-btn--dark:hover:not(:disabled) { background: #2d2d50; }
  .pe-btn--ghost { background: var(--orange-light); color: var(--orange); border: 1.5px solid var(--orange-border); }
  .pe-btn--ghost:hover:not(:disabled) { border-color: var(--orange); }
  .pe-btn--discord { background: var(--discord); color: #fff; }
  .pe-btn--discord:hover:not(:disabled) { background: #4752c4; }
  .pe-btn--sm { min-height: 34px; padding: 0 12px; font-size: 0.8rem; }

  /* Spinner */
  .pe-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: pe-spin 0.7s linear infinite; }
  .pe-spinner--dark { border-color: var(--border); border-top-color: var(--accent); }
  @keyframes pe-spin { to { transform: rotate(360deg); } }

  /* ── Board ── */
  .pe-board { background: var(--orange-light); border: 1.5px solid var(--orange-border); border-radius: 20px; padding: clamp(16px,3vw,24px); box-shadow: var(--shadow); }
  .pe-board-header { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
  .pe-board-emoji { font-size: 1.4rem; }
  .pe-board-title { font-family: 'Syne', sans-serif; font-size: clamp(0.95rem,2.5vw,1.15rem); font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--orange); }
  .pe-board-saved-badge { font-size: 0.72rem; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: #dcfce7; color: #166534; }

  /* Layout */
  .pe-layout { display: grid; grid-template-columns: 150px minmax(300px,1fr) 150px; gap: 14px; }
  .pe-column { display: flex; flex-direction: column; gap: 10px; align-items: stretch; }
  .pe-col-title { display: none; }

  /* PosteBox */
  .pe-box { width: 100%; padding: 12px 8px; text-align: center; cursor: pointer; border: 1.5px solid var(--orange-border); border-radius: 14px; background: var(--surface); box-shadow: 0 2px 8px rgba(26,26,46,0.04); transition: all 0.18s ease; font-family: 'DM Sans', sans-serif; }
  .pe-box:hover { border-color: var(--orange); background: #fff4e8; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(196,92,0,0.1); }
  .pe-box--filled { border-color: rgba(26,26,46,0.2); background: #f9f8f5; }
  .pe-box--wide { max-width: 140px; align-self: center; }
  .pe-box-icon { display: block; font-size: 22px; margin-bottom: 4px; }
  .pe-box-label { display: block; font-size: 0.68rem; font-weight: 800; color: var(--orange); letter-spacing: 0.05em; text-transform: uppercase; }

  /* Slot */
  .pe-slot { display: inline-block; margin-top: 7px; padding: 3px 9px; border-radius: 999px; border: 1px dashed #ffb87a; background: #fff4e8; color: #c47a40; font-size: 0.68rem; font-weight: 700; }
  .pe-slot--filled { background: var(--accent); color: #fff; border-color: var(--accent); border-style: solid; }

  /* DoubleBox */
  .pe-double { border: 1.5px solid var(--orange-border); border-radius: 14px; background: var(--surface); box-shadow: 0 2px 8px rgba(26,26,46,0.04); padding: 10px 12px; display: grid; grid-template-columns: 1fr 1px 1fr; gap: 10px; align-items: center; transition: all 0.18s ease; }
  .pe-double:hover { border-color: var(--orange); transform: translateY(-1px); }
  .pe-double-btn { border: none; background: transparent; cursor: pointer; padding: 4px; text-align: center; font-family: inherit; }
  .pe-double-sub { display: block; font-size: 0.62rem; color: #c47a40; margin-bottom: 2px; }
  .pe-double-name { display: block; font-size: 0.7rem; font-weight: 800; color: var(--orange); text-transform: uppercase; letter-spacing: 0.04em; }
  .pe-sep { width: 1px; height: 44px; background: var(--orange-border); }
  .pe-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  /* ── History ── */
  .pe-history-section { background: var(--surface); border-radius: var(--radius); padding: clamp(16px,3vw,28px); box-shadow: var(--shadow); }
  .pe-history-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
  .pe-history-title { font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); }
  .pe-history-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 36px 0; color: var(--muted); font-size: 0.9rem; }
  .pe-history-list { display: flex; flex-direction: column; gap: 10px; }
  .pe-history-card { border: 1.5px solid var(--border); border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; background: var(--bg); animation: pe-fadein 0.35s ease both; transition: box-shadow 0.15s; }
  .pe-history-card:hover { box-shadow: 0 4px 16px rgba(26,26,46,0.08); }
  .pe-history-card--active { border-color: var(--accent2); background: #fff8f5; }
  @keyframes pe-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .pe-history-rush { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
  .pe-history-rush-badge { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; color: var(--text); }
  .pe-history-date { font-size: 0.8rem; color: var(--muted); }
  .pe-active-badge { font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #fff4e8; color: var(--orange); border: 1px solid var(--orange-border); }
  .pe-history-author { font-size: 0.75rem; color: var(--muted); }
  .pe-history-actions { display: flex; gap: 6px; flex-wrap: wrap; }

  /* Icon buttons */
  .pe-icon-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
  .pe-icon-btn svg { width: 15px; height: 15px; }
  .pe-icon-btn:hover { border-color: var(--accent); color: var(--accent); }
  .pe-icon-btn--discord { background: var(--discord); border-color: var(--discord); color: #fff; }
  .pe-icon-btn--discord:hover { background: #4752c4; border-color: #4752c4; }
  .pe-icon-btn--danger:hover { border-color: #dc2626; color: #dc2626; background: #fee2e2; }

  /* ── Modal ── */
  .pe-modal-backdrop { position: fixed; inset: 0; background: rgba(26,26,46,0.55); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 18px; }
  .pe-modal { width: min(100%, 420px); background: var(--surface); border-radius: 20px; padding: 24px; box-shadow: 0 24px 80px rgba(0,0,0,0.22); }
  .pe-modal-kicker { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--orange); margin-bottom: 8px; }
  .pe-modal-title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; color: var(--text); margin-bottom: 18px; }
  .pe-modal-input { width: 100%; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg); font-family: 'DM Sans', sans-serif; font-size: 1rem; color: var(--text); outline: none; margin-bottom: 18px; transition: border-color 0.18s, box-shadow 0.18s; }
  .pe-modal-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,26,46,0.08); }
  .pe-modal-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }

  /* ── Responsive ── */
  @media (max-width: 900px) { .pe-layout { grid-template-columns: 1fr 1.4fr 1fr; } }
  @media (max-width: 700px) {
    .pe-toolbar-actions { margin-left: 0; width: 100%; }
    .pe-btn, .pe-field { width: 100%; justify-content: center; }
    .pe-layout { grid-template-columns: 1fr; }
    .pe-column { background: var(--surface); border-radius: 16px; padding: 14px; border: 1.5px solid var(--orange-border); }
    .pe-col-title { display: block; font-family: 'Syne', sans-serif; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--orange); margin-bottom: 10px; }
    .pe-box--wide { max-width: none; }
    .pe-history-card { flex-direction: column; align-items: flex-start; }
    .pe-history-actions { width: 100%; }
    .pe-icon-btn { flex: 1; height: 38px; width: auto; border-radius: 10px; }
  }
`;