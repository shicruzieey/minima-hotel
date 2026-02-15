import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "@/integrations/firebase/client";
import { User } from "@/integrations/firebase/types";

export type UserRole = "manager" | "receptionist";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isManager: boolean;
  isAuthenticated: boolean;
  verifyManagerCode: (code: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Manager void code
const MANAGER_VOID_CODE = "1234";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch their data from database
        try {
          const usersRef = ref(db, "users");
          const snapshot = await get(usersRef);

          if (snapshot.exists()) {
            const usersData = snapshot.val();
            // Find user by email
            const userEntry = Object.entries(usersData).find(
              ([_, userData]: [string, any]) => userData.email === firebaseUser.email
            );

            if (userEntry) {
              const [userId, userData] = userEntry as [string, User];
              const userToStore = { ...userData, id: userId };
              setUser(userToStore);
              localStorage.setItem("hotel_user", JSON.stringify(userToStore));
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem("hotel_user");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // First, authenticate with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      
      // Then fetch all users and find by email (no index needed)
      const usersRef = ref(db, "users");
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        console.log("No users found in database");
        await signOut(auth);
        return false;
      }

      // Find user by email
      const usersData = snapshot.val();
      const userEntry = Object.entries(usersData).find(
        ([_, userData]: [string, any]) => userData.email === email
      );

      if (!userEntry) {
        console.log("User not found in database");
        await signOut(auth);
        return false;
      }

      const [userId, userData] = userEntry as [string, User];
      console.log("Found user:", userData);

      // Verify user is active - CRITICAL CHECK
      if (userData.status !== "active") {
        console.log("User account is inactive:", userData.status);
        await signOut(auth);
        throw new Error("ACCOUNT_INACTIVE");
      }

      // Verify role matches
      if (userData.role !== role) {
        console.log("Role mismatch:", userData.role, "vs", role);
        await signOut(auth);
        throw new Error("ROLE_MISMATCH");
      }
      
      // Set user with the Firebase key as id
      const userToStore = { ...userData, id: userId };
      setUser(userToStore);
      localStorage.setItem("hotel_user", JSON.stringify(userToStore));
      console.log("Login successful");
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Re-throw custom errors
      if (error.message === "ACCOUNT_INACTIVE" || error.message === "ROLE_MISMATCH") {
        throw error;
      }
      
      // Handle specific Firebase Auth errors
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        console.log("Invalid credentials");
      } else if (error.code === "auth/invalid-email") {
        console.log("Invalid email format");
      } else if (error.code === "auth/too-many-requests") {
        console.log("Too many failed attempts");
      }
      
      return false;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
      
      // Clear user state
      setUser(null);
      
      // Clear all session data from localStorage
      localStorage.removeItem("hotel_user");
      
      // Clear any other session-related data
      sessionStorage.clear();
      
      console.log("Logout successful - session destroyed");
    } catch (error) {
      console.error("Logout error:", error);
      
      // Force clear even if Firebase signOut fails
      setUser(null);
      localStorage.removeItem("hotel_user");
      sessionStorage.clear();
    }
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
    isLoading,
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
