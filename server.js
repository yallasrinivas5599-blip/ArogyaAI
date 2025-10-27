// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are Arogya AI — a caring, expert health assistant. 
You provide advice on daily health issues, explain causes, suggest remedies, 
and remind users that this is not a substitute for a doctor. 
Keep answers short, clear, and human-like. 
When users mention symptoms like fever, neck pain, or cough — 
give medical guidance, possible causes, and home care tips. 
End responses with empathy (like "Take care 💚").`,
        },
        { role: "user", content: userMessage },
      ],
    });

    const botReply = completion.choices[0].message.content;
    res.json({ reply: botReply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ reply: "😞 Sorry, I'm facing a small issue. Try again later." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
