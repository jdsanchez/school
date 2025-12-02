'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiCheckCircle, FiXCircle, FiFileText, FiDownload, FiUser, FiClock, FiAlertCircle, FiEdit, FiCheck, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_asignacion: string;
  fecha_entrega: string;
  puntos_totales: number;
  archivo_adjunto: string | null;
  entrega_id: number | null;
  fecha_mi_entrega: string | null;
  archivo_entrega: string | null;
  estado: string | null;
  calificacion: number | null;
  comentarios_alumno: string | null;
  comentarios_calificacion: string | null;
  estado_real: string;
}

interface Alumno {
  id: number;
  nombre_completo: string;
  email: string;
  codigo_estudiante: string;
}

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
}

const getServerURL = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

export default function TareasAlumnoPage() {
  const { showAlert } = useAlert();
  const params = useParams();
  const router = useRouter();
  const cursoId = params.id as string;
  const alumnoId = params.alumno_id as string;
  
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [accionModal, setAccionModal] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [calificacion, setCalificacion] = useState(0);
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [cursoId, alumnoId]);

  const cargarDatos = async () => {
    try {
      const [tareasRes, cursoRes, alumnoRes] = await Promise.all([
        api.get(`/tareas/curso/${cursoId}/alumno/${alumnoId}`),
        api.get(`/cursos/${cursoId}`),
        api.get(`/usuarios/${alumnoId}`)
      ]);
      setTareas(tareasRes.data);
      setCurso(cursoRes.data);
      setAlumno(alumnoRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showAlert('Error al cargar la información', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado_real: string, calificacion: number | null) => {
    const badges: { [key: string]: { bg: string; text: string; icon: any } } = {
      Rechazada: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Rechazada', icon: FiXCircle },
      Calificada: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Calificada', icon: FiCheckCircle },
      Entregada: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'Entregada', icon: FiFileText },
      'No entregada': { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', text: 'No entregada', icon: FiXCircle },
      Pendiente: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'Pendiente', icon: FiClock },
    };
    
    const badge = badges[estado_real] || { bg: 'bg-gray-100 text-gray-800', text: estado_real, icon: FiAlertCircle };
    const Icon = badge.icon;
    
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${badge.bg}`}>
          <Icon size={12} />
          {badge.text}
        </span>
        {calificacion !== null && (
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            {calificacion} pts
          </span>
        )}
      </div>
    );
  };

  const isAtrasada = (fechaEntrega: string, estado_real: string) => {
    if (estado_real === 'Calificada' || estado_real === 'Entregada') return false;
    return new Date(fechaEntrega) < new Date();
  };

  const abrirModalCalificar = (tarea: Tarea, accion: 'aprobar' | 'rechazar') => {
    setTareaSeleccionada(tarea);
    setAccionModal(accion);
    setCalificacion(tarea.calificacion || 0);
    setComentarios(tarea.comentarios_calificacion || '');
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setTareaSeleccionada(null);
    setCalificacion(0);
    setComentarios('');
  };

  const handleCalificar = async () => {
    if (!tareaSeleccionada) return;

    try {
      // Si la tarea tiene entrega_id, calificar la entrega existente
      if (tareaSeleccionada.entrega_id) {
        await api.put(`/tareas/entregas/${tareaSeleccionada.entrega_id}/calificar`, {
          calificacion,
          comentarios
        });
      } else {
        // Si no tiene entrega_id, crear registro de calificación para no entrega
        await api.post(`/tareas/${tareaSeleccionada.id}/calificar-no-entrega/${alumnoId}`, {
          calificacion,
          comentarios: comentarios || 'No entregó la tarea'
        });
      }

      showAlert('Tarea calificada exitosamente', 'success');
      cerrarModal();
      cargarDatos();
    } catch (error: any) {
      console.error('Error al calificar:', error);
      showAlert(error.response?.data?.mensaje || 'Error al calificar la tarea', 'error');
    }
  };

  const handleRechazar = async () => {
    if (!tareaSeleccionada) return;

    if (!tareaSeleccionada.entrega_id) {
      showAlert('No se puede rechazar una tarea no entregada', 'error');
      return;
    }

    if (!comentarios.trim()) {
      showAlert('Debes agregar comentarios al rechazar una tarea', 'error');
      return;
    }

    try {
      await api.put(`/tareas/entregas/${tareaSeleccionada.entrega_id}/rechazar`, {
        comentarios
      });

      showAlert('Tarea rechazada. El alumno deberá volver a entregarla', 'success');
      cerrarModal();
      cargarDatos();
    } catch (error: any) {
      console.error('Error al rechazar:', error);
      showAlert(error.response?.data?.mensaje || 'Error al rechazar la tarea', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!alumno || !curso) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No se encontró la información</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          Volver
        </button>
      </div>
    );
  }

  const tareasEntregadas = tareas.filter(t => t.estado_real === 'Entregada' || t.estado_real === 'Calificada');
  const tareasPendientes = tareas.filter(t => t.estado_real === 'Pendiente');
  const tareasNoEntregadas = tareas.filter(t => t.estado_real === 'No entregada');
  const tareasRechazadas = tareas.filter(t => t.estado_real === 'Rechazada');

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tareas del Alumno
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {curso.nombre} ({curso.codigo})
          </p>
        </div>
      </div>

      {/* Información del Alumno */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <FiUser className="text-blue-600 dark:text-blue-300" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {alumno.nombre_completo}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {alumno.codigo_estudiante} • {alumno.email}
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tareas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tareas.length}</p>
            </div>
            <FiFileText className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Entregadas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{tareasEntregadas.length}</p>
            </div>
            <FiCheckCircle className="text-green-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{tareasPendientes.length}</p>
            </div>
            <FiClock className="text-yellow-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No Entregadas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{tareasNoEntregadas.length + tareasRechazadas.length}</p>
            </div>
            <FiXCircle className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Todas las Tareas
        </h2>
        
        {tareas.length > 0 ? (
          <div className="space-y-4">
            {tareas.map((tarea) => (
              <div
                key={tarea.id}
                className={`border rounded-lg p-4 ${
                  isAtrasada(tarea.fecha_entrega, tarea.estado_real)
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                } transition-colors`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tarea.titulo}
                      </h3>
                      {isAtrasada(tarea.fecha_entrega, tarea.estado_real) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <FiAlertCircle size={12} />
                          Atrasada
                        </span>
                      )}
                    </div>
                    
                    {tarea.descripcion && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {tarea.descripcion}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FiCalendar size={14} />
                        <span>Asignada: {new Date(tarea.fecha_asignacion).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock size={14} />
                        <span className={isAtrasada(tarea.fecha_entrega, tarea.estado_real) ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                          Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString()} {new Date(tarea.fecha_entrega).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{tarea.puntos_totales} puntos</span>
                      </div>
                    </div>

                    {tarea.archivo_adjunto && (
                      <div className="mt-3">
                        <a
                          href={`${getServerURL()}${tarea.archivo_adjunto}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          <FiDownload size={16} />
                          Descargar archivo de la tarea
                        </a>
                      </div>
                    )}

                    {/* Información de Entrega del Alumno */}
                    {tarea.entrega_id && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Información de entrega:
                        </h4>
                        
                        {tarea.archivo_entrega && (
                          <div className="mb-2">
                            <a
                              href={`${getServerURL()}/uploads/entregas/${tarea.archivo_entrega}`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              <FiDownload size={14} />
                              Descargar archivo entregado
                            </a>
                          </div>
                        )}
                        
                        {tarea.fecha_mi_entrega && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Entregado: {new Date(tarea.fecha_mi_entrega).toLocaleDateString()} a las {new Date(tarea.fecha_mi_entrega).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        
                        {tarea.comentarios_alumno && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Comentarios del alumno:</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{tarea.comentarios_alumno}</p>
                          </div>
                        )}
                        
                        {tarea.comentarios_calificacion && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Comentarios de calificación:</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{tarea.comentarios_calificacion}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {getEstadoBadge(tarea.estado_real, tarea.calificacion)}
                    
                    {/* Botones de Acción */}
                    <div className="flex gap-2 mt-2">
                      {/* Botón Aprobar - Se muestra si no está calificada y no está rechazada */}
                      {tarea.calificacion === null && tarea.estado_real !== 'Rechazada' && (
                        <button
                          onClick={() => abrirModalCalificar(tarea, 'aprobar')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          title="Calificar tarea"
                        >
                          <FiCheck size={16} />
                          Calificar
                        </button>
                      )}
                      
                      {/* Botón Rechazar - Solo si tiene entrega y no está calificada */}
                      {tarea.entrega_id && tarea.calificacion === null && tarea.estado_real !== 'Rechazada' && (
                        <button
                          onClick={() => abrirModalCalificar(tarea, 'rechazar')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          title="Rechazar tarea"
                        >
                          <FiX size={16} />
                          Rechazar
                        </button>
                      )}
                      
                      {/* Botón Editar - Si ya está calificada */}
                      {tarea.calificacion !== null && (
                        <button
                          onClick={() => abrirModalCalificar(tarea, 'aprobar')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          title="Editar calificación"
                        >
                          <FiEdit size={16} />
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay tareas asignadas en este curso
          </div>
        )}
      </div>

      {/* Modal de Calificación */}
      {mostrarModal && tareaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header del Modal */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {accionModal === 'aprobar' ? 'Calificar Tarea' : 'Rechazar Tarea'}
                </h2>
                <button
                  onClick={cerrarModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Información de la Tarea */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {tareaSeleccionada.titulo}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Puntos totales: {tareaSeleccionada.puntos_totales}
                </p>
              </div>

              {/* Información de la entrega */}
              {tareaSeleccionada.archivo_entrega ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FiCalendar size={16} />
                    <span className="text-sm">
                      Entregado el {tareaSeleccionada.fecha_mi_entrega 
                        ? new Date(tareaSeleccionada.fecha_mi_entrega).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : 'Fecha no disponible'}
                    </span>
                  </div>

                  {tareaSeleccionada.comentarios_alumno && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Comentarios del alumno:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {tareaSeleccionada.comentarios_alumno}
                      </p>
                    </div>
                  )}

                  <div>
                    <a
                      href={`${getServerURL()}/uploads/entregas/${tareaSeleccionada.archivo_entrega}`}
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
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
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
                          max={tareaSeleccionada.puntos_totales}
                          step="0.5"
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-gray-500 dark:text-gray-400">
                          / {tareaSeleccionada.puntos_totales}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Comentarios (opcional)
                      </label>
                      <textarea
                        id="comentarios"
                        value={comentarios}
                        onChange={(e) => setComentarios(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                        placeholder="Agrega comentarios sobre la calificación..."
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Motivo del rechazo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="comentarios"
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none"
                      placeholder="Explica por qué rechazas esta tarea..."
                    />
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={cerrarModal}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  {accionModal === 'aprobar' ? (
                    <button
                      onClick={handleCalificar}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Calificar
                    </button>
                  ) : (
                    <button
                      onClick={handleRechazar}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Rechazar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
