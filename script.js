/* ----------------------------------------------------------
   Arogya AI v2 — script.js
   Smart Chat Simulation + UI Interaction
   ---------------------------------------------------------- */

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const menuBtn = document.getElementById("menuBtn");
const sideNav = document.getElementById("sideNav");

/* 🧭 Toggle side navigator */
menuBtn.addEventListener("click", () => {
  sideNav.classList.toggle("active");
});

/* 🚀 Send message when button clicked or Enter pressed */
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

/* ✉️ Main sendMessage function */
function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // Add user message to chat
  appendMessage("user", text);
  userInput.value = "";

  // Scroll to bottom
  scrollToBottom();

  // Show typing dots
  const typingEl = createTyping();
  chatContainer.appendChild(typingEl);
  scrollToBottom();

  // Delay then show bot reply
  setTimeout(() => {
    typingEl.remove();
    const reply = getAIReply(text);
    appendMessage("bot", reply);
    scrollToBottom();
  }, 900 + Math.random() * 800);
}

/* 💬 Append message bubble */
function appendMessage(sender, message) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = sender === "bot" ? "🤖" : "🧍";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.textContent = message;

  msg.appendChild(avatar);
  msg.appendChild(bubble);

  chatContainer.appendChild(msg);
}

/* ⌛ Typing indicator */
function createTyping() {
  const typingMsg = document.createElement("div");
  typingMsg.classList.add("message", "bot");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = "🤖";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  const dots = document.createElement("div");
  dots.classList.add("typing");
  dots.innerHTML = "<span></span><span></span><span></span>";
  bubble.appendChild(dots);

  typingMsg.appendChild(avatar);
  typingMsg.appendChild(bubble);
  return typingMsg;
}

/* 🧩 Scroll helper */
function scrollToBottom() {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth",
  });
}

/* 🧠 Simple AI placeholder replies */
function getAIReply(input) {
  const msg = input.toLowerCase();

  // Greeting
  if (/(hi|hello|hey)/.test(msg))
    return "Hi there! 👋 I’m Arogya AI — your smart health companion.";
  if (/how are you/.test(msg))
    return "I’m feeling energetic and ready to help 💪 How are you today?";
  if (/who are you/.test(msg))
    return "I’m Arogya AI 🤖, your personal digital health assistant.";
  if (/your name/.test(msg))
    return "My name’s Arogya AI — built to keep you healthy and informed!";
  if (/what can you do|help/.test(msg))
    return "I can chat, guide your wellness, remind you about medicines 💊, and more coming soon!";
  if (/medicine|tablet|dose/.test(msg))
    return "To manage medicines, you’ll soon be able to add schedules in my side panel 💊.";
  if (/thanks|thank you/.test(msg))
    return "You’re welcome 😊 Stay consistent with your health!";
  if (/bye|goodbye|see you/.test(msg))
    return "Take care! 🌿 I’ll be here whenever you need me.";
  if (/who made you|creator|developer/.test(msg))
    return "I was built by a brilliant young mind — Arjun 👑!";
  if (/fever|cold|headache/.test(msg))
    return "Make sure you rest well, stay hydrated, and monitor your temperature. 🌡️";
  if (/health|fit|fitness|diet/.test(msg))
    return "Balanced meals 🍎, daily movement 🏃‍♂️, and 7–8h sleep keep you in top shape!";
  if (/love/.test(msg))
    return "Haha ❤️ I’m all logic and care, but I appreciate your kind words!";
  if (/time|date/.test(msg))
    return "It’s " + new Date().toLocaleString();

  // Default fallback
  const responses = [
    "Interesting! Tell me more 🤔",
    "Hmm, that’s good to know!",
    "Could you explain that a bit more?",
    "I’m listening 👂",
    "That’s cool! 💫",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}