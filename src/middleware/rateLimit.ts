import { Socket } from 'socket.io';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap: Map<string, RateLimitEntry> = new Map();

const MAX_EVENTS_PER_WINDOW = 60;
const WINDOW_MS = 10000; // 10 seconds
const BLOCK_DURATION_MS = 30000; // 30 second block on violation

const blockedClients: Map<string, number> = new Map();

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
  for (const [key, blockedUntil] of blockedClients.entries()) {
    if (now > blockedUntil) {
      blockedClients.delete(key);
    }
  }
}, 60000);

export function rateLimitMiddleware(socket: Socket, next: (err?: any) => void): void {
  const clientId = socket.handshake.address || socket.id;

  // Check if client is blocked
  const blockedUntil = blockedClients.get(clientId);
  if (blockedUntil && Date.now() < blockedUntil) {
    const err = new Error('Rate limit exceeded. Please wait before reconnecting.');
    (err as any).data = { type: 'RATE_LIMIT' };
    return next(err);
  }

  next();

  // Wrap the emit to track outgoing events
  const originalOnevent = (socket as any).onevent;
  (socket as any).onevent = function (packet: any) {
    const now = Date.now();
    let entry = rateLimitMap.get(clientId);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      rateLimitMap.set(clientId, entry);
    }

    entry.count++;

    if (entry.count > MAX_EVENTS_PER_WINDOW) {
      blockedClients.set(clientId, now + BLOCK_DURATION_MS);
      socket.emit('error', {
        message: 'Rate limit exceeded. You are temporarily blocked.',
        retryAfter: BLOCK_DURATION_MS / 1000,
      });
      socket.disconnect(true);
      return;
    }

    originalOnevent.call(this, packet);
  };
}
