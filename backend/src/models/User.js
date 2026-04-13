const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    userEmail: { type: String, lowercase: true, trim: true },
    studentId: { type: String, trim: true },
    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
      required: true,
    },
    department: {
      type: String,
      required: function requiredDepartment() {
        return this.role !== "admin";
      },
      trim: true,
    },
    password: {
      type: String,
      required: function requiredPassword() {
        return ["admin", "faculty", "student"].includes(this.role);
      },
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("validate", function validateIdentity() {
  if (!this.userEmail) {
    this.userEmail = this.email || this.studentId;
  }
  if (this.role === "student" && !this.studentId) {
    throw new Error("studentId is required for students");
  }
  if ((this.role === "admin" || this.role === "faculty") && !this.email) {
    throw new Error("email is required for admin/faculty");
  }
});

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ studentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);
