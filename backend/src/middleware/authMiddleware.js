const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    console.warn(`[AUTH] Missing or invalid Authorization header for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({
      message: "Unauthorized - Missing or invalid Authorization header",
      requiresLogin: true
    });
  }

  try {
    const token = header.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("[AUTH] JWT_SECRET not configured!");
      return res.status(500).json({ message: "Server configuration error" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.warn(`[AUTH] JWT verification failed for ${req.method} ${req.originalUrl}: ${jwtError.message}`);
      return res.status(401).json({
        message: "Invalid or expired token",
        tokenExpired: jwtError.name === "TokenExpiredError"
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.warn(`[AUTH] User not found for ID: ${decoded.id}`);
      return res.status(401).json({ message: "User not found - invalid token" });
    }

    // Enforce OTP verification for students before allowing access to protected routes
    if (user.role === "student" && !user.isVerified) {
      console.warn(`[AUTH] Unverified student attempted access: ${user.email} (${user._id})`);
      return res.status(401).json({
        message: "Student account not verified. Please verify your email/OTP.",
        requiresVerification: true,
        email: user.email
      });
    }

    // Check if student has required department field for filtration
    if (user.role === "student" && !user.department) {
      console.warn(`[AUTH] Student missing department field: ${user.email} (${user._id})`);
      return res.status(401).json({
        message: "Student profile incomplete - department not set",
        incompleteProfile: true
      });
    }

    console.log(`[AUTH ✓] ${user.role.toUpperCase()} authenticated: ${user.email} (${user._id})`);
    req.user = user;
    return next();
  } catch (error) {
    console.error(`[AUTH] Unexpected error during authentication: ${error.message}`);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = { protect };
