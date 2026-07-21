import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../services/markdown";

describe("renderMarkdown", () => {
  it("should return empty string for empty input", () => {
    expect(renderMarkdown("")).toBe("");
  });

  it("should render basic markdown", () => {
    const result = renderMarkdown("**bold** and *italic*");
    expect(result).toContain("<strong>bold</strong>");
    expect(result).toContain("<em>italic</em>");
  });

  it("should render code blocks with highlight.js", () => {
    const result = renderMarkdown("```javascript\nconst x = 1;\n```");
    expect(result).toContain("hljs");
    expect(result).toContain("copy-code-btn");
    expect(result).toContain("javascript");
  });

  it("should render inline code", () => {
    const result = renderMarkdown("Use `npm install` to install");
    expect(result).toContain("<code>");
    expect(result).toContain("npm install");
  });

  it("should render lists", () => {
    const result = renderMarkdown("- item 1\n- item 2\n- item 3");
    expect(result).toContain("<li>");
    expect(result).toContain("item 1");
  });

  it("should render links", () => {
    const result = renderMarkdown("[Google](https://google.com)");
    expect(result).toContain('href="https://google.com"');
    expect(result).toContain("Google");
  });

  it("should handle GFM line breaks", () => {
    const result = renderMarkdown("Line 1\nLine 2");
    expect(result).toContain("<br>");
  });
});
