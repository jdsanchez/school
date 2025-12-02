'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiDownload, FiCheck, FiX, FiEdit2, FiEdit, FiUser, FiCalendar, FiFileText } from 'react-icons/fi';
import api, { getServerURL } from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';

interface Entrega {
  entrega_id: number | null;
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  codigo_alumno: string;
  alumno_email: string;
  archivo_entrega: string | null;
  comentarios_alumno: string | null;
  fecha_entrega: string | null;
  estado: string | null;
  estado_real: string;
  calificacion: number | null;
  comentarios_calificacion: string | null;
  fecha_calificacion: string | null;
  calificado_por: number | null;
  calificado_por_nombre: string | null;
  puntos_totales: number;
}

interface Tarea {
  id: number;
  titulo: string;
  puntos_totales: number;
}

export default function EntregasPage() {
  const { showAlert } = useAlert();
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
  const [accionModal, setAccionModal] = useState<'aprobar' | 'rechazar'>('aprobar');

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

  const abrirModalCalificar = (entrega: Entrega) => {
    setEntregaSeleccionada(entrega);
    setCalificacion(entrega.calificacion || 0);
    setComentariosCalificacion(entrega.comentarios_calificacion || '');
    setAccionModal('aprobar');
    setModalAbierto(true);
  };

  const abrirModalRechazar = (entrega: Entrega) => {
    setEntregaSeleccionada(entrega);
    setComentariosCalificacion('');
    setAccionModal('rechazar');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEntregaSeleccionada(null);
    setCalificacion(0);
    setComentariosCalificacion('');
    setAccionModal('aprobar');
  };

  const handleCalificar = async () => {
    if (!entregaSeleccionada || !tarea) return;

    if (calificacion < 0 || calificacion > tarea.puntos_totales) {
      showAlert(`La calificación debe estar entre 0 y ${tarea.puntos_totales}`, 'warning');
      return;
    }

    setCalificando(true);

    try {
      // Si tiene entrega_id, es una entrega existente
      if (entregaSeleccionada.entrega_id) {
        await api.put(`/tareas/entregas/${entregaSeleccionada.entrega_id}/calificar`, {
          calificacion,
          comentarios: comentariosCalificacion.trim() || null
        });
      } else {
        // No entregó, crear registro de no entrega con calificación
        await api.post(`/tareas/${tareaId}/calificar-no-entrega/${entregaSeleccionada.alumno_id}`, {
          calificacion,
          comentarios: comentariosCalificacion.trim() || 'No entregó la tarea'
        });
      }
      
      showAlert('Tarea calificada exitosamente', 'success');
      cerrarModal();
      cargarDatos();
    } catch (error: any) {
      console.error('Error al calificar:', error);
      showAlert(error.response?.data?.mensaje || 'Error al calificar la entrega', 'error');
    } finally {
      setCalificando(false);
    }
  };

  const handleRechazar = async () => {
    if (!entregaSeleccionada) return;

    if (!entregaSeleccionada.entrega_id) {
      showAlert('No se puede rechazar una tarea que no fue entregada', 'warning');
      return;
    }

    if (!comentariosCalificacion.trim()) {
      showAlert('Debes agregar comentarios explicando por qué se rechaza la tarea', 'warning');
      return;
    }

    setCalificando(true);

    try {
      await api.put(`/tareas/entregas/${entregaSeleccionada.entrega_id}/rechazar`, {
        comentarios: comentariosCalificacion.trim()
      });
      
      showAlert('Tarea rechazada. El alumno deberá volver a entregarla.', 'success');
      cerrarModal();
      cargarDatos();
    } catch (error: any) {
      console.error('Error al rechazar:', error);
      showAlert(error.response?.data?.mensaje || 'Error al rechazar la entrega', 'error');
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
    const estado = entrega.estado_real;
    
    if (estado === 'Rechazada') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <FiX size={12} />
          Rechazada
        </span>
      );
    }
    if (estado === 'Calificada' || entrega.calificacion !== null) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <FiCheck size={12} />
          Calificada
        </span>
      );
    }
    if (estado === 'Entregada') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <FiFileText size={12} />
          Entregada
        </span>
      );
    }
    if (estado === 'No entregada') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <FiX size={12} />
          No entregada
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
                  <tr key={`${entrega.alumno_id}-${entrega.entrega_id || 'no-entrega'}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                            {entrega.codigo_alumno}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entrega.fecha_entrega ? (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(entrega.fecha_entrega).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
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
                        {/* Botón descargar solo si entregó archivo */}
                        {entrega.archivo_entrega && (
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
                        )}
                        {/* Botones de calificar/rechazar */}
                        {entrega.estado_real !== 'Rechazada' && entrega.calificacion === null && (
                          <>
                            <button
                              onClick={() => abrirModalCalificar(entrega)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title={entrega.entrega_id ? 'Aprobar y calificar' : 'Calificar (no entregó)'}
                            >
                              <FiCheck size={18} />
                            </button>
                            {entrega.entrega_id && (
                              <button
                                onClick={() => abrirModalRechazar(entrega)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Rechazar entrega"
                              >
                                <FiX size={18} />
                              </button>
                            )}
                          </>
                        )}
                        {/* Si ya está calificada, permitir editar */}
                        {entrega.calificacion !== null && (
                          <button
                            onClick={() => abrirModalCalificar(entrega)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar calificación"
                          >
                            <FiEdit size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
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
                        {entrega.estado !== 'Rechazada' && (
                          <>
                            <button
                              onClick={() => abrirModalCalificar(entrega)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title={entrega.calificacion !== null ? 'Editar calificación' : 'Calificar'}
                            >
                              <FiCheck size={18} />
                            </button>
                            <button
                              onClick={() => abrirModalRechazar(entrega)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Rechazar entrega"
                            >
                              <FiX size={18} />
                            </button>
                          </>
                        )}
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
                    {accionModal === 'aprobar' ? 'Calificar Entrega' : 'Rechazar Entrega'}
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
              {entregaSeleccionada.archivo_entrega ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FiCalendar size={16} />
                    <span className="text-sm">
                      Entregado el {entregaSeleccionada.fecha_entrega 
                        ? new Date(entregaSeleccionada.fecha_entrega).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : 'Fecha no disponible'}
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
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <FiFileText className="text-yellow-600 dark:text-yellow-400" size={20} />
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                      Este alumno no entregó archivo para esta tarea
                    </p>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                    Puedes asignar una calificación de 0 puntos o cualquier otra calificación.
                  </p>
                </div>
              )}

              {/* Formulario de calificación */}
              <div className="space-y-4">
                {accionModal === 'aprobar' ? (
                  <>
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
                  </>
                ) : (
                  <div>
                    <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Razón del rechazo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="comentarios"
                      value={comentariosCalificacion}
                      onChange={(e) => setComentariosCalificacion(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Explica por qué se rechaza la tarea. El alumno deberá volver a entregarla."
                    />
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                {accionModal === 'aprobar' ? (
                  <button
                    onClick={handleCalificar}
                    disabled={calificando}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {calificando ? 'Guardando...' : 'Aprobar y Calificar'}
                  </button>
                ) : (
                  <button
                    onClick={handleRechazar}
                    disabled={calificando}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {calificando ? 'Rechazando...' : 'Rechazar Tarea'}
                  </button>
                )}
                <button
                  onClick={cerrarModal}
                  disabled={calificando}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
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
