const mongoose = require("mongoose");

const placementSchema = new mongoose.Schema(
  {
    restaurant: {
      type: String,
      default: "Restaurant de Sèvres",
    },

    date: {
      type: Date,
      required: true,
    },

    rushDu: {
      type: String,
      enum: ["midi", "soir"],
      required: true,
    },

    postes: {
      caisse: String,
      satLad: String,
      boissons: String,
      verif: String,
      initiationL1: String,
      uhc1: String,
      initiationL2: String,
      uhc2: String,
      frites: String,
      produitsFrits: String,
      oat: String,
      viandes: String,
    },

    auteurId: {
      type: String,
      required: true,
    },

    auteurNom: String,
    auteurPrenom: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Placement", placementSchema);