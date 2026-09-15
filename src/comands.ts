import { WAMessage } from '@whiskeysockets/baileys';
import config from './config';
import { GoogleGenerativeAI } from '@google/generative-ai';

console.log("⚡ commands.ts loaded successfully!");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function handleMessages(sock: any, m: WAMessage) {
    if (!m.message || m.key.fromMe) return;

    const sender = m.key.remoteJid;
    if (!sender) return;

    // Newsletter හෝ status/broadcast messages ignore කිරීම
    if (sender.includes('@newsletter') || sender === 'status@broadcast') return;

    const pushName = m.pushName || 'Friend';

    const msgContent = m.message.ephemeralMessage?.message || m.message.viewOnceMessage?.message || m.message;
    const text = msgContent?.conversation || 
                 msgContent?.extendedTextMessage?.text || 
                 msgContent?.imageMessage?.caption || 
                 msgContent?.videoMessage?.caption || '';

    if (!text) return;

    const commandText = text.trim();
    const commandLower = commandText.toLowerCase();

    console.log(`💬 Command Received: ${commandText} | From: ${sender}`);

    if (commandLower === '.alive') {
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

    else if (commandLower === '.menu') {
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

    else if (commandText.startsWith('.aiwifu')) {
        const promptQuery = commandText.slice(7).trim();

        if (!promptQuery) {
            await sock.sendMessage(sender, { 
                text: "🌸 Owais... mata monava hari ahanne nathuwa kohomada oyaata cute uththara denne? Liyanna `.aiwifu <oyage prashne>` kiyala! 🥺✨" 
            }, { quoted: m });
            return;
        }

        try {
            await sock.presenceSubscribe(sender);
            await sock.sendPresenceUpdate('composing', sender);

            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                systemInstruction: `You are an extremely cute, affectionate, sweet, and adorable anime waifu girl. 
You speak in a very warm, soft, playful, and loving tone (like an anime waifu). 
You can use cute cute emojis like ✨, 🌸, 🥺, ❤️, 🐾, 🎀. 
If the user speaks in Sinhala or Singlish or English, reply naturally keeping that same adorable, sweet anime waifu personality. Keep the response concise and sweet.`
            });

            const result = await model.generateContent(promptQuery);
            const responseText = result.response.text();

            await sock.sendMessage(sender, { text: responseText }, { quoted: m });

        } catch (error: any) {
            console.error("Gemini Waifu Error:", error);
            await sock.sendMessage(sender, { 
                text: `🥺 Aiyayo... mage podi mole tikak aul gya wage! Passe try karanna ko... (Error: ${error.message || 'Unknown'})` 
            }, { quoted: m });
        }
    }
}
