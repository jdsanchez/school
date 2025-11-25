'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiDownload, FiCheck, FiX, FiEdit2, FiUser, FiCalendar } from 'react-icons/fi';
import api from '@/lib/api';

interface Entrega {
  id: number;
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  alumno_codigo: string;
  fecha_entrega: string;
  archivo_entrega: string;
  comentarios: string | null;
  estado: string;
  calificacion: number | null;
  comentarios_calificacion: string | null;
  fecha_calificacion: string | null;
  calificado_por: number | null;
  calificador_nombre: string | null;
}

interface Tarea {
  id: number;
  titulo: string;
  puntos_totales: number;
}

export default function EntregasPage() {
  const router = useRouter();
  const params = useParams();
  const cursoId = params?.id as string;
  const tareaId = params?.tarea_id as string;

  const [loading, setLoading] = useState(true);
  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'calificadas'>('todas');
  
  // Estado del modal de calificación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState<Entrega | null>(null);
  const [calificacion, setCalificacion] = useState<number>(0);
  const [comentariosCalificacion, setComentariosCalificacion] = useState('');
  const [calificando, setCalificando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [tareaId]);

  const cargarDatos = async () => {
    try {
      // Cargar información de la tarea
      const responseTareas = await api.get(`/tareas/curso/${cursoId}`);
      const tareaEncontrada = responseTareas.data.find((t: any) => t.id === parseInt(tareaId));
      setTarea(tareaEncontrada || null);

      // Cargar entregas
      const responseEntregas = await api.get(`/tareas/${tareaId}/entregas`);
      setEntregas(responseEntregas.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCalificacion = (entrega: Entrega) => {
    setEntregaSeleccionada(entrega);
    setCalificacion(entrega.calificacion || 0);
    setComentariosCalificacion(entrega.comentarios_calificacion || '');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEntregaSeleccionada(null);
    setCalificacion(0);
    setComentariosCalificacion('');
  };

  const handleCalificar = async () => {
    if (!entregaSeleccionada || !tarea) return;

    if (calificacion < 0 || calificacion > tarea.puntos_totales) {
      alert(`La calificación debe estar entre 0 y ${tarea.puntos_totales}`);
      return;
    }

    setCalificando(true);

    try {
      await api.put(`/tareas/entregas/${entregaSeleccionada.id}/calificar`, {
        calificacion,
        comentarios_calificacion: comentariosCalificacion.trim() || null
      });
      
      alert('Entrega calificada exitosamente');
      cerrarModal();
      cargarDatos();
    } catch (error: any) {
      console.error('Error al calificar:', error);
      alert(error.response?.data?.message || 'Error al calificar la entrega');
    } finally {
      setCalificando(false);
    }
  };

  const entregasFiltradas = entregas.filter((entrega) => {
    if (filtro === 'pendientes') return entrega.calificacion === null;
    if (filtro === 'calificadas') return entrega.calificacion !== null;
    return true;
  });

  const getEstadoBadge = (entrega: Entrega) => {
    if (entrega.calificacion !== null) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <FiCheck size={12} />
          Calificada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
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

  if (!tarea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Tarea no encontrada</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Entregas: {tarea.titulo}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {entregas.length} entregas • {entregas.filter(e => e.calificacion !== null).length} calificadas
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'todas', label: 'Todas', count: entregas.length },
          { key: 'pendientes', label: 'Pendientes', count: entregas.filter(e => e.calificacion === null).length },
          { key: 'calificadas', label: 'Calificadas', count: entregas.filter(e => e.calificacion !== null).length },
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

      {/* Lista de entregas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {entregasFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Alumno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha de entrega
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Calificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {entregasFiltradas.map((entrega) => (
                  <tr key={entrega.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {entrega.alumno_nombre[0]}{entrega.alumno_apellido[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {entrega.alumno_nombre} {entrega.alumno_apellido}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {entrega.alumno_codigo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(entrega.fecha_entrega).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(entrega)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entrega.calificacion !== null ? (
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {entrega.calificacion}/{tarea.puntos_totales}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <a
                          href={`${getServerURL()}/uploads/entregas/${entrega.archivo_entrega}`}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Descargar entrega"
                        >
                          <FiDownload size={18} />
                        </a>
                        <button
                          onClick={() => abrirModalCalificacion(entrega)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title={entrega.calificacion !== null ? 'Editar calificación' : 'Calificar'}
                        >
                          <FiEdit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No hay entregas {filtro !== 'todas' && filtro}
            </p>
          </div>
        )}
      </div>

      {/* Modal de calificación */}
      {modalAbierto && entregaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header del modal */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Calificar Entrega
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {entregaSeleccionada.alumno_nombre} {entregaSeleccionada.alumno_apellido}
                  </p>
                </div>
                <button
                  onClick={cerrarModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Información de la entrega */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FiCalendar size={16} />
                  <span className="text-sm">
                    Entregado el {new Date(entregaSeleccionada.fecha_entrega).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {entregaSeleccionada.comentarios && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Comentarios del alumno:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {entregaSeleccionada.comentarios}
                    </p>
                  </div>
                )}

                <div>
                  <a
                    href={`${getServerURL()}/uploads/entregas/${entregaSeleccionada.archivo_entrega}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <FiDownload />
                    Descargar archivo
                  </a>
                </div>
              </div>

              {/* Formulario de calificación */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="calificacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calificación <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      id="calificacion"
                      value={calificacion}
                      onChange={(e) => setCalificacion(parseFloat(e.target.value) || 0)}
                      min="0"
                      max={tarea.puntos_totales}
                      step="0.5"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <span className="text-gray-500 dark:text-gray-400">
                      / {tarea.puntos_totales}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comentarios (opcional)
                  </label>
                  <textarea
                    id="comentarios"
                    value={comentariosCalificacion}
                    onChange={(e) => setComentariosCalificacion(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Agrega comentarios sobre la calificación..."
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  onClick={handleCalificar}
                  disabled={calificando}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {calificando ? 'Guardando...' : 'Guardar Calificación'}
                </button>
                <button
                  onClick={cerrarModal}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
