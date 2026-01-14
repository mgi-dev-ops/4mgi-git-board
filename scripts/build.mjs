#!/usr/bin/env node
// @ts-check

import { buildExtension } from "../esbuild.extension.mjs";
import { buildWebview } from "../esbuild.webview.mjs";

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const production = args.includes("--production");

console.log(`Building... (watch: ${watch}, production: ${production})`);

async function build() {
  try {
    await Promise.all([
      buildExtension({ watch, production }),
      buildWebview({ watch, production }),
    ]);

    if (!watch) {
      console.log("Build complete.");
    }
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

build();
