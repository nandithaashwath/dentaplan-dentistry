import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.trim() !== ''
  );
  res.json({ status: 'ok', geminiConfigured: hasKey });
});

app.post('/api/ai/chat', async (req, res) => {
  const { message, history = [], clinicContext = '' } = req.body ?? {};
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'A message string is required.' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Gemini API key is not configured in environment.',
      code: 'API_UNAVAILABLE',
    });
    return;
  }

  try {
    const systemInstruction = [
      'You are DentaPlan Clinical & Scheduling Assistant for a boutique dental practice.',
      'Your tone is calm, precise, clinically grounded, and concise.',
      'Never fabricate patient data beyond what is provided in clinicContext.',
      'Always emphasize clinician sign-off for diagnosis, prescriptions, or irreversible treatment plans.',
      clinicContext ? `\nLive Clinic Context:\n${clinicContext}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const formattedHistory = Array.isArray(history)
      ? history
          .slice(-8)
          .map((item: { role?: string; content?: string }) =>
            `${item.role === 'assistant' ? 'Assistant' : 'Clinician'}: ${item.content ?? ''}`
          )
          .join('\n')
      : '';

    const prompt = formattedHistory
      ? `${formattedHistory}\nClinician: ${message}\nAssistant:`
      : message;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({
      text: response.text ?? 'No response generated.',
      model: 'gemini-2.5-flash',
      source: 'gemini',
    });
  } catch (err) {
    const messageText = err instanceof Error ? err.message : 'Upstream Gemini error';
    res.status(502).json({
      error: messageText,
      code: 'UPSTREAM_ERROR',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DentaPlan server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
