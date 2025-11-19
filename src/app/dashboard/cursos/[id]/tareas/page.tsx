'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload, FiUpload, FiCalendar, FiFileText } from 'react-icons/fi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_asignacion: string;
  fecha_entrega: string;
  puntos_totales: number;
  archivo_adjunto: string | null;
  curso_nombre: string;
  curso_codigo: string;
  creado_por_nombre: string;
  total_entregas: number;
  entregas_calificadas: number;
}

export default function TareasCursoPage() {
  const params = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const cursoId = params.id as string;
  
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [curso, setCurso] = useState<any>(null);

  useEffect(() => {
    cargarDatos();
  }, [cursoId]);

  const cargarDatos = async () => {
    try {
      const [tareasRes, cursoRes] = await Promise.all([
        api.get(`/tareas/curso/${cursoId}`),
        api.get(`/cursos/${cursoId}`)
      ]);
      setTareas(tareasRes.data);
      setCurso(cursoRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
    
    try {
      await api.delete(`/tareas/${id}`);
      alert('Tarea eliminada exitosamente');
      cargarDatos();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al eliminar tarea');
    }
  };

  const puedeCrearTareas = () => {
    return ['Admin', 'Director', 'Maestro'].includes(usuario?.rol_nombre || '');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tareas del Curso
            </h1>
            {curso && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {curso.nombre} ({curso.codigo})
              </p>
            )}
          </div>
        </div>

        {puedeCrearTareas() && (
          <button
            onClick={() => router.push(`/dashboard/cursos/${cursoId}/tareas/nueva`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus />
            Nueva Tarea
          </button>
        )}
      </div>

      {/* Lista de Tareas */}
      <div className="grid grid-cols-1 gap-4">
        {tareas.length > 0 ? (
          tareas.map((tarea) => (
            <div
              key={tarea.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {tarea.titulo}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {tarea.descripcion}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FiCalendar size={16} />
                      <span>
                        Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FiFileText size={16} />
                      <span>Puntos: {tarea.puntos_totales}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FiUpload size={16} />
                      <span>
                        {tarea.total_entregas} entregas ({tarea.entregas_calificadas} calificadas)
                      </span>
                    </div>
                  </div>

                  {tarea.archivo_adjunto && (
                    <div className="mt-3">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}${tarea.archivo_adjunto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <FiDownload size={16} />
                        Descargar archivo adjunto
                      </a>
                    </div>
                  )}
                </div>

                {puedeCrearTareas() && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/dashboard/cursos/${cursoId}/tareas/${tarea.id}/entregas`)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      title="Ver entregas"
                    >
                      <FiEye size={18} />
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/cursos/${cursoId}/tareas/${tarea.id}/editar`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleEliminar(tarea.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <FiFileText className="mx-auto text-5xl text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No hay tareas asignadas en este curso
            </p>
            {puedeCrearTareas() && (
              <button
                onClick={() => router.push(`/dashboard/cursos/${cursoId}/tareas/nueva`)}
                className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Crear la primera tarea
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
