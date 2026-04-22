const mongoose = require("mongoose");
const { isValidOpportunityDepartment } = require("../constants/departments");
const { getStatusFromLastDate } = require("../utils/dateUtils");

// Status logic: Compare lastDate with today's start date
// ACTIVE until end of lastDate, ARCHIVED after lastDate day ends
const getOpportunityStatus = (lastDate) => {
  if (!lastDate) {
    console.log("[OPPORTUNITY MODEL] getOpportunityStatus: lastDate is null, returning 'active'");
    return "active";
  }

  console.log("[OPPORTUNITY MODEL] getOpportunityStatus called with lastDate:", lastDate);
  const status = getStatusFromLastDate(lastDate);
  console.log("[OPPORTUNITY MODEL] getOpportunityStatus result:", status);
  return status;
};

const opportunitySchema = new mongoose.Schema(
  {
    announcementHeading: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Internship", "Placement"], required: true },
    description: { type: String, required: true, maxlength: 10000 },
    eligibilityCriteria: { type: String, default: "" },
    lastDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
    department: { type: String, required: true, trim: true },
    technicalSkills: [{ type: String, trim: true }],
    applicationLink: { type: String, default: "", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdName: { type: String, required: true, trim: true },
    applications: [{
      studentId: { type: String, trim: true },
      studentEmail: { type: String, required: true, trim: true },
      studentName: { type: String, required: true, trim: true },
      studentDepartment: { type: String, required: true, trim: true },
      appliedAt: { type: Date, default: Date.now }
    }],
    activeStages: {
      type: [String],
      default: [],
      enum: [
        "Aptitude Test",
        "Group Discussion",
        "Technical Interview",
        "HR Interview",
        "Result",
      ],
    },
  },
  { timestamps: true }
);

opportunitySchema.pre("validate", function validateDepartment() {
  if (!isValidOpportunityDepartment(this.department)) {
    throw new Error("Invalid department value");
  }
  this.status = getOpportunityStatus(this.lastDate);
});

opportunitySchema.index({ lastDate: 1 });
opportunitySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Opportunity", opportunitySchema);
