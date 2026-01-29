/**
 * Logging and Tracing Utilities for UI Interactions
 */

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  component?: string;
  userId?: string;
}

export class UILogger {
  private static instance: UILogger;
  private logs: LogEntry[] = [];
  private maxLogEntries: number = 1000;
  private enabled: boolean = true;

  private constructor() {}

  public static getInstance(): UILogger {
    if (!UILogger.instance) {
      UILogger.instance = new UILogger();
    }
    return UILogger.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    if (!this.enabled) return;

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Also log to console
    this.consoleLog(logEntry);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  private consoleLog(entry: LogEntry): void {
    const formattedMessage = `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}`;

    switch (entry.level) {
      case 'info':
        console.info(formattedMessage, entry.context);
        break;
      case 'warn':
        console.warn(formattedMessage, entry.context);
        break;
      case 'error':
        console.error(formattedMessage, entry.context);
        break;
      case 'debug':
        console.debug(formattedMessage, entry.context);
        break;
      default:
        console.log(formattedMessage, entry.context);
    }
  }
}

// Tracing utilities
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: number;
  endTime?: number;
  name: string;
  metadata?: Record<string, any>;
}

export class UITracer {
  private static instance: UITracer;
  private traces: TraceContext[] = [];
  private maxTraceEntries: number = 500;

  private constructor() {}

  public static getInstance(): UITracer {
    if (!UITracer.instance) {
      UITracer.instance = new UITracer();
    }
    return UITracer.instance;
  }

  public startTrace(name: string, parentSpanId?: string, metadata?: Record<string, any>): TraceContext {
    const trace: TraceContext = {
      traceId: this.generateId(),
      spanId: this.generateId(),
      parentSpanId,
      startTime: performance.now(),
      name,
      metadata,
    };

    this.traces.push(trace);

    if (this.traces.length > this.maxTraceEntries) {
      this.traces = this.traces.slice(-this.maxTraceEntries);
    }

    return trace;
  }

  public endTrace(trace: TraceContext): TraceContext {
    const updatedTrace = {
      ...trace,
      endTime: performance.now(),
    };

    // Replace the trace in the array
    const index = this.traces.findIndex(t => t.spanId === trace.spanId);
    if (index !== -1) {
      this.traces[index] = updatedTrace;
    }

    return updatedTrace;
  }

  public getTraces(): TraceContext[] {
    return [...this.traces];
  }

  public getTraceDuration(trace: TraceContext): number {
    return trace.endTime ? trace.endTime - trace.startTime : performance.now() - trace.startTime;
  }

  public clearTraces(): void {
    this.traces = [];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// Convenience functions
export const logInfo = (message: string, context?: Record<string, any>) => {
  UILogger.getInstance().info(message, context);
};

export const logWarn = (message: string, context?: Record<string, any>) => {
  UILogger.getInstance().warn(message, context);
};

export const logError = (message: string, context?: Record<string, any>) => {
  UILogger.getInstance().error(message, context);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  UILogger.getInstance().debug(message, context);
};

export const startTrace = (name: string, parentSpanId?: string, metadata?: Record<string, any>): TraceContext => {
  return UITracer.getInstance().startTrace(name, parentSpanId, metadata);
};

export const endTrace = (trace: TraceContext): TraceContext => {
  return UITracer.getInstance().endTrace(trace);
};

// Initialize logger and tracer
UILogger.getInstance();
UITracer.getInstance();