'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiBell, FiCheckCircle, FiAlertCircle, FiX, FiFileText, FiDollarSign, FiClock } from 'react-icons/fi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';

interface Notificacion {
  id: number;
  referencia_id: number;
  tipo: 'pago_rechazado' | 'pago_confirmado' | 'tarea_pendiente' | 'tarea_atrasada' | 'curso_sin_pagar';
  mensaje: string;
  leido: boolean;
  created_at: string;
  titulo: string;
  valor: number | null;
}

export default function NotificacionesPago() {
  const { usuario } = useAuth();
  const { showAlert } = useAlert();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      const response = await api.get(`/pagos/notificaciones-completas/${usuario.id}`);
      setNotificaciones(response.data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      // Solo mostrar alerta si el dropdown está abierto
      if (showDropdown) {
        showAlert('Error al cargar notificaciones', 'error');
      }
    }
  };

  const marcarComoLeida = async (id: number) => {
    try {
      await api.put(`/pagos/notificaciones/${id}/leer`);
      cargarNotificaciones();
    } catch (error) {
      console.error('Error al marcar notificación:', error);
      showAlert('Error al marcar la notificación como leída', 'error');
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leido).length;

  const toggleDropdown = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: 0
      });
    }
    setShowDropdown(!showDropdown);
  };

  if (usuario?.rol_nombre !== 'Alumno') return null;

  const dropdownContent = showDropdown && mounted ? (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setShowDropdown(false)}
      />
      
      {/* Contenido - Posicionamiento fijo */}
      <div 
        className="fixed w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`
        }}
      >
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
                  {notificaciones.map((notif) => {
                    // Determinar icono y color según el tipo
                    let iconComponent;
                    let colorClass = '';
                    let bgClass = '';
                    let titulo = '';
                    
                    switch (notif.tipo) {
                      case 'pago_confirmado':
                        iconComponent = <FiCheckCircle className="text-green-600 dark:text-green-400" size={20} />;
                        bgClass = 'bg-green-100 dark:bg-green-900/30';
                        colorClass = 'text-green-700 dark:text-green-400';
                        titulo = '✓ Pago Aprobado';
                        break;
                      case 'pago_rechazado':
                        iconComponent = <FiX className="text-red-600 dark:text-red-400" size={20} />;
                        bgClass = 'bg-red-100 dark:bg-red-900/30';
                        colorClass = 'text-red-700 dark:text-red-400';
                        titulo = '✗ Pago Rechazado';
                        break;
                      case 'tarea_pendiente':
                        iconComponent = <FiFileText className="text-blue-600 dark:text-blue-400" size={20} />;
                        bgClass = 'bg-blue-100 dark:bg-blue-900/30';
                        colorClass = 'text-blue-700 dark:text-blue-400';
                        titulo = 'Tarea Pendiente';
                        break;
                      case 'tarea_atrasada':
                        iconComponent = <FiClock className="text-orange-600 dark:text-orange-400" size={20} />;
                        bgClass = 'bg-orange-100 dark:bg-orange-900/30';
                        colorClass = 'text-orange-700 dark:text-orange-400';
                        titulo = '⚠ Tarea Atrasada';
                        break;
                      case 'curso_sin_pagar':
                        iconComponent = <FiDollarSign className="text-purple-600 dark:text-purple-400" size={20} />;
                        bgClass = 'bg-purple-100 dark:bg-purple-900/30';
                        colorClass = 'text-purple-700 dark:text-purple-400';
                        titulo = 'Pago Pendiente';
                        break;
                      default:
                        iconComponent = <FiAlertCircle className="text-gray-600 dark:text-gray-400" size={20} />;
                        bgClass = 'bg-gray-100 dark:bg-gray-900/30';
                        colorClass = 'text-gray-700 dark:text-gray-400';
                        titulo = 'Notificación';
                    }
                    
                    return (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          !notif.leido ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className={`${bgClass} p-2 rounded-full`}>
                              {iconComponent}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className={`text-sm font-semibold ${colorClass}`}>
                                {titulo}
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
                                  {notif.titulo}
                                </p>
                                {notif.valor && (
                                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Q.{Number(notif.valor).toFixed(2)}
                                  </p>
                                )}
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
                    );
                  })}
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
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <FiBell size={24} className="text-gray-600 dark:text-gray-300" />
        {noLeidas > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {noLeidas}
          </span>
        )}
      </button>

      {mounted && typeof window !== 'undefined' && dropdownContent && createPortal(
        dropdownContent,
        document.body
      )}
    </>
  );
}
