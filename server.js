// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve all files (index.html, style.css, script.js, etc.)

// -------------------
// AI Chat Endpoint
// -------------------
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are Arogya AI, a friendly, smart AI health assistant that helps with common health issues, diet, and fitness advice." },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Hmm, I’m not sure. Could you rephrase?";
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Sorry, something went wrong on the server." });
  }
});

// -------------------
// Default route – serve index.html
// -------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// -------------------
// Start Server
// -------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
