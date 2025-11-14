require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// routes
const apiRoutes = require("./routes/api/apiRoutes");

// background services
const { startAutomationEngine } = require("./services/automationEngine");

// middlewares
const requestContext = require("./middleware/requestContext");
const rateLimit = require("./middleware/rateLimit");
const idempotency = require("./middleware/idempotency");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const attachDbAndCtx = require("./middleware/attachDbAndCtx");

const logger = require("./utils/logger");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://szstc-srvr:3001",
  "http://szstc-srvr:3000",
  "http://10.0.1.188:3001",
  "http://100.93.205.55:3001",
  "http://100.93.205.55:3000",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// parser
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// context, limits, and logging
app.use(requestContext(logger));
app.use(rateLimit({ capacity: 300, refillPerSec: 2 }));
app.use(morgan("combined"));

// health/ root
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/", (_req, res) => res.send("Hello World"));

// every api request can use req.db and req.ctx
app.use(attachDbAndCtx);

app.use(idempotency());

// mount versioned API
app.use("/api", apiRoutes);

/// 404 + centralized errors
app.use(notFound);
app.use(errorHandler(logger));

// boot server + automations
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  // start after server is up
  startAutomationEngine().catch((err) => {
    logger.error("Failed to start AutomationEngine:", err);
  });
});

module.exports = app;
