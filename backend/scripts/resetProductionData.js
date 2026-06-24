require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Brief = require("../models/Brief");
const Debrief = require("../models/Debrief");
const Placement = require("../models/Placement");
const FormationValidation = require("../models/FormationValidation");
const Equipier = require("../models/Equipier");
const User = require("../models/User");

const completedPdfDir = path.join(
  __dirname,
  "../uploads/formations-completed"
);

const cleanCompletedPDFs = () => {
  if (!fs.existsSync(completedPdfDir)) return;

  const files = fs.readdirSync(completedPdfDir);

  files.forEach((file) => {
    fs.unlinkSync(path.join(completedPdfDir, file));
  });

  console.log("PDF formations remplis supprimés ✅");
};

const resetProductionData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connecté ✅");

    await Brief.deleteMany({});
    await Debrief.deleteMany({});
    await Placement.deleteMany({});
    await FormationValidation.deleteMany({});
    await Equipier.deleteMany({});

    // Garde uniquement le comptes ADMIN 
    await User.deleteMany({
      role: { $nin: ["ADMIN", ] },
    });

    cleanCompletedPDFs();

    console.log("Données de test supprimées ✅");
    console.log("Comptes ADMIN  ✅");

    process.exit(0);
  } catch (error) {
    console.error("Erreur reset :", error);
    process.exit(1);
  }
};

resetProductionData();