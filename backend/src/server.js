const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const metadataRoutes = require("./routes/metadataRoutes");
const timelineRoutes = require("./routes/timeline");
const attendanceRoutes = require("./routes/attendance");
const { sanitizeRequest } = require("./middleware/sanitizeMiddleware");
const { seedAdminUser, DEFAULT_ADMIN } = require("./utils/seedAdmin");
const { setIO } = require("./utils/io");

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
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV === "development" && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin))) {
      cb(null, true);
    } else {
      cb(new Error(`CORS blocked: ${origin}`), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};

app.use(cors(corsOptions));
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
app.use("/api/student", profileRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/attendance", attendanceRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found", status: 404 });
});

// Comprehensive error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log full error details in development
  if (process.env.NODE_ENV === "development") {
    console.error("[BACKEND ERROR]", {
      status: statusCode,
      message,
      method: req.method,
      url: req.originalUrl,
      stack: err.stack,
      body: req.body,
    });
  } else {
    console.error("[BACKEND ERROR]", { status: statusCode, message, url: req.originalUrl });
  }

  res.status(statusCode).json({ message, status: statusCode });
});

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found", status: 404 });
});

// Create HTTP server for Socket.IO integration
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV === "development" && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin))) {
        cb(null, true);
      } else {
        cb(new Error(`Socket CORS blocked: ${origin}`), false);
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowUpgrades: true,
});

// Set io instance globally so routes can access it
setIO(io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  // eslint-disable-next-line no-console
  console.log(`[SOCKET] User connected: ${socket.id}`);

  socket.on("join:opportunity", ({ opportunityId }) => {
    const roomName = `opportunity_${opportunityId}`;
    socket.join(roomName);
    // eslint-disable-next-line no-console
    console.log(`[SOCKET] Socket ${socket.id} joined room ${roomName}`);
  });

  socket.on("leave:opportunity", ({ opportunityId }) => {
    const roomName = `opportunity_${opportunityId}`;
    socket.leave(roomName);
    // eslint-disable-next-line no-console
    console.log(`[SOCKET] Socket ${socket.id} left room ${roomName}`);
  });

  socket.on("disconnect", () => {
    // eslint-disable-next-line no-console
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
  });
});

// Export io instance for use in route handlers
module.exports = { server, io, app };

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
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[SERVER] Running on port ${PORT} with Socket.IO`);
  });
};

startServer();
