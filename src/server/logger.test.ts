// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { createLogger, type LogLevel } from "@/server/logger";

function capture(minLevel: LogLevel | "silent") {
  const lines: Array<{ level: LogLevel; entry: Record<string, unknown> }> = [];
  const logger = createLogger(
    { service: "api" },
    {
      minLevel,
      write: (level, line) => lines.push({ level, entry: JSON.parse(line) }),
    },
  );

  return { logger, lines };
}

describe("logger", () => {
  it("writes one JSON entry with time, level, message and fields", () => {
    const { logger, lines } = capture("debug");

    logger.info("Practice session created", { sessionId: "s1" });

    expect(lines).toHaveLength(1);
    expect(lines[0].level).toBe("info");
    expect(lines[0].entry).toMatchObject({
      level: "info",
      message: "Practice session created",
      sessionId: "s1",
      service: "api",
    });
    expect(typeof lines[0].entry.time).toBe("string");
  });

  it("drops entries below the minimum level", () => {
    const { logger, lines } = capture("warn");

    logger.debug("a");
    logger.info("b");
    logger.warn("c");
    logger.error("d");

    expect(lines.map((line) => line.level)).toEqual(["warn", "error"]);
  });

  it("writes nothing when silent", () => {
    const { logger, lines } = capture("silent");

    logger.error("ignored");

    expect(lines).toHaveLength(0);
  });

  it("adds child bindings to every entry", () => {
    const { logger, lines } = capture("debug");

    logger.child({ requestId: "r1" }).info("hello");

    expect(lines[0].entry).toMatchObject({ service: "api", requestId: "r1" });
  });

  it("does not let fields overwrite time, level or message", () => {
    const { logger, lines } = capture("debug");

    logger.info("real", { message: "fake", level: "error" });

    expect(lines[0].entry).toMatchObject({ message: "real", level: "info" });
  });

  it("serializes errors with name, message and stack", () => {
    const { logger, lines } = capture("debug");

    logger.error("failed", { error: new Error("boom") });

    expect(lines[0].entry.error).toMatchObject({
      name: "Error",
      message: "boom",
    });
    expect(typeof (lines[0].entry.error as { stack: unknown }).stack).toBe(
      "string",
    );
  });

  it("still logs when fields cannot be serialized", () => {
    const { logger, lines } = capture("debug");
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    logger.info("circular", { circular });

    expect(lines).toHaveLength(1);
    expect(lines[0].entry).toMatchObject({ message: "circular" });
    expect(lines[0].entry.logError).toBeDefined();
  });

  it("defaults to info in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    const logger = createLogger();
    logger.debug("hidden");
    logger.info("shown");

    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toContain("shown");
  });
});
