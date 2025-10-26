// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve your HTML/CSS/JS

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userMessage }],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("Error from OpenAI:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Arogya AI server running on port ${PORT}`)
);
