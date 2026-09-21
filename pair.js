const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
async function getPairCode(phoneNumber) {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_'+phoneNumber);
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        printQRInTerminal: false,
        browser: ["Rimuru Bot", "Chrome", "1.0"]
    });
    sock.ev.on('creds.update', saveCreds);
    if (!sock.authState.creds.registered) {
        const cleanNumber = phoneNumber.replace(/\D/g,'');
        await new Promise(r => setTimeout(r, 2000));
        const code = await sock.requestPairingCode(cleanNumber);
        return code;
    } else {
        return "ALREADY_PAIRED";
    }
}
module.exports = { getPairCode };
