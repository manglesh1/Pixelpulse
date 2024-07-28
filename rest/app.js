const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan'); // For logging requests
const apiRoutes = require('./routes/api/apiRoutes');
const sequelize = require('./models/index'); // Your Sequelize instance
const app = express();

// Enable CORS for all routes
app.use(cors());

// Use body-parser for JSON parsing
app.use(bodyParser.json());

// Use morgan for logging requests
app.use(morgan('combined'));

// Custom middleware for logging requests (if you prefer custom logging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Use API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});