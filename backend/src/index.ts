import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { paymentRouter } from './routes/payment';
import { aiRouter } from './routes/ai';
import { enterpriseRouter } from './routes/enterprise';
import { marketplaceRouter } from './routes/marketplace';
import { copyrightRouter } from './routes/copyright';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/ai', aiRouter);
app.use('/api/enterprise', enterpriseRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/copyright', copyrightRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AI Music Platform API running on http://localhost:${PORT}`);
});

export default app;
