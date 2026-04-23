/**
 * Environment variable validation
 * Ensures all required environment variables are:
 * 1. Present (not undefined)
 * 2. Not set to placeholder values
 *
 * Throws an error and exits process if validation fails in production
 * Warns in development
 */

const requiredEnvVars = {
  MONGODB_URI: {
    required: true,
    type: "string",
    description: "MongoDB connection string"
  },
  JWT_SECRET: {
    required: true,
    type: "string",
    description: "JWT signing secret (min 32 characters)",
    validate: (value) => value.length >= 32
  },
  PORT: {
    required: true,
    type: "string",
    description: "Server port number"
  },
  NODE_ENV: {
    required: true,
    type: "string",
    description: "Environment mode (development/production)",
    validate: (value) => ["development", "production", "test"].includes(value)
  },
  CLIENT_ORIGIN: {
    required: true,
    type: "string",
    description: "Frontend origin for CORS"
  },
  OTP_EMAIL_SERVICE: {
    required: false,
    type: "string",
    description: "Email service provider (gmail, sendgrid, etc)"
  },
  OTP_EMAIL_USER: {
    required: false,
    type: "string",
    description: "Email service username/address"
  },
  OTP_EMAIL_PASS: {
    required: false,
    type: "string",
    description: "Email service password/API key"
  }
};

const placeholderPatterns = [
  /placeholder/i,
  /your_[a-z_]+/i,
  /replace_with/i,
  /xxx/,
  /^example/i,
  /^demo/i
];

const isPlaceholder = (value) => {
  return placeholderPatterns.some(pattern => pattern.test(String(value)));
};

const validateEnv = () => {
  const errors = [];
  const warnings = [];

  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = process.env[key];

    // Check if required variable is missing
    if (config.required && !value) {
      errors.push(`Missing required env variable: ${key} (${config.description})`);
      return;
    }

    // Skip validation if variable is optional and not set
    if (!config.required && !value) {
      return;
    }

    // Check for placeholder values
    if (value && isPlaceholder(value)) {
      const msg = `Env variable ${key} is set to a placeholder value: "${value.substring(0, 30)}..." (${config.description})`;
      config.required ? errors.push(msg) : warnings.push(msg);
      return;
    }

    // Custom validation if provided
    if (config.validate && value && !config.validate(value)) {
      const msg = `Env variable ${key} failed validation: "${value.substring(0, 30)}..." (${config.description})`;
      config.required ? errors.push(msg) : warnings.push(msg);
    }
  });

  // Log warnings
  if (warnings.length > 0) {
    console.warn("[ENV] Warnings:");
    warnings.forEach(w => console.warn(`  ⚠️  ${w}`));
  }

  // Handle errors
  if (errors.length > 0) {
    console.error("[ENV] Critical configuration errors:");
    errors.forEach(e => console.error(`  ❌ ${e}`));

    if (process.env.NODE_ENV === "production") {
      console.error("\n[ENV] Cannot start in production with missing/invalid configuration.");
      process.exit(1);
    } else {
      console.error("\n[ENV] Development mode - continuing with warnings");
    }
  } else {
    console.log("[ENV] ✓ All required environment variables validated successfully");
  }
};

module.exports = { validateEnv };
