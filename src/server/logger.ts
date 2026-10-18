export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

type MinLevel = LogLevel | "silent";

export type Logger = {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /** Returns a logger that adds `bindings` to every entry. */
  child(bindings: LogFields): Logger;
};

export type LoggerOptions = {
  /** Defaults to "debug" in development, "info" in production and "silent" under test. */
  minLevel?: MinLevel;
  write?: (level: LogLevel, line: string) => void;
};

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function defaultMinLevel(): MinLevel {
  switch (process.env.NODE_ENV) {
    case "production":
      return "info";
    case "test":
      return "silent";
    default:
      return "debug";
  }
}

function defaultWrite(level: LogLevel, line: string) {
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function replacer(_key: string, value: unknown) {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (typeof value === "bigint") return value.toString();
  return value;
}

function serialize(entry: LogFields): string {
  try {
    return JSON.stringify(entry, replacer);
  } catch {
    return JSON.stringify({
      time: entry.time,
      level: entry.level,
      message: entry.message,
      logError: "Log fields could not be serialized.",
    });
  }
}

/** Structured logger: one JSON object per line. Server-only. */
export function createLogger(
  bindings: LogFields = {},
  options: LoggerOptions = {},
): Logger {
  const write = options.write ?? defaultWrite;

  function log(level: LogLevel, message: string, fields: LogFields = {}) {
    const minLevel = options.minLevel ?? defaultMinLevel();
    if (minLevel === "silent" || LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) {
      return;
    }

    const entry: LogFields = { time: new Date().toISOString(), level, message };
    // Bindings and fields can never overwrite time, level or message.
    for (const [key, value] of Object.entries({ ...bindings, ...fields })) {
      if (!(key in entry)) entry[key] = value;
    }

    write(level, serialize(entry));
  }

  return {
    debug: (message, fields) => log("debug", message, fields),
    info: (message, fields) => log("info", message, fields),
    warn: (message, fields) => log("warn", message, fields),
    error: (message, fields) => log("error", message, fields),
    child: (extra) => createLogger({ ...bindings, ...extra }, options),
  };
}

export const logger = createLogger();
