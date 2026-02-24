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

const auth = await fetch('https://slack.com/api/auth.test', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
}).then((r) => r.json());

if (!auth.ok) {
  console.log('AUTH_ERROR: ' + JSON.stringify(auth));
  process.exit(1);
}
console.log('BOT_USER_ID=' + auth.user_id);
console.log('BOT_NAME=' + auth.user);
console.log('TEAM=' + auth.team);

const convos = await fetch('https://slack.com/api/conversations.list?types=im&limit=100', {
  headers: { Authorization: 'Bearer ' + token },
}).then((r) => r.json());

if (convos.ok && convos.channels) {
  console.log('DM_CHANNELS=' + convos.channels.length);
  for (const c of convos.channels) {
    console.log('DM: id=' + c.id + ' user=' + c.user);
  }
} else {
  console.log('CONVO_NOTE: ' + (convos.error || 'No DM channels found. This is expected if no one has DM-ed the bot yet.'));
}
