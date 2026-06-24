import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";

const API_URL = "http://localhost:5000/api/formations";

export default function EquipierFormations() {
  const { equipierId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [erreur, setErreur] = useState("");

  const fetchData = async () => {
    try {
      setErreur("");

      const [formationsRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/equipier/${equipierId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),

        axios.get(`${API_URL}/equipier/${equipierId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setData(formationsRes.data);
      setHistory(historyRes.data.history || []);
    } catch (error) {
      setErreur("Erreur lors du chargement des formations");
    }
  };

  useEffect(() => {
    fetchData();
  }, [equipierId]);

  const downloadSignedPDF = async (validationId, formationCode) => {
    try {
      const res = await axios.get(`${API_URL}/completed-pdf/${validationId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `${formationCode}-${equipierId}.pdf`);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErreur("Erreur lors du téléchargement du PDF signé");
    }
  };

  if (!data) {
    return (
      <>
        <style>{globalStyles}</style>
        <Navbar />
        <div className="ef-page">
          <div className="ef-loader">
            <div className="ef-spinner" />
            <p className="ef-loader-text">Chargement des formations…</p>
          </div>
        </div>
      </>
    );
  }

  const pct = data.experience;
  const ring = 2 * Math.PI * 54;
  const ringOffset = ring - (pct / 100) * ring;

  return (
    <>
      <style>{globalStyles}</style>
      <Navbar />

      <div className="ef-page">
        <header className="ef-header">
          <div className="ef-header-inner">
            <div className="ef-avatar">
              {data.equipier.prenom?.[0]}
              {data.equipier.nom?.[0]}
            </div>

            <div className="ef-header-text">
              <h1 className="ef-title">
                {data.equipier.prenom}{" "}
                <span className="ef-title-accent">{data.equipier.nom}</span>
              </h1>

              <p className="ef-subtitle">
                {data.formationsValidees} / {data.totalFormations} formations
                validées
              </p>
            </div>

            <div className="ef-exp-ring">
              <svg viewBox="0 0 120 120" className="ef-ring-svg">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="var(--track)"
                  strokeWidth="8"
                />

                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ring}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 60 60)"
                  className="ef-ring-progress"
                />
              </svg>

              <div className="ef-ring-label">
                <span className="ef-ring-pct">{pct}%</span>
                <span className="ef-ring-sub">XP</span>
              </div>
            </div>
          </div>

          {erreur && <div className="ef-error">{erreur}</div>}
        </header>

        <main className="ef-main">
          <section className="ef-section">
            <h2 className="ef-section-title">Formations</h2>

            <div className="ef-grid">
              {data.formations.map((formation, i) => {
                const validated = formation.statut === "VALIDEE";

                return (
                  <article
                    key={formation.code}
                    className={`ef-card ${
                      validated ? "ef-card--valid" : "ef-card--invalid"
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="ef-card-top">
                      <span
                        className={`ef-badge ${
                          validated ? "ef-badge--valid" : "ef-badge--invalid"
                        }`}
                      >
                        {validated ? "✓ Validée" : "✗ Non validée"}
                      </span>

                      <span className="ef-card-code">{formation.code}</span>
                    </div>

                    <h3 className="ef-card-title">{formation.titre}</h3>

                    <div className="ef-score-row">
                      <span className="ef-score-label">Score</span>

                      <div className="ef-score-bar-wrap">
                        <div
                          className="ef-score-bar"
                          style={{ "--score": `${formation.score}%` }}
                        />
                      </div>

                      <span className="ef-score-value">{formation.score}%</span>
                    </div>

                    <button
                      className="ef-btn"
                      onClick={() =>
                        navigate(
                          `/formations/equipier/${equipierId}/formation/${formation.code}`
                        )
                      }
                    >
                      Ouvrir la formation
                      <svg
                        className="ef-btn-icon"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M4 10h12M11 5l5 5-5 5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="ef-docs-section">
            <h2 className="ef-section-title">Documents signés</h2>

            {history.length === 0 ? (
              <div className="ef-empty">
                Aucun document signé pour cet équipier.
              </div>
            ) : (
              <div className="ef-history-list">
                {history.map((item) => (
                  <article key={item._id} className="ef-history-row">
                    <div>
                      <h3 className="ef-history-title">{item.formationTitre}</h3>

                      <p className="ef-history-meta">
                        Date :{" "}
                        {item.dateValidation
                          ? new Date(item.dateValidation).toLocaleDateString(
                              "fr-FR"
                            )
                          : "-"}
                      </p>

                      <p className="ef-history-meta">
                        Formateur : {item.formateurPrenom} {item.formateurNom}
                      </p>
                    </div>

                    <div className="ef-history-status">
                      <strong>{item.score}%</strong>

                      <span
                        className={`ef-history-badge ${
                          item.validee
                            ? "ef-history-badge--valid"
                            : "ef-history-badge--invalid"
                        }`}
                      >
                        {item.validee ? "Validée" : "Non validée"}
                      </span>
                    </div>

                    {item.pdfRempliPath ? (
                      <button
                        className="ef-download-btn"
                        onClick={() =>
                          downloadSignedPDF(item._id, item.formationCode)
                        }
                      >
                        Télécharger PDF signé
                      </button>
                    ) : (
                      <span className="ef-no-pdf">Aucun PDF</span>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

  :root {
    --bg:       #f4f3ef;
    --surface:  #ffffff;
    --accent:   #1a1a2e;
    --accent2:  #e8572a;
    --text:     #1a1a2e;
    --muted:    #6b7280;
    --track:    #e5e3db;
    --valid:    #166534;
    --valid-bg: #dcfce7;
    --invalid:  #991b1b;
    --invalid-bg:#fee2e2;
    --radius:   16px;
    --shadow:   0 2px 20px rgba(26,26,46,0.07);
  }

  .ef-page {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }

  .ef-loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 16px;
  }

  .ef-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--track);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: ef-spin 0.8s linear infinite;
  }

  @keyframes ef-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .ef-loader-text {
    color: var(--muted);
    font-size: 0.9rem;
  }

  .ef-header {
    background: var(--accent);
    color: #fff;
    padding: clamp(24px, 5vw, 48px) clamp(16px, 5vw, 48px);
  }

  .ef-header-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: clamp(16px, 3vw, 32px);
    flex-wrap: wrap;
  }

  .ef-avatar {
    flex-shrink: 0;
    width: clamp(52px, 8vw, 72px);
    height: clamp(52px, 8vw, 72px);
    border-radius: 50%;
    background: var(--accent2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.03em;
  }

  .ef-header-text {
    flex: 1;
    min-width: 160px;
  }

  .ef-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.4rem, 4vw, 2.2rem);
    font-weight: 800;
    margin: 0 0 6px;
    line-height: 1.1;
    color: #fff;
  }

  .ef-title-accent {
    color: var(--accent2);
  }

  .ef-subtitle {
    font-size: clamp(0.8rem, 2vw, 0.95rem);
    color: rgba(255,255,255,0.6);
    margin: 0;
  }

  .ef-exp-ring {
    position: relative;
    width: clamp(80px, 12vw, 110px);
    flex-shrink: 0;
    margin-left: auto;
  }

  .ef-ring-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .ef-ring-progress {
    transition: stroke-dashoffset 1s cubic-bezier(.4,0,.2,1);
  }

  .ef-ring-label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .ef-ring-pct {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }

  .ef-ring-sub {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .ef-error {
    max-width: 1100px;
    margin: 16px auto 0;
    background: var(--invalid-bg);
    color: var(--invalid);
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .ef-main {
    max-width: 1100px;
    margin: 0 auto;
    padding: clamp(24px, 5vw, 48px) clamp(16px, 5vw, 48px);
  }

  .ef-section {
    margin-bottom: 34px;
  }

  .ef-section-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1rem, 2.5vw, 1.15rem);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    margin: 0 0 20px;
  }

  .ef-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: clamp(12px, 2vw, 20px);
  }

  .ef-card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: clamp(16px, 3vw, 24px);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 14px;
    border: 1.5px solid transparent;
    animation: ef-fadein 0.4s ease both;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .ef-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(26,26,46,0.12);
  }

  .ef-card--valid {
    border-color: #bbf7d0;
  }

  .ef-card--invalid {
    border-color: #fecaca;
  }

  @keyframes ef-fadein {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ef-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ef-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    letter-spacing: 0.02em;
  }

  .ef-badge--valid {
    background: var(--valid-bg);
    color: var(--valid);
  }

  .ef-badge--invalid {
    background: var(--invalid-bg);
    color: var(--invalid);
  }

  .ef-card-code {
    font-size: 0.72rem;
    color: var(--muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .ef-card-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(0.95rem, 2vw, 1.05rem);
    font-weight: 700;
    margin: 0;
    line-height: 1.3;
    color: var(--text);
  }

  .ef-score-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ef-score-label {
    font-size: 0.75rem;
    color: var(--muted);
    white-space: nowrap;
    min-width: 36px;
  }

  .ef-score-bar-wrap {
    flex: 1;
    height: 6px;
    background: var(--track);
    border-radius: 999px;
    overflow: hidden;
  }

  .ef-score-bar {
    height: 100%;
    width: var(--score);
    background: var(--accent);
    border-radius: 999px;
    transition: width 0.8s cubic-bezier(.4,0,.2,1);
  }

  .ef-score-value {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    min-width: 34px;
    text-align: right;
  }

  .ef-btn {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.18s ease, transform 0.15s ease;
  }

  .ef-btn:hover {
    background: #2d2d50;
    transform: scale(1.01);
  }

  .ef-btn:active {
    transform: scale(0.98);
  }

  .ef-btn-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .ef-docs-section {
    margin-top: 36px;
  }

  .ef-empty {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 20px;
    color: var(--muted);
  }

  .ef-history-list {
    display: grid;
    gap: 12px;
  }

  .ef-history-row {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 16px;
    display: grid;
    grid-template-columns: 1fr 110px 210px;
    gap: 16px;
    align-items: center;
  }

  .ef-history-title {
    margin: 0 0 6px;
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
  }

  .ef-history-meta {
    margin: 3px 0;
    color: var(--muted);
    font-size: 0.88rem;
  }

  .ef-history-status {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ef-history-badge {
    display: inline-block;
    width: fit-content;
    padding: 4px 9px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .ef-history-badge--valid {
    color: var(--valid);
    background: var(--valid-bg);
  }

  .ef-history-badge--invalid {
    color: var(--invalid);
    background: var(--invalid-bg);
  }

  .ef-download-btn {
    width: 100%;
    padding: 11px 14px;
    border: none;
    border-radius: 10px;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    font-weight: 700;
  }

  .ef-no-pdf {
    color: var(--invalid);
    font-weight: 700;
  }

  @media (max-width: 760px) {
    .ef-history-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .ef-exp-ring {
      display: none;
    }

    .ef-header-inner {
      flex-wrap: nowrap;
    }
  }
`;