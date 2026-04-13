const mongoose = require("mongoose");

const deletionRequestSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

deletionRequestSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model("DeletionRequest", deletionRequestSchema);
