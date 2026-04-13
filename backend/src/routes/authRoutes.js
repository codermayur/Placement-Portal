const express = require("express");
const {
  login,
  registerStudent,
  verifyOtp,
  changePassword,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerStudent);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/change-password", protect, changePassword);
router.post("/forgot-password/request-otp", requestPasswordResetOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);

module.exports = router;
