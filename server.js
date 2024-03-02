const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { Client } = require("whatsapp-web.js");
const cors = require("cors");
const http = require('http');

const app = express();
const client = new Client();
const secretKey = "!@#$!%S3CR3T"; // Ganti dengan kunci rahasia Anda
let qrCodeData = null;
let whatsappConnected = false;

app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('Sebuah klien terhubung');
  socket.on('disconnect', () => {
    console.log('Sebuah klien terputus');
  });
});

client.on('qr', (qr) => {
  qrCodeData = qr;
  io.emit('qrCodeData', qrCodeData);
  console.log('Kode QR dikirim ke klien');
});

client.on('ready', () => {
  whatsappConnected = true;
  io.emit('whatsappConnected', true);
  console.log('WhatsApp terhubung');
});

client.on('message', async (message) => {
  if (message.body === "!ping") {
    await client.sendMessage(message.from, "pong");
    console.log("Pesan terkirim!");
  }
});

app.post("/api/send-message", verifyToken, async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res
      .status(400)
      .json({ error: "Nomor dan pesan harus disertakan dalam permintaan." });
  }

  try {
    await sendMessageToDestination(number, message);
    res.json({ message: "Pesan sedang dikirim." });
  } catch (error) {
    console.error("Gagal mengirim pesan:", error);
    res.status(500).json({ error: "Gagal mengirim pesan." });
  }
});

app.get("/api/qr-code", verifyToken, async (req, res) => {
  try {
    res.json({ qrCodeData });
    console.log("QR terkirim!");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/ready", (req, res) => {
  console.log("Cek Status!");
  res.status(200).json({ status: whatsappConnected });
});

app.post("/api/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === "user" && password === "password") {
    const token = jwt.sign({ username }, secretKey);
    res.json({ token });
    console.log("Login Berhasil!");
  } else {
    res
      .status(401)
      .json({ error: "Login gagal. Periksa kembali username dan password Anda." });
  }
});

function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res
      .status(403)
      .json({ error: "Token tidak tersedia. Silakan login terlebih dahulu." });
  }
  if (req.path === "/api/ready") {
    return next();
  }
  jwt.verify(token.split(" ")[1], secretKey, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token tidak valid." });
    req.decoded = decoded;
    next();
  });
}

async function sendMessageToDestination(number, message) {
  await client.sendMessage(number + "@c.us", message);
}

server.listen(3000, () => {
  console.log("Server API berjalan di port 3000.");
  client.initialize();
});
