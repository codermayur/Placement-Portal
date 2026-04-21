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

    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          applicationCount: { $size: { $ifNull: ["$applications", []] } }
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    const items = await Opportunity.aggregate(pipeline);
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

  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        applicationCount: { $size: { $ifNull: ["$applications", []] } }
      }
    },
    { $sort: { lastDate: 1, createdAt: -1 } }
  ];

  const data = await Opportunity.aggregate(pipeline);
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

  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        applicationCount: { $size: { $ifNull: ["$applications", []] } }
      }
    },
    { $sort: { lastDate: -1, createdAt: -1 } }
  ];

  const data = await Opportunity.aggregate(pipeline);
  return ok(res, data.map(normalizeOpportunity));
};

const applyToOpportunity = async (req, res) => {
  try {
    console.log('[APPLY_DEBUG] req.user:', {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      studentId: req.user.studentId,
      name: req.user.name,
      department: req.user.department,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    });

    if (req.user.role !== "student") {
      return fail(res, 403, "Only students can apply");
    }

    // Validate studentId
    if (!req.user.studentId) {
      console.error('[APPLY_ERROR] Missing studentId for user:', req.user.email);
      return fail(res, 400, "Student ID is required. Please complete your profile.");
    }

    const opportunity = await Opportunity.findById(req.params.id);
    console.log('[APPLY_DEBUG] opportunity:', {
      id: req.params.id,
      found: !!opportunity,
      status: opportunity?.status,
      department: opportunity?.department
    });

    if (!opportunity) {
      return fail(res, 404, "Opportunity not found");
    }

    if (opportunity.status !== "active") {
      return fail(res, 400, "Cannot apply to inactive/archived opportunities");
    }

    // Check if already applied
    const alreadyApplied = opportunity.applications.some(app => app.studentEmail === req.user.email);
    if (alreadyApplied) {
      return fail(res, 400, "You have already applied to this opportunity");
    }

    // Prepare application data
    const studentName = (req.user.name || req.user.email || 'Unknown').trim();
    const applicationData = {
      studentId: req.user.studentId,
      studentEmail: req.user.email,
      studentName,
      studentDepartment: req.user.department || 'Not specified',
      appliedAt: new Date()
    };

    console.log('[APPLY_DEBUG] Adding application:', applicationData);

    // Add application
    opportunity.applications.push(applicationData);

    const updatedOpportunity = await opportunity.save();
    console.log('[APPLY_SUCCESS] Application added for:', req.user.email);
    return ok(res, normalizeOpportunity(updatedOpportunity));
  } catch (error) {
    console.error('[APPLY_ERROR] Full error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return fail(res, 500, "Failed to apply to opportunity", error.message);
  }
};

const getOpportunityApplications = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) return fail(res, 404, "Opportunity not found");

    // Permission check: admin, faculty (owner), or own opportunity
    if (req.user.role !== "admin" && !isOwner(opportunity, req.user)) {
      return fail(res, 403, "You don't have permission to view applications");
    }

    const applications = opportunity.applications.map(app => ({
      ...app.toObject(),
      studentName: app.studentName,
      count: opportunity.applications.length
    }));

    return ok(res, {
      applications,
      count: applications.length,
      opportunityId: opportunity._id
    });
  } catch (error) {
    return fail(res, 500, "Failed to fetch applications", error.message);
  }
};

module.exports = {
  listOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getActiveOpportunities,
  getArchivedOpportunities,
  applyToOpportunity,
  getOpportunityApplications,
};
