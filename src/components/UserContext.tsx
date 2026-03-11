"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface UserProfile {
  name: string;
  email: string;
}

interface UserContextValue {
  user: UserProfile | null;
  setUser: (profile: UserProfile) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
  clearUser: () => {},
});

const STORAGE_KEY = "reverbic_user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUserState(JSON.parse(stored));
    } catch {}
  }, []);

  const setUser = useCallback((profile: UserProfile) => {
    setUserState(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
