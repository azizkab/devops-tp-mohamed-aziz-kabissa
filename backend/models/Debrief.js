const mongoose = require("mongoose");

const creneauSchema = new mongoose.Schema({
  label: String,

  ca: Number,
  tac: Number,
  staffing: Number,

  tempsR2P: {
    min: Number,
    sec: Number,
  },

  initiation: {
    L1: Number,
    L2: Number,
    L3: Number,
  },
});

const debriefSchema = new mongoose.Schema(
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

    creneaux: [creneauSchema],

    analyseQuart: {
      ca: Number,
      transaction: Number,
      staffing: Number,
    },

    ecartCaisse: Number,
    absent: Number,
    nbreHelloMcDo: Number,
    nbreFormation: Number,
    detailFormation: String,
    remarque: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Debrief", debriefSchema);
