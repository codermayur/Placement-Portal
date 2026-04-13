const { fail } = require("../utils/apiResponse");

const validateOpportunityRequest = (req, res, next) => {
  const required = [
    "announcementHeading",
    "type",
    "description",
    "eligibilityCriteria",
    "lastDate",
    "applicationLink",
  ];
  const missing = required.filter((field) => !req.body?.[field]);
  if (missing.length) {
    return fail(res, 400, "Invalid opportunity payload", { missingFields: missing });
  }
  return next();
};

const validateCreateFacultyRequest = (req, res, next) => {
  const required = ["name", "email", "password", "department"];
  const missing = required.filter((field) => !req.body?.[field]);
  if (missing.length) {
    return fail(res, 400, "Invalid faculty payload", { missingFields: missing });
  }
  return next();
};

const validateCreateAdminRequest = (req, res, next) => {
  const required = ["name", "email", "password"];
  const missing = required.filter((field) => !req.body?.[field]);
  if (missing.length) {
    return fail(res, 400, "Invalid admin payload", { missingFields: missing });
  }
  return next();
};

module.exports = { validateOpportunityRequest, validateCreateFacultyRequest, validateCreateAdminRequest };
