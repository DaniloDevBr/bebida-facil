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
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'usuarios', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userRole = data.role ? String(data.role).trim().toLowerCase() : 'cliente';
          setRole(userRole === 'admin' ? 'admin' : 'cliente');
        } else {
          console.warn("Documento de usuário não encontrado, fallback para 'cliente'");
          setRole('cliente');
        }
      } catch (err) {
        console.error('Erro ao buscar role:', err);
        setRole('cliente'); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return (
    <AuthRoleContext.Provider value={{ role, loading }}>
      {children}
    </AuthRoleContext.Provider>
  );
};

export const useAuthRole = () => useContext(AuthRoleContext);
