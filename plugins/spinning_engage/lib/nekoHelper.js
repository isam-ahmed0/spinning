const axios = require('axios');

const nekoEndpoints = {
  hug: 'hug',
  kiss: 'kiss',
  pat: 'pat',
  slap: 'slap',
  poke: 'poke',
  tickle: 'tickle',
  wink: 'wink',
  blush: 'blush',
  cry: 'cry',
  dance: 'dance',
  laugh: 'laugh',
  smile: 'smile',
  sleep: 'sleep',
  shrug: 'shrug',
  facepalm: 'facepalm',
  thumbsup: 'thumbsup',
  run: 'run',
  eat: 'nom',
  deathstare: 'stare'
};

async function getNekoGif(action) {
  try {
    const reaction = nekoEndpoints[action];
    if (!reaction) return null;
    const response = await axios.get(`https://api.otakugifs.xyz/gif?reaction=${reaction}`);
    if (response.data && response.data.url) {
      return response.data.url;
    }
  } catch (error) {
    console.error(`[nekoHelper] Error fetching GIF for ${action}:`, error.message);
  }
  return null;
}

function hasNekoEndpoint(action) {
  return nekoEndpoints.hasOwnProperty(action);
}

module.exports = { getNekoGif, nekoEndpoints, hasNekoEndpoint };
