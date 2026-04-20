const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/resumes");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const studentId = req.user?._id || "unknown";
    const timestamp = Date.now();
    const filename = `${studentId}_${timestamp}.pdf`;
    cb(null, filename);
  },
});

// File filter to accept only PDF files
const fileFilter = (req, file, cb) => {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".pdf") {
    return cb(new Error("Only PDF files are allowed"));
  }

  // Check MIME type
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("File must be a valid PDF document"));
  }

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Custom error handling middleware for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          message: "File size must be less than 5MB",
          details: "Resume file size exceeds the maximum limit of 5MB",
        },
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          message: "Only one file can be uploaded",
          details: err.message,
        },
      });
    }
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        message: "File upload error",
        details: err.message,
      },
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        message: err.message || "File upload failed",
        details: "Invalid file or file format",
      },
    });
  }

  next();
};

// Middleware to validate file was uploaded
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        message: "No file uploaded",
        details: "Please select a PDF file to upload",
      },
    });
  }

  // Additional validation
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        message: "Authentication required",
        details: "User information not found",
      },
    });
  }

  next();
};

module.exports = {
  upload,
  handleUploadError,
  validateFileUpload,
};
