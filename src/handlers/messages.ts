import { Namespace, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ChatEvent, Message, PaginationOptions } from '../types';
import { UserStore } from '../stores/UserStore';
import { MessageStore } from '../stores/MessageStore';
import { sanitizeMessage, isMessageValid } from '../utils/sanitize';

export function handleMessages(nsp: Namespace, socket: Socket): void {
  const userStore = UserStore.getInstance();
  const messageStore = MessageStore.getInstance();

  // Send message
  socket.on(ChatEvent.SendMessage, (data: { content: string }) => {
    const user = userStore.getUser(socket.id);
    if (!user || !user.currentRoom) {
      socket.emit(ChatEvent.Error, { message: 'You must join a room first' });
      return;
    }

    const { content } = data;
    if (!isMessageValid(content)) {
      socket.emit(ChatEvent.Error, { message: 'Message is empty or exceeds maximum length (2000 characters)' });
      return;
    }

    const sanitizedContent = sanitizeMessage(content);
    const message: Message = {
      id: uuidv4(),
      roomId: user.currentRoom,
      authorId: user.id,
      authorName: user.username,
      content: sanitizedContent,
      timestamp: new Date(),
      editedAt: null,
      isDeleted: false,
    };

    messageStore.addMessage(message);

    nsp.to(user.currentRoom).emit(ChatEvent.NewMessage, {
      id: message.id,
      roomId: message.roomId,
      authorId: message.authorId,
      authorName: message.authorName,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
    });
  });

  // Edit message
  socket.on(ChatEvent.EditMessage, (data: { messageId: string; content: string }) => {
    const user = userStore.getUser(socket.id);
    if (!user) return;

    const { messageId, content } = data;
    const message = messageStore.getMessage(messageId);

    if (!message) {
      socket.emit(ChatEvent.Error, { message: 'Message not found' });
      return;
    }

    if (message.authorId !== user.id) {
      socket.emit(ChatEvent.Error, { message: 'You can only edit your own messages' });
      return;
    }

    if (!isMessageValid(content)) {
      socket.emit(ChatEvent.Error, { message: 'Invalid message content' });
      return;
    }

    const sanitizedContent = sanitizeMessage(content);
    const updated = messageStore.editMessage(messageId, sanitizedContent);

    if (updated) {
      nsp.to(message.roomId).emit(ChatEvent.MessageEdited, {
        id: updated.id,
        content: updated.content,
        editedAt: updated.editedAt ? updated.editedAt.toISOString() : null,
      });
    }
  });

  // Delete message
  socket.on(ChatEvent.DeleteMessage, (data: { messageId: string }) => {
    const user = userStore.getUser(socket.id);
    if (!user) return;

    const { messageId } = data;
    const message = messageStore.getMessage(messageId);

    if (!message) {
      socket.emit(ChatEvent.Error, { message: 'Message not found' });
      return;
    }

    if (message.authorId !== user.id) {
      socket.emit(ChatEvent.Error, { message: 'You can only delete your own messages' });
      return;
    }

    messageStore.deleteMessage(messageId);
    nsp.to(message.roomId).emit(ChatEvent.MessageDeleted, { id: messageId });
  });

  // Message history with pagination
  socket.on(ChatEvent.MessageHistory, (data: PaginationOptions) => {
    const user = userStore.getUser(socket.id);
    if (!user || !user.currentRoom) {
      socket.emit(ChatEvent.Error, { message: 'You must join a room first' });
      return;
    }

    const limit = Math.min(data.limit || 50, 100);
    const offset = data.offset || 0;

    const messages = messageStore.getRoomMessages(user.currentRoom, { limit, offset });
    const total = messageStore.getRoomMessageCount(user.currentRoom);

    socket.emit('message_history_result', {
      messages: messages.map(m => ({
        id: m.id,
        authorId: m.authorId,
        authorName: m.authorName,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        editedAt: m.editedAt ? m.editedAt.toISOString() : null,
        isDeleted: m.isDeleted,
      })),
      total,
      limit,
      offset,
    });
  });
}
