const Brief = require("../models/Brief");
const Debrief = require("../models/Debrief");
const User = require("../models/User");

const {
  generateBriefPDF,
  generateDebriefPDF,
} = require("../services/pdfService");

const { sendPDFToDiscord } = require("../services/discordService");
const { analyseRush } = require("../services/rushAnalysisService");

const canModify = (user, item) => {
  if (["ADMIN", "DIRECTEUR"].includes(user.role)) return true;
  return item.userId === user.id;
};

// ================= BRIEF =================

const createBrief = async (req, res) => {
  try {
    const connectedUser = await User.findById(req.user.id);

    if (!connectedUser) {
      return res
        .status(404)
        .json({ message: "Utilisateur connecté introuvable" });
    }

    const briefData = {
      ...req.body,
      userId: connectedUser._id.toString(),
      managerNom: connectedUser.nom,
      managerPrenom: connectedUser.prenom,
    };

    const brief = await Brief.create(briefData);

    console.log("BRIEF MANAGER :", brief.managerPrenom, brief.managerNom);

    const pdfPath = await generateBriefPDF(brief);
    await sendPDFToDiscord(pdfPath, brief, "brief");

    return res.status(201).json({
      message: "Brief créé + envoyé sur Discord 🚀",
      brief,
    });
  } catch (error) {
    console.error("ERREUR CREATE BRIEF :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la création du brief",
      error: error.message,
    });
  }
};

const getBriefs = async (req, res) => {
  try {
    const briefs = await Brief.find().sort({
      dateRush: -1,
      createdAt: -1,
    });

    return res.status(200).json(briefs);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur lors du chargement des briefs",
      error: error.message,
    });
  }
};

const updateBrief = async (req, res) => {
  try {
    const brief = await Brief.findById(req.params.id);

    if (!brief) {
      return res.status(404).json({ message: "Brief introuvable" });
    }

    if (!canModify(req.user, brief)) {
      return res.status(403).json({
        message: "Vous n'avez pas le droit de modifier ce brief",
      });
    }

    Object.assign(brief, {
      ...req.body,
      userId: brief.userId,
      managerNom: brief.managerNom,
      managerPrenom: brief.managerPrenom,
    });

    await brief.save();

    return res.status(200).json({
      message: "Brief modifié avec succès",
      brief,
    });
  } catch (error) {
    console.error("ERREUR UPDATE BRIEF :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la modification du brief",
      error: error.message,
    });
  }
};

const deleteBrief = async (req, res) => {
  try {
    const brief = await Brief.findById(req.params.id);

    if (!brief) {
      return res.status(404).json({ message: "Brief introuvable" });
    }

    if (!canModify(req.user, brief)) {
      return res.status(403).json({
        message: "Vous n'avez pas le droit de supprimer ce brief",
      });
    }

    await brief.deleteOne();

    return res.status(200).json({
      message: "Brief supprimé avec succès",
    });
  } catch (error) {
    console.error("ERREUR DELETE BRIEF :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la suppression du brief",
      error: error.message,
    });
  }
};

// ================= DEBRIEF =================

const createDebrief = async (req, res) => {
  try {
    const connectedUser = await User.findById(req.user.id);

    if (!connectedUser) {
      return res.status(404).json({
        message: "Utilisateur connecté introuvable",
      });
    }

    const debriefData = {
      ...req.body,
      userId: connectedUser._id.toString(),
      managerNom: connectedUser.nom,
      managerPrenom: connectedUser.prenom,
    };

    const debrief = await Debrief.create(debriefData);

    console.log("DEBRIEF MANAGER :", debrief.managerPrenom, debrief.managerNom);

    const start = new Date(debrief.dateRush);
    start.setHours(0, 0, 0, 0);

    const end = new Date(debrief.dateRush);
    end.setHours(23, 59, 59, 999);

    const matchingBrief = await Brief.findOne({
      dateRush: {
        $gte: start,
        $lte: end,
      },
      rushDu: debrief.rushDu,
    }).sort({ createdAt: -1 });

    const analysis = analyseRush(matchingBrief, debrief);

    const pdfPath = await generateDebriefPDF(debrief);

    await sendPDFToDiscord(pdfPath, debrief, "debrief", analysis);

    return res.status(201).json({
      message: "Débrief créé + analysé + envoyé sur Discord 🚀",
      debrief,
      analysis,
    });
  } catch (error) {
    console.error("ERREUR CREATE DEBRIEF :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la création du débrief",
      error: error.message,
    });
  }
};

const getDebriefs = async (req, res) => {
  try {
    const debriefs = await Debrief.find().sort({
      dateRush: -1,
      createdAt: -1,
    });

    return res.status(200).json(debriefs);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur lors du chargement des débriefs",
      error: error.message,
    });
  }
};

const updateDebrief = async (req, res) => {
  try {
    const debrief = await Debrief.findById(req.params.id);

    if (!debrief) {
      return res.status(404).json({ message: "Débrief introuvable" });
    }

    if (!canModify(req.user, debrief)) {
      return res.status(403).json({
        message: "Vous n'avez pas le droit de modifier ce débrief",
      });
    }

    Object.assign(debrief, {
      ...req.body,
      userId: debrief.userId,
      managerNom: debrief.managerNom,
      managerPrenom: debrief.managerPrenom,
    });

    await debrief.save();

    return res.status(200).json({
      message: "Débrief modifié avec succès",
      debrief,
    });
  } catch (error) {
    console.error("ERREUR UPDATE DEBRIEF :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la modification du débrief",
      error: error.message,
    });
  }
};

const deleteDebrief = async (req, res) => {
  try {
    const debrief = await Debrief.findById(req.params.id);

    if (!debrief) {
      return res.status(404).json({ message: "Débrief introuvable" });
    }

    if (!canModify(req.user, debrief)) {
      return res.status(403).json({
        message: "Vous n'avez pas le droit de supprimer ce débrief",
      });
    }

    await debrief.deleteOne();

    return res.status(200).json({
      message: "Débrief supprimé avec succès",
    });
  } catch (error) {
    console.error("ERREUR DELETE DEBRIEF :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la suppression du débrief",
      error: error.message,
    });
  }
};

// ================= PDF DOWNLOAD =================

const downloadBriefPDF = async (req, res) => {
  try {
    const brief = await Brief.findById(req.params.id);

    if (!brief) {
      return res.status(404).json({ message: "Brief introuvable" });
    }

    const pdfPath = await generateBriefPDF(brief);

    return res.download(pdfPath, `brief-${brief._id}.pdf`);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors du téléchargement du PDF brief",
      error: error.message,
    });
  }
};

const downloadDebriefPDF = async (req, res) => {
  try {
    const debrief = await Debrief.findById(req.params.id);

    if (!debrief) {
      return res.status(404).json({ message: "Débrief introuvable" });
    }

    const pdfPath = await generateDebriefPDF(debrief);

    return res.download(pdfPath, `debrief-${debrief._id}.pdf`);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors du téléchargement du PDF débrief",
      error: error.message,
    });
  }
};

module.exports = {
  createBrief,
  getBriefs,
  updateBrief,
  deleteBrief,
  createDebrief,
  getDebriefs,
  updateDebrief,
  deleteDebrief,
  downloadBriefPDF,
  downloadDebriefPDF,
};
