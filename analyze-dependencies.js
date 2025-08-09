import fs from "fs";
import path from "path";

const ROOT_DIR = ".";
const IMPORT_REGEX =
  /(?:import .* from ['"]([^.'"/][^'"]*)['"]|require\(['"]([^.'"/][^'"]*)['"]\))/g;
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
]);

const depMap = {};
const isExternal = (pkg) => !pkg.startsWith(".") && !pkg.startsWith("/");

function getInstalledDependencies() {
  try {
    const packageJsonPath = path.join(ROOT_DIR, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };
  } catch (error) {
    console.error("Error reading package.json:", error.message);
    return {};
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (IGNORE_DIRS.has(path.basename(file))) continue;
      walk(fullPath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      let match;
      while ((match = IMPORT_REGEX.exec(content)) !== null) {
        const pkg = match[1] || match[2];
        if (!isExternal(pkg)) continue;
        if (!depMap[pkg]) {
          depMap[pkg] = {
            count: 0,
            files: new Set(),
          };
        }
        depMap[pkg].count += 1;
        depMap[pkg].files.add(fullPath);
      }
    }
  }
}

const SRC_DIRS = fs
  .readdirSync(ROOT_DIR)
  .map((name) => path.join(ROOT_DIR, name))
  .filter(
    (p) => fs.statSync(p).isDirectory() && !IGNORE_DIRS.has(path.basename(p))
  );

SRC_DIRS.forEach((dir) => walk(dir));

// Get installed dependencies
const installedDeps = getInstalledDependencies();
const installedPackages = Object.keys(installedDeps);
const usedPackages = Object.keys(depMap);
const unusedPackages = installedPackages.filter(
  (pkg) => !usedPackages.includes(pkg)
);

// Output used dependencies
// console.log("📦 USED DEPENDENCIES:");
// console.log("=====================");
// for (const [pkg, data] of Object.entries(depMap).sort()) {
//   console.log(`📦 ${pkg}`);
//   console.log(`   ↳ Used ${data.count} times in ${data.files.size} files:`);
//   for (const file of data.files) {
//     console.log(`     - ${file}`);
//   }
//   console.log("");
// }

console.log("🚫 UNUSED DEPENDENCIES:");
console.log("========================");
if (unusedPackages.length > 0) {
  unusedPackages.sort().forEach((pkg) => {
    console.log(`🚫 ${pkg} (${installedDeps[pkg]})`);
  });
} else {
  console.log("✅ No unused dependencies found!");
}

console.log("");
console.log(`📊 SUMMARY:`);
console.log(`   🔢 Total installed packages: ${installedPackages.length}`);
console.log(`   ✅ Used packages: ${usedPackages.length}`);
console.log(`   🚫 Unused packages: ${unusedPackages.length}`);
