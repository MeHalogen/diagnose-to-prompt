#!/usr/bin/env node

import { compileDiagnosticPrompt } from "./index.js";
import { readFile } from "node:fs/promises";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help") || args.length === 0) {
    console.log(`
Usage: diagnose-to-prompt <stacktrace-file-or-string> [options]

Options:
  -c, --context <num>   Number of context lines to display (default: 5)
  -h, --help            Show help info
`);
    process.exit(0);
  }

  const input = args[0];
  let stackTrace = input;
  let contextLines = 5;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-c" || arg === "--context") {
      const val = args[++i];
      if (val) contextLines = parseInt(val, 10);
    }
  }

  try {
    const fileContent = await readFile(input, "utf8").catch(() => null);
    if (fileContent !== null) {
      stackTrace = fileContent;
    }

    const result = await compileDiagnosticPrompt({
      stackTrace,
      contextLines
    });

    process.stdout.write(result.markdown + "\n");
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
