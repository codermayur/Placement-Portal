const DeletionRequest = require("../models/DeletionRequest");
const { sanitizeString } = require("../utils/sanitize");

const requestDeletion = async (req, res) => {
  try {
    const reason = sanitizeString(req.body.reason);
    if (!reason) return res.status(400).json({ message: "Reason required" });
    const existingPending = await DeletionRequest.findOne({ studentId: req.user.studentId, status: "pending" });
    if (existingPending) return res.status(400).json({ message: "Pending request already exists" });
    const request = await DeletionRequest.create({
      studentId: req.user.studentId,
      reason,
    });
    return res.status(201).json(request);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { requestDeletion };
