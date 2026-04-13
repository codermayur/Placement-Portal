const mongoose = require("mongoose");

const getOpportunityStatus = (lastDate) => (new Date(lastDate) < new Date() ? "archived" : "active");

const opportunitySchema = new mongoose.Schema(
  {
    announcementHeading: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Internship", "Placement"], required: true },
    description: { type: String, required: true },
    eligibilityCriteria: { type: mongoose.Schema.Types.Mixed, required: true },
    lastDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
    department: { type: String, required: true, trim: true },
    applicationLink: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

opportunitySchema.pre("validate", function validateDepartment() {
  const allowed = ["all", "CSE", "IT", "ECE", "ME", "CE", "EEE", "MBA"];
  if (!allowed.includes(this.department)) {
    throw new Error("Invalid department value");
  }
  this.status = getOpportunityStatus(this.lastDate);
});

module.exports = mongoose.model("Opportunity", opportunitySchema);
