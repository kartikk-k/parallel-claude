import { create } from 'zustand';

export type SessionStatus = 'idle' | 'running' | 'waiting_input' | 'completed' | 'error';

interface SessionState {
  status: SessionStatus;
  lastActivity: number;
  contentSnapshot: string;
}

interface SessionManagerState {
  sessions: Record<string, SessionState>;
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void;
  updateSessionContent: (sessionId: string, content: string) => void;
  getSessionStatus: (sessionId: string) => SessionStatus;
  clearSession: (sessionId: string) => void;
}

export const useSessionManagerStore = create<SessionManagerState>((set, get) => ({
  sessions: {},

  updateSessionStatus: (sessionId: string, status: SessionStatus) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...state.sessions[sessionId],
          status,
          lastActivity: Date.now(),
        },
      },
    })),

  updateSessionContent: (sessionId: string, content: string) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...state.sessions[sessionId],
          contentSnapshot: content,
          lastActivity: Date.now(),
        },
      },
    })),

  getSessionStatus: (sessionId: string) => {
    const session = get().sessions[sessionId];
    return session?.status || 'idle';
  },

  clearSession: (sessionId: string) =>
    set((state) => {
      const { [sessionId]: _, ...rest } = state.sessions;
      return { sessions: rest };
    }),
}));
