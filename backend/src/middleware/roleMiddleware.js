const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    console.error("[ROLE] req.user not set - auth middleware not applied?");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userRole = req.user.role;

  if (!roles.includes(userRole)) {
    console.warn(`[ROLE] Access denied for ${userRole}: ${req.method} ${req.originalUrl} - requires one of: [${roles.join(", ")}]`);
    return res.status(403).json({
      message: `Access denied. Required role: ${roles.join(" or ")}`,
      userRole,
      requiredRoles: roles
    });
  }

  console.log(`[ROLE ✓] ${userRole} allowed: ${req.method} ${req.originalUrl}`);
  return next();
};

module.exports = { allowRoles };
