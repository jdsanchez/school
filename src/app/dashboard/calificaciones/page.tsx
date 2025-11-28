'use client';

import { useState, useEffect } from 'react';
import { FiStar, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import api from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';

interface Calificacion {
  id: number;
  alumno_nombre: string;
  materia_nombre: string;
  nota: number;
  periodo: string;
  fecha: string;
}

export default function CalificacionesPage() {
  const { showAlert } = useAlert();
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('Primer Bimestre');

  useEffect(() => {
    cargarCalificaciones();
  }, [periodo]);

  const cargarCalificaciones = async () => {
    try {
      const response = await api.get('/calificaciones', {
        params: { periodo },
      });
      setCalificaciones(response.data);
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
      showAlert('Error al cargar las calificaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const promedioGeneral =
    calificaciones.length > 0
      ? (
          calificaciones.reduce((sum, c) => sum + c.nota, 0) / calificaciones.length
        ).toFixed(2)
      : 0;

  const aprobados = calificaciones.filter((c) => c.nota >= 60).length;
  const reprobados = calificaciones.filter((c) => c.nota < 60).length;

  const getNotaColor = (nota: number) => {
    if (nota >= 90) return 'text-green-600 dark:text-green-400';
    if (nota >= 80) return 'text-blue-600 dark:text-blue-400';
    if (nota >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (nota >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getNotaBadge = (nota: number) => {
    if (nota >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (nota >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (nota >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (nota >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Calificaciones
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Promedio General</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {promedioGeneral}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FiStar className="text-blue-600 dark:text-blue-300" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aprobados</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {aprobados}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <FiTrendingUp className="text-green-600 dark:text-green-300" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Reprobados</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {reprobados}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
              <FiTrendingDown className="text-red-600 dark:text-red-300" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="text-gray-700 dark:text-gray-300 font-medium mr-4">
            Periodo:
          </label>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option>Primer Bimestre</option>
            <option>Segundo Bimestre</option>
            <option>Tercer Bimestre</option>
            <option>Cuarto Bimestre</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Materia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {calificaciones.map((calificacion) => (
                <tr key={calificacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {calificacion.alumno_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {calificacion.materia_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {calificacion.periodo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-2xl font-bold ${getNotaColor(calificacion.nota)}`}>
                      {calificacion.nota}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getNotaBadge(
                        calificacion.nota
                      )}`}
                    >
                      {calificacion.nota >= 60 ? 'Aprobado' : 'Reprobado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {new Date(calificacion.fecha).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {calificaciones.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay calificaciones registradas para este periodo
          </div>
        )}
      </div>
    </div>
  );
}
