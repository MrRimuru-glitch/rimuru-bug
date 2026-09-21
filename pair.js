const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
async function getPairCode(phoneNumber) {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_'+phoneNumber);
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: false,
        browser: ["Rimuru Bot", "Chrome", "1.0"],
        connectTimeoutMs: 60000
    });
    sock.ev.on('creds.update', saveCreds);
    // Keep alive for 90 seconds so you have time to enter code
    await new Promise(r => setTimeout(r, 3000));
    const cleanNumber = phoneNumber.replace(/\D/g,'');
    const code = await sock.requestPairingCode(cleanNumber);
    // Don't close socket, let it wait for pairing
    setTimeout(()=>{ try{sock.end()}catch(e){} }, 90000);
    return code;
}
module.exports = { getPairCode };
