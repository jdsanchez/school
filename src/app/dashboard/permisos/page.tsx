'use client';

import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiSave, FiRefreshCw } from 'react-icons/fi';
import api from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';

interface Rol {
  id: number;
  nombre: string;
}

interface Menu {
  id: number;
  nombre: string;
  icono: string;
}

interface Permiso {
  menu_id: number;
  menu_nombre: string;
  menu_icono: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

interface MatrizRol {
  rol_id: number;
  rol_nombre: string;
  permisos: Permiso[];
}

export default function PermisosPage() {
  const { showAlert } = useAlert();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [matriz, setMatriz] = useState<MatrizRol[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const response = await api.get('/permisos/matriz');
      setRoles(response.data.roles);
      setMenus(response.data.menus);
      setMatriz(response.data.matriz);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermiso = (rolId: number, menuId: number, campo: keyof Permiso) => {
    setMatriz((prevMatriz) =>
      prevMatriz.map((rol) => {
        if (rol.rol_id === rolId) {
          return {
            ...rol,
            permisos: rol.permisos.map((permiso) => {
              if (permiso.menu_id === menuId) {
                return {
                  ...permiso,
                  [campo]: !permiso[campo],
                };
              }
              return permiso;
            }),
          };
        }
        return rol;
      })
    );
    setCambiosPendientes(true);
  };

  const toggleTodosPermisos = (rolId: number, campo: keyof Permiso) => {
    setMatriz((prevMatriz) =>
      prevMatriz.map((rol) => {
        if (rol.rol_id === rolId) {
          const todosMarcados = rol.permisos.every((p) => p[campo]);
          return {
            ...rol,
            permisos: rol.permisos.map((permiso) => ({
              ...permiso,
              [campo]: !todosMarcados,
            })),
          };
        }
        return rol;
      })
    );
    setCambiosPendientes(true);
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      // Guardar permisos de cada rol
      for (const rol of matriz) {
        const permisosParaGuardar = rol.permisos
          .filter((p) => p.puede_ver || p.puede_crear || p.puede_editar || p.puede_eliminar)
          .map((p) => ({
            menu_id: p.menu_id,
            submenu_id: null,
            puede_ver: p.puede_ver,
            puede_crear: p.puede_crear,
            puede_editar: p.puede_editar,
            puede_eliminar: p.puede_eliminar,
          }));

        await api.post('/permisos', {
          rol_id: rol.rol_id,
          permisos: permisosParaGuardar,
        });
      }

      showAlert('Permisos guardados exitosamente', 'success');
      setCambiosPendientes(false);
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      showAlert('Error al guardar permisos', 'error');
    } finally {
      setGuardando(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Permisos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configura qué puede ver y hacer cada rol en el sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={cargarDatos}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400"
          >
            <FiRefreshCw />
            Recargar
          </button>
          <button
            onClick={guardarCambios}
            disabled={!cambiosPendientes || guardando}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <FiSave />
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {cambiosPendientes && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg">
          <p className="font-medium">Tienes cambios sin guardar</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                  Rol
                </th>
                {menus.map((menu) => (
                  <th
                    key={menu.id}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{menu.nombre}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {matriz.map((rol) => (
                <tr key={rol.rol_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10">
                    <div className="flex flex-col">
                      <span className="text-lg">{rol.rol_nombre}</span>
                      <div className="flex gap-2 mt-2 text-xs">
                        <button
                          onClick={() => toggleTodosPermisos(rol.rol_id, 'puede_ver')}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Ver todos
                        </button>
                        <button
                          onClick={() => toggleTodosPermisos(rol.rol_id, 'puede_crear')}
                          className="text-green-600 hover:text-green-800 dark:text-green-400"
                        >
                          Crear todos
                        </button>
                        <button
                          onClick={() => toggleTodosPermisos(rol.rol_id, 'puede_editar')}
                          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400"
                        >
                          Editar todos
                        </button>
                        <button
                          onClick={() => toggleTodosPermisos(rol.rol_id, 'puede_eliminar')}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          Eliminar todos
                        </button>
                      </div>
                    </div>
                  </td>
                  {rol.permisos.map((permiso) => (
                    <td key={permiso.menu_id} className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={permiso.puede_ver}
                            onChange={() =>
                              togglePermiso(rol.rol_id, permiso.menu_id, 'puede_ver')
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-blue-600 dark:text-blue-400">Ver</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={permiso.puede_crear}
                            onChange={() =>
                              togglePermiso(rol.rol_id, permiso.menu_id, 'puede_crear')
                            }
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Crear
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={permiso.puede_editar}
                            onChange={() =>
                              togglePermiso(rol.rol_id, permiso.menu_id, 'puede_editar')
                            }
                            className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                          />
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            Editar
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={permiso.puede_eliminar}
                            onChange={() =>
                              togglePermiso(rol.rol_id, permiso.menu_id, 'puede_eliminar')
                            }
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                          />
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Eliminar
                          </span>
                        </label>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          Leyenda de Permisos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Ver:</strong> Puede ver el módulo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Crear:</strong> Puede crear nuevos registros
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Editar:</strong> Puede modificar registros
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Eliminar:</strong> Puede eliminar registros
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
