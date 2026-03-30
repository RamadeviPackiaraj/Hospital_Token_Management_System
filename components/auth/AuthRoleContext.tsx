"use client";

import * as React from "react";
import { AuthRole, isAuthRole } from "@/lib/auth-flow";

const STORAGE_KEY = "hospital_token_selected_role";

interface AuthRoleContextValue {
  selectedRole: AuthRole | null;
  setSelectedRole: (role: AuthRole | null) => void;
}

const AuthRoleContext = React.createContext<AuthRoleContextValue | null>(null);

export function AuthRoleProvider({ children }: { children: React.ReactNode }) {
  const [selectedRole, setSelectedRoleState] = React.useState<AuthRole | null>(null);

  React.useEffect(() => {
    const storedRole = window.localStorage.getItem(STORAGE_KEY);
    setSelectedRoleState(isAuthRole(storedRole) ? storedRole : "doctor");
  }, []);

  const setSelectedRole = React.useCallback((role: AuthRole | null) => {
    setSelectedRoleState(role);

    if (typeof window === "undefined") return;

    if (role) {
      window.localStorage.setItem(STORAGE_KEY, role);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <AuthRoleContext.Provider value={{ selectedRole, setSelectedRole }}>
      {children}
    </AuthRoleContext.Provider>
  );
}

export function useAuthRole() {
  const context = React.useContext(AuthRoleContext);

  if (!context) {
    throw new Error("useAuthRole must be used within AuthRoleProvider.");
  }

  return context;
}
