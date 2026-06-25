const express = require("express");
const router = express.Router();

const {
  createBrief,
  getBriefs,
  updateBrief,
  deleteBrief,
  createDebrief,
  getDebriefs,
  updateDebrief,
  deleteDebrief,
  downloadBriefPDF,
  downloadDebriefPDF,
} = require("../controllers/briefController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

// BRIEFS
router.post(
  "/brief",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  createBrief,
);

router.get(
  "/brief",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  getBriefs,
);

router.put(
  "/brief/:id",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  updateBrief,
);

router.delete(
  "/brief/:id",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  deleteBrief,
);

router.get(
  "/brief/:id/pdf",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  downloadBriefPDF,
);

// DEBRIEFS
router.post(
  "/debrief",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  createDebrief,
);

router.get(
  "/debrief",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  getDebriefs,
);

router.put(
  "/debrief/:id",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  updateDebrief,
);

router.delete(
  "/debrief/:id",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  deleteDebrief,
);

router.get(
  "/debrief/:id/pdf",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  downloadDebriefPDF,
);

module.exports = router;
