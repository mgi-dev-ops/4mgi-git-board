// @ts-check
import * as esbuild from "esbuild";

/**
 * @param {object} options
 * @param {boolean} options.watch
 * @param {boolean} options.production
 * @returns {Promise<esbuild.BuildContext | esbuild.BuildResult>}
 */
export async function buildExtension({ watch = false, production = false }) {
  /** @type {esbuild.BuildOptions} */
  const config = {
    entryPoints: ["src/extension/extension.ts"],
    outfile: "dist/extension.js",
    platform: "node",
    format: "cjs",
    external: ["vscode"],
    bundle: true,
    minify: production,
    sourcemap: true,
    logLevel: "info",
  };

  if (watch) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log("[extension] Watching for changes...");
    return ctx;
  }

  return esbuild.build(config);
}
