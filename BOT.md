# Spiralcord - Complete Bot Making Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Configuration](#configuration)
4. [Plugin System](#plugin-system)
5. [JavaScript Plugins](#javascript-plugins)
6. [DSL Plugins](#dsl-plugins)
7. [Config System](#config-system)
8. [Commands API](#commands-api)
9. [Hooks & Events](#hooks--events)
10. [Inter-Plugin Communication](#inter-plugin-communication)
11. [Discord.js Integration](#discordjs-integration)
12. [Buttons, Select Menus & Modals](#components)
13. [Voice & Music](#voice--music)
14. [AI Integration](#ai-integration)
15. [Database Access](#database-access)
16. [Image Manipulation](#image-manipulation)
17. [CLI Commands](#cli-commands)
18. [Plugin Manager (spm)](#plugin-manager-spm)
19. [REPL Console](#repl-console)
20. [Testing](#testing)
21. [Deployment](#deployment)

---

## Getting Started

### Install

```bash
# Minimal (core only)
npm install -g spiralcord

# Full (voice, music, AI, database, canvas)
npm install spiralcord-full
```

### Create a Bot

```bash
# Clone a template
spiral install https://github.com/yourname/my-bot

# Or create manually
mkdir my-bot && cd my-bot
```

### spiral.json

Create `spiral.json` in your bot folder:

```json
{
  "name": "My Bot",
  "token": "YOUR_DISCORD_TOKEN",
  "prefix": "!",
  "intents": ["Guilds", "GuildMessages", "MessageContent"],
  "clientId": "YOUR_BOT_CLIENT_ID",
  "disabledCommands": []
}
```

### Start

```bash
spiral run
```

---

## Project Structure

```
my-bot/
  spiral.json              # Bot config (token, prefix, intents)
  plugins/
    my_plugin/
      plugin.json          # Plugin manifest (required)
      index.js             # JavaScript plugin
      plugin.dsl           # DSL plugin (alternative to index.js)
      config.json          # User settings
      config.schema.json   # Config schema with defaults
  node_modules/
  package.json
```

---

## Configuration

### spiral.json

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Bot display name |
| `token` | string | Discord bot token |
| `prefix` | string | Command prefix (default: `!`) |
| `intents` | string[] | Gateway intents to enable |
| `clientId` | string | Discord application client ID |
| `disabledCommands` | string[] | Commands to disable |

### Available Intents

- `Guilds` - Server information
- `GuildMessages` - Read messages in servers
- `MessageContent` - Read message content (required for commands)
- `GuildMembers` - Access member list
- `GuildVoiceStates` - Voice channel tracking
- `DirectMessages` - DM support
- `GuildPresences` - Presence/activity tracking

---

## Plugin System

Spiralcord is 100% plugin-based. There are **no builtin plugins** in the package. Everything is a plugin:

| Plugin | Purpose |
|--------|---------|
| `spiral_core` | Essential commands (help, ping, info, kick, ban) |
| `spiral_command_dispatch` | Routes prefix commands to handlers |
| `spiral_slash_commands` | Registers slash commands with Discord |
| `spiral_economy` | Currency system |
| `spiral_fun` | Fun commands |
| `spiral_moderation` | Moderation tools |
| `spiral_utilities` | Utility commands |
| `spiral_presence` | Bot status/activity management |
| `spiral_ai` | OpenAI chat integration |
| `spiral_counter` | Number counting system |
| `spiral_greetings` | Greeting commands (DSL) |
| `spiral_reactions` | Reaction commands (DSL) |
| `spiral_greet` | Custom greet hooks |

### Plugin Types

**JavaScript plugins** - Full power, any feature:
```
plugins/my_plugin/
  plugin.json
  index.js
```

**DSL plugins** - No code, simple responses:
```
plugins/my_plugin/
  plugin.json
  plugin.dsl
```

Both types use the same `plugin.json` manifest and `config.json`/`config.schema.json` config system.

---

## plugin.json (Manifest)

Required for every plugin:

```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": "yourname",
  "dependencies": {},
  "collision_policy": "last-wins",
  "builtin": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique plugin identifier |
| `version` | string | Yes | Semantic version |
| `description` | string | Yes | Short description |
| `author` | string | No | Author name |
| `dependencies` | object | No | Other plugins this depends on |
| `collision_policy` | string | No | What happens when commands conflict |
| `builtin` | boolean | No | Internal use |

### Collision Policies

When two plugins register the same command name:

- `"error"` - Refuse to load, log error
- `"first-wins"` - First plugin keeps the command
- `"last-wins"` - Latest plugin overrides (default)

---

## JavaScript Plugins

### Basic Structure

```js
module.exports = {
  // Called once when plugin loads
  async init(config, runtime) {
    console.log('Plugin ready!');
  },

  // Prefix commands (!command)
  commands: {},

  // Trigger words (no prefix)
  keywords: {},

  // Discord event handlers
  hooks: {},

  // REPL commands for interactive console
  repl: {},

  // API exposed to other plugins
  api: {}
};
```

### Commands

```js
module.exports = {
  commands: {
    greet: {
      description: 'Greet someone',
      usage: '<user>',
      slash: false,
      priority: 0,
      execute: async (message, args, runtime) => {
        const user = message.mentions.users.first();
        if (!user) return message.reply('Please mention someone!');

        await message.reply(`Hello ${user}!`);
      }
    },

    // Commands with aliases
    hello: {
      description: 'Say hello',
      aliases: ['hi', 'hey'],
      execute: async (message, args, runtime) => {
        await message.reply(`Hello ${message.author}!`);
      }
    }
  }
};
```

### Keywords (Trigger Words)

Keywords fire on any message containing the word (no prefix):

```js
module.exports = {
  keywords: {
    rip: async (message, args, runtime) => {
      await message.reply('Press F to pay respects');
    }
  }
};
```

### Hooks (Event Handlers)

```js
module.exports = {
  hooks: {
    bot_ready: async (payload, runtime) => {
      console.log(`Logged in as ${payload.user.tag}`);
    },

    message_received: async (payload, runtime) => {
      const { message, user, guild } = payload;
      // Do something with every message
    },

    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      // Handle buttons, select menus, modals
    },

    presence_update: async (payload, runtime) => {
      const { oldPresence, newPresence, user } = payload;
    },

    voice_state_update: async (payload, runtime) => {
      const { oldState, newState, user } = payload;
    },

    guild_joined: async (payload, runtime) => {
      console.log(`Joined ${payload.guild.name}`);
    }
  }
};
```

---

## DSL Plugins

For simple response commands, use DSL (no JavaScript needed).

### Syntax

```
# Comments start with #

COMMAND hello "Say hello to the bot"
  ALIASES hi, hey, greetings
  COOLDOWN 3
  REQUIRES_ARGS "Usage: !hello <name>"
  REQUIRES_PERMISSION MANAGE_MESSAGES
  RESPONSE_POOL
    Hello {user.name}! How are you?
    Hey {user.name}! What's up?
    Hi there {user.name}!
  END
END

COMMAND info "Show something"
  EMBED "#00FF00"
  TITLE "Information"
  DESCRIPTION "This is an embed with a green border"
END
```

### DSL Keywords

| Keyword | Syntax | Description |
|---------|--------|-------------|
| `COMMAND` | `COMMAND name "description"` | Create a prefix command |
| `SLASH_COMMAND` | `SLASH_COMMAND name "description"` | Create a slash command |
| `ALIASES` | `ALIASES alias1, alias2` | Alternative command names |
| `COOLDOWN` | `COOLDOWN 5` | Seconds between uses |
| `REQUIRES_ARGS` | `REQUIRES_ARGS "error msg"` | Error if no arguments |
| `REQUIRES_PERMISSION` | `REQUIRES_PERMISSION BAN_MEMBERS` | Discord permission required |
| `RESPONSE` | `RESPONSE "text"` | Fixed text response |
| `RESPONSE_POOL` | (block) | Pool of random responses |
| `EMBED` | `EMBED "#FF0000"` | Send colored embed |
| `TITLE` | `TITLE "text"` | Embed title |
| `DESCRIPTION` | `DESCRIPTION "text"` | Embed description |
| `BUTTON` | `BUTTON "label" STYLE Success ACTION command` | Add a button |
| `SELECT` | `SELECT "placeholder" OPTION "label" VALUE "val"` | Add select menu |
| `DB_SET` | `DB_SET key value` | Set a database value |
| `DB_GET` | `DB_GET key` | Get a database value |
| `DB_ADD` | `DB_ADD key 10` | Add to a number |
| `DB_DELETE` | `DB_DELETE key` | Delete a key |
| `DB_RESPONSE` | `DB_RESPONSE "key"` | Use DB value in response |
| `END` | `END` | Close current block |

### DSL Variables

| Variable | Replaced With |
|----------|---------------|
| `{user.id}` | User's Discord ID |
| `{user.name}` | User's username |
| `{channel.id}` | Channel ID |
| `{guild.id}` | Server ID |
| `{guild.name}` | Server name |
| `{args}` | Command arguments as string |
| `{db_value}` | Last DB_GET or DB_ADD result |
| `{db_response}` | DB_RESPONSE value |

### DSL Example: Slash Command

```
SLASH_COMMAND hello "Say hello to the bot"
  RESPONSE "Hello {user.name}!"
END
```

### DSL Example: Database Counter

```
COMMAND score "Check your score"
  RESPONSE "Your score: {db_value}"
  DB_GET score
END

COMMAND addscore "Add to your score"
  RESPONSE "Score: {db_value}"
  DB_ADD score 10
END

COMMAND setscore "Set your score"
  RESPONSE "Score set to {db_value}"
  DB_SET score 50
END
```

### Real Example

```
# spiral_reactions plugin.dsl

COMMAND hug "Hug someone"
  ALIASES embrace, cuddle
  COOLDOWN 5
  REQUIRES_ARGS "Usage: !hug <user>"
  RESPONSE_POOL
    {user.name} hugs {args} tightly!
    {user.name} gives {args} a warm bear hug!
    {user.name} wraps {args} in a big hug!
  END
END

COMMAND coinflip "Flip a coin"
  ALIASES flip
  COOLDOWN 2
  EMBED "#FFD700"
  TITLE "Coin Flip"
  DESCRIPTION "Heads!"
END
```

---

## Config System

### config.schema.json

Define defaults and structure:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "My Plugin Config",
  "type": "object",
  "properties": {
    "enabled": {
      "type": "boolean",
      "default": true,
      "description": "Enable/disable plugin"
    },
    "apiKey": {
      "type": "string",
      "default": "",
      "description": "API key for external service"
    },
    "maxItems": {
      "type": "number",
      "default": 50,
      "description": "Maximum items to store"
    },
    "greeting": {
      "type": "string",
      "default": "Hello!",
      "description": "Greeting message"
    }
  }
}
```

### config.json

User overrides (what users actually edit):

```json
{
  "enabled": true,
  "apiKey": "sk-abc123",
  "maxItems": 100
}
```

### Accessing Config

```js
module.exports = {
  async init(config, runtime) {
    // config = merged schema defaults + user config.json
    console.log(config.apiKey);     // "sk-abc123"
    console.log(config.maxItems);   // 100
    console.log(config.greeting);   // "Hello!" (from schema default)
  },

  commands: {
    test: {
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('my_plugin');
        await message.reply(`API Key: ${config.apiKey}`);
      }
    }
  }
};
```

---

## Commands API

### Command Object

```js
{
  description: 'Short description shown in help',
  usage: '<required> [optional]',
  aliases: ['alt1', 'alt2'],       // Alternative names
  slash: false,                     // Register as slash command
  priority: 0,                      // Higher = wins on collision
  execute: async (message, args, runtime) => {
    // message - Discord.js Message object
    // args    - Array of space-separated arguments
    // runtime - Spiralcord runtime API
  }
}
```

### Slash Commands

Set `slash: true` to auto-register with Discord:

```js
commands: {
  ping: {
    description: 'Check latency',
    slash: true,
    execute: async (message, args, runtime) => {
      await message.reply('Pong!');
    }
  }
}
```

### Permission Checks

```js
execute: async (message, args, runtime) => {
  // Check Discord permissions
  if (!message.member.permissions.has('BAN_MEMBERS')) {
    return message.reply('You need Ban Members permission.');
  }

  // Check roles
  if (!message.member.roles.cache.some(r => r.name === 'Admin')) {
    return message.reply('Admins only!');
  }

  // Proceed with command
}
```

### Embeds

```js
const { EmbedBuilder } = require('discord.js');

execute: async (message, args, runtime) => {
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Title')
    .setDescription('Description')
    .setThumbnail(message.author.displayAvatarURL())
    .addFields(
      { name: 'Field 1', value: 'Value 1', inline: true },
      { name: 'Field 2', value: 'Value 2', inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Footer text' });

  await message.reply({ embeds: [embed] });
}
```

### Buttons & Components

```js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

execute: async (message, args, runtime) => {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_yes')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('confirm_no')
        .setLabel('No')
        .setStyle(ButtonStyle.Danger)
    );

  await message.reply({ content: 'Are you sure?', components: [row] });
}
```

Handle button clicks in hooks:

```js
hooks: {
  interaction_received: async (payload, runtime) => {
    const { interaction } = payload;

    if (interaction.isButton()) {
      if (interaction.customId === 'confirm_yes') {
        await interaction.reply('Confirmed!');
      }
      if (interaction.customId === 'confirm_no') {
        await interaction.reply('Cancelled!');
      }
    }
  }
}
```

---

## Hooks & Events

### Full Hook Reference

| Hook | When | Payload |
|------|------|---------|
| `bot_ready` | Bot logged in | `{ client, user, config }` |
| `message_received` | Message sent | `{ message, user, guild, channel }` |
| `interaction_received` | Button/modal/select | `{ interaction, user, guild, channel }` |
| `presence_update` | Status changed | `{ oldPresence, newPresence, user, guild }` |
| `voice_state_update` | Voice join/leave | `{ oldState, newState, user, guild }` |
| `reaction_add` | Reaction added | `{ reaction, user, message }` |
| `reaction_remove` | Reaction removed | `{ reaction, user, message }` |
| `guild_joined` | Bot joins server | `{ guild }` |
| `guild_left` | Bot leaves server | `{ guild }` |
| `bot_shutdown` | Bot stopping | `{ client }` |

### Custom Hooks

Plugins can emit and listen to custom hooks:

```js
// Plugin A: Emit custom event
await runtime.emitHook('economy:purchase', {
  userId: message.author.id,
  item: 'sword',
  cost: 100
});

// Plugin B: Listen for it
module.exports = {
  hooks: {
    'economy:purchase': async (payload, runtime) => {
      console.log(`${payload.userId} bought ${payload.item}`);
    }
  }
};
```

### Serial vs Parallel Hooks

By default hooks run in parallel. For sequential:

```js
// In plugin manager (internal)
await runtime.emitHookSerial('message_received', payload);

// For hooks that return true/false
const handled = await runtime.emitHookWithResult('message_received', payload);
```

---

## Inter-Plugin Communication

### Get Another Plugin's API

```js
module.exports = {
  async init(config, runtime) {
    // Access spiral_ai's API
    const ai = runtime.getPluginAPI('spiral_ai');
    if (ai) {
      const history = ai.getHistory(userId);
    }
  }
};
```

### Get Another Plugin's Config

```js
const aiConfig = runtime.getPluginConfig('spiral_ai');
console.log(aiConfig.apiKey);
```

### Shared State via Hooks

```
Plugin A emits: economy:balance_changed
Plugin B listens: economy:balance_changed

// Plugin A
await runtime.emitHook('economy:balance_changed', { userId, newBalance });

// Plugin B
hooks: {
  'economy:balance_changed': async (payload, runtime) => {
    console.log(`${payload.userId} now has ${payload.newBalance}`);
  }
}
```

---

## Discord.js Integration

Spiralcord uses discord.js v14. Full access in all plugins:

```js
const {
  Client, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, PermissionsBitField,
  ChannelType, AttachmentBuilder
} = require('discord.js');
```

### Common Patterns

```js
// Send a message
await message.channel.send('Hello!');

// Reply to a message
await message.reply('Reply!');

// Delete a message
await message.delete();

// Send to specific channel
const channel = runtime.client.channels.cache.get('CHANNEL_ID');
await channel.send('Hello!');

// Get a member
const member = message.guild.members.cache.get(userId);

// Ban/Kick
await member.ban({ reason: 'Spam' });
await member.kick('Reason');

// DM a user
await message.author.send('Hello via DM!');

// Create channel
const ch = await message.guild.channels.create('ticket', {
  type: ChannelType.GuildText
});

// Wait for response
const filter = m => m.author.id === message.author.id;
const collected = await message.channel.awaitMessages({
  filter, max: 1, time: 30000
});
```

---

## Voice & Music

Requires `spiralcord-full` or manual install:

```bash
npm install @discordjs/voice @discordjs/opus discord-player ffmpeg-static
```

### Join Voice Channel

```js
const { joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  commands: {
    join: {
      description: 'Join your voice channel',
      execute: async (message, args, runtime) => {
        const channel = message.member.voice.channel;
        if (!channel) return message.reply('Join a voice channel first!');

        const connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator
        });

        await message.reply(`Joined ${channel.name}`);
      }
    }
  }
};
```

### Music Player

```js
const { Player } = require('discord-player');

let player;

module.exports = {
  async init(config, runtime) {
    player = new Player(runtime.client);
    // Register extractors for YouTube, Spotify, etc.
  },

  commands: {
    play: {
      description: 'Play a song',
      usage: '<query or URL>',
      execute: async (message, args, runtime) => {
        const query = args.join(' ');
        if (!query) return message.reply('Provide a song name!');

        const channel = message.member.voice.channel;
        if (!channel) return message.reply('Join a voice channel!');

        const track = await player.play(channel, query, {
          nodeOptions: { metadata: message }
        });

        await message.reply(`Playing: **${track.track.title}**`);
      }
    },

    stop: {
      description: 'Stop music',
      execute: async (message, args, runtime) => {
        const queue = player.nodes.get(message.guild.id);
        if (queue) queue.delete();
        await message.reply('Stopped!');
      }
    }
  }
};
```

---

## AI Integration

Requires `spiralcord-full` or manual install:

```bash
npm install openai
```

### Basic AI Plugin

```js
const OpenAI = require('openai');

let openai;
const conversations = new Map();

module.exports = {
  async init(config, runtime) {
    if (config.apiKey) {
      openai = new OpenAI({ apiKey: config.apiKey });
    }
  },

  commands: {
    ask: {
      description: 'Ask AI a question',
      usage: '<question>',
      execute: async (message, args, runtime) => {
        if (!openai) return message.reply('AI not configured.');

        const question = args.join(' ');
        if (!question) return message.reply('Ask something!');

        const userId = message.author.id;
        const history = conversations.get(userId) || [];

        history.push({ role: 'user', content: question });

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Be helpful and concise.' },
            ...history.slice(-10)
          ],
          max_tokens: 500
        });

        const reply = response.choices[0].message.content;
        history.push({ role: 'assistant', content: reply });
        conversations.set(userId, history.slice(-10));

        await message.reply(reply);
      }
    }
  }
};
```

### config.schema.json for AI

```json
{
  "type": "object",
  "properties": {
    "enabled": { "type": "boolean", "default": true },
    "apiKey": { "type": "string", "default": "" },
    "model": { "type": "string", "default": "gpt-3.5-turbo" },
    "systemPrompt": { "type": "string", "default": "Be helpful and concise." },
    "maxHistory": { "type": "number", "default": 10 },
    "cooldown": { "type": "number", "default": 5 }
  }
}
```

---

## Database Access

### Built-in JSON Database

Spiralcord includes a built-in JSON database (`data.json`). No setup required.

```js
module.exports = {
  commands: {
    addxp: {
      description: 'Add XP to yourself',
      usage: '<amount>',
      execute: async (message, args, runtime) => {
        const amount = parseInt(args[0]) || 10;
        const key = `${message.author.id}.xp`;
        const newXP = runtime.db.add(key, amount);
        await message.reply(`XP: ${newXP}`);
      }
    },

    myxp: {
      description: 'Check your XP',
      execute: async (message, args, runtime) => {
        const xp = runtime.db.get(`${message.author.id}.xp`, 0);
        await message.reply(`Your XP: ${xp}`);
      }
    }
  }
};
```

### Database API

| Method | Description |
|--------|-------------|
| `runtime.db.get(key, default)` | Get value (supports dot notation) |
| `runtime.db.set(key, value)` | Set value |
| `runtime.db.add(key, amount)` | Add to number (creates if missing) |
| `runtime.db.delete(key)` | Delete a key |
| `runtime.db.has(key)` | Check if key exists |
| `runtime.db.all()` | Get all data |
| `runtime.db.clear()` | Clear all data |

### SQLite (alternative)

```bash
npm install better-sqlite3
```

```js
const Database = require('better-sqlite3');
let db;

module.exports = {
  async init(config, runtime) {
    db = new Database('data.db');

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1
      )
    `);
  },

  commands: {
    xp: {
      description: 'Check your XP',
      execute: async (message, args, runtime) => {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(message.author.id);
        await message.reply(`XP: ${user?.xp || 0} | Level: ${user?.level || 1}`);
      }
    }
  }
};
```

---

## Image Manipulation

Requires `spiralcord-full` or manual install:

```bash
npm install @napi-rs/canvas
```

### Generate an Image

```js
const { createCanvas } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
  commands: {
    banner: {
      description: 'Generate a welcome banner',
      execute: async (message, args, runtime) => {
        const canvas = createCanvas(800, 200);
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 800, 200);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 200);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Welcome ${message.author.username}!`, 400, 100);

        ctx.font = '24px sans-serif';
        ctx.fillText(`to ${message.guild.name}`, 400, 150);

        const buffer = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });

        await message.reply({ files: [attachment] });
      }
    }
  }
};
```

---

## CLI Commands

### Bot Commands

| Command | Description |
|---------|-------------|
| `spiral run` | Start the bot |
| `spiral run -R` | Start with auto-reload + REPL console |
| `spiral dev` | Start with auto-reload on file changes |
| `spiral web` | Open plugin manager UI |
| `spiral test` | Test all plugins for errors |
| `spiral doctor` | Check bot health and configuration |
| `spiral -V` | Show version |

### Repo Commands

| Command | Description |
|---------|-------------|
| `spiral install <repo>` | Clone bot from GitHub |
| `spiral update` | Update spiralcord to latest version |

---

## Plugin Manager (spm)

spm is a separate CLI for managing plugins. It stores plugins in `~/.spiralcord/plugins/`.

### Installation

```bash
# Included with spiralcord
spm --help

# Or standalone
npm install -g spm
```

### Commands

| Command | Description |
|---------|-------------|
| `spm install <source>` | Install from GitHub |
| `spm list` | List installed plugins |
| `spm enable <plugin>` | Enable a plugin |
| `spm disable <plugin>` | Disable a plugin |
| `spm create <name>` | Create new plugin |
| `spm create <name> -t dsl` | Create DSL plugin |
| `spm create <name> -t voice` | Create voice plugin |
| `spm create <name> -t ai` | Create AI plugin |
| `spm test <plugin>` | Test a plugin |
| `spm remove <plugin>` | Remove a plugin |
| `spm info <plugin>` | Show plugin info |
| `spm update` | Update all plugins |

### Shared Commands Module

spm uses a shared commands module (`spm/lib/commands.js`) that both the CLI and the interactive REPL use. This means:

- Same logic for both CLI and REPL
- Functions return `{ success, message }` for clean integration
- Uses `execFileSync` for security (no shell injection)

---

## REPL Console

Start with `spiral run -R` for an interactive console:

```
$ spiral run -R
[runtime] Starting Spiralcord v2.2.7
[runtime] Ready as MyBot#1234 | 5 servers
[repl] 2 plugin command(s) registered: .greet, .stats

spiral> .status
Uptime: 0h 2m 30s | Servers: 5 | Users: 200

spiral> spm.plugins
  ● spiral_core v1.0.0 — Core plugin
  ● my-plugin v1.0.0 — My custom plugin

spiral> .greet
Hello User!

spiral> .reload
Plugins reloaded.

spiral> .exit
Bot continues running. Press Ctrl+C to stop.
```

### Bot REPL Commands

| Command | Description |
|---------|-------------|
| `.status` | Show uptime, servers, users |
| `.reload` | Hot-reload all plugins |
| `.stop` | Stop the bot |
| `.commands` | List all registered commands |
| `.help` | Show available commands |

### SPM REPL Commands

| Command | Description |
|---------|-------------|
| `spm.plugins` | List installed plugins |
| `spm.install <source>` | Install from GitHub |
| `spm.create <name>` | Create new plugin |
| `spm.enable <name>` | Enable plugin |
| `spm.disable <name>` | Disable plugin |
| `spm.remove <name>` | Remove plugin |
| `spm.test <name>` | Test plugin |
| `spm.info <name>` | Show plugin info |
| `spm.update` | Update all plugins |

### Plugin REPL Commands

Plugins can register custom commands for the REPL:

```js
module.exports = {
  name: 'my-plugin',
  repl: {
    greet: {
      description: 'Say hello',
      execute: async (args, context) => {
        return `Hello ${context.user.username}!`;
      }
    }
  }
};
```

Then in the REPL: `spiral> .greet`

---

## Testing

```bash
spiral test
```

### What It Checks

- **JS syntax** - Validates `index.js` files parse correctly
- **DSL syntax** - Validates `plugin.dsl` files (unclosed blocks, bad keywords)
- **Command conflicts** - Detects duplicate command names across plugins
- **Hook conflicts** - Warns when multiple plugins use same hooks
- **Missing files** - Checks for required `plugin.json` and `index.js`/`plugin.dsl`
- **Config schema** - Validates `config.schema.json` format
- **Dependencies** - Warns about missing npm packages

### Example Output

```
Testing plugins...

✓ spiral_ai
✓ spiral_core (10 commands)
✓ spiral_counter (6 commands)
✓ spiral_economy (5 commands)
✓ spiral_greetings (5 commands)

Results: 13 passed, 2 warnings, 0 errors

Warnings:
  ⚠ Hook "message_received" used by 2 plugins: spiral_ai, spiral_command_dispatch

All tests passed! Run "spiral run" to start.
```

### Fix Errors Manually

The test command reports issues but does **not** auto-fix. Fix errors yourself before running the bot.

---

## Deployment

### Local Development

```bash
spiral run
```

### Production (VPS / Cloud)

```bash
# Install
npm install -g spiralcord
spiral install https://github.com/you/my-bot
cd my-bot

# Edit spiral.json with your token
nano spiral.json

# Run in background with pm2
npm install -g pm2
pm2 start "spiral run" --name my-bot
pm2 save
pm2 startup
```

### Updating

```bash
cd my-bot
spiral update
# Token and configs are preserved
```

---

## Complete Plugin Example

### plugins/leveling/plugin.json

```json
{
  "name": "leveling",
  "version": "1.0.0",
  "description": "XP and leveling system",
  "author": "yourname",
  "dependencies": {}
}
```

### plugins/leveling/config.schema.json

```json
{
  "type": "object",
  "properties": {
    "enabled": { "type": "boolean", "default": true },
    "xpPerMessage": { "type": "number", "default": 15 },
    "xpCooldown": { "type": "number", "default": 60 },
    "baseXP": { "type": "number", "default": 100 },
    "announceLevelUp": { "type": "boolean", "default": true }
  }
}
```

### plugins/leveling/config.json

```json
{
  "enabled": true,
  "xpPerMessage": 15,
  "announceLevelUp": true
}
```

### plugins/leveling/index.js

```js
const { EmbedBuilder } = require('discord.js');
const xp = new Map();
const cooldowns = new Map();

function getLevelXP(level, baseXP) {
  return Math.floor(baseXP * Math.pow(1.5, level));
}

module.exports = {
  async init(config, runtime) {
    console.log(`[leveling] XP per message: ${config.xpPerMessage}`);
  },

  hooks: {
    message_received: async (payload, runtime) => {
      const config = runtime.getPluginConfig('leveling');
      if (!config.enabled) return;

      const { message } = payload;
      if (message.author.bot) return;

      const userId = message.author.id;

      // Cooldown check
      if (cooldowns.has(userId)) return;
      cooldowns.set(userId, true);
      setTimeout(() => cooldowns.delete(userId), (config.xpCooldown || 60) * 1000);

      // Add XP
      const data = xp.get(userId) || { xp: 0, level: 0 };
      data.xp += config.xpPerMessage || 15;

      const needed = getLevelXP(data.level, config.baseXP || 100);

      // Level up
      if (data.xp >= needed) {
        data.xp -= needed;
        data.level++;

        if (config.announceLevelUp) {
          const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('Level Up!')
            .setDescription(`${message.author} reached **Level ${data.level}**!`)
            .setTimestamp();

          await message.channel.send({ embeds: [embed] });
        }
      }

      xp.set(userId, data);
    }
  },

  commands: {
    level: {
      description: 'Check your level',
      execute: async (message, args, runtime) => {
        const target = message.mentions.users.first() || message.author;
        const data = xp.get(target.id) || { xp: 0, level: 0 };
        const config = runtime.getPluginConfig('leveling');
        const needed = getLevelXP(data.level, config.baseXP || 100);

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle(`${target.username}'s Level`)
          .addFields(
            { name: 'Level', value: `${data.level}`, inline: true },
            { name: 'XP', value: `${data.xp}/${needed}`, inline: true }
          )
          .setThumbnail(target.displayAvatarURL());

        await message.reply({ embeds: [embed] });
      }
    },

    leaderboard: {
      description: 'Show top users',
      aliases: ['lb'],
      execute: async (message, args, runtime) => {
        const sorted = [...xp.entries()]
          .sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp)
          .slice(0, 10);

        if (!sorted.length) return message.reply('No data yet!');

        const lines = sorted.map(([id, data], i) =>
          `${i + 1}. <@${id}> - Level ${data.level} (${data.xp} XP)`
        );

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('Leaderboard')
          .setDescription(lines.join('\n'))
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      }
    },

    setlevel: {
      description: 'Set a user\'s level',
      usage: '<user> <level>',
      execute: async (message, args, runtime) => {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
          return message.reply('Admin only!');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('Mention a user!');

        const level = parseInt(args[1]);
        if (isNaN(level)) return message.reply('Provide a level!');

        const data = xp.get(user.id) || { xp: 0, level: 0 };
        data.level = level;
        data.xp = 0;
        xp.set(user.id, data);

        await message.reply(`Set ${user.username} to level ${level}`);
      }
    }
  }
};
```

---

## Quick Reference

### Creating a Plugin in 30 Seconds

```bash
# 1. Create folder
mkdir plugins/my_plugin

# 2. Create plugin.json
echo '{"name":"my_plugin","version":"1.0.0","description":"My plugin"}' > plugins/my_plugin/plugin.json

# 3. Create index.js
echo 'module.exports={commands:{test:{description:"Test",execute:async(m)=>await m.reply("It works!")}}}' > plugins/my_plugin/index.js

# 4. Test
spiral test

# 5. Run
spiral run
```

### Minimal DSL Plugin in 10 Seconds

```
# plugins/hello/plugin.dsl

COMMAND hello "Say hello"
  RESPONSE_POOL
    Hello {user.name}!
    Hi {user.name}!
  END
END
```

(Don't forget `plugin.json` too!)