const Opportunity = require("../models/Opportunity");
const OpportunityAttendance = require("../models/OpportunityAttendance");
const { sanitizeString } = require("../utils/sanitize");
const { ok, fail } = require("../utils/apiResponse");
const { OPPORTUNITY_BROADCAST_ALL, isValidOpportunityDepartment } = require("../constants/departments");

const deriveStatusFromLastDate = (lastDate) =>
  new Date(lastDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
    ? "archived"
    : "active";

/*const deriveStatusFromLastDate = (lastDate) => (new Date(lastDate) < new Date() ? "archived" : "active");*/

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

const normalizeOpportunity = (doc, userEmail = null) => {
  const raw = doc?.toObject ? doc.toObject() : doc;
  if (!raw) return raw;

  const normalized = { ...raw, id: String(raw._id) };

  // Add hasApplied field for students
  if (userEmail) {
    normalized.hasApplied = raw.applications?.some(app => app.studentEmail === userEmail) ?? false;
  }

  return normalized;
};

const isOwner = (opportunity, user) => {
  if (!opportunity || !user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "faculty") return false;
  if (!opportunity.createdBy) return false;
  return String(opportunity.createdBy) === String(user._id);
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
    if (!opportunity) {
      console.warn(`[OPPORTUNITY] Not found: ${req.params.id}`);
      return fail(res, 404, "Opportunity not found");
    }

    // Role-based access control
    if (req.user.role === "student" || req.user.role === "faculty") {
      const isAll = opportunity.department === OPPORTUNITY_BROADCAST_ALL;
      const departmentFilter = opportunity.department;
      const userDept = req.user.department;

      // Use regex matching for department (consistent with other endpoints)
      const hasUserDept = isAll || new RegExp(`\\b${userDept}\\b`).test(departmentFilter);

      if (!isAll && !hasUserDept) {
        console.warn(
          `[OPPORTUNITY 403] ${req.user.role} ${req.user.email} denied access to opportunity ${req.params.id}:`,
          `Expected one of: [${departmentFilter}], Got: ${userDept}`
        );
        return fail(res, 403, `Forbidden - opportunity not available for your department (${userDept})`);
      }
    }

    console.log(`[OPPORTUNITY ✓] ${req.user.role} ${req.user.email} accessed opportunity ${req.params.id}`);
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
      createdBy: req.user._id,
      createdName: req.user.name || req.user.email || "Unknown",
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
    const opportunity = await Opportunity.create(payload);
    return ok(res, normalizeOpportunity(opportunity), 201);
  } catch (error) {
    console.error("[OPPORTUNITIES][CREATE]", { body: req.body, error: error.message });
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
  try {
    await syncOpportunityStatuses();
    const filter = { status: "active" };

    if (req.user.role === "faculty") {
      // Faculty can only see opportunities they created
      filter.createdBy = req.user._id;
      console.log(`[OPPORTUNITY] Fetching active opportunities for faculty: ${req.user.email}`);
    } else if (req.user.role === "student") {
      filter.$or = [
        { department: OPPORTUNITY_BROADCAST_ALL },
        { department: { $regex: new RegExp(`\\b${req.user.department}\\b`) } }
      ];
      console.log(`[OPPORTUNITY] Fetching active opportunities for student ${req.user.email} (dept: ${req.user.department})`);
    } else {
      console.log(`[OPPORTUNITY] Fetching active opportunities for ${req.user.role}: ${req.user.email}`);
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
    console.log(`[OPPORTUNITY ✓] Found ${data.length} active opportunities for ${req.user.role}`);
    // Pass user email for students to check hasApplied status
    const userEmail = req.user.role === "student" ? req.user.email : null;
    return ok(res, data.map(doc => normalizeOpportunity(doc, userEmail)));
  } catch (error) {
    console.error(`[OPPORTUNITY ERROR] getActiveOpportunities failed: ${error.message}`);
    return fail(res, 500, "Failed to fetch active opportunities", error.message);
  }
};

const getArchivedOpportunities = async (req, res) => {
  try {
    await syncOpportunityStatuses();
    const filter = { status: "archived" };

    if (req.user.role === "faculty") {
      // Faculty can only see opportunities they created
      filter.createdBy = req.user._id;
      console.log(`[OPPORTUNITY] Fetching archived opportunities for faculty: ${req.user.email}`);
    } else if (req.user.role === "student") {
      filter.$or = [
        { department: OPPORTUNITY_BROADCAST_ALL },
        { department: { $regex: new RegExp(`\\b${req.user.department}\\b`) } }
      ];
      console.log(`[OPPORTUNITY] Fetching archived opportunities for student ${req.user.email} (dept: ${req.user.department})`);
    } else {
      console.log(`[OPPORTUNITY] Fetching archived opportunities for ${req.user.role}: ${req.user.email}`);
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
    console.log(`[OPPORTUNITY ✓] Found ${data.length} archived opportunities for ${req.user.role}`);
    // Pass user email for students to check hasApplied status
    const userEmail = req.user.role === "student" ? req.user.email : null;
    return ok(res, data.map(doc => normalizeOpportunity(doc, userEmail)));
  } catch (error) {
    console.error(`[OPPORTUNITY ERROR] getArchivedOpportunities failed: ${error.message}`);
    return fail(res, 500, "Failed to fetch archived opportunities", error.message);
  }
};

const applyToOpportunity = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return fail(res, 403, "Faculty and Admin cannot apply for opportunities.");
    }

    // Validate studentId
    if (!req.user.studentId) {
      return fail(res, 400, "Student ID is required. Please complete your profile.");
    }

    const opportunity = await Opportunity.findById(req.params.id);
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

    // Add application
    opportunity.applications.push(applicationData);

    const updatedOpportunity = await opportunity.save();

    // Create attendance records for all active stages
    if (opportunity.activeStages && opportunity.activeStages.length > 0) {
      const attendanceRecords = opportunity.activeStages.map((stage) => ({
        opportunityId: opportunity._id,
        studentId: req.user.studentId,
        stage,
        status: "pending",
        markedBy: null,
        markedAt: null,
      }));

      try {
        await OpportunityAttendance.insertMany(attendanceRecords, { ordered: false });
        console.log(`[APPLY] Created ${attendanceRecords.length} attendance records for student ${req.user.studentId}`);
      } catch (error) {
        // Duplicate errors (E11000) are expected if records already exist
        if (!error.message.includes("duplicate") && !error.message.includes("E11000")) {
          console.error("[APPLY ATTENDANCE ERROR]", { studentId: req.user.studentId, error: error.message });
        }
      }
    }

    return ok(res, normalizeOpportunity(updatedOpportunity));
  } catch (error) {
    console.error('[APPLY_ERROR]', { message: error.message, stack: error.stack });
    return fail(res, 500, "Failed to apply to opportunity", error.message);
  }
};

const getApplicantsCount = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return fail(res, 404, "Opportunity not found");

    // Authorization check: admin can see all, faculty can only see their own
    if (req.user.role === "faculty") {
      if (!opportunity.createdBy || String(opportunity.createdBy) !== String(req.user._id)) {
        return fail(res, 403, "Access denied.");
      }
    }

    const count = opportunity.applications.length;
    return ok(res, { opportunityId: opportunity._id, count });
  } catch (error) {
    return fail(res, 500, "Failed to fetch applicant count", error.message);
  }
};

const getApplicants = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return fail(res, 404, "Opportunity not found");

    // Authorization check: admin can see all, faculty can only see their own
    if (req.user.role === "faculty") {
      if (!opportunity.createdBy || String(opportunity.createdBy) !== String(req.user._id)) {
        return fail(res, 403, "Access denied.");
      }
    }

    const applicants = opportunity.applications.map(app => ({
      _id: app._id,
      appliedAt: app.appliedAt,
      student: {
        name: app.studentName,
        email: app.studentEmail,
        studentId: app.studentId,
        department: app.studentDepartment
      }
    }));

    return ok(res, applicants);
  } catch (error) {
    return fail(res, 500, "Failed to fetch applicants", error.message);
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
  getApplicantsCount,
  getApplicants,
  getOpportunityApplications,
};
