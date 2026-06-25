const mongoose = require("mongoose");

const briefSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    restaurant: {
      type: String,
      default: "Restaurant de Sèvres",
    },

    managerNom: String,
    managerPrenom: String,

    dateRush: {
      type: Date,
      required: true,
    },

    rushDu: {
      type: String,
      enum: ["midi", "soir"],
      required: true,
    },

    jourReference1: Date,
    jourReference2: Date,
    evenements: String,

    heurePlusForte: {
      ca: Number,
      gc: Number,
    },

    quartHeurePlusFort: {
      ca: Number,
      gc: Number,
    },

    canalVentePlusFort: {
      ca: Number,
      gc: Number,
    },

    pic: String,
    nombreDeNiveau: Number,
    nombreDeLigne: Number,
    staffing: String,
    zoneDeDanger: String,
    solution: String,

    tempsInitiation: String,
    tempsR2P: String,
    tempsLAD: String,

    objectifSalle: String,
    objectifProduction: String,
    objectifFormation: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Brief", briefSchema);
