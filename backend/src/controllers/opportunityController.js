const Opportunity = require("../models/Opportunity");
const { sanitizeString } = require("../utils/sanitize");
const { ok, fail } = require("../utils/apiResponse");

const deriveStatusFromLastDate = (lastDate) => (new Date(lastDate) < new Date() ? "archived" : "active");

const syncOpportunityStatuses = async () => {
  const now = new Date();
  await Promise.all([
    Opportunity.updateMany({ lastDate: { $lt: now }, status: { $ne: "archived" } }, { $set: { status: "archived" } }),
    Opportunity.updateMany({ lastDate: { $gte: now }, status: { $ne: "active" } }, { $set: { status: "active" } }),
  ]);
};

const validatePayload = (payload) => {
  const required = [
    "announcementHeading",
    "type",
    "description",
    "eligibilityCriteria",
    "lastDate",
    "applicationLink",
    "department",
  ];
  for (const field of required) {
    if (!payload[field]) return `${field} is required`;
  }
  try {
    new URL(payload.applicationLink);
  } catch {
    return "applicationLink must be a valid URL";
  }
  const selectedDate = new Date(payload.lastDate);
  if (Number.isNaN(selectedDate.getTime())) return "lastDate must be a valid date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  if (selectedDate < today) return "lastDate cannot be in the past";
  return null;
};

const createOpportunity = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      announcementHeading: sanitizeString(req.body.announcementHeading),
      description: sanitizeString(req.body.description),
      applicationLink: sanitizeString(req.body.applicationLink),
      department: sanitizeString(req.body.department),
      type: sanitizeString(req.body.type),
    };
    if (req.user.role === "faculty") {
      payload.department = req.user.department;
    }
    payload.status = deriveStatusFromLastDate(payload.lastDate);
    const validationError = validatePayload(payload);
    if (validationError) return fail(res, 400, validationError);
    const opportunity = await Opportunity.create({ ...payload, createdBy: req.user._id });
    return ok(res, opportunity, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[OPPORTUNITIES][CREATE]", { body: req.body, error: error.message });
    return fail(res, 400, "Failed to create opportunity", error.message);
  }
};

const updateOpportunity = async (req, res) => {
  try {
    const existing = await Opportunity.findById(req.params.id);
    if (!existing) return fail(res, 404, "Opportunity not found");

    if (req.user.role === "faculty" && existing.department !== req.user.department) {
      return fail(res, 403, "Faculty can only update own department opportunities");
    }

    const payload = {
      ...req.body,
      announcementHeading: sanitizeString(req.body.announcementHeading),
      description: sanitizeString(req.body.description),
      applicationLink: sanitizeString(req.body.applicationLink),
      department: sanitizeString(req.body.department),
      type: sanitizeString(req.body.type),
    };
    if (req.user.role === "faculty") payload.department = req.user.department;
    payload.status = deriveStatusFromLastDate(payload.lastDate);
    const validationError = validatePayload(payload);
    if (validationError) return fail(res, 400, validationError);

    const updated = await Opportunity.findByIdAndUpdate(req.params.id, payload, { new: true });
    return ok(res, updated);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[OPPORTUNITIES][UPDATE]", { id: req.params.id, body: req.body, error: error.message });
    return fail(res, 400, "Failed to update opportunity", error.message);
  }
};

const getActiveOpportunities = async (req, res) => {
  await syncOpportunityStatuses();
  const filter = { status: "active" };
  if (req.user.role === "student") filter.department = { $in: [req.user.department, "all"] };
  if (req.user.role === "faculty") filter.department = req.user.department;

  const data = await Opportunity.find(filter).sort({ lastDate: 1, createdAt: -1 });
  return ok(res, data);
};

const getArchivedOpportunities = async (req, res) => {
  await syncOpportunityStatuses();
  const filter = { status: "archived" };
  if (req.user.role === "student") filter.department = { $in: [req.user.department, "all"] };
  if (req.user.role === "faculty") filter.department = req.user.department;

  const data = await Opportunity.find(filter).sort({ lastDate: -1, createdAt: -1 });
  return ok(res, data);
};

module.exports = {
  createOpportunity,
  updateOpportunity,
  getActiveOpportunities,
  getArchivedOpportunities,
};
