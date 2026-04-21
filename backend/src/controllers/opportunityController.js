const Opportunity = require("../models/Opportunity");
const { sanitizeString } = require("../utils/sanitize");
const { ok, fail } = require("../utils/apiResponse");
const { OPPORTUNITY_BROADCAST_ALL, isValidOpportunityDepartment } = require("../constants/departments");

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
    "lastDate",
    "department",
  ];
  for (const field of required) {
    if (!payload[field]) return `${field} is required`;
  }
  if (payload.applicationLink) {
    try {
      const parsed = new URL(payload.applicationLink);
      if (!["http:", "https:"].includes(parsed.protocol)) return "applicationLink must start with http/https";
    } catch {
      return "applicationLink must be a valid URL";
    }
  }
  if ((payload.description || "").length > 10000) return "description must be <= 10000 characters";
  const selectedDate = new Date(payload.lastDate);
  if (Number.isNaN(selectedDate.getTime())) return "lastDate must be a valid date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  if (selectedDate < today) return "lastDate cannot be in the past";
  return null;
};

const normalizeOpportunity = (doc) => {
  const raw = doc?.toObject ? doc.toObject() : doc;
  if (!raw) return raw;
  return { ...raw, id: String(raw._id) };
};

const isOwner = (opportunity, user) => {
  if (!opportunity || !user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "faculty") return false;
  const createdByValue = opportunity.createdBy;
  if (!createdByValue) return false;
  return String(createdByValue) === String(user.email) || String(createdByValue) === String(user._id);
};

const isArchivedOpportunity = (opportunity) => deriveStatusFromLastDate(opportunity.lastDate) === "archived";
const getDepartmentAudience = (department) => [department, OPPORTUNITY_BROADCAST_ALL];

const listOpportunities = async (req, res) => {
  try {
    await syncOpportunityStatuses();
    const filter = {};
    if (req.user.role === "student" || req.user.role === "faculty") {
      filter.$or = [
        { department: OPPORTUNITY_BROADCAST_ALL },
        { department: { $regex: new RegExp(`\\b${req.user.department}\\b`) } }
      ];
    }

    const items = await Opportunity.find(filter).sort({ createdAt: -1 });
    return ok(res, items.map(normalizeOpportunity));
  } catch (error) {
    return fail(res, 500, "Failed to fetch opportunities", error.message);
  }
};

const getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return fail(res, 404, "Opportunity not found");
    if (req.user.role === "student" || req.user.role === "faculty") {
      const isAll = opportunity.department === OPPORTUNITY_BROADCAST_ALL;
      const hasUserDept = opportunity.department.includes(req.user.department);
      if (!isAll && !hasUserDept) return fail(res, 403, "Forbidden");
    }
    return ok(res, normalizeOpportunity(opportunity));
  } catch (error) {
    return fail(res, 500, "Failed to fetch opportunity", error.message);
  }
};

const createOpportunity = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      announcementHeading: sanitizeString(req.body.announcementHeading),
      description: sanitizeString(req.body.description),
      applicationLink: req.body.applicationLink ? sanitizeString(req.body.applicationLink) : "",
      department: sanitizeString(req.body.department),
      type: sanitizeString(req.body.type),
      eligibilityCriteria: Array.isArray(req.body.eligibilityCriteria)
        ? req.body.eligibilityCriteria.map(sanitizeString).filter(Boolean).join(", ")
        : sanitizeString(req.body.eligibilityCriteria),
    };
    if (req.user.role === "faculty") {
      payload.department = req.user.department;
    }
    if (!isValidOpportunityDepartment(payload.department)) {
      return fail(res, 400, "Invalid department");
    }
    payload.status = deriveStatusFromLastDate(payload.lastDate);
    const validationError = validatePayload(payload);
    if (validationError) {
      console.error('[OPPORTUNITIES][VALIDATION_ERROR]', { payloadKeys: Object.keys(payload), error: validationError });
      return fail(res, 400, validationError);
    }
    const opportunity = await Opportunity.create({ ...payload, createdBy: req.user.email || String(req.user._id) });
    return ok(res, normalizeOpportunity(opportunity), 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[OPPORTUNITIES][CREATE]", { body: req.body, payload, error: error.message });
    return fail(res, 400, "Failed to create opportunity", error.message);
  }
};

const updateOpportunity = async (req, res) => {
  try {
    const existing = await Opportunity.findById(req.params.id);
    if (!existing) return fail(res, 404, "Opportunity not found");

    if (!isOwner(existing, req.user)) {
      return fail(res, 403, "You don't have permission to edit this opportunity");
    }
    if (isArchivedOpportunity(existing)) {
      return fail(res, 409, "Cannot edit archived opportunities");
    }

    const payload = {
      ...req.body,
      announcementHeading: sanitizeString(req.body.announcementHeading),
      description: sanitizeString(req.body.description),
      applicationLink: req.body.applicationLink ? sanitizeString(req.body.applicationLink) : "",
      department: sanitizeString(req.body.department),
      type: sanitizeString(req.body.type),
      eligibilityCriteria: Array.isArray(req.body.eligibilityCriteria)
        ? req.body.eligibilityCriteria.map(sanitizeString).filter(Boolean).join(", ")
        : sanitizeString(req.body.eligibilityCriteria),
    };
    if (req.user.role === "faculty") payload.department = req.user.department;
    if (!isValidOpportunityDepartment(payload.department)) {
      return fail(res, 400, "Invalid department");
    }
    payload.status = deriveStatusFromLastDate(payload.lastDate);
    const validationError = validatePayload(payload);
    if (validationError) return fail(res, 400, validationError);

    const updated = await Opportunity.findByIdAndUpdate(req.params.id, payload, { new: true });
    return ok(res, normalizeOpportunity(updated));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[OPPORTUNITIES][UPDATE]", { id: req.params.id, body: req.body, error: error.message });
    return fail(res, 400, "Failed to update opportunity", error.message);
  }
};

const deleteOpportunity = async (req, res) => {
  try {
    const existing = await Opportunity.findById(req.params.id);
    if (!existing) return fail(res, 404, "Opportunity not found");
    if (!isOwner(existing, req.user)) return fail(res, 403, "You don't have permission to delete this opportunity");
    if (isArchivedOpportunity(existing)) return fail(res, 409, "Archived opportunities cannot be deleted");

    await Opportunity.deleteOne({ _id: existing._id });
    return ok(res, { message: "Opportunity deleted successfully" });
  } catch (error) {
    return fail(res, 500, "Failed to delete opportunity", error.message);
  }
};

const getActiveOpportunities = async (req, res) => {
  await syncOpportunityStatuses();
  const filter = { status: "active" };

  if (req.user.role === "faculty") {
    // Faculty can only see opportunities they created
    filter.createdBy = req.user.email || String(req.user._id);
  } else if (req.user.role === "student") {
    filter.$or = [
      { department: OPPORTUNITY_BROADCAST_ALL },
      { department: { $regex: new RegExp(`\\b${req.user.department}\\b`) } }
    ];
  }

  const data = await Opportunity.find(filter).sort({ lastDate: 1, createdAt: -1 });
  return ok(res, data.map(normalizeOpportunity));
};

const getArchivedOpportunities = async (req, res) => {
  await syncOpportunityStatuses();
  const filter = { status: "archived" };

  if (req.user.role === "faculty") {
    // Faculty can only see opportunities they created
    filter.createdBy = req.user.email || String(req.user._id);
  } else if (req.user.role === "student") {
    filter.$or = [
      { department: OPPORTUNITY_BROADCAST_ALL },
      { department: { $regex: new RegExp(`\\b${req.user.department}\\b`) } }
    ];
  }

  const data = await Opportunity.find(filter).sort({ lastDate: -1, createdAt: -1 });
  return ok(res, data.map(normalizeOpportunity));
};

module.exports = {
  listOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getActiveOpportunities,
  getArchivedOpportunities,
};
