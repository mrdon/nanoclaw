import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getVal = (key) => {
  const match = envContent.match(new RegExp(key + '=(.+)'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
};

const appToken = getVal('SLACK_APP_TOKEN');
if (!appToken) {
  console.log('ERROR: SLACK_APP_TOKEN not found in .env');
  process.exit(1);
}

console.log('Token prefix:', appToken.substring(0, 5));
console.log('Token length:', appToken.length);

if (!appToken.startsWith('xapp-')) {
  console.log('WARNING: App token should start with xapp-');
}

// Test the app token by trying to open a connection
const resp = await fetch('https://slack.com/api/apps.connections.open', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + appToken, 'Content-Type': 'application/x-www-form-urlencoded' },
});
const data = await resp.json();
console.log('Connection test ok:', data.ok);
if (!data.ok) {
  console.log('Error:', data.error);
}
