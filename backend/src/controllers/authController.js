const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendOtpEmail } = require("../utils/sendOtpEmail");
const { sanitizeUserResponse, sanitizeString } = require("../utils/sanitize");
const { fail, ok } = require("../utils/apiResponse");

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
const instituteEmailRegex = /^[a-z]+(?:\.[a-z]+)+@vsit\.edu\.in$/i;
const otpRateWindowMs = 60 * 1000;
const otpRequestLimitPerWindow = 3;
const otpLimiter = new Map();

const canRequestOtp = (studentId) => {
  const now = Date.now();
  const current = otpLimiter.get(studentId) || { count: 0, resetAt: now + otpRateWindowMs };
  if (current.resetAt < now) {
    otpLimiter.set(studentId, { count: 1, resetAt: now + otpRateWindowMs });
    return true;
  }
  if (current.count >= otpRequestLimitPerWindow) return false;
  otpLimiter.set(studentId, { ...current, count: current.count + 1 });
  return true;
};

const registerStudent = async (req, res) => {
  try {
    const name = sanitizeString(req.body.name);
    const studentId = sanitizeString(req.body.studentId);
    const department = sanitizeString(req.body.department);
    const email = sanitizeString(req.body.email);
    const password = sanitizeString(req.body.password);

    if (!name || !studentId || !department || !email || !password) {
      return fail(res, 400, "Name, student ID, email, department and password are required");
    }
    if (!instituteEmailRegex.test(email)) {
      return fail(res, 400, "Email must follow name.surname@vsit.edu.in format");
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      return fail(res, 400, "Password must be 8+ chars with uppercase, number and special character");
    }
    if (!canRequestOtp(studentId)) {
      return res.status(429).json({ message: "Too many OTP requests. Try again in a minute." });
    }

    const existing = await User.findOne({ studentId });
    if (existing) {
      return fail(res, 400, "Student already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, studentId, department, role: "student", email, password: hashedPassword, isVerified: false });

    const otp = `${crypto.randomInt(100000, 1000000)}`;
    await Otp.findOneAndUpdate(
      { studentId, purpose: "registration" },
      { studentId, email, role: "student", purpose: "registration", otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true }
    );
    if (email) await sendOtpEmail(email, otp);

    return ok(
      res,
      {
        message: "OTP sent successfully",
      },
      201
    );
  } catch (error) {
    return fail(res, 500, "Registration failed", error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const studentId = sanitizeString(req.body.studentId);
    const otp = sanitizeString(req.body.otp);
    const otpDoc = await Otp.findOne({ studentId, purpose: "registration" });
    if (!otpDoc || otpDoc.otp !== otp || otpDoc.expiresAt < new Date()) {
      return fail(res, 400, "Invalid or expired OTP");
    }

    const user = await User.findOneAndUpdate({ studentId }, { isVerified: true }, { new: true });
    await Otp.deleteOne({ _id: otpDoc._id });
    const token = signToken(user._id);
    return ok(res, { token, user: sanitizeUserResponse(user) });
  } catch (error) {
    return fail(res, 500, "OTP verification failed", error.message);
  }
};

const login = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[AUTH] /login payload keys:", Object.keys(req.body || {}));
    }
    const email = sanitizeString(req.body.email);
    const password = sanitizeString(req.body.password);
    const studentId = sanitizeString(req.body.studentId);
    const role = sanitizeString(req.body.role);

    if (role === "student") {
      if (!studentId || !password) return fail(res, 400, "studentId and password are required");
      const student = await User.findOne({ studentId, role: "student" });
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[AUTH] student lookup:", Boolean(student), "verified:", Boolean(student?.isVerified));
      }
      if (!student || !student.isVerified) {
        return fail(res, 401, "Student not verified");
      }
      const isStudentPasswordValid = await bcrypt.compare(password || "", student.password || "");
      if (!isStudentPasswordValid) return fail(res, 401, "Invalid credentials");
      return ok(res, { token: signToken(student._id), user: sanitizeUserResponse(student) });
    }
    if (!email || !password || !role) {
      return fail(res, 400, "Email, password and role are required");
    }

    const user = await User.findOne({ email, role });
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[AUTH] admin/faculty lookup:", Boolean(user), "role:", role);
    }
    if (!user || !["admin", "faculty"].includes(role)) {
      return fail(res, 401, "Invalid credentials");
    }
    const isMatch = await bcrypt.compare(password || "", user.password || "");
    if (!isMatch) {
      return fail(res, 401, "Invalid credentials");
    }
    return ok(res, { token: signToken(user._id), user: sanitizeUserResponse(user) });
  } catch (error) {
    return fail(res, 500, "Login failed", error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const currentPassword = sanitizeString(req.body.currentPassword);
    const newPassword = sanitizeString(req.body.newPassword);
    const confirmNewPassword = sanitizeString(req.body.confirmNewPassword);
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return fail(res, 400, "All password fields are required");
    }
    if (newPassword !== confirmNewPassword) return fail(res, 400, "New passwords do not match");
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword)) {
      return fail(res, 400, "Password must be 8+ chars with uppercase, number and special character");
    }
    const user = await User.findById(req.user._id);
    if (!user || !user.password) return fail(res, 400, "Password change is unavailable for this account");
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return fail(res, 401, "Current password is incorrect");
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return ok(res, { message: "Password changed successfully" });
  } catch (error) {
    return fail(res, 500, "Failed to change password", error.message);
  }
};

const requestPasswordResetOtp = async (req, res) => {
  try {
    const email = sanitizeString(req.body.email);
    const role = sanitizeString(req.body.role);
    if (!email || !role) return fail(res, 400, "Email and role are required");
    if (!instituteEmailRegex.test(email)) return fail(res, 400, "Invalid institute email format");
    const user = await User.findOne({ email, role });
    if (!user) return fail(res, 404, "Account not found");

    const otp = `${crypto.randomInt(100000, 1000000)}`;
    await Otp.findOneAndUpdate(
      { email, role, purpose: "password_reset" },
      { email, role, purpose: "password_reset", otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true }
    );
    await sendOtpEmail(email, otp);
    return ok(res, { message: "Reset OTP sent successfully" });
  } catch (error) {
    return fail(res, 500, "Failed to send reset OTP", error.message);
  }
};

const resetPasswordWithOtp = async (req, res) => {
  try {
    const email = sanitizeString(req.body.email);
    const role = sanitizeString(req.body.role);
    const otp = sanitizeString(req.body.otp);
    const newPassword = sanitizeString(req.body.newPassword);
    const confirmNewPassword = sanitizeString(req.body.confirmNewPassword);
    if (!email || !role || !otp || !newPassword || !confirmNewPassword) {
      return fail(res, 400, "All fields are required");
    }
    if (newPassword !== confirmNewPassword) return fail(res, 400, "New passwords do not match");
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword)) {
      return fail(res, 400, "Password must be 8+ chars with uppercase, number and special character");
    }
    const otpDoc = await Otp.findOne({ email, role, purpose: "password_reset" });
    if (!otpDoc || otpDoc.otp !== otp || otpDoc.expiresAt < new Date()) {
      return fail(res, 400, "Invalid or expired OTP");
    }
    const user = await User.findOne({ email, role });
    if (!user) return fail(res, 404, "Account not found");
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await Otp.deleteOne({ _id: otpDoc._id });
    return ok(res, { message: "Password reset successful" });
  } catch (error) {
    return fail(res, 500, "Failed to reset password", error.message);
  }
};

module.exports = {
  registerStudent,
  verifyOtp,
  login,
  changePassword,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
};
