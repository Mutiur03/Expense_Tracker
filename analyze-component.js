import fs from "fs";
import path from "path";

const COMPONENTS_DIR = path.resolve("./components");
const PROJECT_ROOT = path.resolve("./app");
console.log("COMPONENTS_DIR:", COMPONENTS_DIR);
console.log("PROJECT_ROOT:", PROJECT_ROOT);
const VALID_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const IMPORT_REGEX =
  /(?:import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)|import\(['"]([^'"]+)['"]\))/g;

const allComponentFiles = new Set();
const usedComponentFiles = new Set();

function collectComponentFiles(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      collectComponentFiles(fullPath);
    } else if (VALID_EXTENSIONS.includes(path.extname(fullPath))) {
      allComponentFiles.add(path.resolve(fullPath));
    }
  }
}

function resolveImport(baseFile, importPath) {
  if (
    !importPath.startsWith("./") &&
    !importPath.startsWith("../") &&
    !importPath.startsWith("components/") &&
    !importPath.startsWith("@/components/") &&
    !importPath.startsWith("/") &&
    importPath.includes("/") &&
    !importPath.startsWith("components")
  ) {
    return null;
  }

  let resolvedPath = "";

  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    resolvedPath = path.resolve(path.dirname(baseFile), importPath);
  } else if (
    importPath.startsWith("components/") ||
    importPath.startsWith("@/components/")
  ) {
    const relativePath = importPath.replace(/^(@\/)?components\//, "");
    resolvedPath = path.resolve(COMPONENTS_DIR, relativePath);
  } else if (importPath.startsWith("/") || !importPath.includes("/")) {
    resolvedPath = path.resolve(COMPONENTS_DIR, importPath);
  } else {
    return null;
  }

  const normalizedResolved = path.resolve(resolvedPath);
  const normalizedComponents = path.resolve(COMPONENTS_DIR);

  if (!normalizedResolved.startsWith(normalizedComponents + path.sep)) {
    return null;
  }

  if (
    VALID_EXTENSIONS.includes(path.extname(resolvedPath)) &&
    fs.existsSync(resolvedPath)
  ) {
    return resolvedPath;
  }

  for (const ext of VALID_EXTENSIONS) {
    const tryFile = resolvedPath + ext;
    if (fs.existsSync(tryFile)) {
      return tryFile;
    }
  }

  for (const ext of VALID_EXTENSIONS) {
    const tryIndex = path.join(resolvedPath, "index" + ext);
    if (fs.existsSync(tryIndex)) {
      return tryIndex;
    }
  }

  return null;
}

function scanProjectForImports(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanProjectForImports(fullPath);
    } else if (VALID_EXTENSIONS.includes(path.extname(fullPath))) {
      const content = fs.readFileSync(fullPath, "utf-8");

      IMPORT_REGEX.lastIndex = 0;
      let match;
      while ((match = IMPORT_REGEX.exec(content)) !== null) {
        const importPath = match[1] || match[2] || match[3];
        if (!importPath) continue;

        const resolved = resolveImport(fullPath, importPath);
        if (resolved) {
          if (resolved.startsWith(COMPONENTS_DIR)) {
            usedComponentFiles.add(path.resolve(resolved));
          }
        }
      }
    }
  }
}

collectComponentFiles(COMPONENTS_DIR);
scanProjectForImports(PROJECT_ROOT);
scanProjectForImports(COMPONENTS_DIR);

const unusedComponents = [...allComponentFiles].filter(
  (f) => !usedComponentFiles.has(f)
);

console.log(`📦 Total components: ${allComponentFiles.size}`);
console.log(`✅ Used components: ${usedComponentFiles.size}`);
console.log(`❌ Unused components: ${unusedComponents.length}\n`);

if (unusedComponents.length) {
  console.log("Unused components:");
  unusedComponents.forEach((f) => {
    console.log(" -", path.relative(COMPONENTS_DIR, f));
  });
} else {
  console.log("🎉 All components are used!");
}
