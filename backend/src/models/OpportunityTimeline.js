const mongoose = require("mongoose");

const opportunityTimelineSchema = new mongoose.Schema(
  {
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Opportunity",
      required: true,
      index: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["faculty", "admin"],
      required: true,
    },
    stage: {
      type: String,
      enum: [
        "Aptitude Test",
        "Group Discussion",
        "Technical Interview",
        "HR Interview",
        "Result",
        "General Update",
      ],
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    isStageActivation: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

opportunityTimelineSchema.index({ opportunityId: 1, createdAt: -1 });

module.exports = mongoose.model("OpportunityTimeline", opportunityTimelineSchema);
