'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiCalendar } from 'react-icons/fi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
}

interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  codigo_alumno: string;
  presente: boolean;
  asistencia_id?: number;
}

export default function AsistenciaPage() {
  const { usuario } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarCursos();
  }, []);

  useEffect(() => {
    if (cursoSeleccionado) {
      cargarAlumnos();
    }
  }, [cursoSeleccionado, fecha]);

  const cargarCursos = async () => {
    try {
      const response = await api.get('/cursos');
      setCursos(response.data.filter((c: any) => c.activo));
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    }
  };

  const cargarAlumnos = async () => {
    try {
      const response = await api.get(`/cursos/${cursoSeleccionado}/alumnos`);
      
      // Verificar asistencias de la fecha seleccionada
      const asistenciasRes = await api.get('/asistencia', {
        params: { curso_id: cursoSeleccionado, fecha_inicio: fecha, fecha_fin: fecha }
      });
      
      const alumnosConAsistencia = response.data.map((alumno: any) => {
        const asistencia = asistenciasRes.data.find((a: any) => a.alumno_id === alumno.id);
        return {
          ...alumno,
          presente: asistencia?.estado === 'Presente',
          asistencia_id: asistencia?.id
        };
      });
      
      setAlumnos(alumnosConAsistencia);
    } catch (error) {
      console.error('Error al cargar alumnos:', error);
    }
  };

  const toggleAsistencia = (alumnoId: number) => {
    setAlumnos(alumnos.map(alumno => 
      alumno.id === alumnoId 
        ? { ...alumno, presente: !alumno.presente }
        : alumno
    ));
  };

  const marcarTodos = (estado: boolean) => {
    setAlumnos(alumnos.map(alumno => ({ ...alumno, presente: estado })));
  };

  const handleGuardarAsistencia = async () => {
    if (!cursoSeleccionado) {
      alert('Selecciona un curso primero');
      return;
    }

    setGuardando(true);

    try {
      await Promise.all(
        alumnos.map(alumno =>
          api.post('/asistencia', {
            alumno_id: alumno.id,
            curso_id: cursoSeleccionado,
            fecha: fecha,
            estado: alumno.presente ? 'Presente' : 'Ausente'
          })
        )
      );

      alert('Asistencia guardada exitosamente');
      cargarAlumnos();
    } catch (error: any) {
      console.error('Error al guardar asistencia:', error);
      alert(error.response?.data?.error || 'Error al guardar asistencia');
    } finally {
      setGuardando(false);
    }
  };

  const totalPresentes = alumnos.filter(a => a.presente).length;
  const totalAusentes = alumnos.filter(a => !a.presente).length;
  const porcentajeAsistencia = alumnos.length > 0 
    ? Math.round((totalPresentes / alumnos.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Control de Asistencia
        </h1>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Curso *
            </label>
            <select
              value={cursoSeleccionado || ''}
              onChange={(e) => setCursoSeleccionado(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecciona un curso...</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.codigo} - {curso.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha *
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {cursoSeleccionado && (
        <>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Alumnos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {alumnos.length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Presentes</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {totalPresentes}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Porcentaje</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {porcentajeAsistencia}%
              </p>
            </div>
          </div>

          {/* Lista de Alumnos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lista de Alumnos - {new Date(fecha).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => marcarTodos(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Marcar Todos
                </button>
                <button
                  onClick={() => marcarTodos(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Desmarcar Todos
                </button>
                <button
                  onClick={handleGuardarAsistencia}
                  disabled={guardando}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  <FiSave size={16} />
                  {guardando ? 'Guardando...' : 'Guardar Asistencia'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                      Presente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {alumnos.map((alumno) => (
                    <tr 
                      key={alumno.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => toggleAsistencia(alumno.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAsistencia(alumno.id);
                          }}
                          className="inline-flex items-center justify-center w-6 h-6 rounded border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            backgroundColor: alumno.presente ? '#10b981' : 'transparent',
                            borderColor: alumno.presente ? '#10b981' : '#6b7280'
                          }}
                        >
                          {alumno.presente && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {alumno.codigo_alumno}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {alumno.nombre} {alumno.apellido}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {alumnos.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay alumnos inscritos en este curso
              </div>
            )}
          </div>
        </>
      )}

      {!cursoSeleccionado && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <FiCalendar className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={64} />
          <p className="text-xl text-gray-500 dark:text-gray-400">
            Selecciona un curso para registrar asistencia
          </p>
        </div>
      )}
    </div>
  );
}
