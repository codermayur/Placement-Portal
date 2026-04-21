const { fail } = require("../utils/apiResponse");
const { isValidDepartment, isValidOpportunityDepartment } = require("../constants/departments");

const validateOpportunityRequest = (req, res, next) => {
  const required = [
    "announcementHeading",
    "type",
    "description",
    "lastDate",
  ];
  if (req.user?.role !== "faculty") {
    required.push("department");
  }
  const missing = required.filter((field) => !req.body?.[field]);
  if (missing.length) {
    return fail(res, 400, "Invalid opportunity payload", { missingFields: missing });
  }
  if (req.user?.role === "faculty") {
    return next();
  }
  if (!isValidOpportunityDepartment(req.body.department)) {
    return fail(res, 400, "Invalid opportunity department");
  }
  return next();
};

const validateCreateFacultyRequest = (req, res, next) => {
  const required = ["name", "email", "password", "department"];
  const missing = required.filter((field) => !req.body?.[field]);
  if (missing.length) {
    return fail(res, 400, "Invalid faculty payload", { missingFields: missing });
  }
  if (!isValidDepartment(req.body.department)) {
    return fail(res, 400, "Invalid faculty department");
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
