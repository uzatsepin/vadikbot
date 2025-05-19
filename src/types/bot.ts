import { Context, SessionFlavor } from 'grammy';
import { ConversationFlavor, Conversation, ConversationFlavor as CF } from '@grammyjs/conversations';
import type { Car, Payment, User } from '@prisma/client';

export interface SessionData {
  conversationState: Record<string, any>;
}

// Base context type with session
export type MyContext = Context & SessionFlavor<SessionData>;

// Context type with conversation support
//@ts-ignore
export type MyConversationContext = MyContext & ConversationFlavor;

// Conversation type
export type MyConversation = Conversation<MyConversationContext>;

// Re-export Prisma types
export type { Car, Payment, User };