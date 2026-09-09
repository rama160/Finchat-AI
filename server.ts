import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Helper to initialize Gemini safely
  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  // Health check routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString()
    });
  });

  // Gemini Chat Endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, systemInstruction } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on server',
          fallback: true
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ],
        config: {
          systemInstruction: systemInstruction || 
            'Anda adalah Finchat AI, asisten keuangan pribadi cerdas berbahasa Indonesia. Berikan jawaban yang ramah, ringkas, solutif dan akurat seputar keuangan, pengeluaran, pemasukan, dan tips hemat.'
        }
      });

      const reply = response.text || '';
      return res.json({ reply });
    } catch (err: any) {
      console.error('Gemini Chat Error:', err);
      return res.status(500).json({ error: err.message || 'Error processing chat' });
    }
  });

  // Gemini Receipt OCR Endpoint
  app.post('/api/gemini/ocr', async (req, res) => {
    try {
      const { image } = req.body;
      const ai = getGeminiClient();

      if (!ai || !image) {
        return res.status(503).json({ error: 'Gemini not available or no image provided' });
      }

      // Extract base64 and mime type
      const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid base64 image data' });
      }

      const mimeType = match[1];
      const base64Data = match[2];

      const prompt = `Analisis struk pembelian ini. Ekstrak data struk dalam format JSON valid:
{
  "merchant": "Nama Toko atau Merchant",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "description": "Nama detail barang",
      "amount": 100000
    }
  ],
  "grand_total": 600000
}
Pastikan description menyimpan detail asli barang, bukan kategori. Kembalikan HANYA JSON murni tanpa markdown triple backticks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      });

      const raw = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Gemini OCR Error:', err);
      return res.status(500).json({ error: err.message || 'Error processing OCR' });
    }
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    if (typeof (globalThis as any).__dirname !== 'undefined') {
      delete (globalThis as any).__dirname;
    }
    if (typeof (global as any).__dirname !== 'undefined') {
      delete (global as any).__dirname;
    }

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    console.log(`Finchat AI Server is ready.`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please check running processes.`);
    } else {
      console.error('Server error:', err);
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
