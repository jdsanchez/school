'use client';

import { useAuth } from '@/contexts/AuthContext';
import { FiUsers, FiBook, FiCalendar, FiStar } from 'react-icons/fi';

export default function DashboardPage() {
  const { usuario } = useAuth();

  const stats = [
    {
      title: 'Total Usuarios',
      value: '1,234',
      icon: FiUsers,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Materias Activas',
      value: '48',
      icon: FiBook,
      color: 'bg-green-500',
      change: '+3',
    },
    {
      title: 'Asistencia Hoy',
      value: '89%',
      icon: FiCalendar,
      color: 'bg-purple-500',
      change: '+5%',
    },
    {
      title: 'Promedio General',
      value: '8.5',
      icon: FiStar,
      color: 'bg-yellow-500',
      change: '+0.3',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Bienvenido, {usuario?.nombre}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Aquí tienes un resumen de las actividades del sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                {stat.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Actividad Reciente
          </h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {item}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Actividad de ejemplo {item}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hace 2 horas
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Nuevo Usuario', icon: FiUsers },
              { title: 'Nueva Materia', icon: FiBook },
              { title: 'Registrar Asistencia', icon: FiCalendar },
              { title: 'Registrar Notas', icon: FiStar },
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                  <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                    {action.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
