const express = require("express");
const { requestDeletion } = require("../controllers/studentController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/deletion-request", protect, allowRoles("student"), requestDeletion);

module.exports = router;
