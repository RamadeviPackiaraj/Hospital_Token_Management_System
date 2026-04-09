"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatMessage, ChatMessageType, ChatSender } from "@/lib/chat";
import { createMessage } from "@/lib/chat";

type ChatStoreState = {
  messages: ChatMessage[];
  addMessage: (input: {
    conversationId: string;
    sender: ChatSender;
    message: string;
    type: ChatMessageType;
  }) => void;
  editMessage: (id: string, updatedText: string) => void;
  deleteMessage: (id: string) => void;
  markAsRead: (id: string) => void;
  markConversationAsRead: (conversationId: string, viewer: ChatSender) => void;
  clearConversation: (conversationId: string) => void;
};

export const CHAT_STORAGE_KEY = "chat-storage";

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: ({ conversationId, sender, message, type }) =>
        set((state) => ({
          messages: [
            ...state.messages,
            createMessage(sender, message, type, conversationId, false),
          ],
        })),
      editMessage: (id, updatedText) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id ? { ...message, message: updatedText } : message
          ),
        })),
      deleteMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((message) => message.id !== id),
        })),
      markAsRead: (id) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id ? { ...message, isRead: true } : message
          ),
        })),
      markConversationAsRead: (conversationId, viewer) =>
        set((state) => {
          let changed = false;
          const nextMessages = state.messages.map((message) => {
            if (message.conversationId !== conversationId || message.sender === viewer || message.isRead) {
              return message;
            }

            changed = true;
            return { ...message, isRead: true };
          });

          return changed ? { messages: nextMessages } : state;
        }),
      clearConversation: (conversationId) =>
        set((state) => ({
          messages: state.messages.filter((message) => message.conversationId !== conversationId),
        })),
    }),
    {
      name: CHAT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
