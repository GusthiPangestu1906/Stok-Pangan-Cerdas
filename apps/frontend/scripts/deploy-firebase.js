const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const rawSecret = process.env.FIREBASE_SA;
if (!rawSecret) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_STOK_PANGAN_CERDAS secret is not set in GitHub Secrets!');
  process.exit(1);
}

let sa;
try {
  sa = JSON.parse(rawSecret);
} catch (e) {
  console.error('ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
  process.exit(1);
}

if (sa.private_key) {
  // Normalize PEM line endings: replace escaped \\n with \n and strip any \r
  sa.private_key = sa.private_key.replace(/\\n/g, '\n').replace(/\r/g, '');
}

const keyPath = path.resolve(__dirname, 'sa-credentials.json');
fs.writeFileSync(keyPath, JSON.stringify(sa, null, 2));

console.log('Firebase Service Account credentials loaded and normalized.');
console.log('Starting deployment to Firebase Hosting...');

try {
  execSync('npx --yes firebase-tools@latest deploy --only hosting --project stok-pangan-cerdas', {
    stdio: 'inherit',
    env: {
      ...process.env,
      GOOGLE_APPLICATION_CREDENTIALS: keyPath,
    },
  });
  console.log('Deployment to Firebase Hosting succeeded!');
} finally {
  if (fs.existsSync(keyPath)) {
    fs.unlinkSync(keyPath);
  }
}
