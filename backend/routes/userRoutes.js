const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  updateUserRole,
  toggleUserStatus,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("ADMIN", "DIRECTEUR", "MANAGER"), getUsers);

router.post("/", roleMiddleware("ADMIN", "DIRECTEUR"), createUser);

router.patch("/:id/role", roleMiddleware("ADMIN", "DIRECTEUR"), updateUserRole);

router.patch("/:id/toggle-status", roleMiddleware("ADMIN", "DIRECTEUR"), toggleUserStatus);

module.exports = router;