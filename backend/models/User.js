const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    prenom: {
      type: String,
      required: true,
      trim: true,
    },
    identifiant: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    motDePasse: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"],
      required: true,
      default: "MANAGER",
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);