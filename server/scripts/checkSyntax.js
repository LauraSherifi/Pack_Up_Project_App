const fs = require('fs');
const path = require('path');
const vm = require('vm');

const serverRoot = path.join(__dirname, '..');
const ignoredDirs = new Set(['node_modules', 'public', '.git']);
const files = [];

const collectJavaScriptFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        collectJavaScriptFiles(fullPath);
      }
      return;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  });
};

collectJavaScriptFiles(serverRoot);

const failures = [];

files.forEach((file) => {
  try {
    const source = fs.readFileSync(file, 'utf8');
    new vm.Script(source, { filename: file });
  } catch (err) {
    failures.push({
      file: path.relative(serverRoot, file),
      output: err.message,
    });
  }
});

if (failures.length > 0) {
  console.error('Backend syntax check failed.');
  failures.forEach((failure) => {
    console.error(`\n${failure.file}`);
    console.error(failure.output);
  });
  process.exit(1);
}

console.log(`Backend syntax check passed for ${files.length} files.`);
