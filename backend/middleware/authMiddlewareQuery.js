const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddlewareQuery = async (req, res, next) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({ message: "Accès non autorisé" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-motDePasse");

    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }

    req.user = {
      id: user._id.toString(),
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

module.exports = authMiddlewareQuery;