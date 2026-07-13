# diagnose-to-prompt

> **LLM Crash Context Compiler:** A zero-dependency diagnostic tool to parse Node.js stack traces, fetch the exact source code surrounding the crash site, and generate Markdown diagnostic prompts for LLMs to debug.

---

## ⚡ Features
- **Zero Runtime Dependencies**: Ultra lightweight and fast.
- **Stack Trace Parser**: Parses standard JavaScript/TypeScript error traces to identify the exact crash site in local workspace files.
- **Node core / node_modules Filtering**: Automatically ignores internal Node runtime structures and external modules to focus on your code.
- **Code Site Extractor**: Reads the crash file and extracts lines of code immediately surrounding the stack frame.
- **Clickable File Links**: Generates standard `file://` scheme markdown links for direct IDE navigation.

---

## 📦 Installation

```bash
npm install diagnose-to-prompt
```

---

## 🚀 Usage

### 1. CLI Usage
Compile stack traces piped from a file:

```bash
npx diagnose-to-prompt error.log
```

### 2. Programmatic API

```javascript
import { compileDiagnosticPrompt } from 'diagnose-to-prompt';

const errorStackTrace = `
Error: Cannot read properties of undefined (reading 'split')
    at processData (/Users/user/project/src/utils.ts:15:30)
    at Object.<anonymous> (/Users/user/project/src/index.ts:5:2)
`;

const result = await compileDiagnosticPrompt({
  stackTrace: errorStackTrace,
  contextLines: 3 // lines around failure site (default: 5)
});

console.log(result.markdown);
```

---

## 📄 License
MIT License.
