const mongoose = require("mongoose");

const formationValidationSchema = new mongoose.Schema(
  {
    equipierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipier",
      required: true,
    },

    formationCode: {
      type: String,
      required: true,
    },

    formationTitre: {
      type: String,
      required: true,
    },

    reponses: [
      {
        question: String,
        valide: Boolean,
      },
    ],

    score: {
      type: Number,
      default: 0,
    },

    validee: {
      type: Boolean,
      default: false,
    },

    signatureEquipier: {
      type: String,
      required: true,
    },
    pdfRempliPath: {
      type: String,
    },
    formateurId: {
      type: String,
      required: true,
    },
    formateurNom: String,
    formateurPrenom: String,
    signatureFormateur: {
      type: String,
    },
    dateExpiration: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "FormationValidation",
  formationValidationSchema,
);
