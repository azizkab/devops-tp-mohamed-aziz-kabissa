const cron = require("node-cron");
const FormationValidation = require("../models/FormationValidation");
const Equipier = require("../models/Equipier");
const { sendDiscordMessage } = require("./discordService");

const daysBetween = (date) => {
  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const checkFormationExpirations = async () => {
  try {
    const validations = await FormationValidation.find({
      formationCode: "prevention_securite",
      validee: true,
      dateExpiration: { $ne: null },
    }).sort({ dateValidation: -1 });

    const latestByEquipier = {};

    validations.forEach((validation) => {
      const key = validation.equipierId.toString();

      if (!latestByEquipier[key]) {
        latestByEquipier[key] = validation;
      }
    });

    const alerts = [];

    for (const validation of Object.values(latestByEquipier)) {
      const equipier = await Equipier.findById(validation.equipierId);
      if (!equipier) continue;

      const daysLeft = daysBetween(validation.dateExpiration);

      if (daysLeft < 0) {
        alerts.push(
          `❌ **${equipier.prenom} ${equipier.nom}** — Prévention sécurité expirée depuis ${Math.abs(
            daysLeft,
          )} jour(s)`,
        );
      } else if (daysLeft <= 30) {
        alerts.push(
          `⚠️ **${equipier.prenom} ${equipier.nom}** — Prévention sécurité expire dans ${daysLeft} jour(s)`,
        );
      }
    }

    if (alerts.length === 0) return;

    const message = [
      `🚨 **ALERTE FORMATIONS OBLIGATOIRES**`,
      ``,
      ...alerts,
      ``,
      `Merci de planifier les renouvellements nécessaires.`,
    ].join("\n");

    await sendDiscordMessage(message);
  } catch (error) {
    console.error("ERREUR ALERTES FORMATIONS :", error);
  }
};

const startFormationAlertsCron = () => {
  cron.schedule("0 8 * * *", checkFormationExpirations, {
    timezone: "Europe/Paris",
  });

  console.log("Cron alertes formations activé ✅");
};

module.exports = {
  checkFormationExpirations,
  startFormationAlertsCron,
};
