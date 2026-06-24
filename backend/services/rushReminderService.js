const cron = require("node-cron");
const { sendDiscordMessage } = require("./discordService");

const startRushReminderCron = () => {
  cron.schedule(
    "0 11 * * *",
    async () => {
      await sendDiscordMessage(
        "📋 **RAPPEL BRIEF MIDI**\n\nN’oubliez pas de faire le **brief du midi** avant le rush."
      );
    },
    {
      timezone: "Europe/Paris",
    }
  );

  cron.schedule(
    "0 14 * * *",
    async () => {
      await sendDiscordMessage(
        "📊 **RAPPEL DÉBRIEF MIDI**\n\nN’oubliez pas de faire le **débrief du midi**."
      );
    },
    {
      timezone: "Europe/Paris",
    }
  );

  cron.schedule(
    "0 18 * * *",
    async () => {
      await sendDiscordMessage(
        "📋 **RAPPEL BRIEF SOIR**\n\nN’oubliez pas de faire le **brief du soir** avant le rush."
      );
    },
    {
      timezone: "Europe/Paris",
    }
  );

  cron.schedule(
    "0 21 * * *",
    async () => {
      await sendDiscordMessage(
        "📊 **RAPPEL DÉBRIEF SOIR**\n\nN’oubliez pas de faire le **débrief du soir**."
      );
    },
    {
      timezone: "Europe/Paris",
    }
  );

  console.log("Cron rappels brief/débrief activé ✅");
};

module.exports = {
  startRushReminderCron,
};