const bcrypt = require("bcryptjs");
const User = require("../models/User");

const DEFAULT_ADMIN = {
  name: "Portal Admin",
  email: "admin.vsit@vsit.edu.in",
  role: "admin",
  password: "Admin@123",
};

const seedAdminUser = async () => {
  const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN.email, role: "admin" });
  if (existingAdmin) return { created: false, email: existingAdmin.email };

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  await User.create({
    ...DEFAULT_ADMIN,
    password: hashedPassword,
    isVerified: true,
  });
  return { created: true, email: DEFAULT_ADMIN.email };
};

module.exports = { seedAdminUser, DEFAULT_ADMIN };
