'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiImage } from 'react-icons/fi';
import api from '@/lib/api';
import { useConfig } from '@/contexts/ConfigContext';

interface Configuracion {
  nombre_sistema: string;
  logo: string;
  email_contacto: string;
  telefono_contacto: string;
  direccion: string;
}

export default function ConfiguracionPage() {
  const { recargarConfig } = useConfig();
  const [config, setConfig] = useState<Configuracion>({
    nombre_sistema: '',
    logo: '',
    email_contacto: '',
    telefono_contacto: '',
    direccion: '',
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await api.get('/configuracion');
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const formData = new FormData();
      formData.append('nombre_sistema', config.nombre_sistema);
      formData.append('email_contacto', config.email_contacto);
      formData.append('telefono_contacto', config.telefono_contacto);
      formData.append('direccion', config.direccion);
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await api.put('/configuracion', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Recargar configuración en el contexto
      await recargarConfig();
      
      alert('Configuración actualizada exitosamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfig({
      ...config,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configuración del Sistema
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Información General
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Sistema
              </label>
              <input
                type="text"
                name="nombre_sistema"
                value={config.nombre_sistema}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Class Optima"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo del Sistema
              </label>
              <div className="flex items-center gap-4">
                {config.logo && (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${config.logo}`}
                    alt="Logo"
                    className="h-20 w-20 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                )}
                {logoFile && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Nuevo archivo: {logoFile.name}
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  <FiImage />
                  Cambiar Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email de Contacto
              </label>
              <input
                type="email"
                name="email_contacto"
                value={config.email_contacto}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="contacto@classoptima.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                name="telefono_contacto"
                value={config.telefono_contacto}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="+502 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dirección
              </label>
              <textarea
                name="direccion"
                value={config.direccion}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Dirección del establecimiento educativo"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <FiSave />
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
