'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useSidebar } from '@/contexts/SidebarContext';
import ThemeToggle from './ThemeToggle';
import NotificacionesPago from './NotificacionesPago';
import {
  FiMenu,
  FiX,
  FiHome,
  FiUsers,
  FiShield,
  FiBook,
  FiCalendar,
  FiStar,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';

interface MenuItem {
  menu_id: number;
  menu_nombre: string;
  menu_ruta: string;
  icono: string;
  submenu_id?: number;
  submenu_nombre?: string;
  submenu_ruta?: string;
}

const iconMap: { [key: string]: any } = {
  dashboard: FiHome,
  users: FiUsers,
  shield: FiShield,
  book: FiBook,
  'calendar-check': FiCalendar,
  star: FiStar,
  settings: FiSettings,
  clipboard: FiBook, // Para "Mis Tareas"
};

export default function Sidebar() {
  const { isOpen, toggleSidebar } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);
  const { usuario, permisos, logout } = useAuth();
  const { config } = useConfig();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Agrupar permisos por menú
  const menusAgrupados = permisos.reduce((acc: any[], permiso) => {
    const menuExistente = acc.find((m) => m.menu_id === permiso.menu_id);
    
    if (menuExistente) {
      if (permiso.submenu_id) {
        menuExistente.submenus.push({
          id: permiso.submenu_id,
          nombre: permiso.submenu_nombre,
          ruta: permiso.submenu_ruta,
        });
      }
    } else {
      acc.push({
        menu_id: permiso.menu_id,
        nombre: permiso.menu_nombre,
        ruta: permiso.menu_ruta,
        icono: permiso.icono,
        submenus: permiso.submenu_id
          ? [
              {
                id: permiso.submenu_id,
                nombre: permiso.submenu_nombre,
                ruta: permiso.submenu_ruta,
              },
            ]
          : [],
      });
    }
    
    return acc;
  }, []);

  const toggleMenu = (menuId: number) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (ruta: string) => pathname === ruta;

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 text-white transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {isOpen && (
              <div className="flex items-center gap-2">
                {config?.logo ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}${config.logo}`} 
                    alt="Logo" 
                    className="w-8 h-8 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CO</span>
                  </div>
                )}
                <span className="font-bold text-lg">{config?.nombre_sistema || 'Class Optima'}</span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {usuario?.nombre.charAt(0)}
                  {usuario?.apellido.charAt(0)}
                </span>
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {usuario?.nombre} {usuario?.apellido}
                  </p>
                  <p className="text-sm text-gray-400 truncate">{usuario?.rol_nombre}</p>
                </div>
              )}
              <NotificacionesPago />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            <ul className="space-y-2">
              {/* Agregar "Mis Tareas" para Alumnos */}
              {usuario?.rol_nombre === 'Alumno' && (
                <li>
                  <Link
                    href="/dashboard/mis-tareas"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname === '/dashboard/mis-tareas'
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <FiBook size={20} />
                    {isOpen && <span>Mis Tareas</span>}
                  </Link>
                </li>
              )}
              
              {menusAgrupados.map((menu) => {
                const Icon = iconMap[menu.icono] || FiHome;
                const hasSubmenus = menu.submenus.length > 0;
                const isExpanded = expandedMenus.includes(menu.menu_id);

                return (
                  <li key={menu.menu_id}>
                    {hasSubmenus ? (
                      <>
                        <button
                          onClick={() => toggleMenu(menu.menu_id)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive(menu.ruta)
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={20} />
                            {isOpen && <span>{menu.nombre}</span>}
                          </div>
                          {isOpen &&
                            (isExpanded ? (
                              <FiChevronDown size={16} />
                            ) : (
                              <FiChevronRight size={16} />
                            ))}
                        </button>
                        {isOpen && isExpanded && (
                          <ul className="mt-2 ml-4 space-y-1">
                            {menu.submenus.map((submenu: any) => (
                              <li key={submenu.id}>
                                <Link
                                  href={submenu.ruta}
                                  className={`block px-4 py-2 rounded-lg transition-colors ${
                                    isActive(submenu.ruta)
                                      ? 'bg-blue-600 text-white'
                                      : 'hover:bg-gray-700 text-gray-400'
                                  }`}
                                >
                                  {submenu.nombre}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={menu.ruta}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive(menu.ruta)
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        <Icon size={20} />
                        {isOpen && <span>{menu.nombre}</span>}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 space-y-2">
            <div className="flex items-center justify-center">
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-gray-300 hover:text-white"
            >
              <FiLogOut size={20} />
              {isOpen && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for content */}
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'}`} />
    </>
  );
}
