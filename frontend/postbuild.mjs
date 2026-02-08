// Post-build script: builds landing page and merges into dist/
// This runs after `vite build` to produce a combined output:
//   dist/         → landing page (root)
//   dist/app/     → frontend React app
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync, readFileSync, writeFileSync, renameSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyDirSync(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(srcPath, destPath);
    else copyFileSync(srcPath, destPath);
  }
}

const landingDir = path.resolve(__dirname, '../AISTETHLanding-V2/AISTETHLanding-V2');
const landingDist = path.resolve(landingDir, 'dist/public');
const appDist = path.resolve(__dirname, 'dist');
const appTemp = path.resolve(__dirname, 'dist-app-temp');

try {
  console.log('\n=== Post-build: Merging landing page ===\n');

  // 1. Move frontend dist → temp
  if (existsSync(appTemp)) rmSync(appTemp, { recursive: true, force: true });
  renameSync(appDist, appTemp);
  mkdirSync(appDist, { recursive: true });
  console.log('✓ Frontend build moved to temp');

  // 2. Install deps & build landing page
  console.log('Installing landing page dependencies...');
  execSync('npm install --prefer-offline --no-audit', { cwd: landingDir, stdio: 'inherit' });
  console.log('Building landing page...');
  execSync('npx vite build', { cwd: landingDir, stdio: 'inherit', env: { ...process.env, BROWSERSLIST_IGNORE_OLD_DATA: '1' } });

  // 3. Copy landing page → dist/ (root)
  if (existsSync(landingDist)) {
    copyDirSync(landingDist, appDist);
    console.log('✓ Landing page copied to dist/');
  } else {
    throw new Error('Landing page dist not found at ' + landingDist);
  }

  // 4. Copy frontend app → dist/app/
  const appFinalDir = path.join(appDist, 'app');
  copyDirSync(appTemp, appFinalDir);
  console.log('✓ Frontend app copied to dist/app/');

  // 5. Create app/404.html from app's index.html for SPA routing under /app/
  const appIndexHtml = path.join(appFinalDir, 'index.html');
  if (existsSync(appIndexHtml)) {
    writeFileSync(path.join(appFinalDir, '404.html'), readFileSync(appIndexHtml, 'utf-8'));
    console.log('✓ Created app/404.html for SPA routing under /app/');
  }

  // 6. Do NOT create a root 404.html - Cloudflare Pages enables SPA mode
  //    when no 404.html exists, routing all unmatched paths to /index.html

  // 7. Create _redirects for Cloudflare Pages SPA routing (additional safety)
  const redirects = '/app/* /app/index.html 200\n/* /index.html 200\n';
  writeFileSync(path.join(appDist, '_redirects'), redirects);
  console.log('✓ Created _redirects for SPA routing');

  // 7. Cleanup temp
  rmSync(appTemp, { recursive: true, force: true });
  console.log('\n✅ Combined build complete! dist/ contains landing + app\n');
} catch (e) {
  console.error('\n❌ Post-build error:', e.message);
  // Restore original dist if possible
  if (existsSync(appTemp) && !existsSync(appDist)) {
    renameSync(appTemp, appDist);
    console.log('Restored original frontend dist');
  }
  process.exit(1);
}
