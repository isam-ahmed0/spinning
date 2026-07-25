const axios = require('axios');

const OTAKUGIFS_BASE = 'https://api.otakugifs.xyz/gif';

async function getRandomTenorGif(searchTerm) {
  const apiKey = process.env.TENOR_API_KEY;

  if (apiKey) {
    try {
      const response = await axios.get('https://tenor.googleapis.com/v2/search', {
        params: {
          q: searchTerm,
          key: apiKey,
          client_key: 'spinning_discord_bot',
          limit: 25,
          media_filter: 'gif',
          contentfilter: 'medium'
        }
      });
      if (response.data.results && response.data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * response.data.results.length);
        return response.data.results[randomIndex].media_formats.gif.url;
      }
    } catch (error) {
      console.error('[gifHelper] Tenor API error:', error.message);
    }
  }

  try {
    const reaction = searchTerm.replace(/\s+/g, '');
    const response = await axios.get(`${OTAKUGIFS_BASE}?reaction=${reaction}`);
    if (response.data && response.data.url) {
      return response.data.url;
    }
  } catch (error) {
    console.error('[gifHelper] OtakuGIFs fallback error:', error.message);
  }

  return null;
}

module.exports = { getRandomTenorGif };
