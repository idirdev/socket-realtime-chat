import { v4 as uuidv4 } from 'uuid';
import { Room } from '../types';

export class RoomStore {
  private static instance: RoomStore;
  private rooms: Map<string, Room>;

  private constructor() {
    this.rooms = new Map();
  }

  public static getInstance(): RoomStore {
    if (!RoomStore.instance) {
      RoomStore.instance = new RoomStore();
    }
    return RoomStore.instance;
  }

  public createRoom(
    name: string,
    description: string,
    createdBy: string,
    maxMembers: number,
    isPrivate: boolean,
  ): Room {
    const room: Room = {
      id: uuidv4(),
      name,
      description,
      createdBy,
      createdAt: new Date(),
      members: new Set(),
      maxMembers,
      isPrivate,
    };

    this.rooms.set(room.id, room);
    return room;
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public listRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  public addMember(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.members.size >= room.maxMembers) return false;
    room.members.add(userId);
    return true;
  }

  public removeMember(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    return room.members.delete(userId);
  }

  public getRoomMembers(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.members);
  }

  public deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }
}
