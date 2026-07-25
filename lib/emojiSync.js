const fs = require('fs');
const path = require('path');
const { REST } = require('discord.js');
const { spawn } = require('child_process');

const ASSETS_DIR = path.join(__dirname, '..', 'tempassets');
const EMOJIS_PATH = path.join(__dirname, '..', 'emojis.json');
const EMOJI_REGEX = /^<(a?):(\w+):(\d+)>$/;
const SUPPORTED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function decodeClientId(token) {
  try {
    const decoded = Buffer.from(token.split('.')[0], 'base64').toString('utf8');
    if (/^\d{17,20}$/.test(decoded)) return decoded;
    return null;
  } catch {
    return null;
  }
}

function deleteAssetsDir() {
  try {
    fs.rmSync(ASSETS_DIR, { recursive: true, force: true });
    console.log('[EmojiSync] tempassets/ removed');
  } catch (err) {
    console.warn(`[EmojiSync] Could not remove tempassets/: ${err.message}`);
  }
}

function restartProcess() {
  console.log('[EmojiSync] Restarting to apply new emoji IDs...');
  const child = spawn(process.execPath, [process.argv[1]], {
    detached: true,
    stdio: 'inherit',
    env: process.env,
  });
  child.unref();
  setTimeout(() => process.exit(0), 300);
}

async function runEmojiSync() {
  if (!fs.existsSync(ASSETS_DIR)) return;

  console.log('[EmojiSync] Starting emoji sync from tempassets/...');

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('[EmojiSync] DISCORD_BOT_TOKEN not set — cannot sync emojis');
    deleteAssetsDir();
    return;
  }

  let emojis;
  try {
    emojis = JSON.parse(fs.readFileSync(EMOJIS_PATH, 'utf8'));
  } catch (err) {
    console.error(`[EmojiSync] Failed to read emojis.json: ${err.message}`);
    return;
  }

  const clientId = decodeClientId(token);
  if (!clientId) {
    console.error('[EmojiSync] Could not decode client ID from token');
    return;
  }

  console.log(`[EmojiSync] Client ID: ${clientId}`);

  let imageFiles;
  try {
    imageFiles = fs.readdirSync(ASSETS_DIR).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return SUPPORTED_EXT.has(ext) && !f.startsWith('.');
    });
  } catch (err) {
    console.error(`[EmojiSync] Failed to read tempassets/: ${err.message}`);
    return;
  }

  if (imageFiles.length === 0) {
    console.log('[EmojiSync] tempassets/ is empty — nothing to upload');
    deleteAssetsDir();
    return;
  }

  console.log(`[EmojiSync] Found ${imageFiles.length} image(s) in tempassets/`);

  const rest = new REST({ version: '10' }).setToken(token);

  let appEmojis = [];
  try {
    const res = await rest.get(`/applications/${clientId}/emojis`);
    appEmojis = Array.isArray(res) ? res : (res.items ?? []);
    console.log(`[EmojiSync] Application has ${appEmojis.length} emoji(s)`);
  } catch (err) {
    console.error(`[EmojiSync] Failed to fetch application emojis: ${err.message}`);
    return;
  }

  const nameToNewEmoji = {};
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of imageFiles) {
    const ext = path.extname(file).toLowerCase();
    const name = path.basename(file, ext);
    const animated = ext === '.gif';

    const existing = appEmojis.find(e => e.name === name);
    if (existing) {
      nameToNewEmoji[name] = {
        id: existing.id,
        name: existing.name,
        animated: existing.animated ?? false,
      };
      skipped++;
      console.log(`[EmojiSync] ✓ ${name} — already uploaded, skipped`);
      continue;
    }

    console.log(`[EmojiSync] ↑ ${name} — uploading...`);

    let imageBuffer;
    try {
      imageBuffer = fs.readFileSync(path.join(ASSETS_DIR, file));
    } catch (err) {
      console.error(`[EmojiSync] ✗ ${name} — read error: ${err.message}`);
      failed++;
      continue;
    }

    const mimeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    const mimeType = mimeMap[ext] || 'image/png';
    const image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    try {
      const newEmoji = await rest.post(`/applications/${clientId}/emojis`, {
        body: { name, image },
      });
      nameToNewEmoji[name] = {
        id: newEmoji.id,
        name: newEmoji.name,
        animated: newEmoji.animated ?? animated,
      };
      uploaded++;
      console.log(`[EmojiSync] ✓ ${name} — uploaded (ID: ${newEmoji.id})`);
    } catch (err) {
      console.error(`[EmojiSync] ✗ ${name} — upload failed: ${err.message}`);
      failed++;
    }
  }

  let updated = false;
  const result = { ...emojis };
  let fixedCount = 0;

  for (const [key, emojiStr] of Object.entries(emojis)) {
    const match = emojiStr.match(EMOJI_REGEX);
    if (!match) continue;

    const emojiName = match[2];
    const newData = nameToNewEmoji[emojiName];
    if (!newData) continue;

    const correct = newData.animated
      ? `<a:${newData.name}:${newData.id}>`
      : `<:${newData.name}:${newData.id}>`;

    if (result[key] !== correct) {
      result[key] = correct;
      updated = true;
      fixedCount++;
    }
  }

  if (updated) {
    try {
      fs.writeFileSync(EMOJIS_PATH, JSON.stringify(result, null, 2));
      console.log(`[EmojiSync] emojis.json updated — ${fixedCount} key(s) rewritten`);
    } catch (err) {
      console.error(`[EmojiSync] Failed to save emojis.json: ${err.message}`);
    }
  } else {
    console.log('[EmojiSync] emojis.json already up to date');
  }

  const parts = [
    uploaded ? `${uploaded} uploaded` : null,
    skipped ? `${skipped} skipped` : null,
    failed ? `${failed} failed` : null,
  ].filter(Boolean);

  console.log(`[EmojiSync] ${parts.join(' · ')}`);

  deleteAssetsDir();

  if (updated) {
    restartProcess();
    await new Promise(r => setTimeout(r, 2000));
  }
}

module.exports = { runEmojiSync };
