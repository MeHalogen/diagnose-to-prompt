import { describe, it, expect } from "vitest";
import { compileDiagnosticPrompt } from "../src/index.js";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";

describe("compileDiagnosticPrompt", () => {
  it("should parse standard stack trace and extract context", async () => {
    // Create a temporary file to crash in
    const tmpFile = path.resolve("tests/mock-crash.js");
    const code = `// line 1
// line 2
function buggy() {
  throw new Error("Crash"); // line 4
}
module.exports = { buggy };
`;
    await writeFile(tmpFile, code, "utf8");

    const stackTrace = `Error: Crash
    at buggy (${tmpFile}:4:9)
    at Object.<anonymous> (${path.resolve("tests/index.test.ts")}:12:5)`;

    const result = await compileDiagnosticPrompt({
      stackTrace,
      contextLines: 2,
    });

    expect(result.filePath).toBe(tmpFile);
    expect(result.line).toBe(4);
    expect(result.column).toBe(9);
    expect(result.snippet).toContain("> 4:   throw new Error(\"Crash\");");

    // Clean up
    await unlink(tmpFile);
  });

  it("should handle traces without local files", async () => {
    const stackTrace = `Error: Crash
    at node:internal/modules/esm/resolve:274:11
    at moduleResolve (node:internal/modules/esm/resolve:864:10)`;
    const result = await compileDiagnosticPrompt({ stackTrace });
    expect(result.filePath).toBeNull();
    expect(result.markdown).toContain("Could not resolve local file from stack trace.");
  });
});
