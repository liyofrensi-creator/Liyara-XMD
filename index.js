const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startLiyara() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS("Chrome")
    });

    if (!sock.authState.creds.registered) {
        console.log('\n========================================');
        const phoneNumber = await question('📱 ඔයාගේ WhatsApp නම්බර් එක රටේ කෝඩ් එකත් එක්ක දාන්න (උදා: 94771234567): ');
        console.log('========================================\n');
        
        await new Promise(resolve => setTimeout(resolve, 4000));
        let code = await sock.requestPairingCode(phoneNumber.trim().replace(/[^0-9]/g, ''));
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        
        console.log(`\n🔗 ඔන්න ඔයාගේ Pairing Code එක: \x1b[32m${code}\x1b[0m\n`);
        console.log('💡 ඔයාගේ WhatsApp එකට ගිහින් Linked Devices -> Link with phone number යන තැනට ගිහින් මේ කෝඩ් එක දෙන්න!\n');
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(`\n🚀 ${config.botName} සාර්ථකව WhatsApp එක සමඟ කනෙක්ට් වුණා!\n`);
        } else if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('🔄 කනෙක්ෂන් එක බිඳුණා, නැවත සම්බන්ධ වෙමින් පවතී...');
                startLiyara();
            } else {
                console.log('❌ ලොග් අව් වී ඇත. කරුණාකර auth_info ෆෝල්ඩර් එක මකා නැවත කනෙක්ට් කරන්න.');
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
