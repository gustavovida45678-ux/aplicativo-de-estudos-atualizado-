/**
 * WhatsApp Sidecar (Baileys) — Secretaria Virtual
 * - Conecta ao WhatsApp via QR code (Baileys / whiskeysockets)
 * - Expõe API HTTP mínima para o backend FastAPI
 * - Encaminha mensagens recebidas para o webhook do backend
 *
 * Baseado no baileys-service do projeto deusfiel, adaptado para o
 * aplicativo de estudos (Secretaria Virtual).
 */
const path = require("path");
const express = require("express");
const QRCode = require("qrcode");
const axios = require("axios");
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  downloadMediaMessage,
  isJidUser,
  isLidUser,
} = require("@whiskeysockets/baileys");

const PORT = parseInt(process.env.PORT || "8002", 10);
const AUTH_DIR = process.env.BAILEYS_AUTH_DIR || path.join(__dirname, "auth_info");
const INTERNAL_TOKEN = process.env.BAILEYS_INTERNAL_TOKEN || "deusfiel-secretaria-2026";
const BACKEND_WEBHOOK =
  process.env.BACKEND_WEBHOOK ||
  "https://aplicativo-de-estudos-atualizado-s.onrender.com/api/whatsapp/webhook";

const logger = pino({ level: "warn" });

let sock = null;
let qrRaw = null;
let qrDataUri = null;
let qrGeneratedAt = null;
let connectionState = "close";
let lastError = null;
let me = null;
let reconnectAttempts = 0;
const MAX_BACKOFF_MS = 60_000;

function jidToPhone(jid) {
  if (!jid) return "";
  return String(jid).split("@")[0].split(":")[0];
}

function resolvePhoneAndJid(msg) {
  const key = msg.key || {};
  const remoteJid = key.remoteJid || "";
  const senderPn = msg.senderPn || key.senderPn || null;
  const participantPn = msg.participantPn || key.participantPn || null;
  const altJid = key.remoteJidAlt || null;
  let phoneJid = null;
  for (const cand of [senderPn, participantPn, altJid]) {
    if (cand && typeof cand === "string" && cand.endsWith("@s.whatsapp.net")) {
      phoneJid = cand;
      break;
    }
  }
  const isLid = isLidUser(remoteJid);
  let phone = "";
  if (phoneJid) phone = jidToPhone(phoneJid);
  else if (isJidUser(remoteJid)) phone = jidToPhone(remoteJid);
  else if (isLid) phone = jidToPhone(remoteJid); // apenas para exibição
  return { phone, remoteJid, phoneJid, isLid };
}

async function startBaileys() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        qrRaw = qr;
        qrGeneratedAt = Date.now();
        try {
          qrDataUri = await QRCode.toDataURL(qr, { margin: 1, scale: 6 });
        } catch (e) {
          console.error("[baileys] qr encode error:", e.message);
        }
      }
      if (connection === "open") {
        connectionState = "open";
        qrRaw = null;
        qrDataUri = null;
        reconnectAttempts = 0;
        me = sock.user;
        console.log("[baileys] conectado:", me?.id);
      } else if (connection === "connecting") {
        connectionState = "connecting";
      } else if (connection === "close") {
        connectionState = "close";
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut =
          code === DisconnectReason.loggedOut ||
          code === DisconnectReason.connectionClosed;
        if (loggedOut) {
          console.log("[baileys] sessão encerrada. Limpando credenciais...");
          const fs = require("fs");
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
        }
        const backoff = Math.min(5000 * 2 ** reconnectAttempts, MAX_BACKOFF_MS);
        reconnectAttempts += 1;
        setTimeout(startBaileys, backoff);
      }
      sock.ev.on("connection.update", () => {});
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const msg of messages) {
        try {
          if (!msg.message) continue;
          if (msg.key?.fromMe) continue;
          const remote = msg.key?.remoteJid || "";
          if (remote.endsWith("@g.us")) continue;
          if (remote.endsWith("@broadcast")) continue;
          if (remote === "status@broadcast") continue;

          const { phone, remoteJid, phoneJid, isLid } = resolvePhoneAndJid(msg);
          if (!phone) continue;

          const m = msg.message;
          let text = "";
          let imageBase64 = null;
          let imageMime = null;
          let imageCaption = null;
          if (m.conversation) text = m.conversation;
          else if (m.extendedTextMessage?.text) text = m.extendedTextMessage.text;
          else if (m.imageMessage) {
            imageCaption = m.imageMessage.caption || null;
            text = imageCaption || "[Imagem recebida]";
            try {
              const buf = await downloadMediaMessage(msg, "buffer", {}, { logger });
              imageBase64 = Buffer.from(buf).toString("base64");
              imageMime = m.imageMessage.mimetype || "image/jpeg";
            } catch (e) {
              console.warn("[baileys] image download failed:", e.message);
            }
          } else if (m.audioMessage) {
            text = "[Áudio recebido — envie por texto, ainda não consigo ouvir áudios]";
          } else if (m.videoMessage) text = "[Vídeo recebido]";
          else if (m.stickerMessage) text = "[Sticker]";
          else continue;

          const payload = {
            token: INTERNAL_TOKEN,
            phone,
            jid: remoteJid,
            phone_jid: phoneJid || null,
            is_lid: isLid,
            name: msg.pushName || phone,
            text,
            image_base64: imageBase64,
            image_mime: imageMime,
            image_caption: imageCaption,
            message_id: msg.key.id,
            timestamp: msg.messageTimestamp,
          };
          try {
            await axios.post(BACKEND_WEBHOOK, payload, { timeout: 60000, maxBodyLength: 50 * 1024 * 1024 });
          } catch (err) {
            console.warn("[baileys] forward to backend failed:", err.message);
          }
        } catch (e) {
          console.error("[baileys] msg handler error", e);
        }
      }
    });
  } catch (e) {
    console.error("[baileys] start error:", e);
    setTimeout(startBaileys, 10000);
  }
}

const app = express();
app.use(express.json({ limit: "4mb" }));

function authMiddleware(req, res, next) {
  const token = req.header("x-internal-token");
  if (token !== INTERNAL_TOKEN) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "baileys" }));

app.get("/status", authMiddleware, (_req, res) => {
  res.json({
    ok: true,
    connection_state: connectionState,
    has_qr: !!qrDataUri,
    qr_age_seconds: qrGeneratedAt ? Math.round((Date.now() - qrGeneratedAt) / 1000) : null,
    me: me ? { id: me.id, name: me.name } : null,
    last_error: lastError ? lastError.message : null,
  });
});

app.get("/qr", authMiddleware, (_req, res) => {
  res.json({ ok: true, qr: qrDataUri, generated_at: qrGeneratedAt, connection_state: connectionState });
});

app.post("/restart", authMiddleware, async (_req, res) => {
  if (sock) sock.end(new Error("restart"));
  res.json({ ok: true });
});

app.post("/logout", authMiddleware, async (_req, res) => {
  try {
    await sock?.logout();
  } catch (e) {}
  const fs = require("fs");
  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  } catch (e) {}
  if (sock) sock.end(new Error("logout"));
  res.json({ ok: true });
});

app.post("/send-text", authMiddleware, async (req, res) => {
  const { jid, text } = req.body || {};
  if (!jid || !text) return res.status(400).json({ ok: false, error: "jid e text são obrigatórios" });
  if (connectionState !== "open") {
    return res.status(409).json({ ok: false, error: "whatsapp desconectado" });
  }
  try {
    await sock.sendMessage(jid, { text });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/conversations", authMiddleware, async (_req, res) => {
  if (!sock) return res.json({ ok: true, conversations: [] });
  const chats = [];
  const chatStore = sock.chats;
  if (chatStore && chatStore.all) {
    for (const c of chatStore.all()) {
      if (c.id.endsWith("@g.us") || c.id.endsWith("@broadcast")) continue;
      chats.push({ jid: c.id, name: c.name || c.id.split("@")[0], unread: c.unreadCount || 0 });
    }
  }
  res.json({ ok: true, conversations: chats.slice(0, 100) });
});

app.listen(PORT, () => console.log(`[baileys] sidecar ouvindo na porta ${PORT}`));
startBaileys();