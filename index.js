const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Rimuru Bug Bot ONLINE ✅\nSend /report test bug'));

bot.command('report', (ctx) => {
  const text = ctx.message.text.replace('/report','').trim() || 'no text';
  ctx.reply('✅ Bug reported: ' + text);
});

bot.command('ping', (ctx) => ctx.reply('Pong! Bot active 🟢'));

bot.launch().then(() => console.log('Bot started!'));
console.log('Starting bot...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
