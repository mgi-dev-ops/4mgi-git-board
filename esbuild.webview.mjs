// @ts-check
import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";

/**
 * Resolve CSS @import statements
 * @param {string} css - CSS content
 * @param {string} basePath - Base path for resolving imports
 * @param {Set<string>} processed - Already processed files to avoid circular imports
 * @returns {Promise<string>} - Resolved CSS content
 */
async function resolveCssImports(css, basePath, processed = new Set()) {
  const importRegex = /@import\s+["']([^"']+)["']\s*;/g;
  let result = css;
  let match;

  while ((match = importRegex.exec(css)) !== null) {
    const importPath = match[1];
    const fullPath = path.resolve(path.dirname(basePath), importPath);

    if (processed.has(fullPath)) continue;
    processed.add(fullPath);

    try {
      let importedCss = await fs.promises.readFile(fullPath, "utf8");
      // Recursively resolve imports
      importedCss = await resolveCssImports(importedCss, fullPath, processed);
      result = result.replace(match[0], importedCss);
    } catch {
      console.warn(`Warning: Could not resolve CSS import: ${importPath}`);
    }
  }

  return result;
}

/**
 * CSS plugin for esbuild
 * Handles both regular CSS and CSS modules
 */
function cssPlugin() {
  return {
    name: "css-plugin",
    setup(build) {
      const cssContents = [];
      const cssModulesMap = new Map();

      // Handle CSS Modules (.module.css)
      build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
        const css = await fs.promises.readFile(args.path, "utf8");
        const fileName = path.basename(args.path, ".module.css");
        const hash = Math.random().toString(36).substring(2, 8);

        // Extract class names and create mapping
        const classNames = {};
        const processedCss = css.replace(
          /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g,
          (match, className) => {
            const scopedName = `${fileName}_${className}_${hash}`;
            classNames[className] = scopedName;
            return `.${scopedName}`;
          }
        );

        cssModulesMap.set(args.path, processedCss);

        return {
          contents: `export default ${JSON.stringify(classNames)};`,
          loader: "js",
        };
      });

      // Handle regular CSS (not module.css)
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        // Skip .module.css files (already handled above)
        if (args.path.endsWith(".module.css")) {
          return null; // Let other handlers process it
        }
        let css = await fs.promises.readFile(args.path, "utf8");
        // Resolve @import statements
        css = await resolveCssImports(css, args.path);
        cssContents.push(css);
        return { contents: "", loader: "js" };
      });

      // Collect all CSS at the end
      build.onEnd(async () => {
        let allCss = "";

        // Add regular CSS first
        allCss += cssContents.join("\n");

        // Then add CSS modules
        if (cssModulesMap.size > 0) {
          allCss += "\n" + Array.from(cssModulesMap.values()).join("\n");
        }

        if (allCss.trim()) {
          await fs.promises.writeFile("dist/webview.css", allCss);
        }
      });
    },
  };
}

/**
 * @param {object} options
 * @param {boolean} options.watch
 * @param {boolean} options.production
 * @returns {Promise<esbuild.BuildContext | esbuild.BuildResult>}
 */
export async function buildWebview({ watch = false, production = false }) {
  // Ensure dist directory exists
  await fs.promises.mkdir("dist", { recursive: true });

  // Clear previous CSS file
  try {
    await fs.promises.writeFile("dist/webview.css", "");
  } catch {
    // Ignore if file doesn't exist
  }

  /** @type {esbuild.BuildOptions} */
  const config = {
    entryPoints: ["src/webview/index.tsx"],
    outfile: "dist/webview.js",
    platform: "browser",
    format: "iife",
    bundle: true,
    minify: production,
    sourcemap: true,
    logLevel: "info",
    loader: {
      ".svg": "dataurl",
      ".png": "dataurl",
      ".jpg": "dataurl",
    },
    jsx: "automatic",
    plugins: [cssPlugin()],
    // External CSS will be bundled separately
    external: [],
  };

  if (watch) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log("[webview] Watching for changes...");
    return ctx;
  }

  return esbuild.build(config);
}
