const { Telegraf, Scenes, session } = require('telegraf');

const ADMIN_ID = 7151823699; // Your Telegram ID
const bot = new Telegraf(process.env.BOT_TOKEN);

let bannedUsers = new Set();
let bannedWhatsApp = new Set();
let userCooldown = new Map();
let badWords = ["http://", "https://", ".exe", ".apk", ".zip", "free money", "crypto"];

function getAutoFix(action, device) {
  const t = (action + " " + device).toLowerCase();
  if (t.includes("boss")) return "🔧 AUTO-FIX Boss: LOW graphics, close other apps, restart before boss!";
  if (t.includes("inventory")) return "🔧 AUTO-FIX Inventory: Clear cache, free 1GB, no spam!";
  if (t.includes("loading") || t.includes("black")) return "🔧 AUTO-FIX Loading: Force close, check internet, reinstall.";
  return "🔧 General Fix: Restart, clear cache, free 2GB, update game!";
}

// ====== 1. SESSION ======
bot.use(session());

// ====== 2. PATCH: FORCE EXIT SCENE FOR ADMIN COMMANDS ======
bot.use(async (ctx, next) => {
  const text = ctx.message?.text || "";
  if (text.startsWith("/ban") || text.startsWith("/unban") || text.startsWith("/wabanlist") || text.startsWith("/banlist") || text.startsWith("/start") || text.startsWith("/ping") || text.startsWith("/cancel")) {
    try { await ctx.scene.leave(); } catch(e){}
  }
  return next();
});

// ====== 3. SECURITY MIDDLEWARE ======
bot.use(async (ctx, next) => {
  const id = ctx.from?.id;
  const text = ctx.message?.text?.toLowerCase() || "";
  if (!id) return next();

  if (bannedUsers.has(id)) {
    return ctx.reply("🚫 You don get banned. Contact admin.");
  }
  if (userCooldown.has(id) && Date.now() - userCooldown.get(id) < 3000) {
    return ctx.reply("⏳ Slow down! Wait 3 sec");
  }
  userCooldown.set(id, Date.now());

  if (badWords.some(w => text.includes(w))) {
    bannedUsers.add(id);
    return ctx.reply("🚫 Suspicious content! Auto-banned.");
  }
  if (ctx.message.document || ctx.message.photo) {
    return ctx.reply("⚠️ No file allowed! Text only.");
  }
  return next();
});

// ====== 4. CRASH SCENE ======
const crashScene = new Scenes.WizardScene(
  'crash-report',
  (ctx) => {
    ctx.wizard.state.report = {};
    ctx.reply('💥 CRASH REPORT\n\n1️⃣ Wetin you dey do when e crash? (type /cancel to exit)');
    return ctx.wizard.next();
  },
  (ctx) => {
    if (ctx.message.text === "/cancel") { ctx.reply("❌ Cancelled."); return ctx.scene.leave(); }
    ctx.wizard.state.report.action = ctx.message.text.substring(0,300);
    ctx.reply('2️⃣ Which device/OS?');
    return ctx.wizard.next();
  },
  (ctx) => {
    if (ctx.message.text === "/cancel") { ctx.reply("❌ Cancelled."); return ctx.scene.leave(); }
    ctx.wizard.state.report.device = ctx.message.text.substring(0,300);
    ctx.reply('3️⃣ Steps to reproduce? + WhatsApp number (optional)');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message.text === "/cancel") { ctx.reply("❌ Cancelled."); return ctx.scene.leave(); }
    ctx.wizard.state.report.steps = ctx.message.text.substring(0,300);
    const r = ctx.wizard.state.report;
    const user = ctx.from;
    const autoFix = getAutoFix(r.action, r.device);
    const reportMsg = `🚨 NEW CRASH 🚨\n👤 @${user.username||'no'} (${user.id})\n📱 ${r.device}\n🎮 ${r.action}\n📝 ${r.steps}`;
    await ctx.reply(`✅ Saved!\n\n${autoFix}\n\nThanks!`);
    try { if (user.id!= ADMIN_ID) await ctx.telegram.sendMessage(ADMIN_ID, reportMsg); } catch(e){}
    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage([crashScene]);
bot.use(stage.middleware());

// ====== 5. COMMANDS (NOW ALWAYS WORK) ======
bot.start((ctx) => ctx.reply(`💥 Rimuru AUTO-FIX Bot ✅ PATCHED\n/crash - Report\n/ping - Check\n/cancel - Exit crash\nAdmin: /ban /unban /banlist /banwa /unbanwa /wabanlist`));
bot.command('ping', (ctx) => ctx.reply('🟢 Online + Auto-fix + Patch active!'));
bot.command('cancel', async (ctx) => { try{await ctx.scene.leave();}catch(e){} ctx.reply("❌ Out of crash report."); });

bot.command('ban', (ctx) => {
  if (ctx.from.id!= ADMIN_ID) return ctx.reply("❌ Admin only!");
  const targetId = parseInt(ctx.message.text.split(" ")[1]);
  if (!targetId) return ctx.reply("Usage: /ban 123456789");
  bannedUsers.add(targetId);
  ctx.reply(`✅ Telegram User ${targetId} BANNED! 🚫`);
});
bot.command('unban', (ctx) => {
  if (ctx.from.id!= ADMIN_ID) return ctx.reply("❌ Admin only!");
  const targetId = parseInt(ctx.message.text.split(" ")[1]);
  bannedUsers.delete(targetId);
  ctx.reply(`✅ Telegram User ${targetId} UNBANNED!`);
});
bot.command('banlist', (ctx) => {
  if (ctx.from.id!= ADMIN_ID) return ctx.reply("❌ Admin only!");
  if (bannedUsers.size==0) return ctx.reply("No banned Telegram ✅");
  ctx.reply("🚫 Banned Telegram:\n" + Array.from(bannedUsers).join("\n"));
});
bot.command('banwa', (ctx) => {
  if (ctx.from.id!= ADMIN_ID) return ctx.reply("❌ Admin only!");
  let num = ctx.message.text.split(" ")[1];
  if (!num) return ctx.reply("Usage: /banwa 2349126906557");
  num = num.replace(/\D/g,'');
  bannedWhatsApp.add(num);
  ctx.reply(`✅ WhatsApp ${num} BANNED! 🚫\n\nTotal banned WA: ${bannedWhatsApp.size}`);
});
bot.command('unbanwa', (ctx) => {
  if (ctx.from.id!= ADMIN_ID) return ctx.reply("❌ Admin only!");
  let num = ctx.message.text.split(" ")[1]?.replace(/\D/g,'');
  if (!num) return ctx.reply("Usage: /unbanwa 2349126906557");
  bannedWhatsApp.delete(num);
  ctx.reply(`✅ WhatsApp ${num} UNBANNED!`);
});
bot.command('wabanlist', (ctx) => {
  if (ctx.from.id!= ADMIN_ID) return ctx.reply("❌ Admin only!");
  if (bannedWhatsApp.size==0) return ctx.reply("No banned WhatsApp ✅");
  ctx.reply("🚫 Banned WhatsApp:\n" + Array.from(bannedWhatsApp).join("\n"));
});

bot.command('crash', (ctx) => ctx.scene.enter('crash-report'));
bot.command('report', (ctx) => ctx.scene.enter('crash-report'));

bot.launch().then(() => console.log('PATCHED Bot started!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => 
