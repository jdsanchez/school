'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCalendar, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import api from '@/lib/api';

interface Alumno {
  id: number;
  nombre_completo: string;
  email: string;
  telefono: string;
  codigo_estudiante: string;
  fecha_inscripcion: string;
  estado_pago: 'Pendiente' | 'Pagado' | 'Atrasado' | 'Parcial' | 'Cancelado' | null;
  pago_id: number | null;
  monto_pagado: number;
  metodo_pago: string;
  fecha_pago: string;
}

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  maestro_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  cupo_maximo: number;
  alumnos_inscritos: number;
  costo: number;
}

export default function AlumnosCursoPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = params.id as string;
  
  const [curso, setCurso] = useState<Curso | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [cursoId]);

  const cargarDatos = async () => {
    try {
      const [cursoRes, alumnosRes] = await Promise.all([
        api.get(`/cursos/${cursoId}`),
        api.get(`/cursos/${cursoId}/alumnos`)
      ]);
      setCurso(cursoRes.data);
      setAlumnos(alumnosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar la información del curso');
    } finally {
      setLoading(false);
    }
  };

  const alumnosFiltrados = alumnos.filter(
    (alumno) =>
      alumno.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumno.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumno.codigo_estudiante.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoPagoBadge = (estado: string | null) => {
    const badges: { [key: string]: { bg: string; text: string; icon: any } } = {
      Pagado: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Pagado', icon: FiCheckCircle },
      Pendiente: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'Pendiente', icon: FiAlertCircle },
      Atrasado: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Atrasado', icon: FiXCircle },
      Parcial: { bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', text: 'Parcial', icon: FiAlertCircle },
      Cancelado: { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', text: 'Cancelado', icon: FiXCircle },
    };
    
    const badge = badges[estado || ''] || { bg: 'bg-gray-100 text-gray-800', text: 'Sin pago', icon: FiAlertCircle };
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${badge.bg}`}>
        <Icon size={12} />
        {badge.text}
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

  if (!curso) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Curso no encontrado</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Alumnos Inscritos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {curso.nombre} ({curso.codigo})
          </p>
        </div>
      </div>

      {/* Información del Curso */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Maestro</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {curso.maestro_nombre}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Período</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {new Date(curso.fecha_inicio).toLocaleDateString()} - {new Date(curso.fecha_fin).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cupo</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {curso.alumnos_inscritos} / {curso.cupo_maximo} alumnos
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Alumnos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar alumno por nombre, email o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {alumnosFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Alumno
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha Inscripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado de Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {alumnosFiltrados.map((alumno) => (
                  <tr key={alumno.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">
                        {alumno.codigo_estudiante}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <FiUser className="text-blue-600 dark:text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {alumno.nombre_completo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-1">
                          <FiMail size={14} />
                          {alumno.email}
                        </div>
                        {alumno.telefono && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <FiPhone size={14} />
                            {alumno.telefono}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <FiCalendar size={14} />
                        {new Date(alumno.fecha_inscripcion).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getEstadoPagoBadge(alumno.estado_pago)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {alumno.monto_pagado > 0 ? (
                          <>
                            <div className="font-semibold text-green-600 dark:text-green-400">
                              Q{Number(alumno.monto_pagado).toFixed(2)}
                            </div>
                            {alumno.metodo_pago && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {alumno.metodo_pago}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Sin pago</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No se encontraron alumnos con ese criterio' : 'No hay alumnos inscritos aún'}
          </div>
        )}

        {/* Resumen */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {alumnos.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Inscritos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {alumnos.filter(a => a.estado_pago === 'Pagado').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pagos Confirmados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {alumnos.filter(a => a.estado_pago === 'Pendiente').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pagos Pendientes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {alumnos.filter(a => a.estado_pago === 'Atrasado').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pagos Atrasados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
