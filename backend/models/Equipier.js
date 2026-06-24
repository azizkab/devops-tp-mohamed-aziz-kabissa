const mongoose = require("mongoose");

const equipierSchema = new mongoose.Schema(
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
    dateEntree: {
      type: Date,
      default: null,
    },
    statut: {
      type: String,
      trim: true,
      default: "",
    },
    telephone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Equipier", equipierSchema);