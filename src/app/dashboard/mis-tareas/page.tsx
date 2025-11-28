'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiDownload, FiUpload, FiCheckCircle, FiAlertCircle, FiClock, FiFileText } from 'react-icons/fi';
import api from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';

interface MiTarea {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_asignacion: string;
  fecha_entrega: string;
  puntos_totales: number;
  archivo_adjunto: string | null;
  curso_nombre: string;
  curso_codigo: string;
  curso_id: number;
  maestro_nombre: string;
  entrega_id: number | null;
  fecha_mi_entrega: string | null;
  archivo_entrega: string | null;
  estado: string | null;
  calificacion: number | null;
  comentarios_calificacion: string | null;
}

export default function MisTareasPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [tareas, setTareas] = useState<MiTarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'entregadas' | 'calificadas'>('todas');

  useEffect(() => {
    cargarTareas();
  }, []);

  const cargarTareas = async () => {
    try {
      const response = await api.get('/tareas/mis-tareas');
      setTareas(response.data);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      showAlert('Error al cargar tus tareas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tareasFiltradas = tareas.filter((tarea) => {
    if (filtro === 'pendientes') return !tarea.entrega_id;
    if (filtro === 'entregadas') return tarea.entrega_id && !tarea.calificacion;
    if (filtro === 'calificadas') return tarea.calificacion !== null;
    return true;
  });

  const getEstadoBadge = (tarea: MiTarea) => {
    if (tarea.calificacion !== null) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <FiCheckCircle size={14} />
          Calificada: {tarea.calificacion}/{tarea.puntos_totales}
        </span>
      );
    }
    if (tarea.entrega_id) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <FiCheckCircle size={14} />
          Entregada
        </span>
      );
    }
    const fechaEntrega = new Date(tarea.fecha_entrega);
    const ahora = new Date();
    if (fechaEntrega < ahora) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <FiAlertCircle size={14} />
          Atrasada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <FiClock size={14} />
        Pendiente
      </span>
    );
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mis Tareas
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gestiona y entrega tus tareas asignadas
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'todas', label: 'Todas', count: tareas.length },
          { key: 'pendientes', label: 'Pendientes', count: tareas.filter(t => !t.entrega_id).length },
          { key: 'entregadas', label: 'Entregadas', count: tareas.filter(t => t.entrega_id && !t.calificacion).length },
          { key: 'calificadas', label: 'Calificadas', count: tareas.filter(t => t.calificacion !== null).length },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFiltro(item.key as any)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filtro === item.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {/* Lista de Tareas */}
      <div className="grid grid-cols-1 gap-4">
        {tareasFiltradas.length > 0 ? (
          tareasFiltradas.map((tarea) => (
            <div
              key={tarea.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/mis-tareas/${tarea.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {tarea.titulo}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tarea.curso_nombre} ({tarea.curso_codigo}) • {tarea.maestro_nombre}
                      </p>
                    </div>
                    {getEstadoBadge(tarea)}
                  </div>

                  {tarea.descripcion && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {tarea.descripcion}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiCalendar size={16} />
                  <span>
                    Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiFileText size={16} />
                  <span>Puntos: {tarea.puntos_totales}</span>
                </div>

                {tarea.fecha_mi_entrega && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <FiCheckCircle size={16} />
                    <span>
                      Entregada el {new Date(tarea.fecha_mi_entrega).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}
              </div>

              {tarea.calificacion !== null && tarea.comentarios_calificacion && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Comentarios:</span> {tarea.comentarios_calificacion}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <FiFileText className="mx-auto text-5xl text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No tienes tareas {filtro !== 'todas' && filtro}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
