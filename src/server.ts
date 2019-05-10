import express from 'express';
import http from 'http';
import socketIo from 'socket.io';
import cors from 'cors';
import path from 'path';
import { ChatEvent } from './types';
import { handleConnection } from './handlers/connection';
import { handleMessages } from './handlers/messages';
import { handleRooms } from './handlers/rooms';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { RoomStore } from './stores/RoomStore';

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  origins: CORS_ORIGIN,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Express middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API endpoint: list rooms
app.get('/api/rooms', (_req, res) => {
  const rooms = RoomStore.getInstance().listRooms();
  res.json(rooms.map(room => ({
    id: room.id,
    name: room.name,
    description: room.description,
    memberCount: room.members.size,
    maxMembers: room.maxMembers,
    isPrivate: room.isPrivate,
  })));
});

// Create default "General" room
const roomStore = RoomStore.getInstance();
roomStore.createRoom('General', 'The main chat room', 'system', 100, false);

// Chat namespace
const chatNamespace = io.of('/chat');

chatNamespace.use(rateLimitMiddleware);

chatNamespace.on(ChatEvent.Connection, (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);

  handleConnection(chatNamespace, socket);
  handleMessages(chatNamespace, socket);
  handleRooms(chatNamespace, socket);

  socket.on(ChatEvent.Disconnect, () => {
    console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
  });
});

// Fallback: serve index.html for SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  chatNamespace.emit('server_shutdown', { message: 'Server is shutting down' });
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`=================================`);
  console.log(` Socket Realtime Chat Server`);
  console.log(` Running on port ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(` Chat:   http://localhost:${PORT}`);
  console.log(`=================================`);
});

export { io, server };
