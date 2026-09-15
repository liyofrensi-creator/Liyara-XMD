import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    ConnectionState,
    WAMessage,
    MessageUpsertType
} from '@whiskeysockets/baileys';
import pino from 'pino';
import config from './config';
import * as readline from 'readline';
import { Boom } from '@hapi/boom';
import { handleMessages } from './commands'; // <-- මෙතන './comands' වෙනුවට './commands' කියලා හැදුවා

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text: string): Promise<string> => new Promise((resolve) => rl.question(text, resolve));

async function startLiyara(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }) as any,
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS("Chrome")
    });

    if (!sock.authState.creds.registered) {
        console.log('\n========================================');
        const phoneNumber = await question('Enter your whatsapp number with country code (e.g., 94771234567): ');
        console.log('========================================\n');

        await new Promise((resolve) => setTimeout(resolve, 4000));

        const formattedNumber = phoneNumber.trim().replace(/[^0-9]/g, '');
        let code = await sock.requestPairingCode(formattedNumber);
        code = code?.match(/.{1,4}/g)?.join('-') || code;

        console.log(`\n🔗 Your Pairing Code: \x1b[32m${code}\x1b[0m\n`);
        console.log('💡 Go to your WhatsApp -> Linked Devices -> Link with phone number and enter this code!\n');
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log(`\n🚀 ${config.botName} successfully connected to WhatsApp!\n`);
        } else if (connection === 'close') {
            const error = lastDisconnect?.error as Boom;
            const shouldReconnect = error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                console.log('🔄 Connection lost, reconnecting...');
                startLiyara();
            } else {
                console.log('❌ Logged out. Please delete the auth_info folder and scan the QR code again.');
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }: { messages: WAMessage[], type: MessageUpsertType }) => {
        if (!messages || messages.length === 0) return;
        const m = messages[0];

        // Debugging සඳහා console එකට message එක print කරගැනීමට
        console.log("📩 Message received event triggered!");

        await handleMessages(sock, m);
    });
}

startLiyara();
