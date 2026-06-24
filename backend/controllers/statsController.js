const Brief = require("../models/Brief");
const Debrief = require("../models/Debrief");

const parseTimeToSeconds = (value) => {
  if (!value || typeof value !== "string") return null;

  const [min, sec] = value.split(":").map(Number);

  if (Number.isNaN(min) || Number.isNaN(sec)) return null;

  return min * 60 + sec;
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

const getRushStats = async (req, res) => {
  try {
    const { rushDu, dateDebut, dateFin } = req.query;

    const filter = {};

    if (rushDu && rushDu !== "TOUS") {
      filter.rushDu = rushDu;
    }

    if (dateDebut || dateFin) {
      filter.dateRush = {};

      if (dateDebut) {
        const start = new Date(dateDebut);
        start.setHours(0, 0, 0, 0);
        filter.dateRush.$gte = start;
      }

      if (dateFin) {
        const end = new Date(dateFin);
        end.setHours(23, 59, 59, 999);
        filter.dateRush.$lte = end;
      }
    }

    const briefs = await Brief.find(filter).sort({
      dateRush: -1,
      createdAt: -1,
    });

    const debriefs = await Debrief.find(filter).sort({
      dateRush: -1,
      createdAt: -1,
    });

    const totalBriefs = briefs.length;
    const totalDebriefs = debriefs.length;

    const totalCAReel = debriefs.reduce(
      (sum, d) => sum + (d.analyseQuart?.ca || 0),
      0
    );

    const totalTransactions = debriefs.reduce(
      (sum, d) => sum + (d.analyseQuart?.transaction || 0),
      0
    );

    const totalStaffing = debriefs.reduce(
      (sum, d) => sum + (d.analyseQuart?.staffing || 0),
      0
    );

    const moyenneCA = totalDebriefs
      ? Math.round(totalCAReel / totalDebriefs)
      : 0;

    const moyenneTransactions = totalDebriefs
      ? Math.round(totalTransactions / totalDebriefs)
      : 0;

    const moyenneStaffing = totalDebriefs
      ? Number((totalStaffing / totalDebriefs).toFixed(1))
      : 0;

    const analyses = debriefs.map((debrief) => {
      const start = new Date(debrief.dateRush);
      start.setHours(0, 0, 0, 0);

      const end = new Date(debrief.dateRush);
      end.setHours(23, 59, 59, 999);

      const matchingBrief = briefs.find((brief) => {
        const briefDate = new Date(brief.dateRush);

        return (
          briefDate >= start &&
          briefDate <= end &&
          brief.rushDu === debrief.rushDu
        );
      });

      const caBrief = matchingBrief?.quartHeurePlusFort?.ca || 0;
      const caDebrief = debrief.analyseQuart?.ca || 0;
      const ecartCA = caDebrief - caBrief;

      const staffingBrief = Number(matchingBrief?.staffing) || 0;
      const staffingDebrief = debrief.analyseQuart?.staffing || 0;
      const ecartStaffing = staffingDebrief - staffingBrief;

      const r2pBriefSeconds = parseTimeToSeconds(matchingBrief?.tempsR2P);
      const r2pDebriefSeconds = getAverageR2PSeconds(debrief.creneaux);

      const ecartR2P =
        r2pBriefSeconds !== null && r2pDebriefSeconds !== null
          ? r2pDebriefSeconds - r2pBriefSeconds
          : null;

      const alertes = [];

      if (!matchingBrief) alertes.push("Aucun brief associé");
      if (ecartCA < 0) alertes.push("CA inférieur au brief");
      if (ecartStaffing < 0) alertes.push("Staffing inférieur");
      if (ecartR2P !== null && ecartR2P > 0) alertes.push("R2P dégradé");

      return {
        id: debrief._id,
        dateRush: debrief.dateRush,
        rushDu: debrief.rushDu,
        manager: `${debrief.managerPrenom || ""} ${debrief.managerNom || ""}`.trim(),
        caBrief,
        caDebrief,
        ecartCA,
        staffingBrief,
        staffingDebrief,
        ecartStaffing,
        r2pBrief: matchingBrief?.tempsR2P || "-",
        r2pDebrief: secondsToMinSec(r2pDebriefSeconds),
        ecartR2P,
        alertes,
      };
    });

    const rushsEnDifficulte = analyses.filter((a) => a.alertes.length > 0);

    return res.status(200).json({
      totals: {
        totalBriefs,
        totalDebriefs,
        moyenneCA,
        moyenneTransactions,
        moyenneStaffing,
        rushsEnDifficulte: rushsEnDifficulte.length,
      },
      analyses,
      rushsEnDifficulte,
    });
  } catch (error) {
    console.error("ERREUR STATS :", error);

    return res.status(500).json({
      message: "Erreur serveur lors du chargement des statistiques",
      error: error.message,
    });
  }
};

const getMyBestShift = async (req, res) => {
  try {
    const user = req.user;

    const bestShift = await Debrief.findOne({
      userId: user.id,
    }).sort({ "analyseQuart.ca": -1 });

    if (!bestShift) {
      return res.status(200).json({
        caMax: 0,
        transactions: 0,
        dateRush: null,
        rushDu: null,
      });
    }

    return res.status(200).json({
      caMax: bestShift.analyseQuart?.ca || 0,
      transactions: bestShift.analyseQuart?.transaction || 0,
      dateRush: bestShift.dateRush,
      rushDu: bestShift.rushDu,
    });
  } catch (error) {
    console.error("ERREUR BEST SHIFT :", error);

    return res.status(500).json({
      message: "Erreur serveur lors du chargement du meilleur shift",
      error: error.message,
    });
  }

};
const getManagersLeaderboard = async (req, res) => {
  try {
    const debriefs = await Debrief.find();

    const managersMap = {};

    debriefs.forEach((d) => {
      const key = d.userId || `${d.managerPrenom}-${d.managerNom}`;

      if (!managersMap[key]) {
        managersMap[key] = {
          userId: d.userId,
          managerNom: d.managerNom || "",
          managerPrenom: d.managerPrenom || "",
          totalCA: 0,
          totalTransactions: 0,
          nombreDebriefs: 0,
          meilleurCA: 0,
          meilleurShift: null,
        };
      }

      const ca = d.analyseQuart?.ca || 0;
      const transactions = d.analyseQuart?.transaction || 0;

      managersMap[key].totalCA += ca;
      managersMap[key].totalTransactions += transactions;
      managersMap[key].nombreDebriefs += 1;

      if (ca > managersMap[key].meilleurCA) {
        managersMap[key].meilleurCA = ca;
        managersMap[key].meilleurShift = {
          dateRush: d.dateRush,
          rushDu: d.rushDu,
          transactions,
        };
      }
    });

    const leaderboard = Object.values(managersMap)
      .map((m) => ({
        ...m,
        moyenneCA: m.nombreDebriefs
          ? Math.round(m.totalCA / m.nombreDebriefs)
          : 0,
        moyenneTransactions: m.nombreDebriefs
          ? Math.round(m.totalTransactions / m.nombreDebriefs)
          : 0,
      }))
      .sort((a, b) => b.meilleurCA - a.meilleurCA);

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error("ERREUR LEADERBOARD :", error);

    return res.status(500).json({
      message: "Erreur serveur lors du chargement du leaderboard",
      error: error.message,
    });
  }
};

module.exports = {
  getRushStats,
  getMyBestShift,
  getManagersLeaderboard,
};