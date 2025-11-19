'use client';

import { useState, useEffect } from 'react';
import { FiBell, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Notificacion {
  id: number;
  pago_id: number;
  tipo: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
  curso_nombre: string;
  monto: number;
}

export default function NotificacionesPago() {
  const { usuario } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario?.rol_nombre === 'Alumno') {
      cargarNotificaciones();
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [usuario]);

  const cargarNotificaciones = async () => {
    if (!usuario) return;
    
    try {
      const response = await api.get(`/pagos/notificaciones/${usuario.id}`);
      setNotificaciones(response.data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  const marcarComoLeida = async (id: number) => {
    try {
      await api.put(`/pagos/notificaciones/${id}/leer`);
      cargarNotificaciones();
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leido).length;

  if (usuario?.rol_nombre !== 'Alumno') return null;

  return (
    <div className="relative">
      {/* Botón de Notificaciones */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <FiBell size={24} className="text-gray-600 dark:text-gray-300" />
        {noLeidas > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {noLeidas}
          </span>
        )}
      </button>

      {/* Dropdown de Notificaciones */}
      {showDropdown && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Contenido */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Notificaciones de Pagos
              </h3>
              {noLeidas > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {noLeidas} notificación{noLeidas !== 1 ? 'es' : ''} sin leer
                </p>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notificaciones.length === 0 ? (
                <div className="p-8 text-center">
                  <FiBell className="mx-auto text-5xl text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No tienes notificaciones
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notificaciones.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !notif.leido ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {notif.tipo === 'Confirmado' ? (
                            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                              <FiCheckCircle className="text-green-600 dark:text-green-400" size={20} />
                            </div>
                          ) : (
                            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                              <FiAlertCircle className="text-red-600 dark:text-red-400" size={20} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm font-semibold ${
                              notif.tipo === 'Confirmado' 
                                ? 'text-green-700 dark:text-green-400' 
                                : 'text-red-700 dark:text-red-400'
                            }`}>
                              {notif.tipo === 'Confirmado' ? '✓ Pago Aprobado' : '✗ Pago Rechazado'}
                            </p>
                            {!notif.leido && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {notif.mensaje}
                          </p>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {notif.curso_nombre}
                              </p>
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Q{Number(notif.monto).toFixed(2)}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </p>
                              {!notif.leido && (
                                <button
                                  onClick={() => marcarComoLeida(notif.id)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Marcar como leída
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notificaciones.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <button
                  onClick={() => {
                    notificaciones.forEach(n => !n.leido && marcarComoLeida(n.id));
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Marcar todas como leídas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
