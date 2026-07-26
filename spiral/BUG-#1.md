# BUG-#1: Spiralcord Framework Issues

Three bugs found in the spiralcord framework (`node_modules/spiralcord/src/`) during Spinning Apple development.

---

## 1. MaxListenersExceededWarning

**File:** `node_modules/spiralcord/src/plugins/manager.js:16`

**Symptom:**
```
MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
11 interaction_received listeners added to [SpiralPluginManager].
MaxListeners is 10.
```

**Cause:** Constructor sets `this.maxListeners = 50` after `super()`, but the EventEmitter prototype setter may not apply correctly across all Node.js versions. The warning reports the default value of 10.

**Fix:** Change line 16 from:
```js
this.maxListeners = 50;
```
to:
```js
this.setMaxListeners(50);
```

`setMaxListeners()` is the canonical EventEmitter method and is guaranteed to work.

---

## 2. Unknown Intent "GuildMessageReactions"

**File:** `node_modules/spiralcord/src/runtime.js:139-145`

**Symptom:**
```
[runtime] Unknown intent "GuildMessageReactions", defaulting to Guilds
```

**Cause:** The `_resolveIntents()` method has a hardcoded intent name map that only includes 7 intents. `GuildMessageReactions` is not mapped.

**Current map (lines 139-145):**
```js
'Guilds': GatewayIntentBits.Guilds,
'GuildMessages': GatewayIntentBits.GuildMessages,
'MessageContent': GatewayIntentBits.MessageContent,
'GuildMembers': GatewayIntentBits.GuildMembers,
'GuildVoiceStates': GatewayIntentBits.GuildVoiceStates,
'DirectMessages': GatewayIntentBits.DirectMessages,
'GuildPresences': GatewayIntentBits.GuildPresences
```

**Fix:** Add missing intents to the map:
```js
'Guilds': GatewayIntentBits.Guilds,
'GuildMessages': GatewayIntentBits.GuildMessages,
'MessageContent': GatewayIntentBits.MessageContent,
'GuildMembers': GatewayIntentBits.GuildMembers,
'GuildVoiceStates': GatewayIntentBits.GuildVoiceStates,
'DirectMessages': GatewayIntentBits.DirectMessages,
'GuildPresences': GatewayIntentBits.GuildPresences,
'GuildMessageReactions': GatewayIntentBits.GuildMessageReactions,
'GuildEmojisAndStickers': GatewayIntentBits.GuildEmojisAndStickers,
'GuildIntegrations': GatewayIntentBits.GuildIntegrations,
'GuildWebhooks': GatewayIntentBits.GuildWebhooks,
'GuildInvites': GatewayIntentBits.GuildInvites,
'GuildScheduledEvents': GatewayIntentBits.GuildScheduledEvents,
'GuildModeration': GatewayIntentBits.GuildModeration
```

---

## 3. 405 Method Not Allowed on Slash Registration

**File:** `node_modules/spiralcord/src/runtime.js` (slash registration in `spinning_core/index.js:57-67`)

**Symptom:**
```
[spinning_core] Registering 192 commands globally...
[spinning_core] Slash registration error: 405: Method Not Allowed
```

**Cause:** Discord's global command bulk overwrite (`PUT /applications/{id}/commands`) has a limit of ~100 commands per request. The framework sends all 192 commands in a single PUT, which Discord rejects with 405.

**Fix:** Chunk the command body into batches of 100 before calling `rest.put()`. Example in `spinning_core/index.js`:

```js
const BATCH_SIZE = 100;
for (let i = 0; i < body.length; i += BATCH_SIZE) {
  const batch = body.slice(i, i + BATCH_SIZE);
  await rest.put(Routes.applicationCommands(clientId), { body: batch });
}
```

Or more efficiently, use `rest.put()` once for the first 100, then `rest.patch()` or individual `rest.post()`/`rest.delete()` for the remainder.
