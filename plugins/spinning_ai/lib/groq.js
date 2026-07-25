const { V2 } = require('../../spinning_core/lib/ui');
const emojis = require('../../../emojis.json');

const SYSTEM_PROMPT = `You are Spinning Apple, a helpful and intelligent AI assistant.

IDENTITY:
- Your name is Spinning Apple.
- You are NOT GPT, Claude, Gemini, Llama, or any other AI model.
- You are NOT made by OpenAI, Google, Meta, Anthropic, or any other company.
- If asked who made you, who you are, what model you are: You are Spinning Apple.

RESPONSE GUIDELINES:
- Respond like a normal friend would. Just reply naturally.
- Be helpful, knowledgeable, and provide accurate information.
- Give direct, clear answers without unnecessary filler.
- Adapt your tone to match the conversation.

DISCORD-SPECIFIC RULES:
- NEVER output @everyone, @here, or any Discord mentions.
- If asked to ping, mention, or tag anyone, politely decline.
- Format responses nicely using markdown when appropriate.`;

const conversations = new Map();
const cooldowns = new Map();
let keyIndex = 0;

function getConfig(runtime) {
  return runtime.getPluginConfig('spinning_ai');
}

function getApiKey(runtime) {
  const keys = [];
  const single = runtime.config?.groq_api_key;
  if (single) keys.push(single);
  if (runtime.config?.groq_api_keys) keys.push(...runtime.config.groq_api_keys);
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GROQ_API_KEY_${i}`] || runtime.config?.[`groq_api_key_${i}`];
    if (k) keys.push(k);
  }
  if (keys.length === 0) return null;
  const key = keys[keyIndex % keys.length];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

function getHistory(userId) {
  return conversations.get(userId) || [];
}

function addToHistory(userId, role, content) {
  const history = getHistory(userId);
  history.push({ role, content });
  const maxHistory = 20;
  if (history.length > maxHistory) history.splice(0, history.length - maxHistory);
  conversations.set(userId, history);
}

async function groqRequest(messages, model, apiKey) {
  const axios = require('axios');
  const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model,
    messages,
    max_tokens: 2048,
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
  return res.data.choices[0].message.content;
}

const aiSlashCmds = [
  {
    name: 'ai',
    description: 'AI commands',
    options: [
      { type: 'string', name: 'action', description: 'ask, enable, disable, or clear', required: true },
      { type: 'string', name: 'question', description: 'Your question (for ask)', required: false }
    ],
    async execute(interaction, runtime) {
      const action = interaction.options.getString('action');
      const question = interaction.options.getString('question');
      const config = getConfig(runtime);

      if (action === 'enable') {
        if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
          return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
        }
        if (!config.ai_channels) config.ai_channels = [];
        if (!config.ai_channels.includes(interaction.channelId)) {
          config.ai_channels.push(interaction.channelId);
        }
        await V2.reply(interaction, V2.success(`AI enabled in <#${interaction.channelId}>.`), true);
      }

      else if (action === 'disable') {
        if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
          return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
        }
        if (config.ai_channels) {
          config.ai_channels = config.ai_channels.filter(id => id !== interaction.channelId);
        }
        await V2.reply(interaction, V2.success(`AI disabled in <#${interaction.channelId}>.`), true);
      }

      else if (action === 'clear') {
        conversations.delete(interaction.user.id);
        await V2.reply(interaction, V2.success('Conversation history cleared.'), true);
      }

      else if (action === 'ask') {
        if (!question) return V2.reply(interaction, V2.error('Provide a question.'), true);
        if (!config.ai_enabled) return V2.reply(interaction, V2.error('AI is disabled.'), true);

        const apiKey = getApiKey(runtime);
        if (!apiKey) return V2.reply(interaction, V2.error('AI not configured. Set groq_api_key in spiral.json.'), true);

        const now = Date.now();
        const lastUse = cooldowns.get(interaction.user.id) || 0;
        const cooldown = (config.ai_cooldown || 5) * 1000;
        if (now - lastUse < cooldown) {
          const remaining = Math.ceil((cooldown - (now - lastUse)) / 1000);
          return V2.reply(interaction, V2.error(`Wait ${remaining}s before asking again.`), true);
        }
        cooldowns.set(interaction.user.id, now);

        await interaction.deferReply();

        addToHistory(interaction.user.id, 'user', question);

        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...getHistory(interaction.user.id)
        ];

        try {
          const reply = await groqRequest(messages, config.ai_model || 'llama-3.3-70b-versatile', apiKey);
          addToHistory(interaction.user.id, 'assistant', reply);

          const container = V2.container(V2.config.brand_color, [
            V2.text(`${emojis.cat_ai} **AI Response**`),
            V2.separator(),
            V2.text(reply.slice(0, 2000))
          ]);

          await interaction.editReply({ components: [container], flags: V2.FLAG });
        } catch (e) {
          console.error('[spinning_ai] Groq error:', e.message);
          await interaction.editReply({ components: [V2.error(`AI error: ${e.message}`)], flags: V2.FLAG });
        }
      }
    }
  }
];

module.exports = { aiSlashCmds, groqRequest, getApiKey, getHistory, addToHistory, SYSTEM_PROMPT };
