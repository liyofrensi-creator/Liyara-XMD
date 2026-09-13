import { WAMessage } from '@whiskeysockets/baileys';
import * as fs from 'fs';
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

        // 1. ෆොටෝ එකයි ටෙක්ස්ට් එකයි යැවීම
        await sock.sendMessage(sender, {
            image: { url: config.menuImage },
            caption: aliveText.trim()
        }, { quoted: m });

        // 2. Alive Voice Note එක යැවීම
        await sock.sendMessage(sender, {
            audio: fs.readFileSync('./media/alive.mp3'),
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: m });
    }

    else if (command === '.menu') {
        const menuText = `
🌸 *${config.botName}* 🌸
> *Hello ${pushName}!*
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

        // 1. මෙනු ෆොටෝ එකයි ටෙක්ස්ට් එකයි යැවීම
        await sock.sendMessage(sender, {
            image: { url: config.menuImage },
            caption: menuText.trim()
        }, { quoted: m });

        // 2. Menu Voice Note එක යැවීම
        await sock.sendMessage(sender, {
            audio: fs.readFileSync('./media/menu.mp3'),
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: m });
    }
}
