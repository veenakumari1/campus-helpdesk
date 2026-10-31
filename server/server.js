import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import complaintsRoutes from './routes/complaints.routes.js';
import referenceRoutes from './routes/reference.routes.js';
import agentRoutes from './routes/agent.routes.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for Vite frontend
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'CampusCare Multi-Agent AI Backend',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api', referenceRoutes);
app.use('/api/agent', agentRoutes);

// Error handling middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[CampusCare Multi-Agent Server] Running on http://localhost:${PORT}`);
    console.log(`[Google Gemini Integration] API Key status: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not set (using verified domain rules fallback)'}`);
  });
}

export default app;

