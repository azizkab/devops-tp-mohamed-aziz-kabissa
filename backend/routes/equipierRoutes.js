const express = require("express");
const router = express.Router();

const {
  createEquipier,
  getEquipiers,
  updateEquipier,
  toggleEquipierStatus,
} = require("../controllers/equipierController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get(
  "/",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  getEquipiers
);

router.post(
  "/",
  roleMiddleware("ADMIN", "DIRECTEUR"),
  createEquipier
);

router.put(
  "/:id",
  roleMiddleware("ADMIN", "DIRECTEUR"),
  updateEquipier
);

router.patch(
  "/:id/toggle-status",
  roleMiddleware("ADMIN", "DIRECTEUR"),
  toggleEquipierStatus
);

module.exports = router;