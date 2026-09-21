const { Telegraf, Scenes, session } = require('telegraf');

const ADMIN_ID = 7151823699;

const bot = new Telegraf(process.env.BOT_TOKEN);

const crashScene = new Scenes.WizardScene(
  'crash-report',
  (ctx) => {
    ctx.wizard.state.report = {};
    ctx.reply('💥 CRASH REPORT\n\n1️⃣ Wetin you dey do when e crash? (e.g. opening inventory, boss fight)');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.report.action = ctx.message.text;
    ctx.reply('2️⃣ Which device/OS? (e.g. Android 13, iPhone 14, PC Windows)');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.report.device = ctx.message.text;
    ctx.reply('3️⃣ E dey crash everytime? Send steps to reproduce am.');
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.report.steps = ctx.message.text;
    const r = ctx.wizard.state.report;
    const user = ctx.from;
    const reportMsg = `🚨 NEW CRASH REPORT 🚨\n👤 From: @${user.username || 'no username'} (${user.id})\n📱 Device: ${r.device}\n🎮 Action: ${r.action}\n📝 Steps: ${r.steps}\n🕒 Time: ${new Date().toLocaleString()}`;

    await ctx.reply('✅ Crash report received! Thanks 🙏\n\n' + reportMsg);
    try {
      await ctx.telegram.sendMessage(ADMIN_ID, reportMsg);
    } catch(e) {
      console.log('Admin send error:', e.message);
    }
    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage([crashScene]);
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => ctx.reply(`💥 Rimuru CRASH Bot ONLINE ✅\n\n/crash - Report crash step-by-step\n/report - Same as crash\n/ping - Check bot`));
bot.command('ping', (ctx) => ctx.reply('Pong! Crash bot active 🟢'));
bot.command('crash', (ctx) => ctx.scene.enter('crash-report'));
bot.command('report', (ctx) => ctx.scene.enter('crash-report'));
bot.hears(/\/report (.+)/, async (ctx) => {
  const text = ctx.match[1];
  const msg = `🚨 QUICK CRASH: ${text}\nFrom: @${ctx.from.username} (${ctx.from.id})`;
  await ctx.reply('✅ Quick crash logged: ' + text);
  try { await ctx.telegram.sendMessage(ADMIN_ID, msg); } catch(e){}
});

bot.launch().then(() => console.log('Crash bot started!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
