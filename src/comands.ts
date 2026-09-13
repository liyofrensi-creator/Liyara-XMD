import { WAMessage } from '@whiskeysockets/baileys';
import config from './config';

export async function handleMessages(sock: any, m: WAMessage) {
    if (!m.message || m.key.fromMe) return;

    const sender = m.key.remoteJid;
    if (!sender) return;

    const pushName = m.pushName || 'Friend';
    const text = m.message.conversation || m.message.extendedTextMessage?.text;

    if (!text) return;

    const command = text.toLowerCase();

    if (command === '.alive') {
        const aliveText = `
🌿 *Hello, ${pushName}* 🌿
 ──────────────────
🩵 ➢ *Version* : ${config.version}
🧊 ➢ *Memory* : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
⏳ ➢ *Runtime* : ${process.uptime().toFixed(0)} seconds
🛰️ ➢ *Host* : GitHub Codespaces
──────────────────
🕊️ ® *Powered By Liyo Dev*
        `;

        await sock.sendMessage(sender, {
            image: { url: config.menuImage },
            caption: aliveText.trim()
        });
    }


    else if (command === '.menu') {
        const menuText = `
🌸 *${config.botName}* 🌸
> *reply with a number !*

0️⃣ settings 🌐
1️⃣ main 🌸
2️⃣ download 🍬
3️⃣ convert 🦋
4️⃣ owner 🎀
5️⃣ school & special 🧁
6️⃣ team admin 🐾

──────────────────
🕊️ ® *Powered By Liyara XMD*
        `;

        await sock.sendMessage(sender, {
            image: { url: config.menuImage },
            caption: menuText.trim()
        });
    }
}