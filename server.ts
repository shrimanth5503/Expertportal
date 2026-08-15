import path from 'path';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import { createApp, SUPABASE_SCHEMA_SQL, memoryDatabase, getSupabaseClient, testSupabaseConnection } from './src/server/app.ts';

const PORT = 3000;

export { SUPABASE_SCHEMA_SQL, memoryDatabase, getSupabaseClient, testSupabaseConnection };

export async function startServer() {
  const app = createApp();

  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the HTTP listener if executed directly (not when imported as a serverless function)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default createApp();
