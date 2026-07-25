const { V2 } = require('../../spinning_core/lib/ui');
const emojis = require('../../../emojis.json');

const EIGHT_BALL_ANSWERS = [
  'It is certain.', 'It is decidedly so.', 'Without a doubt.',
  'Yes definitely.', 'You may rely on it.', 'As I see it, yes.',
  'Most likely.', 'Outlook good.', 'Yes.',
  'Signs point to yes.', 'Reply hazy, try again.', 'Ask again later.',
  'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
  'Don\'t count on it.', 'My reply is no.', 'My sources say no.',
  'Outlook not so good.', 'Very doubtful.'
];

const JOKES = [
  { setup: 'Why don\'t scientists trust atoms?', punchline: 'Because they make up everything!' },
  { setup: 'Why did the scarecrow win an award?', punchline: 'He was outstanding in his field!' },
  { setup: 'What do you call a fake noodle?', punchline: 'An impasta!' },
  { setup: 'Why couldn\'t the bicycle stand up by itself?', punchline: 'It was two tired!' },
  { setup: 'What do you call a bear with no teeth?', punchline: 'A gummy bear!' },
  { setup: 'Why don\'t eggs tell jokes?', punchline: 'They\'d crack each other up!' },
  { setup: 'What do you call a dog that does magic?', punchline: 'A Labracadabrador!' },
  { setup: 'Why did the math book look so sad?', punchline: 'Because it had too many problems.' },
  { setup: 'What did the ocean say to the beach?', punchline: 'Nothing, it just waved.' },
  { setup: 'Why can\'t you give Elsa a balloon?', punchline: 'Because she will let it go.' }
];

const FACTS = [
  'A group of flamingos is called a "flamboyance."',
  'Octopuses have three hearts.',
  'Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.',
  'A day on Venus is longer than a year on Venus.',
  'Bananas are berries, but strawberries aren\'t.',
  'The Eiffel Tower can grow up to 6 inches taller during summer due to heat expansion.',
  'A jiffy is an actual unit of time: 1/100th of a second.',
  'The inventor of the Pringles can is buried in one.',
  'Cows have best friends and get stressed when separated.',
  'Wombat poop is cube-shaped.'
];

async function fetchWithFallback(url, transform) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return transform(data);
  } catch {
    return null;
  }
}

const funSlashCmds = [
  {
    name: '8ball',
    description: 'Ask the magic 8-ball',
    options: [{ type: 'string', name: 'question', description: 'Your question', required: true }],
    async execute(interaction) {
      const question = interaction.options.getString('question');
      const answer = EIGHT_BALL_ANSWERS[Math.floor(Math.random() * EIGHT_BALL_ANSWERS.length)];
      const container = V2.container(V2.config.brand_color, [
        V2.text(`${emojis.question} **Magic 8-Ball**`),
        V2.separator(),
        V2.text(`**Q:** ${question}`),
        V2.text(`**A:** ${answer}`)
      ]);
      await V2.reply(interaction, container);
    }
  },
  {
    name: 'coinflip',
    description: 'Flip a coin',
    options: [],
    async execute(interaction) {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
      const container = V2.container(V2.config.brand_color, [
        V2.text(`${emojis.coin || '🪙'} **Coin Flip**`),
        V2.separator(),
        V2.text(`**${result}!**`)
      ]);
      await V2.reply(interaction, container);
    }
  },
  {
    name: 'roll',
    description: 'Roll dice (e.g. 2d6)',
    options: [{ type: 'string', name: 'dice', description: 'Dice notation (e.g. 2d6, d20)', required: false }],
    async execute(interaction) {
      const dice = interaction.options.getString('dice') || '1d6';
      const match = dice.match(/^(\d*)d(\d+)$/i);
      if (!match) {
        return V2.reply(interaction, V2.error('Invalid dice format. Use NdN (e.g. 2d6, d20)'), true);
      }
      const count = parseInt(match[1]) || 1;
      const sides = parseInt(match[2]);
      if (count > 25 || sides > 1000) {
        return V2.reply(interaction, V2.error('Max 25 dice, max 1000 sides.'), true);
      }
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const total = rolls.reduce((a, b) => a + b, 0);
      const container = V2.container(V2.config.brand_color, [
        V2.text(`${emojis.dice || '🎲'} **Dice Roll**`),
        V2.separator(),
        V2.text(`**${dice}:** ${rolls.join(', ')}`),
        V2.text(`**Total:** ${total}`)
      ]);
      await V2.reply(interaction, container);
    }
  },
  {
    name: 'meme',
    description: 'Get a random meme',
    options: [],
    async execute(interaction) {
      await interaction.deferReply();
      const data = await fetchWithFallback(
        'https://meme-api.com/gimme',
        d => ({ title: d.title, url: d.url })
      );
      if (!data) {
        return interaction.editReply({ components: [V2.error('Could not fetch a meme.')], flags: V2.FLAG });
      }
      const container = V2.container(V2.config.brand_color, [
        V2.text(`${emojis.fun} **${data.title}**`),
        V2.mediaGallery(data.url)
      ]);
      await interaction.editReply({ components: [container], flags: V2.FLAG });
    }
  },
  {
    name: 'joke',
    description: 'Get a random joke',
    options: [],
    async execute(interaction) {
      await interaction.deferReply();
      let joke = await fetchWithFallback(
        'https://official-joke-api.appspot.com/random_joke',
        d => ({ setup: d.setup, punchline: d.punchline })
      );
      if (!joke) {
        joke = JOKES[Math.floor(Math.random() * JOKES.length)];
      }
      const container = V2.container(V2.config.brand_color, [
        V2.text(`${emojis.laugh || '🤣'} **Joke**`),
        V2.separator(),
        V2.text(joke.setup),
        V2.text(`||${joke.punchline}||`)
      ]);
      await interaction.editReply({ components: [container], flags: V2.FLAG });
    }
  },
  {
    name: 'fact',
    description: 'Get a random fact',
    options: [],
    async execute(interaction) {
      await interaction.deferReply();
      let fact = await fetchWithFallback(
        'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en',
        d => d.text
      );
      if (!fact) {
        fact = FACTS[Math.floor(Math.random() * FACTS.length)];
      }
      const container = V2.container(V2.config.brand_color, [
        V2.text(`${emojis.info} **Did You Know?**`),
        V2.separator(),
        V2.text(fact)
      ]);
      await interaction.editReply({ components: [container], flags: V2.FLAG });
    }
  }
];

module.exports = { funSlashCmds };
