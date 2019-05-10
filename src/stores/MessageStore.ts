import { Message, PaginationOptions, MessageSearchOptions } from '../types';

export class MessageStore {
  private static instance: MessageStore;
  private messages: Map<string, Message>; // messageId -> Message
  private roomMessages: Map<string, string[]>; // roomId -> messageId[]
  private maxMessagesPerRoom: number;

  private constructor() {
    this.messages = new Map();
    this.roomMessages = new Map();
    this.maxMessagesPerRoom = 1000;
  }

  public static getInstance(): MessageStore {
    if (!MessageStore.instance) {
      MessageStore.instance = new MessageStore();
    }
    return MessageStore.instance;
  }

  public addMessage(message: Message): void {
    this.messages.set(message.id, message);

    if (!this.roomMessages.has(message.roomId)) {
      this.roomMessages.set(message.roomId, []);
    }

    const roomMsgs = this.roomMessages.get(message.roomId)!;
    roomMsgs.push(message.id);

    // Evict oldest messages if over limit
    if (roomMsgs.length > this.maxMessagesPerRoom) {
      const evictedId = roomMsgs.shift()!;
      this.messages.delete(evictedId);
    }
  }

  public getMessage(messageId: string): Message | undefined {
    return this.messages.get(messageId);
  }

  public editMessage(messageId: string, newContent: string): Message | undefined {
    const message = this.messages.get(messageId);
    if (!message || message.isDeleted) return undefined;

    message.content = newContent;
    message.editedAt = new Date();
    return message;
  }

  public deleteMessage(messageId: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    message.isDeleted = true;
    message.content = '[Message deleted]';
    return true;
  }

  public getRoomMessages(roomId: string, pagination: PaginationOptions): Message[] {
    const messageIds = this.roomMessages.get(roomId);
    if (!messageIds) return [];

    const { limit, offset } = pagination;
    // Return messages in reverse chronological order (newest first), then slice
    const reversed = [...messageIds].reverse();
    const sliced = reversed.slice(offset, offset + limit);

    return sliced
      .map(id => this.messages.get(id))
      .filter((m): m is Message => m !== undefined);
  }

  public getRoomMessageCount(roomId: string): number {
    const messageIds = this.roomMessages.get(roomId);
    return messageIds ? messageIds.length : 0;
  }

  public searchMessages(options: MessageSearchOptions): Message[] {
    const { query, roomId, authorId } = options;
    const queryLower = query.toLowerCase();
    const results: Message[] = [];

    for (const message of this.messages.values()) {
      if (message.isDeleted) continue;
      if (roomId && message.roomId !== roomId) continue;
      if (authorId && message.authorId !== authorId) continue;
      if (message.content.toLowerCase().includes(queryLower)) {
        results.push(message);
      }
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public clearRoomMessages(roomId: string): void {
    const messageIds = this.roomMessages.get(roomId);
    if (messageIds) {
      messageIds.forEach(id => this.messages.delete(id));
      this.roomMessages.delete(roomId);
    }
  }
}
