import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getVal = (key) => {
  const match = envContent.match(new RegExp(key + '=(.+)'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
};
const token = getVal('SLACK_BOT_TOKEN');
const channelId = 'D0AHGTY5P16';

const resp = await fetch('https://slack.com/api/chat.postMessage', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    channel: channelId,
    text: 'Hello from NanoClaw! This is a test message to verify the Slack connection.',
  }),
});

const data = await resp.json();
if (data.ok) {
  console.log('SUCCESS: Message sent to DM channel ' + channelId);
  console.log('Message ts: ' + data.ts);
} else {
  console.log('ERROR: ' + data.error);
  if (data.error === 'channel_not_found') {
    console.log('The DM channel was not found. The bot may need to be invited or the channel ID is wrong.');
  }
  if (data.error === 'not_in_channel') {
    console.log('The bot is not in this channel. You need to open a DM with the bot first.');
  }
}
