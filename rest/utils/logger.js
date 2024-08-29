const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const logDirectory = path.join(__dirname, '..', 'logs'); // Adjust the path as needed
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Create a transport for daily log rotation
const dailyRotateFileTransport = new DailyRotateFile({
  filename: `${logDirectory}/%DATE%.log`, // The log file name format
  datePattern: 'YYYY-MM-DD', // The date format in the log file name
  maxFiles: '14d', // Keep log files for 14 days
  zippedArchive: true // Compress the logs after rotating
});

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    dailyRotateFileTransport,
    new winston.transports.Console()
  ]
});

// Overwrite console.log to also log using winston
console.log = (message) => {
  logger.info(message);
};

console.error = (message) => {
  logger.error(message);
};

module.exports = logger;
