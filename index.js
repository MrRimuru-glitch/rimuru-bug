const { Telegraf, Scenes, session } = require('telegraf');
const ADMIN_ID = 7151823699;
const bot = new Telegraf(process.env.BOT_TOKEN);

function getAutoFix(action, device) {
  const text = (action + " " + device).toLowerCase();
  if (text.includes("boss") || text.includes("fight")) {
    return "🔧 **AUTO-FIX for Boss Fight Crash:**\n1. Lower graphics to MEDIUM\n2. Close all other apps (RAM full)\n3. For iPhone 8/Android old: Turn OFF shadows\n4. Restart phone before boss fight\n\nThis na memory overload. We go patch am next update!";
  }
  if (text.includes("inventory") || text.includes("item")) {
    return "🔧 **AUTO-FIX for Inventory Crash:**\n1. Clear game cache: Settings > Apps > Rimuru > Clear Cache\n2. Don't spam open inventory fast\n3. Make sure you get 1GB free storage\n4. Update to latest version";
  }
  if (text.includes("loading") || text.includes("stuck") || text.includes("black")) {
    return "🔧 **AUTO-FIX for Loading Crash:**\n1. Force close game, wait 10 sec\n2. Check internet - need stable connection\n3. Delete & reinstall if e still dey (your save dey cloud)\n4. For PC: Run as Administrator";
  }
  if (text.includes("iphone") || text.includes("ios")) {
    return "🔧 **AUTO-FIX for iOS:**\n1. Settings > General > iPhone Storage > Rimuru > Offload App\n2. Update iOS to latest\n3. iPhone 8 na old RAM, use Low graphics";
  }
  return "🔧 **General Fix:**\n1. Restart device\n2. Clear cache\n3. Free 2GB storage\n4. Update game\n5. Reinstall as last option\n\nYour full report don reach dev, we go fix am permanently!";
}

const crashScene = new Scenes.WizardScene(
  'crash-report',
  (ctx) => {
    ctx.wizard.state.report = {};
    ctx.reply('💥 CRASH REPORT\n\n1️⃣ Wetin you dey do when e crash? (e.g. boss fight, inventory, loading)');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.report.action = ctx.message.text;
    ctx.reply('2️⃣ Which device/OS? (e.g. Android 13, iPhone 8, PC)');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.report.device = ctx.message.text;
    ctx.reply('3️⃣ E dey happen everytime? How to make am happen again?');
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.report.steps = ctx.message.text;
    const r = ctx.wizard.state.report;
    const user = ctx.from;
    const autoFix = getAutoFix(r.action, r.device);

    const reportMsg = `🚨 NEW CRASH 🚨\n👤 @${user.username || 'no username'} (${user.id})\n📱 ${r.device}\n🎮 ${r.action}\n📝 ${r.steps}\n🕒 ${new Date().toLocaleString()}\n\nAuto-fix sent: ${autoFix.substring(0,50)}...`;

    await ctx.reply(`✅ Report saved! Thank you!\n\n${autoFix}\n\nDid this fix help? Reply YES/NO`);

    if (ctx.from.id!= ADMIN_ID) {
      try { await ctx.telegram.sendMessage(ADMIN_ID, reportMsg); } catch(e){}
    }
    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage([crashScene]);
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => ctx.reply(`💥 Rimuru AUTO-FIX Bot ✅\n\n/crash - Report + get instant fix\n/ping - Check`));
bot.command('ping', (ctx) => ctx.reply('🟢 Bot online + Auto-fix active'));
bot.command('crash', (ctx) => ctx.scene.enter('crash-report'));
bot.command('report', (ctx) => ctx.scene.enter('crash-report'));

bot.launch().then(() => console.log('Auto-fix bot started!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
