// Simple console logger with colors
const logger = {
  info: (message, ...args) => console.log('\x1b[36m%s\x1b[0m', `[INFO] ${message}`, ...args),
  warn: (message, ...args) => console.log('\x1b[33m%s\x1b[0m', `[WARN] ${message}`, ...args),
  error: (message, ...args) => console.log('\x1b[31m%s\x1b[0m', `[ERROR] ${message}`, ...args),
  debug: (message, ...args) => console.log('\x1b[90m%s\x1b[0m', `[DEBUG] ${message}`, ...args),
};

export default logger;
