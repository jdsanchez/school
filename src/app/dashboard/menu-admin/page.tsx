'use client';

import { useState, useEffect } from 'react';
import { FiMenu, FiEdit, FiTrash2, FiPlus, FiList } from 'react-icons/fi';
import api from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';

interface Menu {
  id: number;
  nombre: string;
  ruta: string;
  icono: string;
  orden: number;
  activo: boolean;
  submenus_count: number;
}

interface Submenu {
  id: number;
  nombre: string;
  ruta: string;
  menu_id: number;
  menu_nombre: string;
  orden: number;
  activo: boolean;
}

export default function MenusPage() {
  const { showAlert, showConfirm } = useAlert();
  const [activeTab, setActiveTab] = useState<'menus' | 'submenus'>('menus');
  const [menus, setMenus] = useState<Menu[]>([]);
  const [submenus, setSubmenus] = useState<Submenu[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showSubmenuModal, setShowSubmenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [editingSubmenu, setEditingSubmenu] = useState<Submenu | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [menusRes, submenusRes] = await Promise.all([
        api.get('/menus'),
        api.get('/menus/submenus'),
      ]);
      setMenus(menusRes.data);
      setSubmenus(submenusRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarMenu = async (id: number) => {
    showConfirm('¿Eliminar este menú? Se eliminarán también sus submenús.', async () => {
      try {
        await api.delete(`/menus/${id}`);
        showAlert('Menú eliminado exitosamente', 'success');
        cargarDatos();
      } catch (error: any) {
        showAlert(error.response?.data?.error || 'Error al eliminar menú', 'error');
      }
    });
  };

  const eliminarSubmenu = async (id: number) => {
    showConfirm('¿Eliminar este submenú?', async () => {
      try {
        await api.delete(`/menus/submenu/${id}`);
        showAlert('Submenú eliminado exitosamente', 'success');
        cargarDatos();
      } catch (error: any) {
        showAlert(error.response?.data?.error || 'Error al eliminar submenú', 'error');
      }
    });
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
          Gestión de Menús
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('menus')}
            className={`flex items-center gap-2 px-6 py-3 font-medium ${
              activeTab === 'menus'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiMenu size={18} />
            Menús Principales
          </button>
          <button
            onClick={() => setActiveTab('submenus')}
            className={`flex items-center gap-2 px-6 py-3 font-medium ${
              activeTab === 'submenus'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiList size={18} />
            Submenús
          </button>
        </div>

        {/* Contenido de Menús */}
        {activeTab === 'menus' && (
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setEditingMenu(null);
                  setShowMenuModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiPlus />
                Nuevo Menú
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Ruta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Icono
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Submenús
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                        {menu.nombre}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {menu.ruta}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {menu.icono}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                        {menu.orden}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {menu.submenus_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            menu.activo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {menu.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingMenu(menu);
                              setShowMenuModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => eliminarMenu(menu.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {menus.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay menús registrados
              </div>
            )}
          </div>
        )}

        {/* Contenido de Submenús */}
        {activeTab === 'submenus' && (
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setEditingSubmenu(null);
                  setShowSubmenuModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiPlus />
                Nuevo Submenú
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Menú Principal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Ruta
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {submenus.map((submenu) => (
                    <tr key={submenu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                        {submenu.nombre}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {submenu.menu_nombre}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {submenu.ruta}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                        {submenu.orden}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            submenu.activo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {submenu.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingSubmenu(submenu);
                              setShowSubmenuModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => eliminarSubmenu(submenu.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {submenus.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay submenús registrados
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Menú */}
      {showMenuModal && (
        <MenuModal
          menu={editingMenu}
          onClose={() => {
            setShowMenuModal(false);
            setEditingMenu(null);
          }}
          onSuccess={() => {
            setShowMenuModal(false);
            setEditingMenu(null);
            cargarDatos();
          }}
        />
      )}

      {/* Modal de Submenú */}
      {showSubmenuModal && (
        <SubmenuModal
          submenu={editingSubmenu}
          menus={menus}
          onClose={() => {
            setShowSubmenuModal(false);
            setEditingSubmenu(null);
          }}
          onSuccess={() => {
            setShowSubmenuModal(false);
            setEditingSubmenu(null);
            cargarDatos();
          }}
        />
      )}
    </div>
  );
}

// Modal de Menú
function MenuModal({
  menu,
  onClose,
  onSuccess,
}: {
  menu: Menu | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    nombre: menu?.nombre || '',
    ruta: menu?.ruta || '',
    icono: menu?.icono || '',
    orden: menu?.orden || 0,
    activo: menu?.activo ?? true,
  });
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (menu) {
        await api.put(`/menus/${menu.id}`, formData);
        showAlert('Menú actualizado exitosamente', 'success');
      } else {
        await api.post('/menus', formData);
        showAlert('Menú creado exitosamente', 'success');
      }
      onSuccess();
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Error al guardar menú', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {menu ? 'Editar Menú' : 'Nuevo Menú'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ruta *
            </label>
            <input
              type="text"
              value={formData.ruta}
              onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
              required
              placeholder="/dashboard/ejemplo"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icono *
            </label>
            <input
              type="text"
              value={formData.icono}
              onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
              required
              placeholder="dashboard, users, book, etc."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Orden
            </label>
            <input
              type="number"
              value={formData.orden}
              onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Activo
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Submenú
function SubmenuModal({
  submenu,
  menus,
  onClose,
  onSuccess,
}: {
  submenu: Submenu | null;
  menus: Menu[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
  const [formData, setFormData] = useState({
    nombre: submenu?.nombre || '',
    ruta: submenu?.ruta || '',
    menu_id: submenu?.menu_id || '',
    orden: submenu?.orden || 0,
    activo: submenu?.activo ?? true,
  });
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (submenu) {
        await api.put(`/menus/submenu/${submenu.id}`, formData);
        showAlert('Submenú actualizado exitosamente', 'success');
      } else {
        await api.post('/menus/submenu', formData);
        showAlert('Submenú creado exitosamente', 'success');
      }
      onSuccess();
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Error al guardar submenú', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {submenu ? 'Editar Submenú' : 'Nuevo Submenú'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Menú Principal *
            </label>
            <select
              value={formData.menu_id}
              onChange={(e) => setFormData({ ...formData, menu_id: Number(e.target.value) as any })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecciona un menú...</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ruta *
            </label>
            <input
              type="text"
              value={formData.ruta}
              onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
              required
              placeholder="/dashboard/ejemplo"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Orden
            </label>
            <input
              type="number"
              value={formData.orden}
              onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Activo
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
