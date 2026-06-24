import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/api/formations";

export default function FormationValidation() {
  const { equipierId, formationCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const signatureFormateurRef = useRef(null);
  const signatureEquipierRef = useRef(null);

  const [activeCanvas, setActiveCanvas] = useState(null);
  const [formation, setFormation] = useState(null);
  const [equipier, setEquipier] = useState(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const pdfUrl = `${API_URL}/pdf/${formationCode}?token=${token}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formationRes, equipierRes] = await Promise.all([
          axios.get(`${API_URL}/detail/${formationCode}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/equipier/${equipierId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setFormation(formationRes.data);
        setEquipier(equipierRes.data.equipier);
      } catch (error) {
        setErreur("Erreur lors du chargement de la formation");
      }
    };

    fetchData();
  }, [equipierId, formationCode, token]);

  const getCanvasPosition = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDraw = (canvasName, e) => {
    setActiveCanvas(canvasName);
    draw(canvasName, e);
  };

  const stopDraw = () => {
    if (!activeCanvas) return;

    const canvas =
      activeCanvas === "formateur"
        ? signatureFormateurRef.current
        : signatureEquipierRef.current;

    const ctx = canvas.getContext("2d");
    ctx.beginPath();

    setActiveCanvas(null);
  };

  const draw = (canvasName, e) => {
    if (activeCanvas && activeCanvas !== canvasName) return;

    const canvas =
      canvasName === "formateur"
        ? signatureFormateurRef.current
        : signatureEquipierRef.current;

    const ctx = canvas.getContext("2d");
    const pos = getCanvasPosition(e, canvas);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const clearCanvas = (ref) => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasEmpty = (canvas) => {
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    return !pixels.some((channel) => channel !== 0);
  };

  const generatePdf = async () => {
    try {
      setMessage("");
      setErreur("");

      const formateurCanvas = signatureFormateurRef.current;
      const equipierCanvas = signatureEquipierRef.current;

      if (isCanvasEmpty(formateurCanvas)) {
        setErreur("La signature du formateur est obligatoire.");
        return;
      }

      if (isCanvasEmpty(equipierCanvas)) {
        setErreur("La signature de l'équipier est obligatoire.");
        return;
      }

      const signatureFormateur = formateurCanvas.toDataURL("image/png");
      const signatureEquipier = equipierCanvas.toDataURL("image/png");

      const res = await axios.post(
  `${API_URL}/equipier/${equipierId}/validate`,
  {
    formationCode,
    signatureFormateur,
    signatureEquipier,
    reponses: formation.questions.map((q) => ({
      question: q,
      valide: true,
    })),
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const validationId = res.data.validation?._id;

if (validationId) {
  const pdfRes = await axios.get(`${API_URL}/completed-pdf/${validationId}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", `${formationCode}-${equipierId}.pdf`);

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}

setMessage("PDF rempli et signé généré avec succès.");

      setMessage("PDF rempli et signé généré avec succès.");

      setTimeout(() => {
        navigate(`/formations/equipier/${equipierId}`);
      }, 1200);
    } catch (error) {
      setErreur(
        error.response?.data?.message ||
          "Erreur lors de la génération du PDF signé"
      );
    }
  };

  if (!formation || !equipier) {
    return (
      <>
        <Navbar />
        <PageContainer title="Chargement">
          <p>Chargement...</p>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <PageContainer
        title={formation.titre}
        subtitle="PDF officiel McDo à compléter et signer"
      >
        {message && <div style={successStyle}>{message}</div>}
        {erreur && <div style={errorStyle}>{erreur}</div>}

        <div style={infoCardStyle}>
          <div>
            <strong>Équipier</strong>
            <p>
              {equipier.prenom} {equipier.nom}
            </p>
          </div>

          <div>
            <strong>Formateur</strong>
            <p>
              {user?.prenom} {user?.nom}
            </p>
          </div>

          <div>
            <strong>Date</strong>
            <p>{new Date().toLocaleDateString("fr-FR")}</p>
          </div>
        </div>

        <div style={layoutStyle}>
          <div style={pdfCardStyle}>
            <h2>Document officiel</h2>

            <iframe title="PDF Formation" src={pdfUrl} style={iframeStyle} />
          </div>

          <div style={signatureCardStyle}>
            <h2>Signatures</h2>

            <SignatureBox
              title="Signature formateur"
              canvasRef={signatureFormateurRef}
              onClear={() => clearCanvas(signatureFormateurRef)}
              onStart={(e) => startDraw("formateur", e)}
              onMove={(e) => draw("formateur", e)}
              onEnd={stopDraw}
            />

            <SignatureBox
              title="Signature équipier"
              canvasRef={signatureEquipierRef}
              onClear={() => clearCanvas(signatureEquipierRef)}
              onStart={(e) => startDraw("equipier", e)}
              onMove={(e) => draw("equipier", e)}
              onEnd={stopDraw}
            />

            <button style={primaryButtonStyle} onClick={generatePdf}>
              Générer le PDF rempli et signé
            </button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

function SignatureBox({ title, canvasRef, onClear, onStart, onMove, onEnd }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3>{title}</h3>

      <canvas
        ref={canvasRef}
        width={500}
        height={180}
        style={canvasStyle}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      />

      <button style={secondaryButtonStyle} onClick={onClear}>
        Effacer
      </button>
    </div>
  );
}

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "1.3fr 0.7fr",
  gap: 20,
};

const infoCardStyle = {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 20,
};

const pdfCardStyle = {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const signatureCardStyle = {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const iframeStyle = {
  width: "100%",
  height: "78vh",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
};

const canvasStyle = {
  width: "100%",
  maxWidth: 500,
  height: 180,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  backgroundColor: "#fff",
  touchAction: "none",
  marginBottom: 10,
};

const primaryButtonStyle = {
  width: "100%",
  padding: "13px 18px",
  borderRadius: 10,
  border: "none",
  backgroundColor: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  cursor: "pointer",
};

const successStyle = {
  backgroundColor: "#dcfce7",
  color: "#166534",
  padding: 12,
  borderRadius: 10,
  marginBottom: 16,
  fontWeight: 700,
};

const errorStyle = {
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  padding: 12,
  borderRadius: 10,
  marginBottom: 16,
  fontWeight: 700,
};