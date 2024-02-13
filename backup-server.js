// const express = require("express");
// const bodyParser = require("body-parser");
// const qrcode = require("qrcode-terminal");
// const jwt = require("jsonwebtoken");
// const { Client } = require("whatsapp-web.js");

// const app = express();
// const client = new Client();
// let secretKey = "!@#$!%S3CR3T"; // Ganti dengan secret key Anda

// const cors = require('cors');
// // const corsOptions ={
// //     origin:'http://localhost:3000', 
// //     credentials:true,            //access-control-allow-credentials:true
// //     optionSuccessStatus:200
// // }
// app.use(cors());
// // Gunakan bodyParser agar Express dapat membaca data yang dikirim dalam permintaan POST
// app.use(bodyParser.json());

// let qrCodeData = null;

// client.on("ready", () => {
//   console.log("Client is ready!");
// });

// client.on("message", async (message) => {
//   if (message.body === "!ping") {
//     await client.sendMessage(message.from, "pong");
//   }
// });

// // Fungsi untuk mengirim pesan ke nomor tujuan
// async function sendMessageToDestination(number, message) {
//   try {
//     await client.sendMessage(number + "@c.us", message); // Menambahkan '@c.us' untuk format nomor tujuan
//     console.log("Pesan terkirim!");
//   } catch (error) {
//     console.error("Gagal mengirim pesan:", error);
//   }
// }

// // Endpoint API untuk mengirim pesan
// app.post("/api/send-message", verifyToken, async (req, res) => {
//   const { number, message } = req.body;

//   if (!number || !message) {
//     return res
//       .status(400)
//       .json({ error: "Nomor dan pesan harus disertakan dalam permintaan." });
//   }

//   sendMessageToDestination(number, message);
//   res.json({ message: "Pesan sedang dikirim." });
// });

// // Endpoint API untuk mendapatkan QR code
// app.get("/api/qr-code", verifyToken, async (req, res) => {
//   try {
//     // if (!qrCodeData) {
//     //   throw new Error("QR code belum tersedia. Silakan coba lagi nanti.");
//     // }
//     client.on("qr", (qr) => {
//       qrCodeData = qr;
//       //   qrcode.generate(qr, { small: true });
//       res.json({ qrCodeData });
//       console.log("QR terkirim!");
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// client.on("ready", () => {
//   console.log("Client is ready!");
//   // Menambahkan penanganan saat klien siap
//   app.get("/api/ready", verifyToken, (req, res) => {
//     res.sendStatus(200);
//   });
// });

// // Endpoint untuk login dan mendapatkan token JWT
// app.post("/api/login", (req, res) => {
//   // Di sini Anda harus memverifikasi kredensial pengguna dan menghasilkan token JWT
//   const username = req.body.username;
//   const password = req.body.password;

//   // Misalnya, hanya sebagai contoh sederhana
//   if (username === "user" && password === "password") {
//     const token = jwt.sign({ username }, secretKey);
//     res.json({ token });
//     console.log("Login Berhasil!");
//   } else {
//     res
//       .status(401)
//       .json({ error: "Login gagal. Cek kembali username dan password Anda." });
//   }
// });

// // Middleware untuk memverifikasi token JWT
// function verifyToken(req, res, next) {
//   const token = req.headers["authorization"];
//   if (!token) {
//     return res
//       .status(403)
//       .json({ error: "Token tidak tersedia. Silakan login terlebih dahulu." });
//   }
//   jwt.verify(token.split(" ")[1], secretKey, (err, decoded) => {
//     if (err) return res.status(401).json({ error: "Token tidak valid." });
//     req.decoded = decoded;
//     next();
//   });
// }
// // Inisialisasi klien WhatsApp setelah API Express siap
// app.listen(3000, () => {
//   console.log("API server berjalan di port 3000.");
//   client.initialize();
// });