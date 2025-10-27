// server.js - minimal Express server serving static files; no external API calls required
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// allow JSON parsing
app.use(express.json());

// serve static files from repo root (index.html, style.css, script.js)
app.use(express.static(__dirname));

// health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// any other GET → serve index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
