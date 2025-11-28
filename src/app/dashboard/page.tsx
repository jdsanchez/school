'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { FiUsers, FiBook, FiCalendar, FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle, FiFileText, FiTrendingUp, FiActivity } from 'react-icons/fi';
import api from '@/lib/api';
import Link from 'next/link';
import { useAlert } from '@/contexts/AlertContext';

interface DashboardStats {
  totalUsuarios?: number;
  totalCursos?: number;
  totalPagos?: number;
  tareasPendientes?: number;
  tareasEntregadas?: number;
  misCursos?: number;
  pagosPendientes?: number;
  pagosRealizados?: number;
  proximasTareas?: any[];
  actividadesRecientes?: any[];
  pagosRecientes?: any[];
  calificaciones?: any[];
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const { showAlert } = useAlert();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDashboard();
  }, [usuario?.rol_nombre]);

  const cargarDashboard = async () => {
    try {
      if (usuario?.rol_nombre === 'Alumno') {
        await cargarDashboardAlumno();
      } else if (['Admin', 'Director'].includes(usuario?.rol_nombre || '')) {
        await cargarDashboardAdmin();
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      showAlert('Error al cargar los datos del dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarDashboardAlumno = async () => {
    try {
      const [cursosRes, tareasRes, pagosRes] = await Promise.all([
        api.get('/cursos/mis-asignaciones'),
        api.get('/tareas/mis-tareas'),
        api.get('/pagos/mis-pagos')
      ]);

      const tareasPendientes = tareasRes.data.filter((t: any) => !t.entrega_id);
      const tareasEntregadas = tareasRes.data.filter((t: any) => t.entrega_id);
      const pagosPendientes = pagosRes.data.filter((p: any) => p.estado === 'Pendiente');

      setStats({
        misCursos: cursosRes.data.length,
        tareasPendientes: tareasPendientes.length,
        tareasEntregadas: tareasEntregadas.length,
        pagosPendientes: pagosPendientes.length,
        proximasTareas: tareasPendientes.slice(0, 5),
        pagosRecientes: pagosPendientes.slice(0, 3),
        calificaciones: tareasRes.data.filter((t: any) => t.calificacion !== null).slice(0, 5)
      });
    } catch (error) {
      console.error('Error al cargar dashboard alumno:', error);
    }
  };

  const cargarDashboardAdmin = async () => {
    try {
      const [usuariosRes, cursosRes, pagosRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/cursos'),
        api.get('/pagos')
      ]);

      const pagosConfirmados = pagosRes.data.filter((p: any) => p.estado === 'Pagado');
      const pagosPendientes = pagosRes.data.filter((p: any) => p.estado === 'Pendiente');

      setStats({
        totalUsuarios: usuariosRes.data.length,
        totalCursos: cursosRes.data.length,
        totalPagos: pagosConfirmados.length,
        pagosPendientes: pagosPendientes.length,
        pagosRealizados: pagosConfirmados.length,
        pagosRecientes: pagosRes.data.slice(0, 5),
        actividadesRecientes: cursosRes.data.slice(0, 5)
      });
    } catch (error) {
      console.error('Error al cargar dashboard admin:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Dashboard para Alumno
  if (usuario?.rol_nombre === 'Alumno') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            ¡Bienvenido, {usuario?.nombre}!
          </h1>
          <p className="text-blue-100">
            Aquí tienes un resumen de tus actividades académicas
          </p>
        </div>

        {/* Stats Grid - Alumno */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FiBook className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Mis Cursos</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.misCursos || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-500 p-3 rounded-lg">
                <FiClock className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tareas Pendientes</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.tareasPendientes || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tareas Entregadas</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.tareasEntregadas || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Pagos Pendientes</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pagosPendientes || 0}</p>
          </div>
        </div>

        {/* Content Grid - Alumno */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximas Tareas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Próximas Tareas</h2>
              <Link href="/dashboard/mis-tareas" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todas
              </Link>
            </div>
            <div className="space-y-3">
              {stats.proximasTareas && stats.proximasTareas.length > 0 ? (
                stats.proximasTareas.map((tarea: any) => (
                  <Link 
                    key={tarea.id} 
                    href={`/dashboard/mis-tareas/${tarea.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded">
                      <FiFileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{tarea.titulo}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{tarea.curso_nombre}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No tienes tareas pendientes
                </p>
              )}
            </div>
          </div>

          {/* Calificaciones Recientes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Calificaciones Recientes</h2>
            <div className="space-y-3">
              {stats.calificaciones && stats.calificaciones.length > 0 ? (
                stats.calificaciones.map((tarea: any) => (
                  <div 
                    key={tarea.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{tarea.titulo}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{tarea.curso_nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {tarea.calificacion}/{tarea.puntos_totales}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No tienes calificaciones aún
                </p>
              )}
            </div>
          </div>

          {/* Pagos Pendientes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pagos Pendientes</h2>
              <Link href="/dashboard/mis-pagos" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {stats.pagosRecientes && stats.pagosRecientes.length > 0 ? (
                stats.pagosRecientes.map((pago: any) => (
                  <div 
                    key={pago.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 dark:bg-red-900 p-2 rounded">
                        <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{pago.curso_nombre}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Fecha límite: {pago.fecha_limite ? new Date(pago.fecha_limite).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        Q{pago.monto}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No tienes pagos pendientes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard para Admin/Director
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-sm p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ¡Bienvenido, {usuario?.nombre}!
        </h1>
        <p className="text-purple-100">
          Panel de administración del sistema
        </p>
      </div>

      {/* Stats Grid - Admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Usuarios Registrados</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsuarios || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <FiBook className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Cursos Activos</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCursos || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Pagos Realizados</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pagosRealizados || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <FiAlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">Pagos Pendientes</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pagosPendientes || 0}</p>
        </div>
      </div>

      {/* Content Grid - Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividades Recientes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cursos Recientes</h2>
            <Link href="/dashboard/cursos" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {stats.actividadesRecientes && stats.actividadesRecientes.length > 0 ? (
              stats.actividadesRecientes.map((curso: any) => (
                <div 
                  key={curso.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                >
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                    <FiBook className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{curso.nombre}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{curso.codigo}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {curso.alumnos_inscritos || 0} alumnos inscritos
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No hay cursos recientes
              </p>
            )}
          </div>
        </div>

        {/* Pagos Recientes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pagos Recientes</h2>
            <Link href="/dashboard/pagos" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {stats.pagosRecientes && stats.pagosRecientes.length > 0 ? (
              stats.pagosRecientes.map((pago: any) => (
                <div 
                  key={pago.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`${pago.estado === 'Pagado' ? 'bg-green-100 dark:bg-green-900' : 'bg-orange-100 dark:bg-orange-900'} p-2 rounded`}>
                      <FiDollarSign className={`w-4 h-4 ${pago.estado === 'Pagado' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{pago.alumno_nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{pago.curso_nombre}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">Q{pago.monto}</p>
                    <p className={`text-xs ${pago.estado === 'Pagado' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {pago.estado}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No hay pagos recientes
              </p>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/dashboard/usuarios/nuevo"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <FiUsers className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nuevo Usuario</span>
            </Link>

            <Link 
              href="/dashboard/cursos/nuevo"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
            >
              <FiBook className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nuevo Curso</span>
            </Link>

            <Link 
              href="/dashboard/asistencia"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
            >
              <FiCalendar className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Asistencia</span>
            </Link>

            <Link 
              href="/dashboard/reporte-asistencia"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
            >
              <FiTrendingUp className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reportes</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
