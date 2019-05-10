import { Namespace, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ChatEvent, User } from '../types';
import { UserStore } from '../stores/UserStore';
import { RoomStore } from '../stores/RoomStore';

const AVATAR_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#16a085',
];

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function handleConnection(nsp: Namespace, socket: Socket): void {
  const userStore = UserStore.getInstance();
  const roomStore = RoomStore.getInstance();

  // Register user on connection
  const username = (socket.handshake.query.username as string) || `User_${socket.id.slice(0, 6)}`;
  const user: User = {
    id: uuidv4(),
    username: username,
    avatarColor: getRandomColor(),
    joinedAt: new Date(),
    lastSeen: new Date(),
    isOnline: true,
    currentRoom: null,
  };

  userStore.addUser(socket.id, user);
  socket.emit('registered', { user });

  // Join room
  socket.on(ChatEvent.JoinRoom, (data: { roomId: string }) => {
    const { roomId } = data;
    const room = roomStore.getRoom(roomId);
    const currentUser = userStore.getUser(socket.id);

    if (!room) {
      socket.emit(ChatEvent.Error, { message: 'Room not found' });
      return;
    }

    if (!currentUser) {
      socket.emit(ChatEvent.Error, { message: 'User not registered' });
      return;
    }

    if (room.members.size >= room.maxMembers) {
      socket.emit(ChatEvent.Error, { message: 'Room is full' });
      return;
    }

    // Leave current room if in one
    if (currentUser.currentRoom) {
      socket.leave(currentUser.currentRoom);
      roomStore.removeMember(currentUser.currentRoom, currentUser.id);
      nsp.to(currentUser.currentRoom).emit(ChatEvent.UserLeft, {
        userId: currentUser.id,
        username: currentUser.username,
        roomId: currentUser.currentRoom,
      });
    }

    socket.join(roomId);
    roomStore.addMember(roomId, currentUser.id);
    userStore.updateUser(socket.id, { currentRoom: roomId });

    nsp.to(roomId).emit(ChatEvent.UserJoined, {
      userId: currentUser.id,
      username: currentUser.username,
      roomId,
    });

    socket.emit('room_joined', { roomId, roomName: room.name });
  });

  // Leave room
  socket.on(ChatEvent.LeaveRoom, () => {
    const currentUser = userStore.getUser(socket.id);
    if (!currentUser || !currentUser.currentRoom) return;

    const roomId = currentUser.currentRoom;
    socket.leave(roomId);
    roomStore.removeMember(roomId, currentUser.id);
    userStore.updateUser(socket.id, { currentRoom: null });

    nsp.to(roomId).emit(ChatEvent.UserLeft, {
      userId: currentUser.id,
      username: currentUser.username,
      roomId,
    });
  });

  // Typing indicator
  socket.on(ChatEvent.TypingStart, () => {
    const currentUser = userStore.getUser(socket.id);
    if (!currentUser || !currentUser.currentRoom) return;

    socket.to(currentUser.currentRoom).emit(ChatEvent.UserTyping, {
      userId: currentUser.id,
      username: currentUser.username,
      roomId: currentUser.currentRoom,
      isTyping: true,
    });
  });

  socket.on(ChatEvent.TypingStop, () => {
    const currentUser = userStore.getUser(socket.id);
    if (!currentUser || !currentUser.currentRoom) return;

    socket.to(currentUser.currentRoom).emit(ChatEvent.UserTyping, {
      userId: currentUser.id,
      username: currentUser.username,
      roomId: currentUser.currentRoom,
      isTyping: false,
    });
  });

  // Disconnect cleanup
  socket.on(ChatEvent.Disconnect, () => {
    const currentUser = userStore.getUser(socket.id);
    if (!currentUser) return;

    if (currentUser.currentRoom) {
      roomStore.removeMember(currentUser.currentRoom, currentUser.id);
      nsp.to(currentUser.currentRoom).emit(ChatEvent.UserLeft, {
        userId: currentUser.id,
        username: currentUser.username,
        roomId: currentUser.currentRoom,
      });
    }

    userStore.setOffline(socket.id);
    nsp.emit(ChatEvent.PresenceUpdate, {
      userId: currentUser.id,
      username: currentUser.username,
      isOnline: false,
    });
  });
}
