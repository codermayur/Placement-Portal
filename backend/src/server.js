const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const metadataRoutes = require("./routes/metadataRoutes");
const { sanitizeRequest } = require("./middleware/sanitizeMiddleware");
const { seedAdminUser, DEFAULT_ADMIN } = require("./utils/seedAdmin");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();
const app = express();
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin) =>
  /^https?:\/\/localhost:\d+$/i.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/i.test(origin);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools like curl/postman (no Origin header).
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin))) {
      return callback(null, true);
    }
    const corsError = new Error(`CORS blocked for origin: ${origin}`);
    corsError.status = 403;
    return callback(corsError);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    const origin = req.headers.origin || "no-origin";
    // eslint-disable-next-line no-console
    console.log(`[REQ] ${req.method} ${req.originalUrl} origin=${origin}`);
    if (req.method === "OPTIONS") {
      res.on("finish", () => {
        // eslint-disable-next-line no-console
        console.log(
          `[CORS] OPTIONS ${req.originalUrl} -> ${res.statusCode} ACO=${res.getHeader("Access-Control-Allow-Origin")} ACM=${res.getHeader("Access-Control-Allow-Methods")} ACH=${res.getHeader("Access-Control-Allow-Headers")}`
        );
      });
    }
  }
  next();
});
app.use(express.json());
app.use(sanitizeRequest);

app.get("/", (req, res) => {
  res.json({ message: "Placement Portal API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/metadata", metadataRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    // eslint-disable-next-line no-console
    console.error("MONGODB_URI is missing. Add it to your .env file.");
    process.exit(1);
  }
  await connectDB();
  const adminSeedResult = await seedAdminUser();
  if (adminSeedResult.created) {
    // eslint-disable-next-line no-console
    console.log(
      `[ADMIN SEED] Admin created: email=${DEFAULT_ADMIN.email} password=${DEFAULT_ADMIN.password}`
    );
  } else {
    // eslint-disable-next-line no-console
    console.log(`[ADMIN SEED] Admin already present: email=${adminSeedResult.email}`);
  }
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
