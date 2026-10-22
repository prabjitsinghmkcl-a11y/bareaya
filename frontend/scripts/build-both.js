// Builds BOTH frontends for the single-Render-service setup:
//
//   frontend/build/         customer app   -> bareaya.in
//   frontend/build-admin/   admin-only app -> admin.bareaya.in
//
// The two bundles are the same code with REACT_APP_ADMIN_ONLY flipping
// App.jsx between CustomerApp and AdminApp. Running this once per deploy
// keeps the admin surface on its own host: the server serves build-admin/
// to the admin subdomain and build/ to everyone else. Works on Render
// (Linux) and local Windows shells alike — the plain `build:admin` script
// in package.json stays Windows-only for quick local use.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const build = path.join(root, 'build');
const buildAdmin = path.join(root, 'build-admin');
const tmp = path.join(root, 'build-tmp-customer');

const clean = (dir) => fs.rmSync(dir, { recursive: true, force: true });

clean(buildAdmin);
clean(tmp);

console.log('[build:both] customer app -> build/');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
fs.renameSync(build, tmp);

console.log('[build:both] admin app -> build-admin/');
execSync('npm run build', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, REACT_APP_ADMIN_ONLY: 'true' },
});
fs.renameSync(build, buildAdmin);

fs.renameSync(tmp, build);
console.log('[build:both] done: build/ (customer) + build-admin/ (admin).');
