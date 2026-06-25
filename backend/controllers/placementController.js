const Placement = require("../models/Placement");

const {
  sendDiscordMessage,
  sendImageToDiscord,
} = require("../services/discordService");

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
};

const formatPoste = (label, value) => {
  return `• **${label}** : ${value && value.trim() ? value : "—"}`;
};

const buildDiscordPlacementMessage = (placement) => {
  const postes = placement.postes || {};

  return [
    `🍔 **PLACEMENT ÉQUIPE - ${placement.rushDu?.toUpperCase()}**`,
    ``,
    `📍 **Restaurant** : ${placement.restaurant || "Restaurant de Sèvres"}`,
    `📅 **Date** : ${formatDate(placement.date)}`,
    `👤 **Manager** : ${placement.auteurPrenom || ""} ${
      placement.auteurNom || ""
    }`,
    ``,
    `💰 **SERVICE**`,
    formatPoste("Caisse", postes.caisse),
    formatPoste("SAT/LAD", postes.satLad),
    ``,
    `🍟 **PRODUCTION**`,
    formatPoste("Boissons", postes.boissons),
    formatPoste("Vérif", postes.verif),
    formatPoste("Initiation L1", postes.initiationL1),
    formatPoste("UHC1", postes.uhc1),
    formatPoste("Initiation L2", postes.initiationL2),
    formatPoste("UHC2", postes.uhc2),
    formatPoste("Frites", postes.frites),
    formatPoste("Produits frits", postes.produitsFrits),
    ``,
    `⚙️ **SUPPORT**`,
    formatPoste("OAT", postes.oat),
    formatPoste("Viandes", postes.viandes),
  ].join("\n");
};

const canModifyPlacement = (user, placement) => {
  if (["ADMIN", "DIRECTEUR"].includes(user.role)) return true;
  return placement.auteurId === user.id;
};

const createPlacement = async (req, res) => {
  try {
    const { date, rushDu, postes } = req.body;

    if (!date || !rushDu) {
      return res.status(400).json({
        message: "La date et le rush sont obligatoires",
      });
    }

    const placement = await Placement.create({
      restaurant: req.body.restaurant || "Restaurant de Sèvres",
      date,
      rushDu,
      postes,
      auteurId: req.user.id,
      auteurNom: req.user.nom,
      auteurPrenom: req.user.prenom,
    });

    return res.status(201).json({
      message: "Placement enregistré avec succès",
      placement,
    });
  } catch (error) {
    console.error("ERREUR CREATE PLACEMENT :", error);

    return res.status(500).json({
      message: "Erreur lors de l'enregistrement du placement",
      error: error.message,
    });
  }
};

const getPlacements = async (req, res) => {
  try {
    const { date, rushDu } = req.query;

    const filter = {};

    if (rushDu && rushDu !== "TOUS") {
      filter.rushDu = rushDu;
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: start,
        $lte: end,
      };
    }

    const placements = await Placement.find(filter).sort({
      date: -1,
      createdAt: -1,
    });

    return res.status(200).json(placements);
  } catch (error) {
    console.error("ERREUR GET PLACEMENTS :", error);

    return res.status(500).json({
      message: "Erreur lors du chargement des placements",
      error: error.message,
    });
  }
};

const getPlacementById = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);

    if (!placement) {
      return res.status(404).json({
        message: "Placement introuvable",
      });
    }

    return res.status(200).json(placement);
  } catch (error) {
    console.error("ERREUR GET PLACEMENT :", error);

    return res.status(500).json({
      message: "Erreur lors du chargement du placement",
      error: error.message,
    });
  }
};

const updatePlacement = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);

    if (!placement) {
      return res.status(404).json({
        message: "Placement introuvable",
      });
    }

    if (!canModifyPlacement(req.user, placement)) {
      return res.status(403).json({
        message: "Vous n'avez pas le droit de modifier ce placement",
      });
    }

    Object.assign(placement, {
      restaurant: req.body.restaurant ?? placement.restaurant,
      date: req.body.date ?? placement.date,
      rushDu: req.body.rushDu ?? placement.rushDu,
      postes: req.body.postes ?? placement.postes,
    });

    await placement.save();

    return res.status(200).json({
      message: "Placement modifié avec succès",
      placement,
    });
  } catch (error) {
    console.error("ERREUR UPDATE PLACEMENT :", error);

    return res.status(500).json({
      message: "Erreur lors de la modification du placement",
      error: error.message,
    });
  }
};

const deletePlacement = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);

    if (!placement) {
      return res.status(404).json({
        message: "Placement introuvable",
      });
    }

    if (!canModifyPlacement(req.user, placement)) {
      return res.status(403).json({
        message: "Vous n'avez pas le droit de supprimer ce placement",
      });
    }

    await placement.deleteOne();

    return res.status(200).json({
      message: "Placement supprimé avec succès",
    });
  } catch (error) {
    console.error("ERREUR DELETE PLACEMENT :", error);

    return res.status(500).json({
      message: "Erreur lors de la suppression du placement",
      error: error.message,
    });
  }
};

const duplicatePlacement = async (req, res) => {
  try {
    const source = await Placement.findById(req.params.id);

    if (!source) {
      return res.status(404).json({
        message: "Placement source introuvable",
      });
    }

    const { date, rushDu } = req.body;

    const duplicatedPlacement = await Placement.create({
      restaurant: source.restaurant,
      date: date || new Date(),
      rushDu: rushDu || source.rushDu,
      postes: source.postes,
      auteurId: req.user.id,
      auteurNom: req.user.nom,
      auteurPrenom: req.user.prenom,
    });

    return res.status(201).json({
      message: "Placement copié avec succès",
      placement: duplicatedPlacement,
    });
  } catch (error) {
    console.error("ERREUR DUPLICATE PLACEMENT :", error);

    return res.status(500).json({
      message: "Erreur lors de la copie du placement",
      error: error.message,
    });
  }
};

const sendPlacementToDiscord = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);

    if (!placement) {
      return res.status(404).json({
        message: "Placement introuvable",
      });
    }

    const message = buildDiscordPlacementMessage(placement);

    await sendDiscordMessage(message);

    return res.status(200).json({
      message: "Placement envoyé sur Discord avec succès",
    });
  } catch (error) {
    console.error("ERREUR DISCORD PLACEMENT :", error);

    return res.status(500).json({
      message: "Erreur lors de l'envoi Discord",
      error: error.message,
    });
  }
};

const sendPlacementImageToDiscord = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);

    if (!placement) {
      return res.status(404).json({
        message: "Placement introuvable",
      });
    }

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        message: "Image du placement manquante",
      });
    }

    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    const content = [
      `🍔 **PLACEMENT ÉQUIPE - ${placement.rushDu?.toUpperCase()}**`,
      `📍 **${placement.restaurant || "Restaurant de Sèvres"}**`,
      `📅 ${formatDate(placement.date)}`,
      `👤 ${placement.auteurPrenom || ""} ${placement.auteurNom || ""}`,
    ].join("\n");

    await sendImageToDiscord({
      content,
      imageBuffer,
      filename: `placement-${placement.rushDu}-${placement._id}.png`,
    });

    return res.status(200).json({
      message: "Image du placement envoyée sur Discord avec succès",
    });
  } catch (error) {
    console.error("ERREUR DISCORD IMAGE PLACEMENT :", error);

    return res.status(500).json({
      message: "Erreur lors de l'envoi de l'image Discord",
      error: error.message,
    });
  }
};

module.exports = {
  createPlacement,
  getPlacements,
  getPlacementById,
  updatePlacement,
  deletePlacement,
  duplicatePlacement,
  sendPlacementToDiscord,
  sendPlacementImageToDiscord,
};
