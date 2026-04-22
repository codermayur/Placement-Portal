const express = require("express");
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const OpportunityAttendance = require("../models/OpportunityAttendance");
const Opportunity = require("../models/Opportunity");
const { getIO } = require("../utils/io");
const { ok, fail } = require("../utils/apiResponse");

const router = express.Router();

// GET /api/attendance/:opportunityId/:stage
// Faculty and Admin only - get attendance list for a specific stage
router.get("/:opportunityId/:stage", protect, allowRoles("faculty", "admin"), async (req, res) => {
  try {
    const { opportunityId, stage } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      return res.status(400).json({ message: "Invalid opportunity ID format" });
    }

    // Verify the opportunity exists and stage is active
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    if (!opportunity.activeStages.includes(stage)) {
      return res.status(403).json({ message: "Stage not yet activated for this opportunity" });
    }

    // Fetch attendance records for this stage
    const attendanceRecords = await OpportunityAttendance.find({
      opportunityId: new mongoose.Types.ObjectId(opportunityId),
      stage,
    })
      .populate("markedBy", "name")
      .lean();

    // Create a map of studentId -> applicant info from opportunity.applications
    const applicantMap = {};
    if (opportunity.applications && Array.isArray(opportunity.applications)) {
      opportunity.applications.forEach((app) => {
        applicantMap[app.studentId] = {
          _id: app.studentId, // Use studentId as the ID
          name: app.studentName,
          studentId: app.studentId,
          email: app.studentEmail,
          department: app.studentDepartment,
        };
      });
    }

    // Combine attendance records with applicant information
    const attendanceList = attendanceRecords.map((record) => ({
      ...record,
      studentId: applicantMap[record.studentId] || {
        _id: record.studentId,
        name: "Unknown",
        studentId: record.studentId,
        email: "N/A",
        department: "N/A",
      },
    }));

    return res.status(200).json({
      data: attendanceList || [],
      message: "Attendance list fetched successfully",
    });
  } catch (error) {
    console.error("[ATTENDANCE GET ERROR]", {
      opportunityId: req.params.opportunityId,
      stage: req.params.stage,
      error: error.name,
      message: error.message,
      stack: error.stack
    });
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid opportunity ID" });
    }
    return res.status(500).json({ message: error.message || "Failed to fetch attendance" });
  }
});

// PATCH /api/attendance/:opportunityId
// Faculty and Admin only - mark attendance for a student
router.patch("/:opportunityId", protect, allowRoles("faculty", "admin"), async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const { studentId, stage, status } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      return res.status(400).json({ message: "Invalid opportunity ID format" });
    }

    // Validate input
    if (!studentId || !stage || !status) {
      return res.status(400).json({ message: "studentId, stage, and status are required" });
    }

    if (!["present", "absent"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'present' or 'absent'" });
    }

    // Find and update the attendance record (studentId is stored as string)
    const attendanceRecord = await OpportunityAttendance.findOneAndUpdate(
      {
        opportunityId: new mongoose.Types.ObjectId(opportunityId),
        studentId: String(studentId),
        stage,
      },
      {
        status,
        markedBy: req.user._id,
        markedAt: new Date(),
      },
      { new: true }
    );

    if (!attendanceRecord) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Emit Socket.IO event
    const io = getIO();
    if (io) {
      io.to(`opportunity_${opportunityId}`).emit("attendance:update", {
        studentId,
        stage,
        status,
        markedBy: req.user.name,
        markedAt: new Date(),
      });
    }

    return res.status(200).json({
      data: attendanceRecord,
      message: "Attendance marked successfully",
    });
  } catch (error) {
    console.error("[ATTENDANCE PATCH ERROR]", {
      opportunityId: req.params.opportunityId,
      body: req.body,
      error: error.name,
      message: error.message,
      stack: error.stack
    });
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    return res.status(500).json({ message: error.message || "Failed to update attendance" });
  }
});

// GET /api/attendance/:opportunityId/student/:studentId
// Student (own record only), Faculty, Admin - get student's attendance across all stages
router.get("/:opportunityId/student/:studentId", protect, async (req, res) => {
  try {
    const { opportunityId, studentId } = req.params;

    // Enforce student can only access their own records
    if (req.user.role === "student" && String(req.user._id) !== studentId) {
      return res.status(403).json({ message: "Cannot access other student's records" });
    }

    // Fetch all attendance records for this student across all stages
    const attendanceRecords = await OpportunityAttendance.find({
      opportunityId: new mongoose.Types.ObjectId(opportunityId),
      studentId: new mongoose.Types.ObjectId(studentId),
    }).sort({ stage: 1 });

    return res.status(200).json({
      data: attendanceRecords,
      message: "Student attendance records fetched successfully",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[ATTENDANCE STUDENT GET ERROR]", error);
    return res.status(500).json({ message: error.message || "Failed to fetch student attendance" });
  }
});

module.exports = router;
