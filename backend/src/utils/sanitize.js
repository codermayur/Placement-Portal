const sanitizeString = (value) => (typeof value === "string" ? value.trim() : value);

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    // Prevent NoSQL operator keys and dot-notation injection.
    const safeKey = key.replace(/\$/g, "").replace(/\./g, "");
    if (!safeKey) return;
    if (typeof value === "object") result[safeKey] = sanitizeObject(value);
    else result[safeKey] = sanitizeString(value);
  });
  return result;
};

const sanitizeUserResponse = (user) => {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : user;
  const { password, ...safeUser } = plain;
  return safeUser;
};

module.exports = { sanitizeObject, sanitizeUserResponse, sanitizeString };
