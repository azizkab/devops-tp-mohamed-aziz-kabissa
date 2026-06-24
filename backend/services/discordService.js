const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
};

const buildAnalysisText = (analysis) => {
  if (!analysis) return "";

  if (!analysis.foundBrief) {
    return `\n\n⚠️ **Analyse automatique**\n${analysis.message}`;
  }

  const lines = analysis.items.map((item) => {
    const icon =
      item.status === "OK" ? "✅" : item.status === "ALERTE" ? "⚠️" : "ℹ️";

    return `${icon} **${item.label}** | Brief: ${item.brief} | Débrief: ${item.debrief} | Écart: ${item.ecart}`;
  });

  return `\n\n📊 **Analyse automatique Brief vs Débrief**\n${lines.join("\n")}`;
};

const buildBriefContent = (brief) => {
  return [
    `📊 **BRIEF - ${brief.rushDu?.toUpperCase()}**`,
    ``,
    `📍 **Restaurant** : ${brief.restaurant || "Restaurant de Sèvres"}`,
    `👤 **Manager** : ${brief.managerPrenom || ""} ${brief.managerNom || ""}`,
    `📅 **Date** : ${formatDate(brief.dateRush)}`,
    `🍽 **Service** : ${brief.rushDu || "-"}`,
    ``,
    `💰 **Heure forte** : CA ${brief.heurePlusForte?.ca || 0}€ | GC ${
      brief.heurePlusForte?.gc || 0
    }`,
    `📊 **1/4 le plus fort** : CA ${brief.quartHeurePlusFort?.ca || 0}€ | GC ${
      brief.quartHeurePlusFort?.gc || 0
    }`,
    `⚡ **Pic** : ${brief.pic || "-"}`,
    `👥 **Staffing** : ${brief.staffing || "-"}`,
  ].join("\n");
};

const buildDebriefContent = (debrief, analysis) => {
  return [
    `📉 **DÉBRIEF - ${debrief.rushDu?.toUpperCase()}**`,
    ``,
    `📍 **Restaurant** : ${debrief.restaurant || "Restaurant de Sèvres"}`,
    `👤 **Manager** : ${debrief.managerPrenom || ""} ${
      debrief.managerNom || ""
    }`,
    `📅 **Date** : ${formatDate(debrief.dateRush)}`,
    `🍽 **Service** : ${debrief.rushDu || "-"}`,
    ``,
    `💰 **CA réel** : ${debrief.analyseQuart?.ca || 0}€`,
    `👥 **Transactions** : ${debrief.analyseQuart?.transaction || 0}`,
    `📊 **Staffing** : ${debrief.analyseQuart?.staffing || 0}`,
    buildAnalysisText(analysis),
  ].join("\n");
};

const sendPDFToDiscord = async (filePath, data, type = "brief", analysis = null) => {
  try {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      console.warn("DISCORD_WEBHOOK_URL manquant dans .env");
      return;
    }

    const form = new FormData();

    const content =
      type === "brief"
        ? buildBriefContent(data)
        : buildDebriefContent(data, analysis);

    form.append(
      "payload_json",
      JSON.stringify({
        content,
      })
    );

    form.append("file", fs.createReadStream(filePath), {
      filename: path.basename(filePath),
    });

    await axios.post(process.env.DISCORD_WEBHOOK_URL, form, {
      headers: form.getHeaders(),
    });

    console.log("Discord envoyé ✅");
  } catch (error) {
    console.error(
      "Erreur Discord :",
      error.response?.data || error.message || error
    );
  }
};
const sendDiscordMessage = async (content) => {
  try {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      console.warn("DISCORD_WEBHOOK_URL manquant dans .env");
      return;
    }

    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content,
    });

    console.log("Message Discord envoyé ✅");
  } catch (error) {
    console.error(
      "Erreur message Discord :",
      error.response?.data || error.message || error
    );
  }
};

const sendImageToDiscord = async ({ content, imageBuffer, filename }) => {
  try {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      console.warn("DISCORD_WEBHOOK_URL manquant dans .env");
      return;
    }

    const form = new FormData();

    form.append(
      "payload_json",
      JSON.stringify({
        content,
      })
    );

    form.append("file", imageBuffer, {
      filename,
      contentType: "image/png",
    });

    await axios.post(process.env.DISCORD_WEBHOOK_URL, form, {
      headers: form.getHeaders(),
    });

    console.log("Image Discord envoyée ✅");
  } catch (error) {
    console.error(
      "Erreur image Discord :",
      error.response?.data || error.message || error
    );
  }
};

module.exports = {
  sendPDFToDiscord,
  sendDiscordMessage,
  sendImageToDiscord,
};