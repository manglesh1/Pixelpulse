const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan"); // For logging requests
const apiRoutes = require("./routes/api/apiRoutes");
const sequelize = require("./models/index");
const fs = require("fs");
require("dotenv").config();
const app = express();
const { startAutomationEngine } = require("./services/automationEngine");
const cookieParser = require("cookie-parser");

app.use(cookieParser());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://szstc-srvr:3001",
        "http://10.0.1.188:3001",
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
// Use body-parser for JSON parsing
app.use(bodyParser.json());

// Use morgan for logging requests
app.use(morgan("combined"));

// Custom middleware for logging requests (if you prefer custom logging)
app.use((req, res, next) => {
  const startTime = process.hrtime();

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2);

    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime} ms`;

    fs.appendFileSync("logs.txt", `${logMessage}\n`);
    console.log(logMessage);
  });

  next();
});

// Use API routes
app.use("/api", apiRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startAutomationEngine().catch((err) => {
    console.error("Failed to start AutomationEngine:", err);
  });
});
