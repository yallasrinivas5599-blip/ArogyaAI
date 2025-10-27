document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("user-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";

  appendMessage("bot", "Typing... 💬");

  try {
    const res = await fetch("https://arogyaai-22fb.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    document.querySelector(".chat-area").lastElementChild.remove(); // remove typing
    appendMessage("bot", data.reply);
  } catch (err) {
    console.error(err);
    appendMessage("bot", "😞 Server error. Please try again.");
  }
}

function appendMessage(sender, text) {
  const chatArea = document.querySelector(".chat-area");
  const messageEl = document.createElement("div");
  messageEl.className = `${sender}-message message`;
  messageEl.innerText = text;
  chatArea.appendChild(messageEl);
  chatArea.scrollTop = chatArea.scrollHeight;
}
