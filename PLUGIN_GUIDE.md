# Spiralcord Plugin Development Guide

## Plugin Structure

```
plugins/
  my_plugin/
    plugin.json          # Required - manifest
    index.js             # JavaScript plugin (OR)
    plugin.dsl           # DSL plugin (no code needed)
    config.json          # Optional - user settings
    config.schema.json   # Optional - schema for config
```

## plugin.json (Required)

```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "description": "Does something cool",
  "author": "yourname",
  "dependencies": {}
}
```

## JavaScript Plugin (index.js)

```js
module.exports = {
  // Called when plugin loads
  async init(config, runtime) {
    console.log('Plugin loaded!');
  },

  // Text commands (!command)
  commands: {
    hello: {
      description: 'Say hello',
      execute: async (message, args, runtime) => {
        await message.reply('Hello!');
      }
    }
  },

  // Trigger words (no prefix)
  keywords: {
    lol: async (message, args, runtime) => {
      await message.reply('What\'s funny?');
    }
  },

  // Event hooks
  hooks: {
    message_received: async (payload, runtime) => {
      // payload.message, payload.user, payload.guild
    },
    bot_ready: async (payload, runtime) => {
      // payload.client, payload.config
    },
    interaction_received: async (payload, runtime) => {
      // payload.interaction (buttons, select menus, modals)
    },
    presence_update: async (payload, runtime) => {},
    voice_state_update: async (payload, runtime) => {},
    reaction_add: async (payload, runtime) => {},
    reaction_remove: async (payload, runtime) => {},
    guild_joined: async (payload, runtime) => {},
    guild_left: async (payload, runtime) => {}
  },

  // REPL commands for interactive console
  repl: {
    mycmd: {
      description: 'My REPL command',
      execute: async (args, context) => {
        // context.runtime, context.client, context.db
        // context.manager, context.config, context.user
        return 'Hello from REPL!';
      }
    }
  },

  // API exposed to other plugins
  api: {
    getData: () => { return { key: 'value' }; }
  }
};
```

## DSL Plugin (plugin.dsl)

No JavaScript needed. For simple response commands:

```
# Comments start with #

COMMAND hello "Say hello"
  ALIASES hi, hey
  COOLDOWN 3
  REQUIRES_ARGS "Usage: !hello <name>"
  REQUIRES_PERMISSION MANAGE_MESSAGES
  RESPONSE_POOL
    Hello {user.name}!
    Hey there {user.name}!
    Hi {user.name}, what's up?
  END
END

COMMAND embed "Show an embed"
  EMBED "#00FF00"
  TITLE "Cool Title"
  DESCRIPTION "This is an embed!"
END
```

### DSL Keywords

| Keyword | Example | Description |
|---------|---------|-------------|
| `COMMAND` | `COMMAND name "description"` | Create a command |
| `SLASH_COMMAND` | `SLASH_COMMAND name "description"` | Create a slash command |
| `ALIASES` | `ALIASES hi, hey` | Alternative names |
| `COOLDOWN` | `COOLDOWN 5` | Seconds between uses |
| `REQUIRES_ARGS` | `REQUIRES_ARGS "msg"` | Error if no args |
| `REQUIRES_PERMISSION` | `REQUIRES_PERMISSION BAN_MEMBERS` | Needs Discord permission |
| `RESPONSE` | `RESPONSE "text"` | Fixed response |
| `RESPONSE_POOL` | Pool of random responses |
| `EMBED` | `EMBED "#FF0000"` | Send colored embed |
| `TITLE` | `TITLE "text"` | Embed title |
| `DESCRIPTION` | `DESCRIPTION "text"` | Embed description |
| `BUTTON` | `BUTTON "label" STYLE Success ACTION command` | Add button |
| `SELECT` | `SELECT "placeholder" OPTION "label" VALUE "val"` | Add select menu |
| `DB_SET` | `DB_SET key value` | Set database value |
| `DB_GET` | `DB_GET key` | Get database value |
| `DB_ADD` | `DB_ADD key 10` | Add to number |
| `DB_DELETE` | `DB_DELETE key` | Delete key |
| `DB_RESPONSE` | `DB_RESPONSE "key"` | Use DB value in response |
| `END` | `END` | Close block |

### DSL Variables

| Variable | Replaced With |
|----------|---------------|
| `{user.id}` | User's Discord ID |
| `{user.name}` | User's username |
| `{channel.id}` | Channel ID |
| `{guild.id}` | Server ID |
| `{guild.name}` | Server name |
| `{args}` | Command arguments |
| `{db_value}` | Last DB_GET or DB_ADD result |
| `{db_response}` | DB_RESPONSE value |

## Config System

### config.schema.json

```json
{
  "type": "object",
  "properties": {
    "greeting": {
      "type": "string",
      "default": "Hello!",
      "description": "Greeting message"
    },
    "max_users": {
      "type": "number",
      "default": 10
    }
  }
}
```

### config.json

```json
{
  "greeting": "Welcome!",
  "max_users": 5
}
```

Access in code: `config.greeting` (user values override defaults)

## Discord.js Access

Plugins have full access to discord.js:

```js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

// In a command:
const embed = new EmbedBuilder()
  .setColor('#00FF00')
  .setTitle('Title')
  .setDescription('Description');

await message.reply({ embeds: [embed] });
```

## Runtime API

Available in commands/hooks as `runtime`:

```js
runtime.client          // Discord.js client
runtime.config          // spiral.json config
runtime.db              // Built-in JSON database
runtime.pluginManager   // Plugin manager instance
runtime.getPluginConfig('plugin_name')  // Get another plugin's config
runtime.getPluginAPI('plugin_name')     // Get another plugin's API
runtime.getAllCommands()                 // List all commands
runtime.emitHook('event', payload)      // Emit custom hook
```

## REPL Commands

Plugins can register commands for the interactive REPL (`spiral run -R`):

```js
module.exports = {
  repl: {
    greet: {
      description: 'Say hello',
      execute: async (args, context) => {
        // context.runtime    - SpiralRuntime instance
        // context.client     - Discord.js client
        // context.db         - Built-in database
        // context.manager    - Plugin manager
        // context.config     - spiral.json config
        // context.user       - Bot's user object
        return `Hello ${context.user.username}!`;
      }
    }
  }
};
```

Then in the REPL: `spiral> .greet`

## Testing

```bash
spiral test
```

Checks: syntax errors, command conflicts, missing files, config issues.

## Installing Plugins

```bash
spm install <source>         # Install from GitHub
spm list                     # List installed
spm enable <name>            # Enable plugin
spm disable <name>           # Disable plugin
spm create <name>            # Create new plugin
spm test <name>              # Test a plugin
spm remove <name>            # Remove a plugin
spm info <name>              # Show plugin info
spm update                   # Update all plugins
```

## Hook Events

| Hook | When | Payload |
|------|------|---------|
| `bot_ready` | Bot logs in | `client, user, config` |
| `message_received` | Message sent | `message, user, guild, channel` |
| `interaction_received` | Button/modal/etc | `interaction, user, guild, channel` |
| `presence_update` | Status change | `oldPresence, newPresence, user, guild` |
| `voice_state_update` | Voice join/leave | `oldState, newState, user, guild` |
| `reaction_add` | Reaction added | `reaction, user, message` |
| `reaction_remove` | Reaction removed | `reaction, user, message` |
| `guild_joined` | Bot joins server | `guild` |
| `guild_left` | Bot leaves server | `guild` |
| `bot_shutdown` | Bot stopping | `client` |

## Collision Policy

If two plugins register the same command name:

```json
{
  "collision_policy": "error"      // refuse to load
  "collision_policy": "first-wins" // first plugin keeps command
  "collision_policy": "last-wins"  // newest plugin overrides
}
```

Priority system: higher `priority` number wins (default: 0).

## Quick Start

1. Create folder: `plugins/my_plugin/`
2. Create `plugin.json` with name, version, description
3. Create `index.js` with commands/hooks
4. Run `spiral test` to check for errors
5. Run `spiral run` to start bot