const bcrypt = require("bcryptjs");
const User = require("../models/User");

const genererIdentifiant = (nom, prenom) => {
  return `${nom}.${prenom}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const rolesValides = ["ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"];

const createUser = async (req, res) => {
  try {
    const { nom, prenom, motDePasse, role } = req.body;

    if (!nom || !prenom || !motDePasse || !role) {
      return res.status(400).json({
        message: "Nom, prénom, mot de passe et rôle sont obligatoires",
      });
    }

    if (!rolesValides.includes(role)) {
      return res.status(400).json({
        message: "Rôle invalide",
      });
    }

    let identifiant = genererIdentifiant(nom, prenom);

    const existingUser = await User.findOne({ identifiant });

    if (existingUser) {
      identifiant = `${identifiant}${Date.now().toString().slice(-3)}`;
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const user = await User.create({
      nom,
      prenom,
      identifiant,
      motDePasse: hashedPassword,
      role,
      actif: true,
    });

    return res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        identifiant: user.identifiant,
        role: user.role,
        actif: user.actif,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-motDePasse")
      .sort({ createdAt: -1 });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!rolesValides.includes(role)) {
      return res.status(400).json({
        message: "Rôle invalide",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true },
    ).select("-motDePasse");

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    return res.status(200).json({
      message: "Rôle mis à jour avec succès",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    user.actif = !user.actif;
    await user.save();

    return res.status(200).json({
      message: `Compte ${user.actif ? "activé" : "désactivé"} avec succès`,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        identifiant: user.identifiant,
        role: user.role,
        actif: user.actif,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUserRole,
  toggleUserStatus,
};
