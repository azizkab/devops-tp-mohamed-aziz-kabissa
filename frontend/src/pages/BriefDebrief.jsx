import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/api/briefs";
const MIDI_CRENEAUX = ["11H-12H", "12H-13H", "13H-14H"];
const SOIR_CRENEAUX = ["18H-19H", "19H-20H", "20H-21H"];

// ─── Utils ────────────────────────────────────────────────────────────────────
const getAutoRushInfo = () => {
  const now = new Date();
  const hour = now.getHours();
  return {
    dateRush: now.toISOString().split("T")[0],
    rushDu: hour >= 8 && hour < 16 ? "midi" : "soir",
  };
};

const formatMinSec = (min, sec) =>
  `${min || "0"}:${(sec || "0").toString().padStart(2, "0")}`;

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("fr-FR") : "";

const createDefaultCreneaux = (rushDu) =>
  (rushDu === "soir" ? SOIR_CRENEAUX : MIDI_CRENEAUX).map((label) => ({
    label, ca: "", tac: "", staffing: "",
    tempsR2PMin: "", tempsR2PSec: "",
    initiationL1: "", initiationL2: "", initiationL3: "",
  }));

const initialBriefData = (ar) => ({
  restaurant: "Restaurant de Sèvres",
  dateRush: ar.dateRush, rushDu: ar.rushDu,
  jourReference1: "", jourReference2: "", evenements: "",
  heurePlusForteCA: "", heurePlusForteGC: "",
  quartHeurePlusFortCA: "", quartHeurePlusFortGC: "",
  canalVentePlusFortCA: "", canalVentePlusFortGC: "",
  pic: "", nombreDeNiveau: "", nombreDeLigne: "", staffing: "",
  zoneDeDanger: "", solution: "",
  tempsInitiationMin: "", tempsInitiationSec: "",
  tempsR2PMin: "", tempsR2PSec: "",
  tempsLADMin: "", tempsLADSec: "",
  objectifSalle: "", objectifProduction: "", objectifFormation: "",
});

const initialDebriefData = (ar) => ({
  restaurant: "Restaurant de Sèvres",
  dateRush: ar.dateRush, rushDu: ar.rushDu,
  creneaux: createDefaultCreneaux(ar.rushDu),
  analyseQuartCA: "", analyseQuartTransaction: "", analyseQuartStaffing: "",
  ecartCaisse: "", absent: "", nbreHelloMcDo: "", nbreFormation: "",
  detailFormation: "", remarque: "",
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BriefDebrief() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const autoRush = getAutoRushInfo();

  const [mode, setMode] = useState("brief");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [briefs, setBriefs] = useState([]);
  const [debriefs, setDebriefs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyType, setHistoryType] = useState("brief");
  const [historyRush, setHistoryRush] = useState("TOUS");
  const [historyDate, setHistoryDate] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [briefData, setBriefData] = useState(initialBriefData(autoRush));
  const [debriefData, setDebriefData] = useState(initialDebriefData(autoRush));

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true); setErreur("");
      const [br, dr] = await Promise.all([
        axios.get(`${API_URL}/brief`, authHeaders),
        axios.get(`${API_URL}/debrief`, authHeaders),
      ]);
      setBriefs(br.data); setDebriefs(dr.data);
    } catch (e) {
      setErreur(e.response?.data?.message || "Erreur lors du chargement de l'historique");
    } finally { setLoadingHistory(false); }
  };

  useEffect(() => { if (mode === "historique") fetchHistory(); }, [mode]);

  const handleBriefChange = (e) => setBriefData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleDebriefChange = (e) => setDebriefData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleCreneauChange = (i, field, value) =>
    setDebriefData((p) => { const c = [...p.creneaux]; c[i] = { ...c[i], [field]: value }; return { ...p, creneaux: c }; });

  const downloadPDF = async (id, type) => {
    try {
      const res = await axios.get(`${API_URL}/${type}/${id}/pdf`, { ...authHeaders, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.setAttribute("download", `${type}-${id}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { setErreur("Erreur lors du téléchargement du PDF"); }
  };

  const deleteItem = async (id, type) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer ce ${type === "brief" ? "brief" : "débrief"} ?`)) return;
    try {
      await axios.delete(`${API_URL}/${type}/${id}`, authHeaders);
      setMessage(`${type === "brief" ? "Brief" : "Débrief"} supprimé avec succès`);
      fetchHistory(); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { setErreur(e.response?.data?.message || "Erreur lors de la suppression"); }
  };

  const saveEdit = async () => {
    try {
      await axios.put(`${API_URL}/${editingType}/${editingItem._id}`, editingItem, authHeaders);
      setMessage(`${editingType === "brief" ? "Brief" : "Débrief"} modifié avec succès`);
      setEditingItem(null); setEditingType(null);
      fetchHistory(); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { setErreur(e.response?.data?.message || "Erreur lors de la modification"); }
  };

  const submitBrief = async (e) => {
    e.preventDefault(); setMessage(""); setErreur("");
    try {
      const b = briefData;
      await axios.post(`${API_URL}/brief`, {
        restaurant: b.restaurant, managerNom: user?.nom, managerPrenom: user?.prenom,
        dateRush: b.dateRush, rushDu: b.rushDu,
        jourReference1: b.jourReference1 || null, jourReference2: b.jourReference2 || null,
        evenements: b.evenements,
        heurePlusForte: { ca: Number(b.heurePlusForteCA) || 0, gc: Number(b.heurePlusForteGC) || 0 },
        quartHeurePlusFort: { ca: Number(b.quartHeurePlusFortCA) || 0, gc: Number(b.quartHeurePlusFortGC) || 0 },
        canalVentePlusFort: { ca: Number(b.canalVentePlusFortCA) || 0, gc: Number(b.canalVentePlusFortGC) || 0 },
        pic: b.pic, nombreDeNiveau: Number(b.nombreDeNiveau) || 0,
        nombreDeLigne: Number(b.nombreDeLigne) || 0, staffing: b.staffing,
        zoneDeDanger: b.zoneDeDanger, solution: b.solution,
        tempsInitiation: formatMinSec(b.tempsInitiationMin, b.tempsInitiationSec),
        tempsR2P: formatMinSec(b.tempsR2PMin, b.tempsR2PSec),
        tempsLAD: formatMinSec(b.tempsLADMin, b.tempsLADSec),
        objectifSalle: b.objectifSalle, objectifProduction: b.objectifProduction,
        objectifFormation: b.objectifFormation,
      }, authHeaders);
      setMessage("Brief enregistré avec succès");
      setBriefData(initialBriefData(getAutoRushInfo()));
    } catch (e) { setErreur(e.response?.data?.error || e.response?.data?.message || "Erreur lors de l'enregistrement du brief"); }
  };

  const submitDebrief = async (e) => {
    e.preventDefault(); setMessage(""); setErreur("");
    try {
      const d = debriefData;
      const res = await axios.post(`${API_URL}/debrief`, {
        userId: user.id, restaurant: d.restaurant,
        managerNom: user?.nom, managerPrenom: user?.prenom,
        dateRush: d.dateRush, rushDu: d.rushDu,
        creneaux: d.creneaux.map((c) => ({
          label: c.label, ca: Number(c.ca) || 0, tac: Number(c.tac) || 0,
          staffing: Number(c.staffing) || 0,
          tempsR2P: { min: Number(c.tempsR2PMin) || 0, sec: Number(c.tempsR2PSec) || 0 },
          initiation: { L1: c.initiationL1 === "" ? null : Number(c.initiationL1), L2: c.initiationL2 === "" ? null : Number(c.initiationL2), L3: c.initiationL3 === "" ? null : Number(c.initiationL3) },
        })),
        analyseQuart: { ca: Number(d.analyseQuartCA) || 0, transaction: Number(d.analyseQuartTransaction) || 0, staffing: Number(d.analyseQuartStaffing) || 0 },
        ecartCaisse: Number(d.ecartCaisse) || 0, absent: Number(d.absent) || 0,
        nbreHelloMcDo: Number(d.nbreHelloMcDo) || 0, nbreFormation: Number(d.nbreFormation) || 0,
        detailFormation: d.detailFormation, remarque: d.remarque,
      }, authHeaders);
      setMessage(res.data?.message || "Débrief enregistré avec succès");
      setDebriefData(initialDebriefData(getAutoRushInfo()));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErreur(e.response?.data?.message || "Erreur lors de l'enregistrement du débrief");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const filteredHistory = useMemo(() => {
    const src = historyType === "brief" ? briefs : debriefs;
    return src.filter((item) => {
      const matchRush = historyRush === "TOUS" || item.rushDu === historyRush;
      const itemDate = item.dateRush ? new Date(item.dateRush).toISOString().split("T")[0] : "";
      return matchRush && (historyDate ? itemDate === historyDate : true);
    });
  }, [historyType, briefs, debriefs, historyRush, historyDate]);

  const TABS = [
    { key: "brief",      label: "Brief",       icon: "📋" },
    { key: "debrief",    label: "Débrief",      icon: "📊" },
    { key: "historique", label: "Historique",   icon: "🕘" },
  ];

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="bd-page">
        {/* ── Header ── */}
        <header className="bd-header">
          <div className="bd-header-inner">
            <div>
              <h1 className="bd-title">Brief / <span className="bd-title-accent">Débrief</span></h1>
              <p className="bd-subtitle">Préparation et analyse du rush pour les rôles autorisés.</p>
            </div>
            <div className="bd-rush-pill">
              <span className="bd-rush-dot" />
              <span>{autoRush.rushDu === "midi" ? "Rush Midi" : "Rush Soir"}</span>
              <span className="bd-rush-date">{formatDate(autoRush.dateRush)}</span>
            </div>
          </div>

          {/* Tabs in header */}
          <div className="bd-header-inner" style={{ marginTop: 24 }}>
            <div className="bd-tabs">
              {TABS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  className={`bd-tab${mode === key ? " bd-tab--active" : ""}`}
                  onClick={() => { setMode(key); setMessage(""); setErreur(""); }}
                >
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="bd-main">
          {message && (
            <div className="bd-alert bd-alert--success">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {message}
            </div>
          )}
          {erreur && (
            <div className="bd-alert bd-alert--error">
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              {erreur}
            </div>
          )}

          {/* ════ BRIEF ════ */}
          {mode === "brief" && (
            <form onSubmit={submitBrief}>
              <BdCard title="Informations générales">
                <div className="bd-grid-2">
                  <BdField label="Restaurant"><input className="bd-input" value={briefData.restaurant} disabled /></BdField>
                  <BdField label="Manager"><input className="bd-input" value={`${user?.prenom || ""} ${user?.nom || ""}`} disabled /></BdField>
                  <BdField label="Date du rush"><input className="bd-input" type="date" value={briefData.dateRush} disabled /></BdField>
                  <BdField label="Rush du"><input className="bd-input" value={briefData.rushDu === "midi" ? "Midi" : "Soir"} disabled /></BdField>
                </div>
              </BdCard>

              <BdCard title="Contexte">
                <div className="bd-grid-2">
                  <BdField label="Jour de référence 1"><input className="bd-input" type="date" name="jourReference1" value={briefData.jourReference1} onChange={handleBriefChange} /></BdField>
                  <BdField label="Jour de référence 2"><input className="bd-input" type="date" name="jourReference2" value={briefData.jourReference2} onChange={handleBriefChange} /></BdField>
                </div>
                <BdField label="Événements"><textarea className="bd-input bd-textarea" name="evenements" value={briefData.evenements} onChange={handleBriefChange} rows={3} /></BdField>
              </BdCard>

              <BdCard title="Conditions du rush">
                <div className="bd-grid-3">
                  <BdFieldset title="Heure la plus forte">
                    <BdField label="CA"><input className="bd-input" type="number" name="heurePlusForteCA" value={briefData.heurePlusForteCA} onChange={handleBriefChange} /></BdField>
                    <BdField label="GC (transactions)"><input className="bd-input" type="number" name="heurePlusForteGC" value={briefData.heurePlusForteGC} onChange={handleBriefChange} /></BdField>
                  </BdFieldset>
                  <BdFieldset title="1/4 le plus fort">
                    <BdField label="CA"><input className="bd-input" type="number" name="quartHeurePlusFortCA" value={briefData.quartHeurePlusFortCA} onChange={handleBriefChange} /></BdField>
                    <BdField label="GC (transactions)"><input className="bd-input" type="number" name="quartHeurePlusFortGC" value={briefData.quartHeurePlusFortGC} onChange={handleBriefChange} /></BdField>
                  </BdFieldset>
                  <BdFieldset title="Canal de vente le plus fort">
                    <BdField label="CA"><input className="bd-input" type="number" name="canalVentePlusFortCA" value={briefData.canalVentePlusFortCA} onChange={handleBriefChange} /></BdField>
                    <BdField label="GC (transactions)"><input className="bd-input" type="number" name="canalVentePlusFortGC" value={briefData.canalVentePlusFortGC} onChange={handleBriefChange} /></BdField>
                  </BdFieldset>
                </div>
                <div className="bd-grid-4" style={{ marginTop: 16 }}>
                  <BdField label="Pic"><input className="bd-input" type="time" name="pic" value={briefData.pic} onChange={handleBriefChange} /></BdField>
                  <BdField label="Niveaux"><input className="bd-input" type="number" name="nombreDeNiveau" value={briefData.nombreDeNiveau} onChange={handleBriefChange} /></BdField>
                  <BdField label="Lignes"><input className="bd-input" type="number" name="nombreDeLigne" value={briefData.nombreDeLigne} onChange={handleBriefChange} /></BdField>
                  <BdField label="Staffing"><input className="bd-input" name="staffing" value={briefData.staffing} onChange={handleBriefChange} /></BdField>
                </div>
                <div className="bd-grid-2">
                  <BdField label="Zone de danger"><textarea className="bd-input bd-textarea" name="zoneDeDanger" value={briefData.zoneDeDanger} onChange={handleBriefChange} rows={3} /></BdField>
                  <BdField label="Solution"><textarea className="bd-input bd-textarea" name="solution" value={briefData.solution} onChange={handleBriefChange} rows={3} /></BdField>
                </div>
              </BdCard>

              <BdCard title="Temps de service">
                <div className="bd-grid-3">
                  {[
                    { title: "Temps d'initiation", minKey: "tempsInitiationMin", secKey: "tempsInitiationSec" },
                    { title: "Temps R2P",           minKey: "tempsR2PMin",       secKey: "tempsR2PSec" },
                    { title: "Temps LAD",           minKey: "tempsLADMin",       secKey: "tempsLADSec" },
                  ].map(({ title, minKey, secKey }) => (
                    <BdFieldset key={title} title={title}>
                      <div className="bd-grid-mini">
                        <BdField label="Min"><input className="bd-input" type="number" name={minKey} value={briefData[minKey]} onChange={handleBriefChange} /></BdField>
                        <BdField label="Sec"><input className="bd-input" type="number" name={secKey} value={briefData[secKey]} onChange={handleBriefChange} /></BdField>
                      </div>
                    </BdFieldset>
                  ))}
                </div>
              </BdCard>

              <BdCard title="Objectifs SMART">
                <BdField label="Objectif salle"><textarea className="bd-input bd-textarea" name="objectifSalle" value={briefData.objectifSalle} onChange={handleBriefChange} rows={3} /></BdField>
                <BdField label="Objectif production"><textarea className="bd-input bd-textarea" name="objectifProduction" value={briefData.objectifProduction} onChange={handleBriefChange} rows={3} /></BdField>
                <BdField label="Objectif formation"><textarea className="bd-input bd-textarea" name="objectifFormation" value={briefData.objectifFormation} onChange={handleBriefChange} rows={3} /></BdField>
              </BdCard>

              <button type="submit" className="bd-btn-submit">Enregistrer le brief</button>
            </form>
          )}

          {/* ════ DÉBRIEF ════ */}
          {mode === "debrief" && (
            <form onSubmit={submitDebrief}>
              <BdCard title="Informations générales">
                <div className="bd-grid-2">
                  <BdField label="Restaurant"><input className="bd-input" value={debriefData.restaurant} disabled /></BdField>
                  <BdField label="Manager"><input className="bd-input" value={`${user?.prenom || ""} ${user?.nom || ""}`} disabled /></BdField>
                  <BdField label="Date du rush"><input className="bd-input" type="date" value={debriefData.dateRush} disabled /></BdField>
                  <BdField label="Rush du"><input className="bd-input" value={debriefData.rushDu === "midi" ? "Midi" : "Soir"} disabled /></BdField>
                </div>
              </BdCard>

              <BdCard title="Analyse par tranche horaire">
                <div className="bd-creneaux-grid">
                  {debriefData.creneaux.map((cr, i) => (
                    <div key={cr.label} className="bd-creneau-card">
                      <div className="bd-creneau-header">{cr.label}</div>
                      <BdField label="Chiffre d'affaires"><input className="bd-input" type="number" value={cr.ca} onChange={(e) => handleCreneauChange(i, "ca", e.target.value)} /></BdField>
                      <BdField label="TAC"><input className="bd-input" type="number" value={cr.tac} onChange={(e) => handleCreneauChange(i, "tac", e.target.value)} /></BdField>
                      <BdField label="Temps R2P">
                        <div className="bd-grid-mini">
                          <input className="bd-input" type="number" placeholder="min" value={cr.tempsR2PMin} onChange={(e) => handleCreneauChange(i, "tempsR2PMin", e.target.value)} />
                          <input className="bd-input" type="number" placeholder="sec" value={cr.tempsR2PSec} onChange={(e) => handleCreneauChange(i, "tempsR2PSec", e.target.value)} />
                        </div>
                      </BdField>
                      <BdField label="Staffing"><input className="bd-input" type="number" value={cr.staffing} onChange={(e) => handleCreneauChange(i, "staffing", e.target.value)} /></BdField>
                      <div className="bd-creneau-initiation">
                        <p className="bd-creneau-initiation-title">Temps d'initiation</p>
                        <p className="bd-creneau-initiation-hint">Laissez vide si ligne fermée</p>
                        <BdField label="L1"><input className="bd-input" type="number" value={cr.initiationL1} onChange={(e) => handleCreneauChange(i, "initiationL1", e.target.value)} /></BdField>
                        <BdField label="L2"><input className="bd-input" type="number" value={cr.initiationL2} onChange={(e) => handleCreneauChange(i, "initiationL2", e.target.value)} /></BdField>
                        <BdField label="L3"><input className="bd-input" type="number" value={cr.initiationL3} onChange={(e) => handleCreneauChange(i, "initiationL3", e.target.value)} /></BdField>
                      </div>
                    </div>
                  ))}
                </div>
              </BdCard>

              <BdCard title="Analyse quart">
                <div className="bd-grid-3">
                  <BdField label="Chiffre d'affaires"><input className="bd-input" type="number" name="analyseQuartCA" value={debriefData.analyseQuartCA} onChange={handleDebriefChange} /></BdField>
                  <BdField label="Transactions"><input className="bd-input" type="number" name="analyseQuartTransaction" value={debriefData.analyseQuartTransaction} onChange={handleDebriefChange} /></BdField>
                  <BdField label="Staffing"><input className="bd-input" type="number" name="analyseQuartStaffing" value={debriefData.analyseQuartStaffing} onChange={handleDebriefChange} /></BdField>
                </div>
              </BdCard>

              <BdCard title="Infos complémentaires">
                <div className="bd-grid-4">
                  <BdField label="Écart caisse"><input className="bd-input" type="number" name="ecartCaisse" value={debriefData.ecartCaisse} onChange={handleDebriefChange} /></BdField>
                  <BdField label="Absent"><input className="bd-input" type="number" name="absent" value={debriefData.absent} onChange={handleDebriefChange} /></BdField>
                  <BdField label="HelloMcDo"><input className="bd-input" type="number" name="nbreHelloMcDo" value={debriefData.nbreHelloMcDo} onChange={handleDebriefChange} /></BdField>
                  <BdField label="Nbre formation"><input className="bd-input" type="number" name="nbreFormation" value={debriefData.nbreFormation} onChange={handleDebriefChange} /></BdField>
                </div>
                <BdField label="Détail formation"><textarea className="bd-input bd-textarea" name="detailFormation" value={debriefData.detailFormation} onChange={handleDebriefChange} rows={3} /></BdField>
                <BdField label="Remarque"><textarea className="bd-input bd-textarea" name="remarque" value={debriefData.remarque} onChange={handleDebriefChange} rows={3} /></BdField>
              </BdCard>

              <button type="submit" className="bd-btn-submit">Enregistrer le débrief</button>
            </form>
          )}

          {/* ════ HISTORIQUE ════ */}
          {mode === "historique" && (
            <>
              <BdCard title="Filtres">
                <div className="bd-grid-3">
                  <BdField label="Type">
                    <select className="bd-input" value={historyType} onChange={(e) => setHistoryType(e.target.value)}>
                      <option value="brief">Brief</option>
                      <option value="debrief">Débrief</option>
                    </select>
                  </BdField>
                  <BdField label="Rush">
                    <select className="bd-input" value={historyRush} onChange={(e) => setHistoryRush(e.target.value)}>
                      <option value="TOUS">Tous</option>
                      <option value="midi">Midi</option>
                      <option value="soir">Soir</option>
                    </select>
                  </BdField>
                  <BdField label="Date">
                    <input className="bd-input" type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} />
                  </BdField>
                </div>
                <button type="button" className="bd-btn-secondary" onClick={fetchHistory}>Actualiser</button>
              </BdCard>

              <BdCard title={`Historique des ${historyType === "brief" ? "briefs" : "débriefs"}`}>
                {loadingHistory ? (
                  <div className="bd-loader"><div className="bd-spinner" /><p>Chargement…</p></div>
                ) : filteredHistory.length === 0 ? (
                  <div className="bd-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 40, opacity: 0.3 }}>
                      <path d="M9 12h6m-3-3v6M5 19H3a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h9a2 2 0 012 2v3" strokeLinecap="round" />
                    </svg>
                    <p>Aucun résultat trouvé.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredHistory.map((item) =>
                      historyType === "brief" ? (
                        <HistoryCard key={item._id} item={item} type="brief"
                          onDetail={() => { setSelectedItem(item); setSelectedType("brief"); setShowDetail(true); }}
                          onDownload={() => downloadPDF(item._id, "brief")}
                          onEdit={() => { setEditingItem(item); setEditingType("brief"); setShowDetail(false); }}
                          onDelete={() => deleteItem(item._id, "brief")}
                        />
                      ) : (
                        <HistoryCard key={item._id} item={item} type="debrief"
                          onDetail={() => { setSelectedItem(item); setSelectedType("debrief"); setShowDetail(true); }}
                          onDownload={() => downloadPDF(item._id, "debrief")}
                          onEdit={() => { setEditingItem(item); setEditingType("debrief"); setShowDetail(false); }}
                          onDelete={() => deleteItem(item._id, "debrief")}
                        />
                      )
                    )}
                  </div>
                )}
              </BdCard>
            </>
          )}

          {/* ── Edit form ── */}
          {editingItem && (
            <BdCard title={`Modifier ${editingType === "brief" ? "le brief" : "le débrief"}`} accent>
              {editingType === "brief" ? (
                <>
                  <BdField label="Événements"><textarea className="bd-input bd-textarea" value={editingItem.evenements || ""} onChange={(e) => setEditingItem({ ...editingItem, evenements: e.target.value })} rows={3} /></BdField>
                  <div className="bd-grid-2">
                    <BdField label="CA heure la plus forte"><input className="bd-input" type="number" value={editingItem.heurePlusForte?.ca || ""} onChange={(e) => setEditingItem({ ...editingItem, heurePlusForte: { ...editingItem.heurePlusForte, ca: Number(e.target.value) } })} /></BdField>
                    <BdField label="GC heure la plus forte"><input className="bd-input" type="number" value={editingItem.heurePlusForte?.gc || ""} onChange={(e) => setEditingItem({ ...editingItem, heurePlusForte: { ...editingItem.heurePlusForte, gc: Number(e.target.value) } })} /></BdField>
                  </div>
                  <BdField label="Staffing"><input className="bd-input" value={editingItem.staffing || ""} onChange={(e) => setEditingItem({ ...editingItem, staffing: e.target.value })} /></BdField>
                  <div className="bd-grid-2">
                    <BdField label="Zone de danger"><textarea className="bd-input bd-textarea" value={editingItem.zoneDeDanger || ""} onChange={(e) => setEditingItem({ ...editingItem, zoneDeDanger: e.target.value })} rows={3} /></BdField>
                    <BdField label="Solution"><textarea className="bd-input bd-textarea" value={editingItem.solution || ""} onChange={(e) => setEditingItem({ ...editingItem, solution: e.target.value })} rows={3} /></BdField>
                  </div>
                </>
              ) : (
                <>
                  <div className="bd-grid-2">
                    <BdField label="CA"><input className="bd-input" type="number" value={editingItem.analyseQuart?.ca || ""} onChange={(e) => setEditingItem({ ...editingItem, analyseQuart: { ...editingItem.analyseQuart, ca: Number(e.target.value) } })} /></BdField>
                    <BdField label="Transactions"><input className="bd-input" type="number" value={editingItem.analyseQuart?.transaction || ""} onChange={(e) => setEditingItem({ ...editingItem, analyseQuart: { ...editingItem.analyseQuart, transaction: Number(e.target.value) } })} /></BdField>
                    <BdField label="Staffing"><input className="bd-input" type="number" value={editingItem.analyseQuart?.staffing || ""} onChange={(e) => setEditingItem({ ...editingItem, analyseQuart: { ...editingItem.analyseQuart, staffing: Number(e.target.value) } })} /></BdField>
                    <BdField label="Écart caisse"><input className="bd-input" type="number" value={editingItem.ecartCaisse || ""} onChange={(e) => setEditingItem({ ...editingItem, ecartCaisse: Number(e.target.value) })} /></BdField>
                  </div>
                  <BdField label="Détail formation"><textarea className="bd-input bd-textarea" value={editingItem.detailFormation || ""} onChange={(e) => setEditingItem({ ...editingItem, detailFormation: e.target.value })} rows={3} /></BdField>
                  <BdField label="Remarque"><textarea className="bd-input bd-textarea" value={editingItem.remarque || ""} onChange={(e) => setEditingItem({ ...editingItem, remarque: e.target.value })} rows={3} /></BdField>
                </>
              )}
              <div className="bd-edit-actions">
                <button type="button" className="bd-btn-submit" style={{ width: "auto" }} onClick={saveEdit}>Enregistrer les modifications</button>
                <button type="button" className="bd-btn-secondary" onClick={() => { setEditingItem(null); setEditingType(null); }}>Annuler</button>
              </div>
            </BdCard>
          )}
        </main>
      </div>

      {showDetail && selectedItem && (
        <DetailModal item={selectedItem} type={selectedType} onClose={() => { setSelectedItem(null); setSelectedType(null); setShowDetail(false); }} />
      )}
    </>
  );
}

// ─── HistoryCard ──────────────────────────────────────────────────────────────
function HistoryCard({ item, type, onDetail, onDownload, onEdit, onDelete }) {
  const isBrief = type === "brief";
  return (
    <div className="bd-history-card">
      <div className="bd-history-card-top">
        <div>
          <div className="bd-history-title">
            <span className={`bd-history-type-badge bd-history-type-badge--${isBrief ? "brief" : "debrief"}`}>
              {isBrief ? "Brief" : "Débrief"}
            </span>
            <span className="bd-history-date">{formatDate(item.dateRush)}</span>
            <span className="bd-rush-pill bd-rush-pill--sm">{item.rushDu === "midi" ? "Midi" : "Soir"}</span>
          </div>
          <p className="bd-history-manager">{item.managerPrenom} {item.managerNom}</p>
        </div>
        <div className="bd-history-actions">
          <button className="bd-icon-btn" onClick={onDetail} title="Détail">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7" /><path d="M10 9v4m0-7.01V6" strokeLinecap="round" /></svg>
          </button>
          <button className="bd-icon-btn" onClick={onDownload} title="PDF">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 16v1a1 1 0 001 1h10a1 1 0 001-1v-1M7 10l3 3 3-3M10 4v9" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="bd-icon-btn" onClick={onEdit} title="Modifier">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9a2 2 0 01-.828.514l-3 1 1-3a2 2 0 01.514-.828l9-9z" strokeLinecap="round" /></svg>
          </button>
          <button className="bd-icon-btn bd-icon-btn--danger" onClick={onDelete} title="Supprimer">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>

      <div className="bd-history-details">
        {isBrief ? (
          <>
            <BdMini title="Heure la + forte" text={`CA ${item.heurePlusForte?.ca || 0} | GC ${item.heurePlusForte?.gc || 0}`} />
            <BdMini title="1/4 le + fort" text={`CA ${item.quartHeurePlusFort?.ca || 0} | GC ${item.quartHeurePlusFort?.gc || 0}`} />
            <BdMini title="Canal de vente" text={`CA ${item.canalVentePlusFort?.ca || 0} | GC ${item.canalVentePlusFort?.gc || 0}`} />
            <BdMini title="Pic" text={item.pic || "-"} />
            <BdMini title="Staffing" text={item.staffing || "-"} />
            <BdMini title="Temps" text={`Init: ${item.tempsInitiation || "-"} | R2P: ${item.tempsR2P || "-"} | LAD: ${item.tempsLAD || "-"}`} />
          </>
        ) : (
          <>
            {(item.creneaux || []).map((c) => (
              <BdMini key={c._id || c.label} title={c.label} text={`CA ${c.ca || 0} | TAC ${c.tac || 0} | Staff ${c.staffing || 0}`} />
            ))}
            <BdMini title="Analyse quart" text={`CA ${item.analyseQuart?.ca || 0} | Tx ${item.analyseQuart?.transaction || 0} | Staff ${item.analyseQuart?.staffing || 0}`} />
            <BdMini title="Écart caisse" text={item.ecartCaisse ?? 0} />
            <BdMini title="Absent" text={item.absent ?? 0} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────
function DetailModal({ item, type, onClose }) {
  const isBrief = type === "brief";
  return (
    <div className="bd-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bd-modal">
        <div className="bd-modal-header">
          <div>
            <h2 className="bd-modal-title">Détail {isBrief ? "du brief" : "du débrief"}</h2>
            <p className="bd-modal-sub">{formatDate(item.dateRush)} — {item.rushDu === "midi" ? "Midi" : "Soir"} — {item.restaurant}</p>
          </div>
          <button className="bd-modal-close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="bd-modal-body">
          <BdCard title="Informations générales">
            <div className="bd-mini-grid">
              <BdMini title="Restaurant" text={item.restaurant || "-"} />
              <BdMini title="Manager" text={`${item.managerPrenom || ""} ${item.managerNom || ""}`} />
              <BdMini title="Date du rush" text={formatDate(item.dateRush)} />
              <BdMini title="Rush du" text={item.rushDu || "-"} />
            </div>
          </BdCard>

          {isBrief ? (
            <>
              <BdCard title="Contexte">
                <div className="bd-mini-grid" style={{ marginBottom: 12 }}>
                  <BdMini title="Jour référence 1" text={formatDate(item.jourReference1) || "-"} />
                  <BdMini title="Jour référence 2" text={formatDate(item.jourReference2) || "-"} />
                </div>
                <BdMini title="Événements" text={item.evenements || "-"} />
              </BdCard>
              <BdCard title="Conditions du rush">
                <div className="bd-mini-grid">
                  <BdMini title="Heure la + forte" text={`CA: ${item.heurePlusForte?.ca || 0} | GC: ${item.heurePlusForte?.gc || 0}`} />
                  <BdMini title="1/4 le + fort" text={`CA: ${item.quartHeurePlusFort?.ca || 0} | GC: ${item.quartHeurePlusFort?.gc || 0}`} />
                  <BdMini title="Canal de vente" text={`CA: ${item.canalVentePlusFort?.ca || 0} | GC: ${item.canalVentePlusFort?.gc || 0}`} />
                  <BdMini title="Pic" text={item.pic || "-"} />
                  <BdMini title="Niveaux" text={item.nombreDeNiveau || 0} />
                  <BdMini title="Lignes" text={item.nombreDeLigne || 0} />
                  <BdMini title="Staffing" text={item.staffing || "-"} />
                  <BdMini title="Zone de danger" text={item.zoneDeDanger || "-"} />
                  <BdMini title="Solution" text={item.solution || "-"} />
                </div>
              </BdCard>
              <BdCard title="Temps de service">
                <div className="bd-mini-grid">
                  <BdMini title="Temps initiation" text={item.tempsInitiation || "-"} />
                  <BdMini title="Temps R2P" text={item.tempsR2P || "-"} />
                  <BdMini title="Temps LAD" text={item.tempsLAD || "-"} />
                </div>
              </BdCard>
              <BdCard title="Objectifs SMART">
                <BdMini title="Objectif salle" text={item.objectifSalle || "-"} />
                <BdMini title="Objectif production" text={item.objectifProduction || "-"} />
                <BdMini title="Objectif formation" text={item.objectifFormation || "-"} />
              </BdCard>
            </>
          ) : (
            <>
              <BdCard title="Analyse par tranche horaire">
                <div className="bd-mini-grid">
                  {(item.creneaux || []).map((c) => (
                    <div key={c._id || c.label} className="bd-mini-item bd-mini-item--creneau">
                      <strong className="bd-mini-label">{c.label}</strong>
                      {[["CA", c.ca || 0], ["TAC", c.tac || 0], ["Staffing", c.staffing || 0],
                        ["R2P", `${c.tempsR2P?.min || 0}m ${c.tempsR2P?.sec || 0}s`],
                        ["Init L1", c.initiation?.L1 ?? "-"], ["Init L2", c.initiation?.L2 ?? "-"], ["Init L3", c.initiation?.L3 ?? "-"],
                      ].map(([k, v]) => (
                        <p key={k} className="bd-mini-line"><span>{k} :</span> {v}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </BdCard>
              <BdCard title="Analyse quart">
                <div className="bd-mini-grid">
                  <BdMini title="CA" text={item.analyseQuart?.ca || 0} />
                  <BdMini title="Transactions" text={item.analyseQuart?.transaction || 0} />
                  <BdMini title="Staffing" text={item.analyseQuart?.staffing || 0} />
                </div>
              </BdCard>
              <BdCard title="Infos complémentaires">
                <div className="bd-mini-grid" style={{ marginBottom: 12 }}>
                  <BdMini title="Écart caisse" text={item.ecartCaisse || 0} />
                  <BdMini title="Absent" text={item.absent || 0} />
                  <BdMini title="HelloMcDo" text={item.nbreHelloMcDo || 0} />
                  <BdMini title="Formation" text={item.nbreFormation || 0} />
                </div>
                <BdMini title="Détail formation" text={item.detailFormation || "-"} />
                <BdMini title="Remarque" text={item.remarque || "-"} />
              </BdCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function BdCard({ title, children, accent }) {
  return (
    <div className={`bd-card${accent ? " bd-card--accent" : ""}`}>
      <h2 className="bd-card-title">{title}</h2>
      {children}
    </div>
  );
}

function BdFieldset({ title, children }) {
  return (
    <div className="bd-fieldset">
      <h3 className="bd-fieldset-title">{title}</h3>
      {children}
    </div>
  );
}

function BdField({ label, children }) {
  return (
    <div className="bd-field">
      <label className="bd-label">{label}</label>
      {children}
    </div>
  );
}

function BdMini({ title, text }) {
  return (
    <div className="bd-mini-item">
      <span className="bd-mini-label">{title}</span>
      <p className="bd-mini-value">{text}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --accent: #1a1a2e; --accent2: #e8572a;
    --bg: #f4f3ef; --surface: #ffffff;
    --border: #e5e3db; --text: #1a1a2e; --muted: #6b7280;
    --radius: 16px; --shadow: 0 2px 20px rgba(26,26,46,0.07);
  }
  .bd-page { min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }

  /* Header */
  .bd-header { background: var(--accent); padding: clamp(24px,5vw,48px) clamp(16px,5vw,48px) 0; }
  .bd-header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .bd-title { font-family: 'Syne', sans-serif; font-size: clamp(1.4rem,4vw,2.2rem); font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 6px; }
  .bd-title-accent { color: var(--accent2); }
  .bd-subtitle { font-size: 0.875rem; color: rgba(255,255,255,0.5); }
  .bd-rush-pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 999px; font-size: 0.8rem; color: rgba(255,255,255,0.8); flex-shrink: 0; }
  .bd-rush-pill--sm { padding: 3px 10px; font-size: 0.72rem; background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.75); }
  .bd-rush-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent2); animation: bd-blink 1.8s ease-in-out infinite; }
  @keyframes bd-blink { 0%,100%{opacity:1} 50%{opacity:.35} }
  .bd-rush-date { color: rgba(255,255,255,0.45); font-size: 0.75rem; }

  /* Tabs */
  .bd-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
  .bd-tab { display: inline-flex; align-items: center; gap: 6px; padding: 12px 20px; border: none; background: transparent; color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; border-bottom: 2.5px solid transparent; transition: color 0.18s, border-color 0.18s; border-radius: 8px 8px 0 0; white-space: nowrap; }
  .bd-tab:hover { color: rgba(255,255,255,0.85); }
  .bd-tab--active { color: #fff; border-bottom-color: var(--accent2); background: rgba(255,255,255,0.06); }

  /* Main */
  .bd-main { max-width: 1100px; margin: 0 auto; padding: clamp(20px,4vw,40px) clamp(16px,5vw,48px); display: flex; flex-direction: column; gap: 18px; }

  /* Alerts */
  .bd-alert { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 10px; font-size: 0.875rem; font-weight: 500; }
  .bd-alert--success { background: #dcfce7; color: #166534; }
  .bd-alert--error   { background: #fee2e2; color: #991b1b; }

  /* Card */
  .bd-card { background: var(--surface); border-radius: var(--radius); padding: clamp(16px,3vw,28px); box-shadow: var(--shadow); }
  .bd-card--accent { border-top: 3px solid var(--accent2); }
  .bd-card-title { font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 18px; }

  /* Fieldset */
  .bd-fieldset { border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; background: var(--bg); }
  .bd-fieldset-title { font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700; color: var(--text); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.08em; }

  /* Fields */
  .bd-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .bd-field:last-child { margin-bottom: 0; }
  .bd-label { font-size: 0.8rem; font-weight: 600; color: var(--text); }
  .bd-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--surface); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: var(--text); outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
  .bd-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,26,46,0.08); }
  .bd-input:disabled { background: var(--bg); color: var(--muted); cursor: default; }
  .bd-textarea { resize: vertical; min-height: 80px; }

  /* Grids */
  .bd-grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,240px),1fr)); gap: 14px; }
  .bd-grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,220px),1fr)); gap: 14px; }
  .bd-grid-4 { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,160px),1fr)); gap: 14px; }
  .bd-grid-mini { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

  /* Buttons */
  .bd-btn-submit { width: 100%; padding: 14px 20px; background: var(--accent); color: #fff; border: none; border-radius: 12px; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; letter-spacing: 0.03em; cursor: pointer; margin-bottom: 8px; transition: background 0.18s, transform 0.15s; }
  .bd-btn-submit:hover { background: #2d2d50; }
  .bd-btn-submit:active { transform: scale(0.99); }
  .bd-btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: var(--bg); color: var(--text); border: 1.5px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; cursor: pointer; transition: border-color 0.18s; }
  .bd-btn-secondary:hover { border-color: var(--accent); }
  .bd-edit-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }

  /* Créneaux */
  .bd-creneaux-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,260px),1fr)); gap: 14px; }
  .bd-creneau-card { border: 1.5px solid var(--border); border-radius: 14px; padding: 16px; background: var(--bg); }
  .bd-creneau-header { font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 700; text-align: center; padding: 8px; background: var(--accent); color: #fff; border-radius: 8px; margin-bottom: 14px; letter-spacing: 0.05em; }
  .bd-creneau-initiation { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .bd-creneau-initiation-title { font-size: 0.78rem; font-weight: 700; color: var(--text); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .bd-creneau-initiation-hint { font-size: 0.72rem; color: var(--muted); margin-bottom: 10px; }

  /* Loader / Empty */
  .bd-loader { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 0; color: var(--muted); font-size: 0.9rem; }
  .bd-spinner { width: 32px; height: 32px; border: 2.5px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: bd-spin 0.7s linear infinite; }
  @keyframes bd-spin { to { transform: rotate(360deg); } }
  .bd-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 0; color: var(--muted); font-size: 0.9rem; }

  /* History cards */
  .bd-history-card { background: var(--bg); border: 1.5px solid var(--border); border-radius: 14px; padding: 16px; transition: box-shadow 0.18s; }
  .bd-history-card:hover { box-shadow: 0 4px 20px rgba(26,26,46,0.09); }
  .bd-history-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .bd-history-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
  .bd-history-date { font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700; color: var(--text); }
  .bd-history-manager { font-size: 0.8rem; color: var(--muted); }
  .bd-history-type-badge { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; }
  .bd-history-type-badge--brief   { background: #dbeafe; color: #1e3a8a; }
  .bd-history-type-badge--debrief { background: #f3e8ff; color: #6b21a8; }
  .bd-history-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .bd-history-details { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,180px),1fr)); gap: 10px; }

  /* Icon buttons */
  .bd-icon-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
  .bd-icon-btn svg { width: 16px; height: 16px; }
  .bd-icon-btn:hover { border-color: var(--accent); color: var(--accent); }
  .bd-icon-btn--danger:hover { border-color: #dc2626; color: #dc2626; background: #fee2e2; }

  /* Mini info */
  .bd-mini-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,160px),1fr)); gap: 10px; }
  .bd-mini-item { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
  .bd-mini-item--creneau { grid-column: span 1; }
  .bd-mini-label { font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; display: block; margin-bottom: 4px; }
  .bd-mini-value { font-size: 0.875rem; font-weight: 500; color: var(--text); }
  .bd-mini-line { font-size: 0.8rem; color: var(--text); margin-top: 3px; }
  .bd-mini-line span { color: var(--muted); }

  /* Modal */
  .bd-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 9999; }
  .bd-modal { background: var(--bg); border-radius: 20px 20px 0 0; width: 100%; max-width: 1100px; max-height: 92vh; overflow-y: auto; }
  .bd-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: clamp(16px,3vw,28px); padding-bottom: 0; position: sticky; top: 0; background: var(--bg); z-index: 1; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .bd-modal-title { font-family: 'Syne', sans-serif; font-size: clamp(1.1rem,3vw,1.4rem); font-weight: 800; color: var(--text); }
  .bd-modal-sub { font-size: 0.85rem; color: var(--muted); margin-top: 4px; }
  .bd-modal-close { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--muted); cursor: pointer; flex-shrink: 0; transition: all 0.15s; }
  .bd-modal-close svg { width: 18px; height: 18px; }
  .bd-modal-close:hover { border-color: var(--accent); color: var(--accent); }
  .bd-modal-body { padding: clamp(16px,3vw,28px); display: flex; flex-direction: column; gap: 16px; }

  @media (max-width: 480px) {
    .bd-edit-actions { flex-direction: column; }
    .bd-btn-submit { width: 100% !important; }
  }
`;