#!/usr/bin/env node
// @ts-check
/**
 * Build script for 4MGI Git Board
 * Builds both extension and webview bundles
 */

import { buildExtension } from "./esbuild.extension.mjs";
import { buildWebview } from "./esbuild.webview.mjs";

const args = process.argv.slice(2);
const watch = args.includes("--watch") || args.includes("-w");
const production = args.includes("--production") || args.includes("-p");

console.log(`\n🔨 Building 4MGI Git Board...`);
console.log(`   Mode: ${production ? "production" : "development"}`);
console.log(`   Watch: ${watch}\n`);

async function build() {
  try {
    // Build both in parallel
    await Promise.all([
      buildExtension({ watch, production }),
      buildWebview({ watch, production }),
    ]);

    if (!watch) {
      console.log("\n✅ Build completed successfully!\n");
    }
  } catch (error) {
    console.error("\n❌ Build failed:", error);
    process.exit(1);
  }
}

build();
