import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getVal = (key) => {
  const match = envContent.match(new RegExp(key + '=(.+)'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
};
const token = getVal('SLACK_BOT_TOKEN');
if (!token) {
  console.log('ERROR: No SLACK_BOT_TOKEN in .env');
  process.exit(1);
}

// auth.test returns the scopes in the response headers, but we can also check via the API
const resp = await fetch('https://slack.com/api/auth.test', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
});

const headers = Object.fromEntries(resp.headers.entries());
console.log('x-oauth-scopes:', headers['x-oauth-scopes'] || '(not returned)');

const data = await resp.json();
console.log('ok:', data.ok);
console.log('user:', data.user);
console.log('team:', data.team);

// Also try conversations.list with types=im to see the actual error
const convResp = await fetch('https://slack.com/api/conversations.list?types=im&limit=10', {
  headers: { Authorization: 'Bearer ' + token },
});
const convData = await convResp.json();
console.log('conversations.list ok:', convData.ok);
console.log('conversations.list error:', convData.error || 'none');
console.log('conversations.list needed:', convData.needed || 'n/a');
console.log('conversations.list provided:', convData.provided || 'n/a');
