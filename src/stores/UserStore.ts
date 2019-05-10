import { User } from '../types';

export class UserStore {
  private static instance: UserStore;
  private users: Map<string, User>; // socketId -> User
  private socketToUser: Map<string, string>; // socketId -> userId

  private constructor() {
    this.users = new Map();
    this.socketToUser = new Map();
  }

  public static getInstance(): UserStore {
    if (!UserStore.instance) {
      UserStore.instance = new UserStore();
    }
    return UserStore.instance;
  }

  public addUser(socketId: string, user: User): void {
    this.users.set(socketId, user);
    this.socketToUser.set(socketId, user.id);
  }

  public getUser(socketId: string): User | undefined {
    return this.users.get(socketId);
  }

  public getUserById(userId: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.id === userId) return user;
    }
    return undefined;
  }

  public updateUser(socketId: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(socketId);
    if (!user) return undefined;

    const updated: User = { ...user, ...updates, lastSeen: new Date() };
    this.users.set(socketId, updated);
    return updated;
  }

  public setOffline(socketId: string): void {
    const user = this.users.get(socketId);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      user.currentRoom = null;
    }
  }

  public removeUser(socketId: string): void {
    this.socketToUser.delete(socketId);
    this.users.delete(socketId);
  }

  public getOnlineUsers(): User[] {
    return Array.from(this.users.values()).filter(u => u.isOnline);
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  public getOnlineCount(): number {
    return this.getOnlineUsers().length;
  }
}
