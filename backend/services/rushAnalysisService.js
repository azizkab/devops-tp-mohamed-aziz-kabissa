const parseTimeToSeconds = (value) => {
  if (!value || typeof value !== "string") return null;
  const [min, sec] = value.split(":").map(Number);
  if (Number.isNaN(min) || Number.isNaN(sec)) return null;
  return min * 60 + sec;
};

const formatDiff = (diff) => {
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
};

const getAverageR2PSeconds = (creneaux = []) => {
  const values = creneaux
    .map((c) => {
      const min = c.tempsR2P?.min || 0;
      const sec = c.tempsR2P?.sec || 0;
      const total = min * 60 + sec;
      return total > 0 ? total : null;
    })
    .filter((v) => v !== null);

  if (values.length === 0) return null;

  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

const secondsToMinSec = (seconds) => {
  if (seconds === null || seconds === undefined) return "-";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

const analyseRush = (brief, debrief) => {
  if (!brief) {
    return {
      foundBrief: false,
      message: "Aucun brief correspondant trouvé pour ce débrief.",
      items: [],
    };
  }

  const briefCA = brief.quartHeurePlusFort?.ca || 0;
  const debriefCA = debrief.analyseQuart?.ca || 0;
  const ecartCA = debriefCA - briefCA;

  const briefGC = brief.quartHeurePlusFort?.gc || 0;
  const debriefTransactions = debrief.analyseQuart?.transaction || 0;
  const ecartTransactions = debriefTransactions - briefGC;

  const briefStaffing = Number(brief.staffing) || 0;
  const debriefStaffing = debrief.analyseQuart?.staffing || 0;
  const ecartStaffing = debriefStaffing - briefStaffing;

  const briefR2PSeconds = parseTimeToSeconds(brief.tempsR2P);
  const debriefR2PSeconds = getAverageR2PSeconds(debrief.creneaux);
  const ecartR2P =
    briefR2PSeconds !== null && debriefR2PSeconds !== null
      ? debriefR2PSeconds - briefR2PSeconds
      : null;

  return {
    foundBrief: true,
    message: "Comparaison brief vs débrief réalisée.",
    items: [
      {
        label: "CA",
        brief: `${briefCA} €`,
        debrief: `${debriefCA} €`,
        ecart: `${formatDiff(ecartCA)} €`,
        status: ecartCA >= 0 ? "OK" : "ALERTE",
      },
      {
        label: "Transactions",
        brief: briefGC,
        debrief: debriefTransactions,
        ecart: formatDiff(ecartTransactions),
        status: ecartTransactions >= 0 ? "OK" : "ALERTE",
      },
      {
        label: "Staffing",
        brief: briefStaffing,
        debrief: debriefStaffing,
        ecart: formatDiff(ecartStaffing),
        status: ecartStaffing >= 0 ? "OK" : "ALERTE",
      },
      {
        label: "Temps R2P",
        brief: brief.tempsR2P || "-",
        debrief: secondsToMinSec(debriefR2PSeconds),
        ecart: ecartR2P === null ? "-" : `${formatDiff(ecartR2P)} sec`,
        status: ecartR2P === null ? "INFO" : ecartR2P <= 0 ? "OK" : "ALERTE",
      },
    ],
  };
};

module.exports = {
  analyseRush,
};