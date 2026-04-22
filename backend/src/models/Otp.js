const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    studentId: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, enum: ["admin", "faculty", "student"] },
    purpose: { type: String, enum: ["registration", "password_reset"], default: "registration" },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    // Registration data - stored temporarily until OTP verification
    registrationData: {
      name: { type: String },
      phone: { type: String },
      department: { type: String },
      password: { type: String }, // Hashed password
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);
