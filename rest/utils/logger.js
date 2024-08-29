const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const logDirectory = path.join(__dirname, '..', 'logs'); // Adjust the path as needed
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDirectory, 'app.log') }),
    new winston.transports.Console()
  ]
});

console.log = (message) => {
  logger.info(message);
};

console.error = (message) => {
  logger.error(message);
};

module.exports = logger;
