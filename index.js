const { Telegraf, Scenes, session } = require('telegraf');

const ADMIN_ID = 7151823699; // Your ID
const bot = new Telegraf(process.env.BOT_TOKEN);

let bannedUsers = new Set();
let bannedWhatsApp = new Set();
let userCooldown = new Map();
let badWords = ["http://", "https://", ".exe", ".apk", ".zip", "free money", "crypto"];

function getAutoFix(action, device) {
  const t = (action + " " + device).toLowerCase();
  if (t.includes("boss")) return "🔧 AUTO-FIX Boss: Lower graphics to MEDIUM, close other apps, restart phone!";
  if (t.includes("inventory")) return "🔧 AUTO-FIX Inventory: Clear cache, free 1GB, no spam inventory!";
  if (t.includes("loading") || t.includes("black")) return "🔧 AUTO-FIX Loading: Force close, check internet, reinstall.";
  return "🔧 General Fix: Restart device, clear cache, free 2GB, update game!";
}

// === SECURITY MIDDLEWARE ===
bot.use((ctx, next) => {
  const id = ctx.from?.id;
  const text = ctx.message?.text?.toLowerCase() || "";

  if (!id) return next();

  // Block banned
  if (bannedUsers.has(id)) {
    return ctx.reply("🚫 You don get banned. Contact admin.");
  }

  // Anti-spam 5 sec
  if (userCooldown.has(id) && Date.now() - userCooldown.get(id) < 5000) {
    return ctx.reply("⏳ Slow down! Wait 5 sec");
  }
  userCooldown.set(id, Date.now());

  // Block virus links/files
  if (badWords.some(w => text.includes(w))) {
    bannedUsers.add(id);
    return ctx.reply("🚫 Suspicious content blocked! Auto-banned.");
  }
  if (ctx.message.document || ctx.message.photo) {
    return ctx.reply("⚠️ No file allowed! Text only.");
  }

  return next();
});

// === CRASH SCENE ===
const crashScene = new Scenes.WizardScene(
  'crash-report',
  (ctx) => { 
    ctx.wizard.state.report = {}; 
    ctx.reply('💥 CRASH REPORT (Max 300 chars per answer)\n\n1️⃣ Wetin you dey do when e crash?'); 
    return ctx.wizard.next(); 
  },
  (ctx) => { 
    if (ctx.message.text.length > 300) return ctx.reply("Too long! Max 300 chars");
    ctx.wizard.state.report.action = ctx.message.text; 
    ctx.reply('2️⃣ Which device/OS? e.g iPhone 8 / Android'); 
    return ctx.wizard.next(); 
  },
  (ctx) => { 
    if (ctx.message.text.length > 300) return ctx.reply("Too long! Max 300 chars");
    ctx.wizard.state.report.device = ctx.message.text; 
    ctx.reply('3️⃣ Steps to reproduce? +
