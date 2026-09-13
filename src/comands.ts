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
🛰️ ➢ *Host: GitHub Codespaces
──────────────────
🕊️ ® *Powered By Liyo Dev*
        `;

        // 1. Alive Image & Caption යැවීම
        await sock.sendMessage(sender, {
            image: { url: config.menuImage },
            caption: aliveText.trim()
        }, { quoted: m });

        // 2. Alive Cute Voice Note එක යැවීම
        // (මෙතන 'YOUR_ALIVE_AUDIO_URL_OR_PATH' කියන තැනට ඔයා හදාගත්ත alive MP3 එකේ direct link එක හෝ local path එක දාන්න)
        await sock.sendMessage(sender, {
            audio: { url: 'https://videotourl.com/audio/1789313625802-5c140219-7eb0-46d3-bc2c-5c4e326baeef.mp3' },
            mimetype: 'audio/mp4',
            ptt: true // WhatsApp voice note එකක් ලෙස පෙන්වීමට
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

        // 1. Menu Image & Caption යැවීම
        await sock.sendMessage(sender, {
            image: { url: config.menuImage },
            caption: menuText.trim()
        }, { quoted: m });

        // 2. Menu Cute Voice Note එක යැවීම
        // (මෙතන 'YOUR_MENU_AUDIO_URL_OR_PATH' කියන තැනට AnyToSpeech එකෙන් හදාගත්ත Menu MP3 එකේ direct link එක හෝ local path එක දාන්න)
        await sock.sendMessage(sender, {
            audio: { url: 'https://videotourl.com/audio/1789313698846-f1f9e77d-92ce-4aff-b556-f4a504635857.mp3' },
            mimetype: 'audio/mp4',
            ptt: true // WhatsApp voice note එකක් ලෙස පෙන්වීමට
        }, { quoted: m });
    }
}
