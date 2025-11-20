// 📄 store/notification.store.ts

import { markNotificationAsRead } from '@/lib/appwrite';
import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  markRead: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  markRead: async (id: string) => {
    await markNotificationAsRead(id);
    // Optional: decrement locally (or just refetch list)
    // set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },
}));