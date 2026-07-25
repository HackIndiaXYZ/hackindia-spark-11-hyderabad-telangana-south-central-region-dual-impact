import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isMock: boolean;
  loginWithEmail: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signupWithEmail: (email: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: UserProfile = {
  uid: 'mock-user-id-123',
  email: 'varshita@kitchen.ai',
  displayName: 'Varshita',
  photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  createdAt: Date.now(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true); // Default to mock mode for easy preview

  useEffect(() => {
    // Attempt to load saved user session
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
    setLoading(false);
  }, []);

  const loginWithEmail = async (email: string, password: string, rememberMe: boolean) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      const profile: UserProfile = {
        uid: 'user-' + Math.random().toString(36).substr(2, 9),
        email: email,
        displayName: email.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
        createdAt: Date.now(),
      };
      setUser(profile);
      if (rememberMe) {
        localStorage.setItem('user_session', JSON.stringify(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, displayName: string) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const profile: UserProfile = {
        uid: 'user-' + Math.random().toString(36).substr(2, 9),
        email: email,
        displayName: displayName || email.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${displayName}`,
        createdAt: Date.now(),
      };
      setUser(profile);
      localStorage.setItem('user_session', JSON.stringify(profile));
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUser(MOCK_USER);
      localStorage.setItem('user_session', JSON.stringify(MOCK_USER));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUser(null);
      localStorage.removeItem('user_session');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log(`Password reset email sent to: ${email}`);
  };

  const updateProfileName = async (displayName: string) => {
    if (!user) return;
    const updated = { ...user, displayName };
    setUser(updated);
    localStorage.setItem('user_session', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isMock,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
