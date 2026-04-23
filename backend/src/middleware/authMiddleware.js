/**
 * DEPRECATED: Use middleware/auth.js instead
 * This file maintained for backward compatibility only
 */

const { protect, verifyRefreshToken } = require("./auth");

module.exports = { protect, verifyRefreshToken };
