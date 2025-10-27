// server.js - serves static UI and /chat API
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname)); // serve index.html, style.css, script.js at root

// Placeholder AI function (used when OPENAI_API_KEY not present or when fallback needed)
function placeholderReply(userText){
  const txt = (userText || "").toLowerCase();
  if(!txt.trim()) return "Could you say that again?";
  if(/hi|hello|hey/.test(txt)) return "Hi! 👋 How can I help with your health today?";
  if(/fever|temperature/.test(txt)) return "For fever: rest, hydrate, and take fever reducers like Paracetamol if appropriate. If >39°C or symptoms worsen, see a doctor.";
  if(/neck pain|stiff neck/.test(txt)) return "Neck pain often from posture or strain. Try gentle stretches, warm compresses, and avoid heavy phone use. Seek medical care if severe or persistent.";
  if(/diet|eat|food/.test(txt)) return "Eat balanced meals with fruits, veggies and protein. Stay hydrated and limit processed foods.";
  if(/tablet|paracetamol|ibuprofen|amoxicillin/.test(txt)) return "I can give general info: always follow the label or your prescriber's instructions. Ask about a specific medicine for details.";
  if(/help|what can you do/.test(txt)) return "I can give basic advice on symptoms, explain common medicines, and suggest home care. I'm not a replacement for a doctor.";
  // fallback friendly prompts
  const suggestions = [
    "Tell me more about your symptom.",
    "When did this start?",
    "Do you have any allergies or other illnesses?",
  ];
  return suggestions[Math.floor(Math.random()*suggestions.length)];
}

// Core chat route
app.post('/chat', async (req, res) => {
  const { message } = req.body || {};
  // if no API key, return placeholder reply
  if(!process.env.OPENAI_API_KEY) {
    const reply = placeholderReply(message);
    return res.json({ reply });
  }

  // Try to call OpenAI
  try {
    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: `You are Arogya AI, a caring medical assistant. Give concise, safe, helpful guidance. Always include a short safety disclaimer: "Not a replacement for professional care." Keep language simple.` },
          { role: "user", content: message }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await openaiResp.json();
    if(data?.error){
      console.error('OpenAI error', data.error);
      return res.json({ reply: placeholderReply(message) });
    }
    const reply = data.choices?.[0]?.message?.content || placeholderReply(message);
    return res.json({ reply });
  } catch (err) {
    console.error('API call error', err);
    return res.json({ reply: placeholderReply(message) });
  }
});

// fallback direct SPA route - serve index.html for any other get
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
