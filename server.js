const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { Client } = require("whatsapp-web.js");
const cors = require("cors");

const app = express();
const client = new Client();
const secretKey = "!@#$!%S3CR3T"; // Ganti dengan secret key Anda
let qrCodeData = null;
let whatsappConnected = false;

app.use(cors());
app.use(bodyParser.json());

const WebSocket = require("ws");
const ws = new WebSocket("ws://103.67.186.41:8081");

ws.on("open", function open() {
  console.log("Connected to WebSocket server");
  ws.send("Hello from Node.js!-test");
});

client.on("ready", () => {
  console.log("Client is ready!");
  ws.send("Connected-status");
});

client.on("message", async (message) => {
  if (message.body === "!ping") {
    try {
      await client.sendMessage(message.from, "pong");
      console.log("Pesan terkirim!");
    } catch (error) {
      console.error("Gagal mengirim pesan:", error);
    }
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
  console.log("Get Status!");
  if (whatsappConnected) {
    res.status(200).json({ status: true });
    ws.send("Connected-status");
  } else {
    res.status(200).json({ status: false });
    ws.send("Not Connected-status");
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

client.on("qr", (qr) => {
  if (whatsappConnected) {
    ws.send("Connected-status");
  } else {
    qrCodeData = qr;
    ws.send(qrCodeData + "-qr");
    console.log("Qr Sudah tersedia");
    ws.send("Not Connected-status");
  }
});

app.listen(3000, () => {
  console.log("API server berjalan di port 3000.");
  client.initialize();
});
