> **Archived** — Kept for reference. Not part of the current portfolio. See [collab-engine](https://github.com/idirdev/collab-engine) instead.

# Socket Realtime Chat

[![TypeScript](https://img.shields.io/badge/TypeScript-3.7-blue.svg)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-2.3-black.svg)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-4.17-lightgrey.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A real-time chat application built with Express and Socket.io. Features multiple rooms, typing indicators, message history with pagination, rate limiting, and input sanitization.

## Features

- **Multi-room chat** - Create and join multiple chat rooms
- **Real-time messaging** - Instant message delivery via WebSocket
- **Typing indicators** - See when other users are typing
- **Message history** - Paginated message retrieval
- **Edit & delete messages** - Modify or remove your own messages
- **User presence** - Online/offline status tracking
- **Rate limiting** - Socket.io middleware to prevent abuse
- **XSS protection** - HTML sanitization on all user input
- **Profanity filter** - Configurable word filter

## Architecture

```
src/
  server.ts             # Express + Socket.io server setup
  types.ts              # TypeScript interfaces and enums
  handlers/
    connection.ts       # Join/leave room, presence, disconnect
    messages.ts         # Send, edit, delete, history
    rooms.ts            # Create, list, info, members
  stores/
    UserStore.ts        # In-memory user management (singleton)
    MessageStore.ts     # In-memory message storage with eviction
    RoomStore.ts        # In-memory room management
  middleware/
    rateLimit.ts        # Per-client event rate limiting
  utils/
    sanitize.ts         # HTML escaping, profanity filter
public/
  index.html            # Vanilla JS chat client
```

## Socket Events

### Client -> Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomId: string }` | Join a chat room |
| `leave_room` | - | Leave current room |
| `send_message` | `{ content: string }` | Send a message to current room |
| `edit_message` | `{ messageId: string, content: string }` | Edit own message |
| `delete_message` | `{ messageId: string }` | Delete own message |
| `message_history` | `{ limit: number, offset: number }` | Fetch message history |
| `create_room` | `{ name, description?, maxMembers?, isPrivate? }` | Create a new room |
| `list_rooms` | - | Get list of public rooms |
| `room_info` | `{ roomId: string }` | Get room details |
| `room_members` | `{ roomId: string }` | Get room member list |
| `typing_start` | - | Notify typing started |
| `typing_stop` | - | Notify typing stopped |

### Server -> Client

| Event | Payload | Description |
|-------|---------|-------------|
| `registered` | `{ user: User }` | Confirm registration |
| `room_joined` | `{ roomId, roomName }` | Confirm room join |
| `new_message` | `Message` | New message in room |
| `message_edited` | `{ id, content, editedAt }` | Message was edited |
| `message_deleted` | `{ id }` | Message was deleted |
| `message_history_result` | `{ messages[], total, limit, offset }` | History response |
| `rooms_list` | `{ rooms[] }` | List of rooms |
| `room_info_result` | `Room` | Room details |
| `room_members_result` | `{ roomId, members[] }` | Room members |
| `room_created` | `Room` | New room broadcast |
| `user_joined` | `{ userId, username, roomId }` | User entered room |
| `user_left` | `{ userId, username, roomId }` | User left room |
| `user_typing` | `TypingStatus` | Typing indicator |
| `presence_update` | `{ userId, username, isOnline }` | Online status |
| `error` | `{ message: string }` | Error notification |

## Setup

### Prerequisites

- Node.js >= 10.x
- npm >= 6.x

### Installation

```bash
git clone https://github.com/youruser/socket-realtime-chat.git
cd socket-realtime-chat
npm install
```

### Development

```bash
npm run build
npm run dev
```

### Production

```bash
npm run build
npm start
```

The server starts on port `3000` by default. Set the `PORT` environment variable to change it:

```bash
PORT=8080 npm start
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (uptime, timestamp) |
| `GET` | `/api/rooms` | List all rooms (JSON) |

## Rate Limiting

The socket middleware enforces:

- **60 events** per 10-second window per client
- **30-second block** on violation
- Automatic cleanup of stale tracking entries

## License

MIT
