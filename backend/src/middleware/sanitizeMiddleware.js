const { sanitizeObject } = require("../utils/sanitize");

const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);
  req.query = sanitizeObject(req.query);
  next();
};

module.exports = { sanitizeRequest };
