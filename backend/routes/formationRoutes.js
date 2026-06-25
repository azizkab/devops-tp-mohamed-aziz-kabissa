const express = require("express");
const router = express.Router();

const {
  getFormationsCatalogue,
  getEquipiersWithProgress,
  getEquipierFormations,
  getFormationDetail,
  validateFormation,
  getFormationPDF,
  getFormationDashboard,
  downloadCompletedFormationPDF,
  getEquipierFormationHistory,
} = require("../controllers/formationController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const authMiddlewareQuery = require("../middleware/authMiddlewareQuery");

// PDF avec token dans l'URL
router.get(
  "/pdf/:formationCode",
  authMiddlewareQuery,
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  getFormationPDF,
);

// Toutes les autres routes avec Authorization header
router.use(authMiddleware);

router.get(
  "/catalogue",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  getFormationsCatalogue,
);

router.get(
  "/equipiers",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  getEquipiersWithProgress,
);
router.get(
  "/dashboard",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  getFormationDashboard,
);

router.get(
  "/equipier/:equipierId",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  getEquipierFormations,
);

router.get(
  "/detail/:formationCode",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  getFormationDetail,
);

router.post(
  "/equipier/:equipierId/validate",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  validateFormation,
);
router.get(
  "/completed-pdf/:validationId",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  downloadCompletedFormationPDF,
);
router.get(
  "/equipier/:equipierId/history",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  getEquipierFormationHistory,
);
router.get(
  "/completed-pdf/:validationId",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"),
  downloadCompletedFormationPDF,
);

module.exports = router;
