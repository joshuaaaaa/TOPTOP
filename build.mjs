// Concatenate src/*.js into a single self-contained dist/toptop-card.js (no dependencies).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
const parts = readdirSync("src").filter((f) => f.endsWith(".js")).sort();
const body = parts.map((f) => `// ---- ${f} ----\n` + readFileSync(`src/${f}`, "utf8")).join("\n");
mkdirSync("dist", { recursive: true });
writeFileSync("dist/toptop-card.js", `(() => {\n"use strict";\n${body}\n})();\n`);
console.log(`dist/toptop-card.js built from ${parts.length} files`);
