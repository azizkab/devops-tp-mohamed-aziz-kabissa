const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      identifiant: user.identifiant,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

const login = async (req, res) => {
  try {
    const { identifiant, motDePasse } = req.body;

    if (!identifiant || !motDePasse) {
      return res.status(400).json({
        message: "Identifiant et mot de passe obligatoires",
      });
    }

    const user = await User.findOne({
      identifiant: identifiant.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Identifiants invalides",
      });
    }

    if (!user.actif) {
      return res.status(403).json({
        message: "Compte désactivé",
      });
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, user.motDePasse);

    if (!motDePasseValide) {
      return res.status(401).json({
        message: "Identifiants invalides",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        identifiant: user.identifiant,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-motDePasse");

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  getMe,
};
