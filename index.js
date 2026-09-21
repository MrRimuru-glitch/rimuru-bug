const { Telegraf, Scenes, session } = require('telegraf');
const ADMIN_ID = 7151823699;
const bot = new Telegraf(process.env.BOT_TOKEN);

let bannedUsers = new Set();
let bannedWA = new Set();
let cooldown = new Map();

function getFix(a,d){
  const t=(a+" "+d).toLowerCase();
  if(t.includes("boss")) return "🔧 Fix Boss: LOW graphics, restart!";
  if(t.includes("inventory")) return "🔧 Fix: Clear cache, free 1GB!";
  return "🔧 Fix: Restart, clear cache, free 2GB!";
}

bot.use(session());
bot.use(async (ctx,next)=>{
  const txt=ctx.message?.text||"";
  if(txt.startsWith("/")){ try{await ctx.scene.leave();}catch(e){} }
  return next();
});

bot.use(async (ctx,next)=>{
  const id=ctx.from?.id;
  const txt=(ctx.message?.text||"").toLowerCase();
  if(!id) return next();
  if(bannedUsers.has(id)) return ctx.reply("🚫 Banned.");
  if(cooldown.has(id) && Date.now()-cooldown.get(id)<3000) return ctx.reply("⏳ Wait 3s");
  cooldown.set(id,Date.now());
  if(txt.includes("http://")||txt.includes("https://")||txt.includes(".exe")){
    bannedUsers.add(id);
    return ctx.reply("🚫 Bad link - banned.");
  }
  return next();
});

const crashScene = new Scenes.WizardScene('crash-report',
(ctx)=>{ ctx.wizard.state.r={}; ctx.reply('💥 Crash Report\n1️⃣ Wetin happen? (/cancel to exit)'); return ctx.wizard.next(); },
(ctx)=>{
  if(ctx.message.text=="/cancel"){ ctx.reply("❌ Cancelled"); return ctx.scene.leave(); }
  ctx.wizard.state.r.action=ctx.message.text.slice(0,300);
  ctx.reply('2️⃣ Device?'); return ctx.wizard.next();
},
(ctx)=>{
  if(ctx.message.text=="/cancel"){ ctx.reply("❌ Cancelled"); return ctx.scene.leave(); }
  ctx.wizard.state.r.device=ctx.message.text.slice(0,300);
  ctx.reply('3️⃣ Steps + WA number?'); return ctx.wizard.next();
},
async (ctx)=>{
  if(ctx.message.text=="/cancel"){ ctx.reply("❌ Cancelled"); return ctx.scene.leave(); }
  ctx.wizard.state.r.steps=ctx.message.text.slice(0,300);
  const r=ctx.wizard.state.r;
  const u=ctx.from;
  const fix=getFix(r.action,r.device);
  await ctx.reply(`✅ Saved!\n${fix}`);
  try{ if(u.id!=ADMIN_ID) await ctx.telegram.sendMessage(ADMIN_ID,`🚨 CRASH\n👤 @${u.username} (${u.id})\n📱 ${r.device}\n🎮 ${r.action}\n📝 ${r.steps}`); }catch(e){}
  return ctx.scene.leave();
});

const stage = new Scenes.Stage([crashScene]);
bot.use(stage.middleware());

bot.start((ctx)=>ctx.reply('💥 Rimuru Bot PATCHED ✅\n/crash\n/ping\n/cancel\nAdmin: /ban /banwa'));
bot.command('ping',(ctx)=>ctx.reply('🟢 Online PATCHED!'));
bot.command('cancel',async(ctx)=>{ try{await ctx.scene.leave();}catch(e){} ctx.reply("❌ Out"); });
bot.command('crash',(ctx)=>ctx.scene.enter('crash-report'));
bot.command('report',(ctx)=>ctx.scene.enter('crash-report'));

bot.command('ban',(ctx)=>{
  if(ctx.from.id!=ADMIN_ID) return ctx.reply("❌ Admin only");
  const id=parseInt(ctx.message.text.split(" ")[1]);
  if(!id) return ctx.reply("Use: /ban 123");
  bannedUsers.add(id); ctx.reply(`✅ ${id} BANNED`);
});
bot.command('unban',(ctx)=>{
  if(ctx.from.id!=ADMIN_ID) return;
  const id=parseInt(ctx.message.text.split(" ")[1]);
  bannedUsers.delete(id); ctx.reply(`✅ ${id} UNBANNED`);
});
bot.command('banlist',(ctx)=>{
  if(ctx.from.id!=ADMIN_ID) return;
  if(bannedUsers.size==0) return ctx.reply("No banned");
  ctx.reply("Banned:\n"+Array.from(bannedUsers).join("\n"));
});
bot.command('banwa',(ctx)=>{
  if(ctx.from.id!=ADMIN_ID) return ctx.reply("❌ Admin only");
  let n=ctx.message.text.split(" ")[1];
  if(!n) return ctx.reply("Use: /banwa 2349126906557");
  n=n.replace(/\D/g,'');
  bannedWA.add(n); ctx.reply(`✅ WA ${n} BANNED!\nTotal: ${bannedWA.size}`);
});
bot.command('unbanwa',(ctx)=>{
  if(ctx.from.id!=ADMIN_ID) return;
  let n=ctx.message.text.split(" ")[1]?.replace(/\D/g,'');
  bannedWA.delete(n); ctx.reply(`✅ WA ${n} UNBANNED`);
});
bot.command('wabanlist',(ctx)=>{
  if(ctx.from.id!=ADMIN_ID) return;
  if(bannedWA.size==0) return ctx.reply("No banned WA");
  ctx.reply("Banned WA:\n"+Array.from(bannedWA).join("\n"));
});

bot.launch().then(()=>console.log('Bot started PATCHED'));
process.once('SIGINT',()=>bot.stop('SIGINT'));
process.once('SIGTERM',()=>bot.stop('SIGTERM'));
