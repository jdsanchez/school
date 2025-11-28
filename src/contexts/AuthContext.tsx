'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol_nombre: string;
  rol_id: number;
  activo: boolean;
  foto_perfil?: string;
}

interface Permiso {
  menu_id: number;
  menu_nombre: string;
  menu_ruta: string;
  icono: string;
  submenu_id?: number;
  submenu_nombre?: string;
  submenu_ruta?: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  permisos: Permiso[];
  loading: boolean;
  login: (identificador: string, password: string) => Promise<void>;
  logout: () => void;
  verificarAuth: () => Promise<void>;
  actualizarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);

  const verificarAuth = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await api.get('/auth/verificar');
      setUsuario(data.usuario);
      setPermisos(data.permisos);
    } catch (error) {
      Cookies.remove('token');
      setUsuario(null);
      setPermisos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verificarAuth();
  }, []);

  const login = async (identificador: string, password: string) => {
    const { data } = await api.post('/auth/login', { identificador, password });
    Cookies.set('token', data.token, { expires: 7 });
    setUsuario(data.usuario);
    
    // Cargar permisos
    const permisosRes = await api.get('/auth/verificar');
    setPermisos(permisosRes.data.permisos);
  };

  const logout = () => {
    Cookies.remove('token');
    setUsuario(null);
    setPermisos([]);
  };

  const actualizarUsuario = async () => {
    try {
      const { data } = await api.get('/auth/verificar');
      setUsuario(data.usuario);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, permisos, loading, login, logout, verificarAuth, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
