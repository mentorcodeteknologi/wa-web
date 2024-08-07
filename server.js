const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { Client, LocalAuth, NoAuth } = require("whatsapp-web.js");
const cors = require("cors");
const Pusher = require("pusher");

const app = express();
// const wwebVersion = '2.2412.54';
// const fs = require('fs');

// const SESSION_FILE_PATH = './session.json';
// let sessionCfg;
// if (fs.existsSync(SESSION_FILE_PATH))
// {
//     sessionCfg = require(SESSION_FILE_PATH);
// }

const client = new Client({
  authStrategy: new NoAuth(),
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  // webVersionCache: {
  //   type: "remote",
  //   remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
  // },
});
let secretKey = "!@#$!%S3CR3T"; // Ganti dengan secret key Anda
let qrCodeData = null;
let whatsappConnected = false;
let hitCount = 0;

const PORT = 3000;

// Konfigurasi Pusher
const pusher = new Pusher({
  appId: "1823570",
  key: "fd5523b0b2af4d2df994",
  secret: "27e7998e3d3fd195bea6",
  cluster: "ap1",
  useTLS: true,
});

app.use(cors());
app.use(bodyParser.json());

app.post("/api/send-message", verifyToken, async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res
      .status(400)
      .json({ error: "Nomor dan pesan harus disertakan dalam permintaan." });
  }

  sendMessageToDestination(number, message);
  res.json({ message: "Pesan sedang dikirim." });
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
  if (whatsappConnected) {
    res.status(200).json({ message: "Connected" });
  } else {
    whatsappConnected = false;
    res.status(200).json({ message: "Not Connected", qr: qrCodeData });
  }
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
      .json({ error: "Login gagal. Cek kembali username dan password Anda." });
  }
});

function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({
      error: "Token tidak tersedia. Silakan login terlebih dahulu.",
    });
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
  try {
    await client.sendMessage(number + "@c.us", message);
    console.log("Pesan terkirim!");
  } catch (error) {
    console.error("Gagal mengirim pesan:", error);
  }
}

client.on("ready", () => {
  console.log("Client is ready!");
  if (!whatsappConnected) {
    whatsappConnected = true;
    pusher.trigger("my-channel", "my-event", {
      message: "Connected",
    });
  }
});

client.on("message", async (message) => {
  if (message.body === "!ping") {
    await client.sendMessage(message.from, "pong");
  }
});

client.on("qr", (qr) => {
  console.log("QR Code received");
  if (!whatsappConnected) {
    whatsappConnected = false;
    qrCodeData = qr;
    pusher.trigger("my-channel", "my-event", {
      qr: qrCodeData,
      message: "Not Connected",
    });
    console.log("QR is available");
  }
});

client.on("disconnected", async (reason) => {
  console.log("Client was logged out", reason);
  if (whatsappConnected) {
    whatsappConnected = false;
    pusher.trigger("my-channel", "my-event", {
      message: "Disconnected",
    });
  }
});

app.listen(PORT, () => {
  console.log(`API server berjalan di PORT : ${PORT}.`);
  client.initialize();
});
