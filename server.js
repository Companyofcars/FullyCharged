// server.js
import express from "express";
import fetch from "node-fetch"; // if using Node 18+, fetch is global

const app = express();
const PORT = process.env.PORT || 4000;

// Airtable webhook URL
const AIRTABLE_WEBHOOK =
  "https://hooks.airtable.com/workflows/v1/genericWebhook/appyAgpa58oaTt2EF/wflqvRxLTYWvjY8ug/wtrgh217nFd6rIOIb";

// Parse JSON
app.use(express.json());

// CORS so your React app can talk to this server
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Proxy endpoint
app.post("/api/lead", async (req, res) => {
  try {
    const body = JSON.stringify(req.body);

    const fwd = await fetch(AIRTABLE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const text = await fwd.text();
    res.json({ ok: true, airtableStatus: fwd.status, airtableResp: text });
  } catch (err) {
    console.error("Proxy error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});