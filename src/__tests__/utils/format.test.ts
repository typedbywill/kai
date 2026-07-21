import { describe, it, expect } from "vitest";
import { formatDate, formatFileSize, truncate } from "../../utils/format";

describe("formatDate", () => {
  it("should return empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("should return empty string for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("");
  });

  it("should format valid ISO date", () => {
    const result = formatDate("2026-01-15T14:30:00Z");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatFileSize", () => {
  it("should format 0 bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("should format bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("should format kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });

  it("should format megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1.0 MB");
  });

  it("should format with decimal", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});

describe("truncate", () => {
  it("should not truncate short strings", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("should truncate long strings", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("should handle exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});
