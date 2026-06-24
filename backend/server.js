require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
const { startFormationAlertsCron } = require("./services/formationAlertService");
const { startRushReminderCron } = require("./services/rushReminderService");

connectDB();


app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
  startFormationAlertsCron();
  startRushReminderCron();
});