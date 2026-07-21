import { describe, it, expect } from "vitest";
import {
  resolveAttachmentType,
  MAX_ATTACHMENT_SIZE,
  SUPPORTED_EXTENSIONS,
} from "../../types/attachments";

describe("resolveAttachmentType", () => {
  it("should resolve image MIME types", () => {
    expect(resolveAttachmentType("image/png", "test.png")).toBe("image");
    expect(resolveAttachmentType("image/jpeg", "test.jpg")).toBe("image");
    expect(resolveAttachmentType("image/webp", "test.webp")).toBe("image");
  });

  it("should resolve text MIME types", () => {
    expect(resolveAttachmentType("text/plain", "test.txt")).toBe("text");
    expect(resolveAttachmentType("text/markdown", "test.md")).toBe("markdown");
    expect(resolveAttachmentType("text/csv", "test.csv")).toBe("csv");
  });

  it("should resolve by extension when MIME is unknown", () => {
    expect(resolveAttachmentType("application/octet-stream", "data.json")).toBe("json");
    expect(resolveAttachmentType("", "readme.md")).toBe("markdown");
  });

  it("should return unknown for unsupported types", () => {
    expect(resolveAttachmentType("video/mp4", "video.mp4")).toBe("unknown");
    expect(resolveAttachmentType("", "file.xyz")).toBe("unknown");
  });
});

describe("constants", () => {
  it("should have a reasonable max attachment size", () => {
    expect(MAX_ATTACHMENT_SIZE).toBe(10 * 1024 * 1024); // 10MB
  });

  it("should include common extensions", () => {
    expect(SUPPORTED_EXTENSIONS).toContain(".png");
    expect(SUPPORTED_EXTENSIONS).toContain(".jpg");
    expect(SUPPORTED_EXTENSIONS).toContain(".pdf");
    expect(SUPPORTED_EXTENSIONS).toContain(".md");
    expect(SUPPORTED_EXTENSIONS).toContain(".json");
  });
});
