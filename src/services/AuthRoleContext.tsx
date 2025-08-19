// src/services/AuthRoleContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

interface AuthRoleContextType {
  role: 'admin' | 'cliente' | null;
  loading: boolean;
}

const AuthRoleContext = createContext<AuthRoleContextType>({ role: null, loading: true });

export const AuthRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<'admin' | 'cliente' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const docSnap = await getDoc(doc(db, 'usuarios', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRole(data.role || 'cliente');
      }
      setLoading(false);
    };
    fetchRole();
  }, [user]);

  return <AuthRoleContext.Provider value={{ role, loading }}>{children}</AuthRoleContext.Provider>;
};

export const useAuthRole = () => useContext(AuthRoleContext);
