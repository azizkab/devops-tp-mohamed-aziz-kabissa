const path = require("path");

const Equipier = require("../models/Equipier");
const FormationValidation = require("../models/FormationValidation");
const formationsCatalogue = require("../data/formationsCatalogue");
const { fillFormationPDF } = require("../services/mcdoPdfFillService");

const getExperience = (validations) => {
  const total = formationsCatalogue.length;

  if (total === 0) return 0;

  const validees = validations.filter((v) => v.validee).length;

  return Math.round((validees / total) * 100);
};

const getFormationsCatalogue = async (req, res) => {
  return res.status(200).json(formationsCatalogue);
};

const getEquipiersWithProgress = async (req, res) => {
  try {
    const equipiers = await Equipier.find().sort({ nom: 1, prenom: 1 });

    const result = await Promise.all(
      equipiers.map(async (equipier) => {
        const validations = await FormationValidation.find({
          equipierId: equipier._id,
        });

        return {
          ...equipier.toObject(),
          experience: getExperience(validations),
          formationsValidees: validations.filter((v) => v.validee).length,
          totalFormations: formationsCatalogue.length,
        };
      }),
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("ERREUR EQUIPIERS FORMATION :", error);

    return res.status(500).json({
      message: "Erreur lors du chargement des équipiers formation",
      error: error.message,
    });
  }
};

const getEquipierFormations = async (req, res) => {
  try {
    const equipier = await Equipier.findById(req.params.equipierId);

    if (!equipier) {
      return res.status(404).json({ message: "Équipier introuvable" });
    }

    const validations = await FormationValidation.find({
      equipierId: equipier._id,
    }).sort({ createdAt: -1 });

    const formations = formationsCatalogue.map((formation) => {
      const validation = validations.find(
        (v) => v.formationCode === formation.code,
      );

      return {
        ...formation,
        statut: validation?.validee ? "VALIDEE" : "NON_VALIDEE",
        score: validation?.score || 0,
        validation: validation || null,
      };
    });

    return res.status(200).json({
      equipier,
      experience: getExperience(validations),
      formationsValidees: validations.filter((v) => v.validee).length,
      totalFormations: formationsCatalogue.length,
      formations,
    });
  } catch (error) {
    console.error("ERREUR DETAIL FORMATIONS :", error);

    return res.status(500).json({
      message: "Erreur lors du chargement des formations de l'équipier",
      error: error.message,
    });
  }
};

const getFormationDetail = async (req, res) => {
  try {
    const { formationCode } = req.params;

    const formation = formationsCatalogue.find((f) => f.code === formationCode);

    if (!formation) {
      return res.status(404).json({ message: "Formation introuvable" });
    }

    return res.status(200).json(formation);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors du chargement de la formation",
      error: error.message,
    });
  }
};

const validateFormation = async (req, res) => {
  try {
    const { equipierId } = req.params;
    const { formationCode, reponses, signatureEquipier, signatureFormateur } =
      req.body;

    const equipier = await Equipier.findById(equipierId);

    if (!equipier) {
      return res.status(404).json({ message: "Équipier introuvable" });
    }

    const formation = formationsCatalogue.find((f) => f.code === formationCode);

    if (!formation) {
      return res.status(404).json({ message: "Formation introuvable" });
    }

    if (!signatureEquipier) {
      return res.status(400).json({
        message: "La signature de l'équipier est obligatoire",
      });
    }

    if (!signatureFormateur) {
      return res.status(400).json({
        message: "La signature du formateur est obligatoire",
      });
    }

    const totalQuestions = formation.questions.length;
    const safeReponses = Array.isArray(reponses) ? reponses : [];
    const questionsValidees = safeReponses.filter((r) => r.valide).length;

    const score = totalQuestions
      ? Math.round((questionsValidees / totalQuestions) * 100)
      : 0;

    const validee = score === 100;
    let dateExpiration = null;

    if (formation.renewalMonths) {
      dateExpiration = new Date();

      dateExpiration.setMonth(
        dateExpiration.getMonth() + formation.renewalMonths,
      );
    }

    let pdfRempliPath = null;

    if (validee) {
      pdfRempliPath = await fillFormationPDF({
        formationCode,
        equipier,
        formateur: req.user,
        signatureEquipier,
        signatureFormateur,
        reponses: safeReponses,
        dateValidation: new Date(),
      });
    }

    const validation = await FormationValidation.findOneAndUpdate(
      {
        equipierId,
        formationCode,
      },
      {
        equipierId,
        formationCode,
        formationTitre: formation.titre,
        reponses: safeReponses,
        score,
        validee,
        signatureEquipier,
        signatureFormateur,
        pdfRempliPath,
        formateurId: req.user.id,
        formateurNom: req.user.nom,
        formateurPrenom: req.user.prenom,
        dateValidation: new Date(),
        dateExpiration,
      },
      {
        returnDocument: "after",
        upsert: true,
      },
    );

    const validations = await FormationValidation.find({ equipierId });

    return res.status(200).json({
      message: validee
        ? "Formation validée avec succès"
        : "Formation enregistrée mais non validée à 100%",
      validation,
      experience: getExperience(validations),
      score,
      validee,
      pdfRempliPath,
    });
  } catch (error) {
    console.error("ERREUR VALIDATION FORMATION :", error);

    return res.status(500).json({
      message: "Erreur lors de la validation de la formation",
      error: error.message,
    });
  }
};

const getFormationPDF = async (req, res) => {
  try {
    const { formationCode } = req.params;

    const formation = formationsCatalogue.find((f) => f.code === formationCode);

    if (!formation) {
      return res.status(404).json({ message: "Formation introuvable" });
    }

    const filePath = path.join(
      __dirname,
      "../uploads/formations",
      formation.pdfFile,
    );

    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors du chargement du PDF",
      error: error.message,
    });
  }
};

const getFormationDashboard = async (req, res) => {
  try {
    const equipiers = await Equipier.find().sort({ nom: 1, prenom: 1 });
    const validations = await FormationValidation.find();

    const totalFormations = formationsCatalogue.length;
    const totalEquipiers = equipiers.length;
    const totalPossible = totalEquipiers * totalFormations;
    const totalValidees = validations.filter((v) => v.validee).length;

    const progressionGlobale = totalPossible
      ? Math.round((totalValidees / totalPossible) * 100)
      : 0;

    const equipiersStats = equipiers.map((equipier) => {
      const equipierValidations = validations.filter(
        (v) => v.equipierId.toString() === equipier._id.toString(),
      );

      const validees = equipierValidations.filter((v) => v.validee).length;

      const experience = totalFormations
        ? Math.round((validees / totalFormations) * 100)
        : 0;

      return {
        id: equipier._id,
        nom: equipier.nom,
        prenom: equipier.prenom,
        experience,
        formationsValidees: validees,
        totalFormations,
      };
    });

    const topEquipiers = [...equipiersStats]
      .sort((a, b) => b.experience - a.experience)
      .slice(0, 5);

    const equipiersPrioritaires = [...equipiersStats]
      .filter((e) => e.experience < 50)
      .sort((a, b) => a.experience - b.experience)
      .slice(0, 10);

    const formationsStats = formationsCatalogue.map((formation) => {
      const formationValidations = validations.filter(
        (v) => v.formationCode === formation.code && v.validee,
      );

      const tauxValidation = totalEquipiers
        ? Math.round((formationValidations.length / totalEquipiers) * 100)
        : 0;

      return {
        code: formation.code,
        titre: formation.titre,
        validations: formationValidations.length,
        totalEquipiers,
        tauxValidation,
      };
    });

    const formationsFaibles = [...formationsStats]
      .sort((a, b) => a.tauxValidation - b.tauxValidation)
      .slice(0, 8);

    const formationsFortes = [...formationsStats]
      .sort((a, b) => b.tauxValidation - a.tauxValidation)
      .slice(0, 5);

    return res.status(200).json({
      totals: {
        totalEquipiers,
        totalFormations,
        totalValidees,
        totalPossible,
        progressionGlobale,
      },
      topEquipiers,
      equipiersPrioritaires,
      formationsFaibles,
      formationsFortes,
      formationsStats,
      equipiersStats,
    });
  } catch (error) {
    console.error("ERREUR DASHBOARD FORMATION :", error);

    return res.status(500).json({
      message: "Erreur lors du chargement du dashboard formation",
      error: error.message,
    });
  }
};

const getEquipierFormationHistory = async (req, res) => {
  try {
    const { equipierId } = req.params;

    const equipier = await Equipier.findById(equipierId);

    if (!equipier) {
      return res.status(404).json({
        message: "Équipier introuvable",
      });
    }

    const history = await FormationValidation.find({
      equipierId,
    }).sort({ dateValidation: -1 });

    return res.status(200).json({
      equipier,
      history,
    });
  } catch (error) {
    console.error("ERREUR HISTORIQUE FORMATION :", error);

    return res.status(500).json({
      message: "Erreur lors du chargement de l'historique formation",
      error: error.message,
    });
  }
};

const downloadCompletedFormationPDF = async (req, res) => {
  try {
    const { validationId } = req.params;

    const validation = await FormationValidation.findById(validationId);

    if (!validation || !validation.pdfRempliPath) {
      return res.status(404).json({
        message: "PDF rempli introuvable",
      });
    }

    return res.download(
      validation.pdfRempliPath,
      `${validation.formationCode}-${validation.equipierId}.pdf`,
    );
  } catch (error) {
    console.error("ERREUR DOWNLOAD PDF FORMATION :", error);

    return res.status(500).json({
      message: "Erreur lors du téléchargement du PDF rempli",
      error: error.message,
    });
  }
};

module.exports = {
  getFormationsCatalogue,
  getEquipiersWithProgress,
  getEquipierFormations,
  getFormationDetail,
  validateFormation,
  getFormationPDF,
  getFormationDashboard,
  getEquipierFormationHistory,
  downloadCompletedFormationPDF,
};
