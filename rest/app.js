const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan'); // For logging requests
const apiRoutes = require('./routes/api/apiRoutes');
const sequelize = require('./models/index'); // Your Sequelize instance
const fs = require('fs');
const app = express();
const { startSmokeScheduler } = require('./services/laserSmokeService');

// Enable CORS for all routes
app.use(cors());

// Use body-parser for JSON parsing
app.use(bodyParser.json());

// Use morgan for logging requests
app.use(morgan('combined'));

// Custom middleware for logging requests (if you prefer custom logging)
app.use((req, res, next) => {
 const startTime = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2); // Convert to milliseconds

    // Create a log message
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime} ms`;

    // Write log message to file
    fs.appendFileSync('logs.txt', `${logMessage}\n`);

    console.log(logMessage); // Also log to console if needed
  });

  next();
});

// Use API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startSmokeScheduler();
});