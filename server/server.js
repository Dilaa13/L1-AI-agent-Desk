const express = require("express");
const cors = require("cors");

const app = express();

// Allow requests from your web page (127.0.0.1:5500)
app.use(cors({
  origin: "http://127.0.0.1:5500",
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// Handle preflight requests
app.options("/chat", cors());

app.use(express.json());

// Put your n8n production webhook URL here
const N8N_WEBHOOK_URL = "https://sltrnddigitalab.app.n8n.cloud/webhook/it-agent-chat";

app.post("/chat", async (req, res) => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();

    res.status(response.status);
    res.set("Content-Type", response.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ replyText: "Proxy error: could not reach n8n." });
  }
});

app.listen(3000, () => {
  console.log("Proxy running on http://localhost:3000/chat");
});
