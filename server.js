const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = 'patikasso';

app.use(express.json());

// Sağlık kontrolü
app.get('/', (req, res) => {
  res.send('Patikasso webhook server is running');
});

// Webhook doğrulama (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Mesajlar için webhook (POST)
app.post('/webhook', (req, res) => {
  console.log('Incoming webhook:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

