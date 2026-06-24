const express = require("express");
const router = express.Router();

const {
  getRushStats,
  getMyBestShift,
  getManagersLeaderboard,
} = require("../controllers/statsController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get(
  "/rush",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  getRushStats
);

router.get(
  "/my-best-shift",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  getMyBestShift
);

router.get(
  "/leaderboard",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  getManagersLeaderboard
);

module.exports = router;