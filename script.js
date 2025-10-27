// script.js
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("🧍", message);
  userInput.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  appendMessage("🤖", data.reply);
}

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.textContent = `${sender} ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
