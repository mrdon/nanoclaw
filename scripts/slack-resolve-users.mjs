import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getVal = (key) => {
  const match = envContent.match(new RegExp(key + '=(.+)'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
};
const token = getVal('SLACK_BOT_TOKEN');

const userIds = [
  'UT5CH8GRH', 'UU7JVRJ22', 'USLACKBOT', 'U03K7QV0LP8',
  'UQSP3GSDP', 'U011RT5CAA0', 'UUN1ZJD9P', 'UQ8LZFL6B', 'U03QJAFHWH1',
];

const dmMap = {
  'UT5CH8GRH': 'D0AHGTY5P16',
  'UU7JVRJ22': 'D0AH1H8GRPB',
  'USLACKBOT': 'D0AH1G6MN2D',
  'U03K7QV0LP8': 'D0AGS86MXD2',
  'UQSP3GSDP': 'D0AGNKTMBQA',
  'U011RT5CAA0': 'D0AGLHX5SS2',
  'UUN1ZJD9P': 'D0AGK7ABB6H',
  'UQ8LZFL6B': 'D0AGG87PTNF',
  'U03QJAFHWH1': 'D0AG76JPHST',
};

for (const uid of userIds) {
  if (uid === 'USLACKBOT') {
    console.log(`Slackbot -> DM: ${dmMap[uid]}`);
    continue;
  }
  try {
    const resp = await fetch(`https://slack.com/api/users.info?user=${uid}`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    const data = await resp.json();
    if (data.ok) {
      const name = data.user.real_name || data.user.name;
      console.log(`${name} (${uid}) -> DM: ${dmMap[uid]}`);
    } else {
      console.log(`Unknown (${uid}) -> DM: ${dmMap[uid]} [error: ${data.error}]`);
    }
  } catch (err) {
    console.log(`Error resolving ${uid}: ${err.message}`);
  }
}
