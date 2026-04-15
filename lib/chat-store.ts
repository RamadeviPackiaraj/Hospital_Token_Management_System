"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatMessage, ChatSender } from "@/lib/chat";
import { apiRequest } from "@/lib/api";
import { mapChatMessageFromApi } from "@/lib/chat";

type ChatStoreState = {
  messages: ChatMessage[];
  replaceConversationMessages: (conversationId: string, nextMessages: ChatMessage[]) => void;
  upsertMessage: (message: ChatMessage) => void;
  removeMessage: (id: string) => void;
  markConversationAsRead: (conversationId: string, readerRole: ChatSender, readAt?: number | null) => void;
  clearConversation: (conversationId: string) => void;
  fetchMessages: (doctorId: string, hospitalId: string, conversationId?: string) => Promise<void>;
};

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort((left, right) => {
    if (left.createdAt === right.createdAt) {
      return left.id.localeCompare(right.id);
    }

    return left.createdAt - right.createdAt;
  });
}

function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(existing.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, {
      ...byId.get(message.id),
      ...message,
    });
  }

  return sortMessages(Array.from(byId.values()));
}

export const CHAT_STORAGE_KEY = "chat-storage";

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set) => ({
      messages: [],
      replaceConversationMessages: (conversationId, nextMessages) =>
        set((state) => {
          const otherMessages = state.messages.filter((message) => message.conversationId !== conversationId);
          return {
            messages: sortMessages([...otherMessages, ...nextMessages]),
          };
        }),
      upsertMessage: (message) =>
        set((state) => ({
          messages: mergeMessages(state.messages, [message]),
        })),
      removeMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((message) => message.id !== id),
        })),
      markConversationAsRead: (conversationId, readerRole, readAt = Date.now()) =>
        set((state) => {
          let changed = false;

          const nextMessages = state.messages.map((message) => {
            if (message.conversationId !== conversationId || message.sender === readerRole || message.isRead) {
              return message;
            }

            changed = true;
            return { ...message, isRead: true, readAt };
          });

          return changed ? { messages: nextMessages } : state;
        }),
      clearConversation: (conversationId) =>
        set((state) => ({
          messages: state.messages.filter((message) => message.conversationId !== conversationId),
        })),
      fetchMessages: async (doctorId, hospitalId, conversationId) => {
        try {
          const query = new URLSearchParams({ doctorId, hospitalId, limit: "100" });
          if (conversationId) query.set("conversationId", conversationId);
          const response = await apiRequest<{ items: any[] }>(`/chat/messages?${query.toString()}`);
          const apiMessages = response.items.map((message) => mapChatMessageFromApi(message));

          set((state) => ({
            messages: conversationId
              ? sortMessages([
                  ...state.messages.filter((message) => message.conversationId !== conversationId),
                  ...apiMessages,
                ])
              : mergeMessages(state.messages, apiMessages),
          }));
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      },
    }),
    {
      name: CHAT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
