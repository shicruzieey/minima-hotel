import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "manager" | "receptionist";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isManager: boolean;
  isAuthenticated: boolean;
  verifyManagerCode: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hardcoded users for demo - in production, use Firebase Auth
const USERS: Record<string, { password: string; user: User }> = {
  manager: {
    password: "manager123",
    user: {
      id: "1",
      username: "manager",
      role: "manager",
      name: "Hotel Manager",
    },
  },
  receptionist: {
    password: "reception123",
    user: {
      id: "2",
      username: "receptionist",
      role: "receptionist",
      name: "Front Desk",
    },
  },
};

// Manager void code
const MANAGER_VOID_CODE = "1234";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem("pos_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const userRecord = USERS[username.toLowerCase()];
    
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user);
      localStorage.setItem("pos_user", JSON.stringify(userRecord.user));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pos_user");
  };

  const verifyManagerCode = (code: string): boolean => {
    return code === MANAGER_VOID_CODE;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isManager: user?.role === "manager",
    isAuthenticated: !!user,
    verifyManagerCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
