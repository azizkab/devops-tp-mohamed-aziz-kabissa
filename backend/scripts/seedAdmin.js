require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

const createAdmin = async () => {
  try {
    // Vérification variables .env
    if (
      !process.env.MONGO_URI ||
      !process.env.ADMIN_IDENTIFIANT ||
      !process.env.ADMIN_PASSWORD
    ) {
      console.error("Variables ADMIN ou MONGO manquantes dans .env");
      process.exit(1);
    }

    // Connexion MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connecté ✅");

    // Vérifie si admin existe déjà
    const existing = await User.findOne({
      identifiant: process.env.ADMIN_IDENTIFIANT,
    });

    if (existing) {
      console.log("Admin déjà existant ✅");
      process.exit(0);
    }

    // Hash mot de passe
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    // Création admin
    await User.create({
      nom: process.env.ADMIN_NOM || "Admin",
      prenom: process.env.ADMIN_PRENOM || "Admin",
      identifiant: process.env.ADMIN_IDENTIFIANT,
      motDePasse: hashedPassword,
      role: "ADMIN",
      actif: true,
    });

    console.log("Admin créé avec succès ✅");

    process.exit(0);
  } catch (error) {
    console.error("Erreur création admin :", error);
    process.exit(1);
  }
};

createAdmin();
