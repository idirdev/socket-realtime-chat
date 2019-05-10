export interface User {
  id: string;
  username: string;
  avatarColor: string;
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  currentRoom: string | null;
}

export interface Message {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
  editedAt: Date | null;
  isDeleted: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  members: Set<string>;
  maxMembers: number;
  isPrivate: boolean;
}

export enum ChatEvent {
  Connection = 'connection',
  Disconnect = 'disconnect',
  JoinRoom = 'join_room',
  LeaveRoom = 'leave_room',
  SendMessage = 'send_message',
  EditMessage = 'edit_message',
  DeleteMessage = 'delete_message',
  MessageHistory = 'message_history',
  NewMessage = 'new_message',
  MessageEdited = 'message_edited',
  MessageDeleted = 'message_deleted',
  CreateRoom = 'create_room',
  ListRooms = 'list_rooms',
  RoomInfo = 'room_info',
  RoomMembers = 'room_members',
  RoomCreated = 'room_created',
  UserJoined = 'user_joined',
  UserLeft = 'user_left',
  TypingStart = 'typing_start',
  TypingStop = 'typing_stop',
  UserTyping = 'user_typing',
  PresenceUpdate = 'presence_update',
  Error = 'error',
}

export interface TypingStatus {
  userId: string;
  username: string;
  roomId: string;
  isTyping: boolean;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface MessageSearchOptions {
  query: string;
  roomId?: string;
  authorId?: string;
}
