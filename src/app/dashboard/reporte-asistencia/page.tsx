'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiDownload, FiFilter } from 'react-icons/fi';
import api from '@/lib/api';

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
}

interface AsistenciaAlumno {
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  codigo_alumno: string;
  total_clases: number;
  total_presentes: number;
  total_ausentes: number;
  total_tardanzas: number;
  porcentaje_asistencia: number;
  detalle_fechas: Array<{
    fecha: string;
    estado: string;
  }>;
}

export default function ReporteAsistenciaPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [asistencias, setAsistencias] = useState<AsistenciaAlumno[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      const response = await api.get('/cursos');
      setCursos(response.data.filter((c: any) => c.activo));
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    }
  };

  const cargarReporte = async () => {
    if (!cursoSeleccionado) {
      alert('Selecciona un curso');
      return;
    }

    setCargando(true);
    try {
      // Obtener todos los alumnos del curso
      const alumnosRes = await api.get(`/cursos/${cursoSeleccionado}/alumnos`);
      const alumnos = alumnosRes.data;

      // Obtener todas las asistencias del curso con filtros de fecha
      const params: any = { curso_id: cursoSeleccionado };
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const asistenciasRes = await api.get('/asistencia', { params });
      const todasAsistencias = asistenciasRes.data;

      // Obtener fechas únicas de clases
      const fechasSet = new Set(todasAsistencias.map((a: any) => a.fecha));
      const fechasUnicas = Array.from(fechasSet);
      const totalClases = fechasUnicas.length;

      // Procesar datos por alumno
      const reportePorAlumno = alumnos.map((alumno: any) => {
        const asistenciasAlumno = todasAsistencias.filter(
          (a: any) => a.alumno_id === alumno.id
        );

        const totalPresentes = asistenciasAlumno.filter((a: any) => a.estado === 'Presente').length;
        const totalAusentes = asistenciasAlumno.filter((a: any) => a.estado === 'Ausente').length;
        const totalTardanzas = asistenciasAlumno.filter((a: any) => a.estado === 'Tardanza').length;

        const porcentaje = totalClases > 0 ? (totalPresentes / totalClases) * 100 : 0;

        return {
          alumno_id: alumno.id,
          alumno_nombre: alumno.nombre,
          alumno_apellido: alumno.apellido,
          codigo_alumno: alumno.codigo_alumno,
          total_clases: totalClases,
          total_presentes: totalPresentes,
          total_ausentes: totalAusentes,
          total_tardanzas: totalTardanzas,
          porcentaje_asistencia: Math.round(porcentaje),
          detalle_fechas: asistenciasAlumno.map((a: any) => ({
            fecha: a.fecha,
            estado: a.estado,
          })),
        };
      });

      setAsistencias(reportePorAlumno);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      alert('Error al cargar el reporte');
    } finally {
      setCargando(false);
    }
  };

  const exportarCSV = () => {
    if (asistencias.length === 0) return;

    const headers = ['Código', 'Nombre', 'Total Clases', 'Presentes', 'Ausentes', 'Tardanzas', 'Asistencia %'];
    const rows = asistencias.map((a) => [
      a.codigo_alumno,
      `${a.alumno_nombre} ${a.alumno_apellido}`,
      a.total_clases,
      a.total_presentes,
      a.total_ausentes,
      a.total_tardanzas,
      a.porcentaje_asistencia,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_asistencia_${new Date().getTime()}.csv`;
    a.click();
  };

  const promedioGeneral = asistencias.length > 0
    ? Math.round(asistencias.reduce((acc, a) => acc + a.porcentaje_asistencia, 0) / asistencias.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reporte General de Asistencia
        </h1>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Curso *
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
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={cargarReporte}
              disabled={cargando}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <FiFilter size={16} />
              {cargando ? 'Cargando...' : 'Generar'}
            </button>
            {asistencias.length > 0 && (
              <button
                onClick={exportarCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiDownload size={16} />
                CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas Generales */}
      {asistencias.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Alumnos</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {asistencias.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Clases</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {asistencias[0]?.total_clases || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Asistencia Promedio</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
              {promedioGeneral}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Alumnos en Riesgo</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
              {asistencias.filter((a) => a.porcentaje_asistencia < 75).length}
            </p>
          </div>
        </div>
      )}

      {/* Tabla de Reporte */}
      {asistencias.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Detalle por Alumno
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Alumno
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Clases
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Presentes
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ausentes
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tardanzas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Asistencia %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {asistencias.map((alumno) => (
                  <tr key={alumno.alumno_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {alumno.codigo_alumno}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {alumno.alumno_nombre} {alumno.alumno_apellido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {alumno.total_clases}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 dark:text-green-400 font-semibold">
                      {alumno.total_presentes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 dark:text-red-400 font-semibold">
                      {alumno.total_ausentes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                      {alumno.total_tardanzas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${
                          alumno.porcentaje_asistencia >= 90
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : alumno.porcentaje_asistencia >= 75
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {alumno.porcentaje_asistencia}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!cursoSeleccionado && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <FiCalendar className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={64} />
          <p className="text-xl text-gray-500 dark:text-gray-400">
            Selecciona un curso y haz clic en "Generar" para ver el reporte
          </p>
        </div>
      )}

      {cursoSeleccionado && asistencias.length === 0 && !cargando && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-xl text-gray-500 dark:text-gray-400">
            No hay registros de asistencia para los filtros seleccionados
          </p>
        </div>
      )}
    </div>
  );
}
