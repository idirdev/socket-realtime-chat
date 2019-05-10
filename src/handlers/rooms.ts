import { Namespace, Socket } from 'socket.io';
import { ChatEvent } from '../types';
import { UserStore } from '../stores/UserStore';
import { RoomStore } from '../stores/RoomStore';

export function handleRooms(nsp: Namespace, socket: Socket): void {
  const userStore = UserStore.getInstance();
  const roomStore = RoomStore.getInstance();

  // Create room
  socket.on(ChatEvent.CreateRoom, (data: {
    name: string;
    description?: string;
    maxMembers?: number;
    isPrivate?: boolean;
  }) => {
    const user = userStore.getUser(socket.id);
    if (!user) {
      socket.emit(ChatEvent.Error, { message: 'User not registered' });
      return;
    }

    const { name, description, maxMembers, isPrivate } = data;

    if (!name || name.trim().length === 0 || name.length > 50) {
      socket.emit(ChatEvent.Error, { message: 'Room name must be between 1 and 50 characters' });
      return;
    }

    const existingRooms = roomStore.listRooms();
    const duplicate = existingRooms.find(r => r.name.toLowerCase() === name.trim().toLowerCase());
    if (duplicate) {
      socket.emit(ChatEvent.Error, { message: 'A room with that name already exists' });
      return;
    }

    const room = roomStore.createRoom(
      name.trim(),
      description || '',
      user.id,
      maxMembers || 50,
      isPrivate || false,
    );

    nsp.emit(ChatEvent.RoomCreated, {
      id: room.id,
      name: room.name,
      description: room.description,
      createdBy: user.username,
      maxMembers: room.maxMembers,
      isPrivate: room.isPrivate,
    });
  });

  // List rooms
  socket.on(ChatEvent.ListRooms, () => {
    const rooms = roomStore.listRooms();
    const roomList = rooms
      .filter(room => !room.isPrivate)
      .map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        memberCount: room.members.size,
        maxMembers: room.maxMembers,
      }));

    socket.emit('rooms_list', { rooms: roomList });
  });

  // Room info
  socket.on(ChatEvent.RoomInfo, (data: { roomId: string }) => {
    const room = roomStore.getRoom(data.roomId);
    if (!room) {
      socket.emit(ChatEvent.Error, { message: 'Room not found' });
      return;
    }

    socket.emit('room_info_result', {
      id: room.id,
      name: room.name,
      description: room.description,
      createdAt: room.createdAt.toISOString(),
      memberCount: room.members.size,
      maxMembers: room.maxMembers,
      isPrivate: room.isPrivate,
    });
  });

  // Room members
  socket.on(ChatEvent.RoomMembers, (data: { roomId: string }) => {
    const room = roomStore.getRoom(data.roomId);
    if (!room) {
      socket.emit(ChatEvent.Error, { message: 'Room not found' });
      return;
    }

    const allUsers = userStore.getAllUsers();
    const members = allUsers
      .filter(u => room.members.has(u.id))
      .map(u => ({
        id: u.id,
        username: u.username,
        avatarColor: u.avatarColor,
        isOnline: u.isOnline,
      }));

    socket.emit('room_members_result', { roomId: room.id, members });
  });
}
