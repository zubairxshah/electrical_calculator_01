/**
 * Structured Console Logging Utility
 *
 * Provides consistent, structured logging for debugging and monitoring.
 * Supports ERROR, WARN, INFO, and DEBUG log levels with component context.
 *
 * Features:
 * - Color-coded console output
 * - Timestamp and component tracking
 * - Log buffering for export (last 100 entries)
 * - Development vs production filtering
 * - Sensitive data filtering (no PII in logs)
 *
 * @module logger
 */

/**
 * Log Level Enumeration
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Log Entry Structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: Record<string, any>;
}

/**
 * Logger Class
 *
 * Centralized logging with buffering and formatting
 */
class Logger {
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, component: string, message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      context: context ? this.sanitizeContext(context) : undefined,
    };

    // Add to buffer (FIFO with size limit)
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Console output (with level filtering)
    if (this.shouldLog(level)) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Determine if log should be output based on level and environment
   */
  private shouldLog(level: LogLevel): boolean {
    // In production, only log WARN and ERROR
    if (!this.isDevelopment && (level === LogLevel.DEBUG || level === LogLevel.INFO)) {
      return false;
    }
    return true;
  }

  /**
   * Output log entry to console with formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const color = this.getColorForLevel(entry.level);
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    const logMessage = `[${timestamp}] [${entry.level}] [${entry.component}] ${entry.message}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(`%c${logMessage}`, `color: ${color}; font-weight: bold;`, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(`%c${logMessage}`, `color: ${color}; font-weight: bold;`, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(`%c${logMessage}`, `color: ${color};`, entry.context || '');
        break;
      case LogLevel.DEBUG:
        console.debug(`%c${logMessage}`, `color: ${color};`, entry.context || '');
        break;
    }
  }

  /**
   * Get color for log level
   */
  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '#888888'; // Gray
      case LogLevel.INFO:
        return '#0066AA'; // Blue
      case LogLevel.WARN:
        return '#FFAA00'; // Orange
      case LogLevel.ERROR:
        return '#FF0000'; // Red
    }
  }

  /**
   * Remove sensitive data from context before logging
   */
  private sanitizeContext(context: any): any {
    if (!context || typeof context !== 'object') {
      return context;
    }

    const sanitized = { ...context };

    // Remove potentially sensitive fields
    const sensitiveKeys = [
      'password',
      'token',
      'apiKey',
      'secret',
      'projectName',
      'engineerName',
      'customerName',
    ];

    sensitiveKeys.forEach((key) => {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * DEBUG level log
   * Detailed information for debugging (only in development)
   */
  debug(component: string, message: string, context?: any): void {
    this.log(LogLevel.DEBUG, component, message, context);
  }

  /**
   * INFO level log
   * General informational messages
   */
  info(component: string, message: string, context?: any): void {
    this.log(LogLevel.INFO, component, message, context);
  }

  /**
   * WARN level log
   * Warning conditions that should be reviewed
   */
  warn(component: string, message: string, context?: any): void {
    this.log(LogLevel.WARN, component, message, context);
  }

  /**
   * ERROR level log
   * Error conditions that require attention
   */
  error(component: string, message: string, context?: any): void {
    this.log(LogLevel.ERROR, component, message, context);
  }

  /**
   * Export logs as JSON (for user support)
   */
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
  } {
    const byLevel = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
    };

    this.logBuffer.forEach((entry) => {
      byLevel[entry.level]++;
    });

    return {
      total: this.logBuffer.length,
      byLevel,
    };
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();

/**
 * Convenience exports for direct usage
 */
export const logDebug = (component: string, message: string, context?: any) =>
  logger.debug(component, message, context);

export const logInfo = (component: string, message: string, context?: any) =>
  logger.info(component, message, context);

export const logWarn = (component: string, message: string, context?: any) =>
  logger.warn(component, message, context);

export const logError = (component: string, message: string, context?: any) =>
  logger.error(component, message, context);
