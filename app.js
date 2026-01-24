// 1) Put your n8n webhook URL here
const N8N_WEBHOOK_URL = "https://sltrnddigitallab.app.n8n.cloud/webhook/it-agent-chat";

// 2) Basic elements
const $messages = document.getElementById("messages");
const $input = document.getElementById("input");
const $send = document.getElementById("send");
const $meta = document.getElementById("meta");
const $error = document.getElementById("error");
const $chips = document.getElementById("chips");

// 3) Session and user identity (simple version)
// In a real portal, userId should come from login (SSO). This is a placeholder.
function getSessionId() {
  let id = localStorage.getItem("it_agent_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("it_agent_session", id);
  }
  return id;
}

function getUserId() {
  let id = localStorage.getItem("it_agent_user");
  if (!id) {
    id = "WEB-" + Math.random().toString(16).slice(2);
    localStorage.setItem("it_agent_user", id);
  }
  return id;
}

function addMessage(role, text) {
  const wrap = document.createElement("div");
  wrap.className = "msg " + (role === "user" ? "user" : "bot");

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrap.appendChild(bubble);
  $messages.appendChild(wrap);
  $messages.scrollTop = $messages.scrollHeight;
}

function setChips(suggestions) {
  if (!suggestions || suggestions.length === 0) {
    $chips.style.display = "none";
    $chips.innerHTML = "";
    return;
  }
  $chips.style.display = "flex";
  $chips.innerHTML = "";
  suggestions.forEach((s) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.textContent = s;
    btn.addEventListener("click", () => {
      $input.value = s;
      sendMessage();
    });
    $chips.appendChild(btn);
  });
}

async function callWebhook(messageText) {
  const payload = {
    userId: getUserId(),
    sessionId: getSessionId(),
    message: messageText,
    channel: "web",
    timestamp: new Date().toISOString()
  };

  const res = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error("Webhook request failed with HTTP " + res.status);
  }

  // Expected response:
  // { replyText: "...", suggestions: ["Yes", "No"], type: "kb_suggestion", data: {...} }
  return await res.json();
}

async function sendMessage() {
  const text = $input.value.trim();
  if (!text) return;

  $error.textContent = "";
  setChips([]);

  addMessage("user", text);
  $input.value = "";

  $send.disabled = true;
  $meta.textContent = "Sending...";

  try {
    const data = await callWebhook(text);

    const reply = data.replyText || "No replyText returned from n8n.";
    addMessage("bot", reply);

    setChips(data.suggestions || []);

    // Optional debug line
    if (data.type) {
      $meta.textContent = "Last response type: " + data.type;
    } else {
      $meta.textContent = "";
    }
  } catch (e) {
    addMessage("bot", "I could not reach the help desk service. Try again.");
    $error.textContent = String(e.message || e);
    $meta.textContent = "";
  } finally {
    $send.disabled = false;
    $input.focus();
  }
}

$send.addEventListener("click", sendMessage);
$input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Initial message
addMessage("bot", "Hi. Describe your issue and I will search the Knowledge Bank first.");
