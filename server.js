const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');

const app = express();
const client = new Client();

// Gunakan bodyParser agar Express dapat membaca data yang dikirim dalam permintaan POST
app.use(bodyParser.json());

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (message) => {
    if (message.body === '!ping') {
        await client.sendMessage(message.from, 'pong');
    }
});

// Fungsi untuk mengirim pesan ke nomor tujuan
async function sendMessageToDestination(number, message) {
    try {
        await client.sendMessage(number + '@c.us', message); // Menambahkan '@c.us' untuk format nomor tujuan
        console.log('Pesan terkirim!');
    } catch (error) {
        console.error('Gagal mengirim pesan:', error);
    }
}

// Endpoint API untuk mengirim pesan
app.post('/api/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: 'Nomor dan pesan harus disertakan dalam permintaan.' });
    }

    sendMessageToDestination(number, message);
    res.json({ message: 'Pesan sedang dikirim.' });
});

// Inisialisasi klien WhatsApp setelah API Express siap
app.listen(3000, () => {
    console.log('API server berjalan di port 3000.');
    client.initialize();
});
