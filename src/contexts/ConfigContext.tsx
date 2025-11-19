'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface Configuracion {
  nombre_sistema: string;
  logo: string;
  email_contacto: string;
  telefono_contacto: string;
  direccion: string;
  tema_color: string;
}

interface ConfigContextType {
  config: Configuracion | null;
  loading: boolean;
  recargarConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarConfiguracion = async () => {
    try {
      const response = await api.get('/configuracion');
      setConfig(response.data);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      // Configuración por defecto si falla
      setConfig({
        nombre_sistema: 'Class Optima',
        logo: '',
        email_contacto: '',
        telefono_contacto: '',
        direccion: '',
        tema_color: 'blue'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const recargarConfig = async () => {
    setLoading(true);
    await cargarConfiguracion();
  };

  return (
    <ConfigContext.Provider value={{ config, loading, recargarConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig debe ser usado dentro de un ConfigProvider');
  }
  return context;
}
