const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function execute(command, cwd) {
    console.log(`Executing: ${command} in ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit' });
}

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const rootDir = __dirname;
const landingDir = path.join(rootDir, 'AISTETHLanding-V2', 'AISTETHLanding-V2');
const frontendDir = path.join(rootDir, 'frontend');
const distDir = path.join(rootDir, 'dist');

// 1. Clean dist
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// 2. Build Landing Page
console.log('--- Building Landing Page ---');
execute('npm install', landingDir);
execute('npm run build', landingDir);

// Copy Landing Page dist to root dist
const landingDist = path.join(landingDir, 'dist');
console.log(`Copying ${landingDist} to ${distDir}`);
copyDir(landingDist, distDir);

// 3. Build Frontend (App)
console.log('--- Building Frontend App ---');
execute('npm install', frontendDir);
execute('npm run build', frontendDir);

// Copy Frontend dist to root dist/app
const frontendDist = path.join(frontendDir, 'dist');
const destAppDir = path.join(distDir, 'app');
console.log(`Copying ${frontendDist} to ${destAppDir}`);
copyDir(frontendDist, destAppDir);

console.log('--- Build Complete ---');
console.log('Output available in:', distDir);
