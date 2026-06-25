const express = require("express");
const router = express.Router();

const {
  createPlacement,
  getPlacements,
  getPlacementById,
  updatePlacement,
  deletePlacement,
  sendPlacementToDiscord,
  sendPlacementImageToDiscord,
} = require("../controllers/placementController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  createPlacement,
);

router.get("/", roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"), getPlacements);

router.get(
  "/:id",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  getPlacementById,
);

router.put(
  "/:id",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  updatePlacement,
);

router.delete(
  "/:id",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  deletePlacement,
);

router.post(
  "/:id/discord",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  sendPlacementToDiscord,
);
router.post(
  "/:id/discord-image",
  roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"),
  sendPlacementImageToDiscord,
);

module.exports = router;
