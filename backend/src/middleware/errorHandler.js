/**
 * Global error handler middleware
 * Must be placed AFTER all other middleware and routes
 *
 * In production: Returns generic messages only, never exposes stack traces or details
 * In development: Returns full error details for debugging
 */
const globalErrorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Log full error details
  if (isDevelopment) {
    console.error("[ERROR] Development Error Details:", {
      status: statusCode,
      message: err.message,
      name: err.name,
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      stack: err.stack,
      mongooseError: err.errors ? Object.keys(err.errors) : null
    });
  } else {
    // Production: log only essential info
    console.error("[ERROR] Production Error:", {
      status: statusCode,
      message: err.message,
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }

  // Handle specific error types

  // MongoDB Duplicate Key Error (code 11000)
  if (err.code === 11000 && !isProduction) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: isProduction ? "This resource already exists" : `${field} already exists`,
      status: 400
    });
  }

  // MongoDB Validation Error
  if (err.name === "ValidationError" && !isProduction) {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: isProduction ? "Validation failed" : "Input validation failed",
      errors: isProduction ? [] : messages,
      status: 400
    });
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token",
      status: 401
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired",
      tokenExpired: true,
      status: 401
    });
  }

  // Cast Error (Invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: isProduction ? "Invalid request" : "Invalid ID format",
      status: 400
    });
  }

  // Multer File Upload Errors
  if (err.name === "MulterError") {
    let message = "File upload failed";
    if (err.code === "FILE_TOO_LARGE") {
      message = "File size exceeds maximum allowed";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded";
    } else if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds maximum allowed";
    }
    return res.status(400).json({
      message,
      status: 400
    });
  }

  // Default error response
  const errorResponse = {
    status: statusCode,
    message: statusCode >= 500
      ? (isProduction ? "Internal Server Error" : err.message)
      : (err.message || "An error occurred")
  };

  // In development, include additional details
  if (isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Should be placed AFTER all routes but BEFORE global error handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: "Route not found",
    status: 404,
    method: req.method,
    url: req.originalUrl
  });
};

module.exports = {
  globalErrorHandler,
  notFoundHandler
};
