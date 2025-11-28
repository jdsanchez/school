'use client';

import { useEffect } from 'react';
import { useConfig } from '@/contexts/ConfigContext';

export default function DynamicTitle() {
  const { config } = useConfig();

  useEffect(() => {
    if (config?.nombre_sistema) {
      document.title = `${config.nombre_sistema} - Sistema de Gestión Escolar`;
    }
  }, [config]);

  return null;
}
