const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "patikasso_verify_123"; // Herhangi bir şey olabilir
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN; // Render'da ortam değişkeni olarak gireceğiz
const PIXEL_ID = process.env.META_PIXEL_ID;

// ---- 1) Meta webhook doğrulama ----
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ---- 2) WhatsApp / Instagram webhook POST ----
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    console.log("GELEN VERİ:", JSON.stringify(data, null, 2));

    // WhatsApp mesajından sipariş etiketi algılama — örnek mantık
    const message = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message && message.type === "text") {
      const text = message.text.body.toLowerCase();

      // Eğer kullanıcı WhatsApp'ta "sipariş verildi" yazdıysa META'ya event gönder
      if (text.includes("sipariş verildi")) {
        await sendMetaEvent("Purchase", 899);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// ---- 3) Meta'ya event gönderme ----
async function sendMetaEvent(eventName, value) {
  try {
    const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    await axios.post(url, {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "system_generated",
          custom_data: {
            value: value,
            currency: "TRY"
          }
        }
      ]
    });

    console.log("META EVENT GÖNDERİLDİ →", eventName);
  } catch (err) {
    console.error("Meta event error:", err.response?.data || err);
  }
}

app.listen(3000, () => console.log("Patikasso Webhook Çalışıyor (PORT 3000)"));
