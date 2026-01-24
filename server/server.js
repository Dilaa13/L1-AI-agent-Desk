const express = require("express");

const app = express();
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

    // pass through status + body
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
