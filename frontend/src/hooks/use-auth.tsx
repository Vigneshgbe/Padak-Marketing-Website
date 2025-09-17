// src/hooks/use-auth.tsx
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Define the User interface here as the source of truth for user structure
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  accountType: 'student' | 'professional' | 'business' | 'agency' | 'admin';
  profileImage?: string;
  phone?: string;
  company?: string;
  website?: string;
  bio?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // <--- ADDED: The authentication token
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // <--- ADDED: State for the token
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        
        if (storedToken && userData) {
          const parsedUser = JSON.parse(userData);
          // Basic validation for parsedUser to ensure it's valid
          if (parsedUser && typeof parsedUser.id === 'number' && typeof parsedUser.email === 'string') {
            setUser(parsedUser);
            setToken(storedToken); // <--- SET TOKEN ON INITIAL LOAD
          } else {
            // Clear invalid data if user data is malformed
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('userData');
            console.warn("Invalid user data found in storage, cleared.");
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Ensure to clear invalid data and set states to null if parsing fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
        setUser(null);
        setToken(null); // <--- ENSURE TOKEN IS CLEARED ON ERROR
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/login',  {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      if (data.token && data.user) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.token); // <--- SET TOKEN ON LOGIN SUCCESS
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    setUser(null);
    setToken(null); // <--- CLEAR TOKEN ON LOGOUT
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Ensure the user data in storage is also updated if it's there
      if (localStorage.getItem('userData')) {
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      } else if (sessionStorage.getItem('userData')) {
        sessionStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    }
  };

  const isAuthenticated = !!user && !!token; // <--- RECOMMENDED: Authenticated implies both user data AND token

  // In your useAuth hook
const refreshUser = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
    }
  } catch (error) {
    console.error('Failed to refresh user data:', error);
  }
};


  return (
    <AuthContext.Provider 
      value={{
        user,
        token, // <--- EXPOSE THE TOKEN HERE
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};