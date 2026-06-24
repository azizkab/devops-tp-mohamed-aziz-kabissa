const Equipier = require("../models/Equipier");

const createEquipier = async (req, res) => {
  try {
    const { nom, prenom, dateEntree, statut, telephone, email } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({
        message: "Le nom et le prénom sont obligatoires",
      });
    }

    const equipier = await Equipier.create({
      nom,
      prenom,
      dateEntree: dateEntree || null,
      statut: statut || "",
      telephone: telephone || "",
      email: email || "",
      actif: true,
    });

    return res.status(201).json({
      message: "Équipier ajouté avec succès",
      equipier,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

const getEquipiers = async (req, res) => {
  try {
    const equipiers = await Equipier.find().sort({ nom: 1, prenom: 1 });

    return res.status(200).json(equipiers);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

const updateEquipier = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, dateEntree, statut, telephone, email } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({
        message: "Le nom et le prénom sont obligatoires",
      });
    }

    const equipier = await Equipier.findByIdAndUpdate(
      id,
      {
        nom,
        prenom,
        dateEntree: dateEntree || null,
        statut: statut || "",
        telephone: telephone || "",
        email: email || "",
      },
      { new: true }
    );

    if (!equipier) {
      return res.status(404).json({
        message: "Équipier introuvable",
      });
    }

    return res.status(200).json({
      message: "Équipier mis à jour avec succès",
      equipier,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

const toggleEquipierStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const equipier = await Equipier.findById(id);

    if (!equipier) {
      return res.status(404).json({
        message: "Équipier introuvable",
      });
    }

    equipier.actif = !equipier.actif;
    await equipier.save();

    return res.status(200).json({
      message: `Équipier ${equipier.actif ? "activé" : "désactivé"} avec succès`,
      equipier,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

module.exports = {
  createEquipier,
  getEquipiers,
  updateEquipier,
  toggleEquipierStatus,
};