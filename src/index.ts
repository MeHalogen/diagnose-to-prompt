import { readFile } from "node:fs/promises";
import path from "node:path";

export interface DiagnosticOptions {
  stackTrace: string;
  contextLines?: number;
  cwd?: string;
}

export interface DiagnosticResult {
  filePath: string | null;
  line: number | null;
  column: number | null;
  snippet: string | null;
  markdown: string;
}

/**
 * Parses stack trace, extracts source code lines around failure, and compiles LLM prompt.
 */
export async function compileDiagnosticPrompt(options: DiagnosticOptions): Promise<DiagnosticResult> {
  const cwd = options.cwd || process.cwd();
  const contextLines = options.contextLines !== undefined ? options.contextLines : 5;
  
  const lines = options.stackTrace.split(/\r?\n/);
  let filePath: string | null = null;
  let lineNum: number | null = null;
  let colNum: number | null = null;

  for (const line of lines) {
    let match = line.match(/^\s*at\s+(.+?)\s*\((.*?):(\d+):(\d+)\)\s*$/);
    let file = "";
    let lineStr = "";
    let colStr = "";
    
    if (match) {
      file = match[2];
      lineStr = match[3];
      colStr = match[4];
    } else {
      const matchNoParen = line.match(/^\s*at\s+(.*?):(\d+):(\d+)\s*$/);
      if (matchNoParen) {
        file = matchNoParen[1];
        lineStr = matchNoParen[2];
        colStr = matchNoParen[3];
      }
    }

    if (file) {
      
      // Filter out internal modules and node_modules
      const isInternal = file.includes("node_modules") ||
                         file.includes("node:internal") ||
                         file.startsWith("internal/") ||
                         file.startsWith("node:") ||
                         file.includes("<anonymous>");
                         
      if (!isInternal) {
        filePath = file;
        lineNum = parseInt(lineStr, 10);
        colNum = parseInt(colStr, 10);
        break;
      }
    }
  }

  if (!filePath || lineNum === null) {
    return {
      filePath: null,
      line: null,
      column: null,
      snippet: null,
      markdown: `# Crash Diagnostic Report\n\nCould not resolve local file from stack trace.\n\n## Stack Trace\n\`\`\`\n${options.stackTrace}\n\`\`\`\n`
    };
  }

  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
  let snippet = "";
  let fileLines: string[] = [];

  try {
    const content = await readFile(resolvedPath, "utf8");
    fileLines = content.split(/\r?\n/);

    const start = Math.max(1, lineNum - contextLines);
    const end = Math.min(fileLines.length, lineNum + contextLines);
    
    for (let i = start; i <= end; i++) {
      const marker = i === lineNum ? "> " : "  ";
      snippet += `${marker}${i}: ${fileLines[i - 1]}\n`;
    }
  } catch (err) {
    snippet = `Failed to read file at ${resolvedPath}: ${String(err)}`;
  }

  const relativePath = path.relative(cwd, resolvedPath);
  const markdown = `# Crash Diagnostic Report

An unhandled exception occurred in the application.

## Failed File Reference
- **File**: [${relativePath}](file://${resolvedPath})
- **Line**: ${lineNum}
- **Column**: ${colNum}

## Source Context Around Failure
\`\`\`typescript
${snippet}\`\`\`

## Stack Trace
\`\`\`
${options.stackTrace}
\`\`\`

---
*Please review the code snippet and stack trace above to fix the error.*
`;

  return {
    filePath: resolvedPath,
    line: lineNum,
    column: colNum,
    snippet,
    markdown
  };
}
