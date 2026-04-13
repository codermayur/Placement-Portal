const express = require("express");
const {
  createFaculty,
  createAdmin,
  getDeletionRequests,
  updateDeletionRequestStatus,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { validateCreateFacultyRequest, validateCreateAdminRequest } = require("../middleware/requestValidation");

const router = express.Router();

router.post("/faculty", protect, allowRoles("admin"), validateCreateFacultyRequest, createFaculty);
router.post("/admins", protect, allowRoles("admin"), validateCreateAdminRequest, createAdmin);
router.get("/deletion-requests", protect, allowRoles("admin"), getDeletionRequests);
router.put("/deletion-requests/:id", protect, allowRoles("admin"), updateDeletionRequestStatus);

module.exports = router;
