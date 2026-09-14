import { WAMessage } from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';
import config from './config';

// Gemini AI Client එක සකස් කිරීම
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function handleMessages(sock: any, m: WAMessage) {
    if (!m.message || m.key.fromMe) return;

    const sender = m.key.remoteJid;
    if (!sender) return;

    const pushName = m.pushName || 'Friend';
    const text = m.message.conversation || m.message.extendedTextMessage?.text;

    if (!text) return;

    const commandText = text.trim();
    const args = commandText.split(' ');
    const command = args[0].toLowerCase();
    const query = args.slice(1).join(' ');

    // 1. Alive Command
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
        }, { quoted: m });

        try {
            await sock.sendMessage(sender, {
                audio: fs.readFileSync('./media/alive.mp3'),
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: m });
        } catch (e) {
            console.error('Alive audio error:', e);
        }
    }

    // 2. Menu Command
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
        }, { quoted: m });

        try {
            await sock.sendMessage(sender, {
                audio: fs.readFileSync('./media/menu.mp3'),
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: m });
        } catch (e) {
            console.error('Menu audio error:', e);
        }
    }

    // 3. AI Smart Voice Command (.ai [prashne]) - Gemini + Fish Audio Integration
    else if (command === '.ai') {
        if (!query) {
            await sock.sendMessage(sender, { text: `🌸 Please ask something! Example: .ai කොහොමද ඔයාට?` }, { quoted: m });
            return;
        }

        try {
            // Typing status එක පෙන්වීම
            await sock.sendPresenceUpdate('recording', sender);

            // පියවර 1: Gemini මඟින් ප්‍රශ්නයට උත්තරයක් සකස් කරගැනීම (Cute Anime Waifu විදිහට English වලින්, Fish Audio එකට පහසු වීමට)
            const prompt = `You are Liyara XMD, a cute, friendly anime girl AI assistant. User's name is ${pushName}. Answer the following question briefly and sweetly in English (so it can be spoken out loud): "${query}"`;
            
            const aiResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const replyText = aiResponse.text() || `Hello ${pushName}! I heard you.`;

            // පියවර 2: Gemini එකෙන් ගත්තු උත්තරේ Fish Audio API එකට යවා Voice Note එකක් ලෙස ලබාගැනීම
            const response = await fetch("https://api.fish.audio/v1/tts", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.FISH_API_KEY}`,
                    "Content-Type": "application/json",
                    "model": "s2.1-pro-free",
                },
                body: JSON.stringify({
                    text: `[excited] ${replyText} [laughing]`,
                    reference_id: "90dadc31738c4e61ab44a008c7545030",
                    format: "mp3",
                }),
            });

            if (!response.ok) {
                throw new Error(`Fish Audio API error: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const tempAudioPath = path.join(__dirname, '../media/ai_voice.mp3');
            fs.writeFileSync(tempAudioPath, buffer);

            // පියවර 3: WhatsApp එකට Voice Note (PTT) එක ලෙස යැවීම
            await sock.sendMessage(sender, {
                audio: fs.readFileSync(tempAudioPath),
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: m });

        } catch (error) {
            console.error('AI Smart Voice Error:', error);
            await sock.sendMessage(sender, { text: `Oops! My brain got a little confused. 🥺 Try again!` }, { quoted: m });
        }
    }
}
