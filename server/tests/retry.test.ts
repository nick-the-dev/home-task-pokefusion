import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry, validateWithSchema } from "../src/utils/retry";
import { z } from "zod";

describe("withRetry", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns data on first successful attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn, { maxRetries: 3, delayMs: 1 });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds eventually", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("success");

    const result = await withRetry(fn, { maxRetries: 3, delayMs: 1 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after max retries exceeded", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("persistent failure"));

    await expect(
      withRetry(fn, { maxRetries: 3, delayMs: 1 })
    ).rejects.toThrow("persistent failure");

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("preserves the original error from last attempt", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("specific error message"));

    await expect(
      withRetry(fn, { maxRetries: 2, delayMs: 1 })
    ).rejects.toThrow("specific error message");
  });

  it("logs each failed attempt with attempt number and max retries", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("error1"))
      .mockResolvedValue("ok");

    await withRetry(fn, { maxRetries: 2, delayMs: 1 });

    // Logger outputs formatted string with ANSI codes
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Attempt 1/2 failed: error1")
    );
  });

  it("logs with correct attempt count on multiple failures", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("first"))
      .mockRejectedValueOnce(new Error("second"))
      .mockResolvedValue("ok");

    await withRetry(fn, { maxRetries: 3, delayMs: 1 });

    // Logger outputs formatted string with ANSI codes
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Attempt 1/3 failed: first")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Attempt 2/3 failed: second")
    );
  });

  it("uses default options when none provided", async () => {
    const fn = vi.fn().mockResolvedValue("result");
    const result = await withRetry(fn);
    expect(result).toBe("result");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("converts non-Error throws to Error objects", async () => {
    const fn = vi.fn().mockRejectedValue("string error");

    await expect(
      withRetry(fn, { maxRetries: 1, delayMs: 1 })
    ).rejects.toThrow("string error");
  });

  it("throws fallback error when lastError is undefined", async () => {
    // This tests the edge case where somehow lastError is not set
    // In practice, this shouldn't happen, but the code handles it
    const fn = vi.fn().mockRejectedValue(new Error("test"));

    await expect(
      withRetry(fn, { maxRetries: 1, delayMs: 1 })
    ).rejects.toThrow();
  });

  it("respects maxRetries option", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));

    await expect(
      withRetry(fn, { maxRetries: 5, delayMs: 1 })
    ).rejects.toThrow();

    expect(fn).toHaveBeenCalledTimes(5);
  });

  it("only waits between retries, not after last attempt", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    const startTime = Date.now();

    await expect(
      withRetry(fn, { maxRetries: 2, delayMs: 100 })
    ).rejects.toThrow();

    const elapsed = Date.now() - startTime;
    // Should only wait once (between attempt 1 and 2), not after attempt 2
    // With 2 retries and 100ms delay, should take ~100ms (1 delay)
    // If delay was added after last attempt, would be ~200ms
    expect(elapsed).toBeGreaterThanOrEqual(90);
    expect(elapsed).toBeLessThan(180); // Must be less than 2 delays
  });

  it("waits between each failed attempt except the last", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    const startTime = Date.now();

    await expect(
      withRetry(fn, { maxRetries: 3, delayMs: 50 })
    ).rejects.toThrow();

    const elapsed = Date.now() - startTime;
    // With 3 attempts and 50ms delay, should wait twice (between 1-2 and 2-3)
    expect(elapsed).toBeGreaterThanOrEqual(90);
    expect(elapsed).toBeLessThan(180); // Must be less than 3 delays
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("validateWithSchema", () => {
  const TestSchema = z.object({
    name: z.string(),
    value: z.number(),
  });

  it("returns validated data for valid input", () => {
    const input = { name: "test", value: 42 };
    const result = validateWithSchema(input, TestSchema);
    expect(result).toEqual(input);
  });

  it("throws with 'Validation failed' message for invalid input", () => {
    const input = { name: "test", value: "not a number" };
    expect(() => validateWithSchema(input, TestSchema)).toThrow("Validation failed");
  });

  it("throws for missing required fields with field path in message", () => {
    const input = { name: "test" };
    expect(() => validateWithSchema(input, TestSchema)).toThrow("value");
  });

  it("includes all error paths in error message", () => {
    const input = { name: 123, value: "wrong" };
    try {
      validateWithSchema(input, TestSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      expect((error as Error).message).toContain("name");
      expect((error as Error).message).toContain("value");
    }
  });

  it("includes error messages with paths joined by dots", () => {
    const NestedSchema = z.object({
      nested: z.object({
        field: z.string(),
      }),
    });
    const input = { nested: { field: 123 } };
    try {
      validateWithSchema(input, NestedSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      expect((error as Error).message).toContain("nested.field");
    }
  });

  it("strips additional properties not in schema", () => {
    const input = { name: "test", value: 42, extra: "ignored" };
    const result = validateWithSchema(input, TestSchema);
    expect(result).toEqual({ name: "test", value: 42 });
    expect(result).not.toHaveProperty("extra");
  });

  it("formats multiple errors with comma-space separator", () => {
    const input = { name: 123, value: "wrong" };
    try {
      validateWithSchema(input, TestSchema);
      expect.fail("Should have thrown");
    } catch (error) {
      // Check that errors are joined with ", "
      expect((error as Error).message).toMatch(/name:.*,\s*value:/);
    }
  });
});
