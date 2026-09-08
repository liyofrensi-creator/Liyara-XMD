const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');
const readline = require('readline');

// ටර්මිනල් එකෙන් ෆෝන් නම්බර් එක ඉල්ලීමට අවශ්‍ය සෙටප් එක
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startLiyara() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false // QR කෝඩ් එක ඕෆ් කිරීම
    });

    // බෝට් එක පටන් ගනිද්දී Pairing Code එක ලබා ගැනීම
    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('\n📱 ඔයාගේ WhatsApp නම්බර් එක රටේ කෝඩ් එකත් එක්ක දාන්න (උදා: 94771234567): ');
        let code = await sock.requestPairingCode(phoneNumber.trim());
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(`\n🔗 ඔන්න ඔයාගේ Pairing Code එක: \x1b[32m${code}\x1b[0m\n`);
        console.log('ඔයාගේ WhatsApp එකට ගිහින් Linked Devices -> Link with phone number යන තැනට ගිහින් මේ කෝඩ් එක දෙන්න!');
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(`\n🚀 ${config.botName} සාර්ථකව WhatsApp එක සමඟ කනෙක්ට් වුණා!\n`);
        } else if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startLiyara();
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const sender = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text;

        if (!text) return;

        // Alive Command (.alive)
        if (text.toLowerCase() === '.alive') {
            const aliveText = `
🌿 *Hello, ${config.ownerName}* 🌿
──────────────────
🩵 ➢ *Version* : ${config.version}
🧊 ➢ *Memory* : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
⏳ ➢ *Runtime* : ${process.uptime().toFixed(0)} seconds
🛰️ ➢ *Host* : GitHub Codespaces
──────────────────
🕊️ ® *Powered By Liyo & Liyara*
            `;
            
            await sock.sendMessage(sender, { 
                image: { url: config.menuImage }, 
                caption: aliveText.trim() 
            });
        }

        // Menu Command (.menu)
        else if (text.toLowerCase() === '.menu') {
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
*Powered By Liyo & Liyara*
            `;

            await sock.sendMessage(sender, { 
                image: { url: config.menuImage }, 
                caption: menuText.trim() 
            });
        }
    });
}

startLiyara();
