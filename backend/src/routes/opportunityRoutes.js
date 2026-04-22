const express = require("express");
const {
  listOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getActiveOpportunities,
  getArchivedOpportunities,
  applyToOpportunity,
  getApplicantsCount,
  getApplicants,
  getOpportunityApplications,
} = require("../controllers/opportunityController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { validateOpportunityRequest } = require("../middleware/requestValidation");

const router = express.Router();

router.get("/active", protect, getActiveOpportunities);
router.get("/archive", protect, getArchivedOpportunities);
router.get("/", listOpportunities);
router.get("/:id", getOpportunityById);
router.post("/", protect, allowRoles("admin", "faculty"), validateOpportunityRequest, createOpportunity);
router.put("/:id", protect, allowRoles("admin", "faculty"), validateOpportunityRequest, updateOpportunity);
router.post("/:id/apply", protect, applyToOpportunity);
router.get("/:id/applicants/count", protect, allowRoles("admin", "faculty"), getApplicantsCount);
router.get("/:id/applicants", protect, allowRoles("admin", "faculty"), getApplicants);
router.get("/:id/applications", protect, allowRoles("admin", "faculty"), getOpportunityApplications);
router.delete("/:id", protect, allowRoles("admin", "faculty"), deleteOpportunity);

module.exports = router;
