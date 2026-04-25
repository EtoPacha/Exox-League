const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const prefix = ".";

client.on('ready', () => {
  console.log(`${client.user.tag} aktif!`);
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix)) return;
  if (message.author.bot) return;

  const args = message.content.slice(prefix.length).split(" ");
  const cmd = args[0];

  // 💰 PARA
  if (cmd === "para") {
    let money = await db.get(`money_${message.author.id}`) || 0;
    return message.reply(`Paran: ${money}₺`);
  }

  // 💸 PARA GÖNDER
  if (cmd === "gönder") {
    let user = message.mentions.users.first();
    let miktar = parseInt(args[2]);

    if (!user) return message.reply("Birini etiketle.");
    if (!miktar) return message.reply("Miktar gir.");

    let senderMoney = await db.get(`money_${message.author.id}`) || 0;
    if (senderMoney < miktar) return message.reply("Yetersiz para.");

    await db.subtract(`money_${message.author.id}`, miktar);
    await db.add(`money_${user.id}`, miktar);

    return message.reply("Para gönderildi.");
  }

  // 💰 ADMIN PARA EKLE
  if (cmd === "paraekle") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("Admin değilsin.");

    let user = message.mentions.users.first();
    let miktar = parseInt(args[2]);

    if (!user) return message.reply("Kullanıcı etiketle.");
    if (!miktar) return message.reply("Miktar gir.");

    await db.add(`money_${user.id}`, miktar);

    return message.reply("Para eklendi.");
  }

  // 💸 PARA SİL
  if (cmd === "parasil") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("Admin değilsin.");

    let user = message.mentions.users.first();
    let miktar = parseInt(args[2]);

    await db.subtract(`money_${user.id}`, miktar);

    return message.reply("Para silindi.");
  }

  // 🎭 ROL VER
  if (cmd === "rolver") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply("Yetkin yok.");

    let user = message.mentions.members.first();
    let rol = message.mentions.roles.first();

    if (!user || !rol) return message.reply("Etiketle.");

    await user.roles.add(rol);

    return message.reply("Rol verildi.");
  }

  // ❌ ROL AL
  if (cmd === "rolal") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply("Yetkin yok.");

    let user = message.mentions.members.first();
    let rol = message.mentions.roles.first();

    await user.roles.remove(rol);

    return message.reply("Rol alındı.");
  }

  // 🔨 BAN
  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return message.reply("Yetkin yok.");

    let user = message.mentions.members.first();

    await user.ban();

    return message.reply("Banlandı.");
  }

  // 🎉 ÇEKİLİŞ
  if (cmd === "çekiliş") {
    let süre = args[1];
    let ödül = args.slice(2).join(" ");

    if (!süre || !ödül) return message.reply("Kullanım: .çekiliş 10s ödül");

    let msg = await message.channel.send(`🎉 Çekiliş: ${ödül}`);
    await msg.react("🎉");

    setTimeout(async () => {
      let users = await msg.reactions.cache.get("🎉").users.fetch();
      let katılanlar = users.filter(u => !u.bot);

      let kazanan = katılanlar.random();
      if (!kazanan) return message.channel.send("Katılan yok.");

      message.channel.send(`Kazanan: ${kazanan}`);
    }, süreÇevir(süre));
  }

  // 💤 AFK
  if (cmd === "afk") {
    let sebep = args.slice(1).join(" ") || "Sebep yok";
    await db.set(`afk_${message.author.id}`, sebep);

    return message.reply("AFK oldun.");
  }

});

// AFK kontrol
client.on('messageCreate', async message => {
  let afk = await db.get(`afk_${message.author.id}`);
  if (afk) {
    await db.delete(`afk_${message.author.id}`);
    message.reply("AFK çıktın.");
  }

  let user = message.mentions.users.first();
  if (user) {
    let afkUser = await db.get(`afk_${user.id}`);
    if (afkUser) {
      message.reply("Bu kişi AFK: " + afkUser);
    }
  }
});

function süreÇevir(time) {
  let num = parseInt(time);
  if (time.endsWith("s")) return num * 1000;
  if (time.endsWith("m")) return num * 60000;
  if (time.endsWith("h")) return num * 3600000;
}
client.login(process.env.TOKEN);
