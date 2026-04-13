const express = require("express");
const {
  createOpportunity,
  updateOpportunity,
  getActiveOpportunities,
  getArchivedOpportunities,
} = require("../controllers/opportunityController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { validateOpportunityRequest } = require("../middleware/requestValidation");

const router = express.Router();

router.get("/active", protect, getActiveOpportunities);
router.get("/archive", protect, getArchivedOpportunities);
router.post("/", protect, allowRoles("admin", "faculty"), validateOpportunityRequest, createOpportunity);
router.put("/:id", protect, allowRoles("admin", "faculty"), validateOpportunityRequest, updateOpportunity);

module.exports = router;
