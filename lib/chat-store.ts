"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatMessage, ChatMessageType, ChatSender } from "@/lib/chat";
import { createMessage } from "@/lib/chat";
import { apiRequest } from "@/lib/api";

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
  fetchMessages: (doctorId: string, hospitalId: string, conversationId?: string) => Promise<void>;
  sendMessageApi: (input: {
    doctorId: string;
    hospitalId: string;
    message: string;
    type: ChatMessageType;
  }) => Promise<void>;
  updateMessageApi: (id: string, message: string) => Promise<void>;
};

export const CHAT_STORAGE_KEY = "chat-storage";

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
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
      fetchMessages: async (doctorId, hospitalId, conversationId) => {
        try {
          const query = new URLSearchParams({ doctorId, hospitalId, limit: '100' });
          if (conversationId) query.set('conversationId', conversationId);
          const response = await apiRequest<{ items: any[] }>(`/chat/messages?${query.toString()}`);
          const apiMessages = response.items.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            sender: msg.sender,
            message: msg.message,
            type: msg.type,
            createdAt: new Date(msg.createdAt).getTime(),
            isRead: msg.isRead,
          }));
          set((state) => {
            // Merge with existing messages, preferring API data
            const existingIds = new Set(apiMessages.map(m => m.id));
            const localMessages = state.messages.filter(m => !existingIds.has(m.id) && (!conversationId || m.conversationId === conversationId));
            return { messages: [...localMessages, ...apiMessages] };
          });
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      },
      sendMessageApi: async ({ doctorId, hospitalId, message, type }) => {
        try {
          const response = await apiRequest('/chat/messages', {
            method: 'POST',
            body: JSON.stringify({ doctorId, hospitalId, message, type }),
          });
          const apiMessage = {
            id: response.id,
            conversationId: response.conversationId,
            sender: response.sender,
            message: response.message,
            type: response.type,
            createdAt: new Date(response.createdAt).getTime(),
            isRead: response.isRead,
          };
          set((state) => ({
            messages: [...state.messages, apiMessage],
          }));
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      },
      updateMessageApi: async (id, message) => {
        try {
          await apiRequest(`/chat/messages/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ message }),
          });
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id ? { ...msg, message } : msg
            ),
          }));
        } catch (error) {
          console.error('Failed to update message:', error);
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
