const { V2 } = require('../../spinning_core/lib/ui');
const { MessageFlags } = require('discord.js');
const axios = require('axios');

const funSlashCmds = [
  {
    name: 'meme',
    description: 'Send a meme from Reddit',
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const res = await fetch('https://meme-api.com/gimme');
        const data = await res.json();

        if (!data || !data.url) {
          const container = V2.container(0x2B2D31, [
            V2.text('### No Memes Found'),
            V2.separator(),
            V2.text("Couldn't fetch a meme right now. Your life is the meme!")
          ]);
          return await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        const container = V2.container(0x2B2D31, [
          V2.text('### Reddit Meme'),
          V2.text(`**${data.title}**\nby u/${data.author} in r/${data.subreddit}`),
          V2.mediaGallery(data.url),
          V2.text(`${data.ups || 0} upvotes`)
        ]);

        return await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (error) {
        const container = V2.container(0x2B2D31, [
          V2.text('### Meme API Error'),
          V2.separator(),
          V2.text('Failed to fetch a meme. Please try again later.')
        ]);
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }
  },
  {
    name: 'joke',
    description: 'Send a random joke',
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const res = await fetch('https://v2.jokeapi.dev/joke/Any?safe-mode');
        const data = await res.json();

        let jokeText;
        if (data.type === 'single') {
          jokeText = data.joke;
        } else {
          jokeText = `${data.setup}\n\n||${data.delivery}||`;
        }

        const container = V2.container(0x2B2D31, [
          V2.text('### Random Joke'),
          V2.separator(),
          V2.text(jokeText)
        ]);

        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (error) {
        const container = V2.container(0x2B2D31, [
          V2.text('### Joke API Error'),
          V2.separator(),
          V2.text('Failed to fetch a joke. Please try again later.')
        ]);
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }
  },
  {
    name: 'fact',
    description: 'Send a random fun fact',
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
        const data = await res.json();

        const container = V2.container(0x2B2D31, [
          V2.text('### Fun Fact'),
          V2.separator(),
          V2.text(data.text || 'No fact available.')
        ]);

        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (error) {
        const container = V2.container(0x2B2D31, [
          V2.text('### Fact API Error'),
          V2.separator(),
          V2.text('Failed to fetch a fact. Please try again later.')
        ]);
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }
  },
  {
    name: '8ball',
    description: 'Ask the magic 8-ball a question',
    options: [{ type: 'string', name: 'question', description: 'Your question', required: true }],
    async execute(interaction) {
      const question = interaction.options.getString('question');
      const responses = [
        'It is certain.', 'It is decidedly so.', 'Without a doubt.',
        'Yes - definitely.', 'You may rely on it.', 'As I see it, yes.',
        'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
        'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
        'Cannot predict now.', 'Concentrate and ask again.',
        'Don\'t count on it.', 'My reply is no.', 'My sources say no.',
        'Outlook not so good.', 'Very doubtful.'
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];

      const container = V2.container(0x2B2D31, [
        V2.text('### Magic 8-Ball'),
        V2.separator(),
        V2.text(`**Question:** ${question}`),
        V2.text(`**Answer:** ${response}`)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'coinflip',
    description: 'Flip a coin',
    async execute(interaction) {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

      const container = V2.container(0x2B2D31, [
        V2.text('### Coin Flip'),
        V2.separator(),
        V2.text(`The coin landed on **${result}**!`)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'roll',
    description: 'Roll a dice',
    options: [{ type: 'integer', name: 'sides', description: 'Number of sides (default 6)', required: false, min_value: 2, max_value: 100 }],
    async execute(interaction) {
      const sides = interaction.options.getInteger('sides') || 6;
      const result = Math.floor(Math.random() * sides) + 1;

      const container = V2.container(0x2B2D31, [
        V2.text('### Dice Roll'),
        V2.separator(),
        V2.text(`You rolled a **${result}** (1-${sides})!`)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'dare',
    description: 'Get a random dare challenge',
    async execute(interaction) {
      try {
        const response = await fetch('https://api.truthordarebot.xyz/v1/dare?rating=pg13');
        const data = await response.json();

        const container = V2.container(0x2B2D31, [
          V2.text('### Dare Challenge'),
          V2.separator(),
          V2.text(data.question)
        ]);

        await V2.reply(interaction, container);
      } catch (error) {
        await V2.reply(interaction, V2.error('Could not retrieve a dare. Please try again later.'), true);
      }
    }
  },
  {
    name: 'truth',
    description: 'Get a random truth question',
    async execute(interaction) {
      try {
        const response = await fetch('https://api.truthordarebot.xyz/v1/truth?rating=pg13');
        const data = await response.json();

        const container = V2.container(0x2B2D31, [
          V2.text('### Truth Challenge'),
          V2.separator(),
          V2.text(data.question)
        ]);

        await V2.reply(interaction, container);
      } catch (error) {
        await V2.reply(interaction, V2.error('Could not retrieve a truth question. Please try again later.'), true);
      }
    }
  },
  {
    name: 'pickup',
    description: 'Get a random pickup line',
    async execute(interaction) {
      const pickup = [
        "Hey baby are you allergic to dairy cause I **laktose** clothes you're wearing",
        "I'm not a photographer, but I can **picture** me and you together.",
        "I seem to have lost my phone number. Can I have yours?",
        "Hey babe are you a cat? Because I'm **feline** a connection between us.",
        "Are you French? Because **Eiffel** for you.",
        "Baby, life without you is like a broken pencil... **pointless**.",
        "If I could rearrange the alphabet, I would put **U** and **I** together.",
        "Is your name Google? Because you're everything I'm searching for.",
        "Are you from Starbucks? Because I like you a **latte**.",
        "Are you a banana? Because I find you **a peeling**.",
        "Are you a teapot? Because I like your **steamed** drink.",
        "Babe did it hurt when you fell from heaven?",
        "Is your name Wi-Fi? Because I'm feeling a connection.",
        "Are you Australian? Because you meet all of my **koala**fications.",
        "If I were a cat I'd spend all 9 lives with you.",
        "My love for you is like dividing by 0. It's undefinable.",
        "Take away gravity, I'll still fall for you.",
        "Are you a criminal? Because you just stole my heart.",
        "Hey babe I'm here. What were your other two wishes?"
      ];

      const randomPickup = pickup[Math.floor(Math.random() * pickup.length)];

      const container = V2.container(0x2B2D31, [
        V2.text('### Pickup Line'),
        V2.separator(),
        V2.text(randomPickup)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'nitro',
    description: 'Generate a fake nitro gift link',
    async execute(interaction) {
      const container = V2.container(0x2B2D31, [
        V2.text('### Free Nitro Gift'),
        V2.separator(),
        V2.text("Here's your free nitro gift!\n\nhttps://discord.gift/pnQQ9KxKuMqT2KNxHuKANhvc")
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'token',
    description: 'Generate a fake discord token',
    options: [{ type: 'user', name: 'user', description: 'The user (defaults to yourself)', required: false }],
    async execute(interaction) {
      const list = [
        'A','B','C','D','E','F','G','H','I','J','K','L','M','N',
        'O','P','Q','R','S','T','U','V','W','X','Y','Z','_',
        'a','b','c','d','e','f','g','h','i','j','k','l','m','n',
        'o','p','q','r','s','t','u','v','w','x','y','z','0',
        '1','2','3','4','5','6','7','8','9'
      ];

      let token = '';
      for (let i = 0; i < 59; i++) {
        token += list[Math.floor(Math.random() * list.length)];
      }

      const user = interaction.options.getUser('user') || interaction.user;

      const container = V2.container(0x2B2D31, [
        V2.text('### Fake Token Generator'),
        V2.separator(),
        V2.text(`**${user.username}'s Token**`),
        V2.text(`\`\`\`\n${token}\`\`\``)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'texttoemoji',
    description: 'Convert text to emojis',
    options: [{ type: 'string', name: 'text', description: 'The text to convert', required: true }],
    async execute(interaction) {
      const text = interaction.options.getString('text');
      const emojiMap = {
        'a':'🇦','b':'🇧','c':'🇨','d':'🇩','e':'🇪','f':'🇫',
        'g':'🇬','h':'🇭','i':'🇮','j':'🇯','k':'🇰','l':'🇱',
        'm':'🇲','n':'🇳','o':'🇴','p':'🇵','q':'🇶','r':'🇷',
        's':'🇸','t':'🇹','u':'🇺','v':'🇻','w':'🇼','x':'🇽',
        'y':'🇾','z':'🇿','0':'0️⃣','1':'1️⃣','2':'2️⃣','3':'3️⃣',
        '4':'4️⃣','5':'5️⃣','6':'6️⃣','7':'7️⃣','8':'8️⃣','9':'9️⃣',
        '!':'❗','?':'❓',' ':'  '
      };
      const emojified = text.toLowerCase().split('').map(char => emojiMap[char] || char).join(' ');

      const container = V2.container(0x2B2D31, [
        V2.text('### Text to Emoji'),
        V2.separator(),
        V2.text(`**Original:** ${text}`),
        V2.text(`**Result:**\n${emojified}`)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'rickroll',
    description: 'Detect if a URL is a rickroll',
    options: [{ type: 'string', name: 'url', description: 'The URL to check', required: true }],
    async execute(interaction) {
      const url = interaction.options.getString('url');

      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(url)) {
        return V2.reply(interaction, V2.error('The provided URL format is invalid!'), true);
      }

      await interaction.deferReply();

      try {
        const response = await axios.get(url, {
          maxRedirects: 5,
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const phrases = ['rickroll', 'rick roll', 'rick astley', 'never gonna give you up'];
        const source = response.data.toLowerCase();
        const rickRoll = phrases.some(phrase => source.includes(phrase));

        const container = V2.container(0x2B2D31, [
          V2.text('### Rick Roll Detector'),
          V2.separator(),
          V2.text(`**URL:** ${url}`),
          V2.text(`**Status:** ${rickRoll ? 'Rick Roll DETECTED!' : 'Safe - No Rick Roll found'}`),
          V2.text(rickRoll ? 'You were about to get Rick Rolled!' : 'This URL appears to be Rick Roll free!')
        ]);

        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (error) {
        const container = V2.container(0x2B2D31, [
          V2.text('### URL Check Failed'),
          V2.separator(),
          V2.text('Failed to check the URL. It might be invalid, unreachable, or protected.')
        ]);
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }
  },
  {
    name: 'rizz',
    description: 'Get a random rizz line',
    options: [{ type: 'user', name: 'user', description: 'The user to rizz up', required: false }],
    async execute(interaction) {
      const target = interaction.options.getUser('user') || interaction.user;
      await interaction.deferReply();

      let rizzLine;
      try {
        const response = await axios.get('https://rizz-api.vercel.app/api/random');
        rizzLine = response.data.text || response.data.line;
      } catch (error) {
        const fallbackRizz = [
          'Are you a magician? Because whenever I look at you, everyone else disappears.',
          'Do you have a map? I just keep getting lost in your eyes.',
          'Are you a Wi-Fi router? Because I\'m feeling a strong connection.',
          'If you were a vegetable, you\'d be a \'cute-cumber\'.'
        ];
        rizzLine = fallbackRizz[Math.floor(Math.random() * fallbackRizz.length)];
      }

      const container = V2.container(0x2B2D31, [
        V2.text('### Rizz Logic'),
        V2.separator(),
        V2.text(`${target.id === interaction.user.id ? '' : `Hey ${target}, `}${rizzLine}`)
      ]);

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  },
  {
    name: 'wizz',
    description: 'Fake server destruction command',
    async execute(interaction) {
      await interaction.reply({ components: [V2.container(0x2B2D31, [
        V2.text('### Starting Wizz Process'),
        V2.separator(),
        V2.text(`Wizzing ${interaction.guild.name}, will take 22 seconds to complete...`)
      ])], flags: MessageFlags.IsComponentsV2 });

      const steps = [
        'Changing all guild settings...',
        `Deleting **${interaction.guild.roles.cache.size}** Roles...`,
        `Deleting **${interaction.guild.channels.cache.size}** Channels...`,
        'Deleting Webhooks...',
        'Deleting emojis...',
        'Installing Ban Wave...'
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await interaction.editReply({ components: [V2.container(0x2B2D31, [
          V2.text('### Wizz Progress'),
          V2.separator(),
          V2.text(step)
        ])], flags: MessageFlags.IsComponentsV2 });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      await interaction.editReply({ components: [V2.container(0x2B2D31, [
        V2.text('### Wizz Complete'),
        V2.separator(),
        V2.text(`Successfully wizzed **${interaction.guild.name}**! Just kidding, this is a joke command. Your server is safe.`)
      ])], flags: MessageFlags.IsComponentsV2 });
    }
  },
  {
    name: 'howgay',
    description: 'Check how gay someone is',
    options: [{ type: 'user', name: 'user', description: 'The user to check', required: true }],
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const gayrate = Math.floor(Math.random() * 101);

      let reaction;
      if (gayrate === 0) reaction = 'Completely straight';
      else if (gayrate <= 20) reaction = 'Barely any rainbow vibes';
      else if (gayrate <= 40) reaction = 'A little fruity...';
      else if (gayrate <= 60) reaction = 'Definitely questioning';
      else if (gayrate <= 80) reaction = 'Rainbow flag unlocked';
      else if (gayrate < 100) reaction = 'Pride parade organizer';
      else reaction = 'Maximum gay achieved!';

      const container = V2.container(0x2B2D31, [
        V2.text('### Gay Rate Checker'),
        V2.separator(),
        V2.text(`**${user} is ${gayrate}% gay!**\n\n*${reaction}*`)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'howdumb',
    description: 'Check someone\'s dumb rate',
    options: [{ type: 'user', name: 'user', description: 'The user to check', required: true }],
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const dumbrate = Math.floor(Math.random() * 101);

      let reaction;
      if (dumbrate === 0) reaction = 'Genius level IQ detected!';
      else if (dumbrate <= 20) reaction = 'Pretty smart actually...';
      else if (dumbrate <= 40) reaction = 'Average brain capacity';
      else if (dumbrate <= 60) reaction = 'Hmmm... questionable decisions';
      else if (dumbrate <= 80) reaction = 'Brain cells leaving the chat';
      else if (dumbrate < 100) reaction = 'How do you remember to breathe?';
      else reaction = 'Certified smooth brain moment';

      const container = V2.container(0x2B2D31, [
        V2.text('### Dumb Rate Checker'),
        V2.separator(),
        V2.text(`**${user} is ${dumbrate}% dumb!**\n\n*${reaction}*`)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'simprate',
    description: 'Check how much of a simp someone is',
    options: [{ type: 'user', name: 'user', description: 'The user to check (defaults to yourself)', required: false }],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const rate = Math.floor(Math.random() * 101);

      let reaction;
      if (rate === 0) reaction = 'Completely immune to simping';
      else if (rate <= 20) reaction = 'Strong and independent';
      else if (rate <= 40) reaction = 'Only simps a little bit...';
      else if (rate <= 60) reaction = 'Down bad occasionally';
      else if (rate <= 80) reaction = 'Would donate their life savings';
      else if (rate < 100) reaction = 'Professional simp certified';
      else reaction = 'Ultimate simp lord detected';

      const container = V2.container(0x2B2D31, [
        V2.text('### Simp Rate Checker'),
        V2.separator(),
        V2.text(`**${targetUser.username} is ${rate}% simp!**\n\n*${reaction}*`)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'hack',
    description: 'Pretend to hack someone\'s discord account (for fun)',
    options: [{ type: 'user', name: 'user', description: 'The user to "hack"', required: true }],
    async execute(interaction) {
      const lawda = ['8','3821','23','21','313','43','29','76','11','9','44','470','318','26','69'];
      const user = interaction.options.getUser('user');

      await interaction.reply({ components: [V2.container(0x2B2D31, [
        V2.text('### Hacking In Progress'),
        V2.separator(),
        V2.text('Connecting to Discord servers...\nBypassing security...\nExtracting user data...')
      ])], flags: MessageFlags.IsComponentsV2 });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const randomPass = lawda[Math.floor(Math.random() * lawda.length)];
      const randomPass2 = Math.random().toString(36).substring(2, 5);
      const cleanUsername = user.username.replace(/[^a-zA-Z0-9]/g, '');

      const container = V2.container(0x2B2D31, [
        V2.text('### Hack Complete'),
        V2.separator(),
        V2.text(`**"Extracted" Data**`),
        V2.text(`**User:** ${user}\n**E-Mail:** ${cleanUsername}${randomPass}@gmail.com\n**Password:** ${user.username}@${randomPass2}`)
      ]);

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  },
  {
    name: 'ship',
    description: 'Ship two users together and see their compatibility!',
    options: [
      { type: 'user', name: 'user1', description: 'The first user to ship', required: true },
      { type: 'user', name: 'user2', description: 'The second user (defaults to yourself)', required: false }
    ],
    async execute(interaction) {
      const user1 = interaction.options.getUser('user1');
      const user2 = interaction.options.getUser('user2') || interaction.user;

      const compatibility = Math.floor(Math.random() * 101);
      const heartCount = Math.ceil(compatibility / 20);
      const hearts = '❤️'.repeat(heartCount) + '🖤'.repeat(5 - heartCount);

      let comment;
      if (compatibility === 100) comment = 'Perfect match! Made in heaven!';
      else if (compatibility >= 80) comment = 'Soulmates detected!';
      else if (compatibility >= 60) comment = 'There\'s definitely something there!';
      else if (compatibility >= 40) comment = 'Could work... with effort.';
      else if (compatibility >= 20) comment = 'Not the best match...';
      else comment = 'Better as friends.';

      const container = V2.container(0xff69b4, [
        V2.text('### Ship'),
        V2.separator(),
        V2.text(`**${user1.displayName}** + **${user2.displayName}**`),
        V2.text(`\n${hearts}\n\n**${compatibility}%** Compatibility\n\n*${comment}*`)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'fakemessage',
    description: 'Generate a fake Discord message card',
    options: [
      { type: 'user', name: 'user', description: 'The user to impersonate in the message', required: true },
      { type: 'string', name: 'message', description: 'The message content', required: true, max_length: 500 },
      { type: 'string', name: 'timestamp', description: 'Custom timestamp (e.g., 12:43 AM)', required: false, max_length: 20 },
      { type: 'boolean', name: 'app', description: 'Show APP badge', required: false },
      { type: 'boolean', name: 'verified', description: 'Show verified badge', required: false }
    ],
    async execute(interaction) {
      const userOption = interaction.options.getUser('user');
      const message = interaction.options.getString('message');
      const timestamp = interaction.options.getString('timestamp') || null;
      const bot = interaction.options.getBoolean('app') || false;
      const verified = interaction.options.getBoolean('verified') || false;

      const user = await interaction.client.users.fetch(userOption.id, { force: true });
      const timestampText = timestamp || new Date().toLocaleString();

      let badges = '';
      if (bot) badges += ' [APP]';
      if (verified) badges += ' ✓';

      const container = V2.container(0x2B2D31, [
        V2.text(`### Fake Message${badges}`),
        V2.separator(),
        V2.text(`**${user.displayName || user.username}** — ${timestampText}`),
        V2.text(message)
      ]);

      await V2.reply(interaction, container);
    }
  }
];

module.exports = { funSlashCmds };
