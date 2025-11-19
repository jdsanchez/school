'use client';

import { useState, useEffect } from 'react';
import { FiBook, FiCalendar, FiUser, FiClock, FiMapPin, FiCheckCircle, FiAlertCircle, FiDollarSign, FiPlus, FiX } from 'react-icons/fi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  maestro_nombre: string;
  creditos: number;
  costo: number;
  horario: string;
  aula: string;
  cupo_maximo: number;
  alumnos_inscritos: number;
}

interface MiCurso {
  id: number;
  curso_id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  maestro_nombre: string;
  creditos: number;
  costo: number;
  horario: string;
  aula: string;
  fecha_inscripcion: string;
  estado_inscripcion: string;
  estado_pago: string | null;
  monto_pago: number | null;
}

export default function MisCursosPage() {
  const { usuario } = useAuth();
  const [misAsignaciones, setMisAsignaciones] = useState<MiCurso[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<Curso | null>(null);
  const [activeTab, setActiveTab] = useState<'mis-cursos' | 'disponibles'>('mis-cursos');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      await Promise.all([cargarMisAsignaciones(), cargarCursosDisponibles()]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMisAsignaciones = async () => {
    try {
      const response = await api.get('/cursos/mis-asignaciones');
      setMisAsignaciones(response.data);
    } catch (error) {
      console.error('Error al cargar mis asignaciones:', error);
    }
  };

  const cargarCursosDisponibles = async () => {
    try {
      const response = await api.get('/cursos');
      // Filtrar solo cursos en los que NO estoy inscrito
      const disponibles = response.data.filter((curso: any) => !curso.esta_inscrito);
      setCursosDisponibles(disponibles);
    } catch (error) {
      console.error('Error al cargar cursos disponibles:', error);
    }
  };

  const abrirModalAsignacion = (curso: Curso) => {
    setCursoSeleccionado(curso);
    setShowModal(true);
  };

  const confirmarAsignacion = async () => {
    if (!cursoSeleccionado || !usuario) return;

    try {
      await api.post('/cursos/inscribir', {
        curso_id: cursoSeleccionado.id,
        alumno_id: usuario.id
      });
      alert('¡Te has asignado al curso exitosamente!');
      setShowModal(false);
      setCursoSeleccionado(null);
      cargarDatos();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al asignarse al curso');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: any = {
      'Inscrito': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Activo': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Completado': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Retirado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const getPagoBadge = (estado: string | null) => {
    if (!estado) return { bg: 'bg-gray-100 text-gray-800', text: 'Sin Pago' };
    
    const badges: any = {
      'Pagado': { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Pagado' },
      'Pendiente': { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'Pendiente' },
      'Atrasado': { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Atrasado' },
      'Parcial': { bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', text: 'Parcial' }
    };
    return badges[estado] || { bg: 'bg-gray-100 text-gray-800', text: estado };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Cursos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona tus asignaciones de cursos y explora nuevos cursos disponibles
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('mis-cursos')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'mis-cursos'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Mis Asignaciones ({misAsignaciones.length})
          </button>
          <button
            onClick={() => setActiveTab('disponibles')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'disponibles'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Cursos Disponibles ({cursosDisponibles.length})
          </button>
        </nav>
      </div>

      {/* Mis Asignaciones */}
      {activeTab === 'mis-cursos' && (
        <div>
          {misAsignaciones.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <FiBook className="mx-auto text-5xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No tienes cursos asignados
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Explora los cursos disponibles y asígnate a uno
              </p>
              <button
                onClick={() => setActiveTab('disponibles')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ver Cursos Disponibles
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {misAsignaciones.map((curso) => (
                <div
                  key={curso.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {curso.nombre}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{curso.codigo}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(curso.estado_inscripcion)}`}>
                      {curso.estado_inscripcion}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {curso.descripcion}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <FiUser size={16} />
                      <span>{curso.maestro_nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock size={16} />
                      <span>{curso.horario}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMapPin size={16} />
                      <span>{curso.aula}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCalendar size={16} />
                      <span>Inscrito: {new Date(curso.fecha_inscripcion).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Estado de Pago</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPagoBadge(curso.estado_pago).bg}`}>
                          {getPagoBadge(curso.estado_pago).text}
                        </span>
                      </div>
                      {curso.costo > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Costo</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            Q{Number(curso.costo).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cursos Disponibles */}
      {activeTab === 'disponibles' && (
        <div>
          {cursosDisponibles.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <FiCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                Ya estás asignado a todos los cursos disponibles
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursosDisponibles.map((curso) => (
                <div
                  key={curso.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {curso.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{curso.codigo}</p>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {curso.descripcion}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <FiUser size={16} />
                      <span>{curso.maestro_nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock size={16} />
                      <span>{curso.horario}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMapPin size={16} />
                      <span>{curso.aula}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCalendar size={16} />
                      <span>
                        {new Date(curso.fecha_inicio).toLocaleDateString()} - {new Date(curso.fecha_fin).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cupo</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {curso.alumnos_inscritos}/{curso.cupo_maximo}
                      </p>
                    </div>
                    {curso.costo > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Costo</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          Q{Number(curso.costo).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => abrirModalAsignacion(curso)}
                    disabled={curso.alumnos_inscritos >= curso.cupo_maximo}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      curso.alumnos_inscritos >= curso.cupo_maximo
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <FiPlus size={16} />
                    {curso.alumnos_inscritos >= curso.cupo_maximo ? 'Cupo Lleno' : 'Asignarme a este Curso'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmación */}
      {showModal && cursoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Confirmar Asignación
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCursoSeleccionado(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {cursoSeleccionado.nombre}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {cursoSeleccionado.codigo}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Maestro:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {cursoSeleccionado.maestro_nombre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Horario:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {cursoSeleccionado.horario}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Aula:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {cursoSeleccionado.aula}
                  </span>
                </div>
                {cursoSeleccionado.costo > 0 && (
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Costo:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      Q{Number(cursoSeleccionado.costo).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex gap-2">
                <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Al asignarte a este curso, se agregará a tu lista de cursos. 
                  {cursoSeleccionado.costo > 0 && ' Recuerda realizar el pago correspondiente.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setCursoSeleccionado(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAsignacion}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
