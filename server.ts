import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { connectDB, disconnectDB } from './server/config/db.ts';
import { initSocketIO } from './server/sockets.ts';
import { authRouter } from './server/routes/auth.ts';
import { moviesRouter } from './server/routes/movies.ts';
import { theatresRouter } from './server/routes/theatres.ts';
import { showsRouter } from './server/routes/shows.ts';
import { seatsRouter } from './server/routes/seats.ts';
import { bookingsRouter } from './server/routes/bookings.ts';
import { paymentsRouter } from './server/routes/payments.ts';
import { watchlistRouter } from './server/routes/watchlist.ts';
import { reviewsRouter } from './server/routes/reviews.ts';
import { notificationsRouter } from './server/routes/notifications.ts';
import { adminRouter } from './server/routes/admin.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
initSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: 'MongoDB (Mongoose)',
    app: 'iMovies - Movie Ticket Booking Made Simple',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/theatres', theatresRouter);
app.use('/api/shows', showsRouter);
app.use('/api/shows', seatsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/users/watchlist', watchlistRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);

// Development vs Production serving
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  // 1. Establish MongoDB connection before accepting traffic
  await connectDB();

  // 2. Setup Vite middleware (Dev) or Static files (Prod)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // 3. Start listening
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 iMovies Full-Stack MERN Server running on http://localhost:${PORT}`);
  });
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\nShutting down server gracefully...');
  await disconnectDB();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  await disconnectDB();
  server.close(() => process.exit(0));
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
