const mongoose = require("mongoose");
const { isValidOpportunityDepartment } = require("../constants/departments");

const getOpportunityStatus = (lastDate) => (new Date(lastDate) < new Date() ? "archived" : "active");

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
    applicationLink: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true, trim: true, index: true },
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
