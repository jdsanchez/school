'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiPower, FiSlash, FiKey } from 'react-icons/fi';
import api from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  codigo_alumno: string | null;
  dpi: string;
  telefono: string;
  rol_nombre: string;
  activo: boolean;
}

export default function UsuariosPage() {
  const router = useRouter();
  const { showAlert, showConfirm } = useAlert();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (id: number, activo: boolean) => {
    showConfirm(`¿Estás seguro de ${activo ? 'suspender' : 'activar'} este usuario?`, async () => {
      try {
        await api.put(`/usuarios/${id}`, { activo: !activo });
        showAlert(`Usuario ${activo ? 'suspendido' : 'activado'} exitosamente`, 'success');
        cargarUsuarios();
      } catch (error: any) {
        console.error('Error al cambiar estado:', error);
        showAlert(error.response?.data?.error || 'Error al cambiar estado del usuario', 'error');
      }
    });
  };

  const eliminarUsuario = async (id: number) => {
    showConfirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.', async () => {
      try {
        await api.delete(`/usuarios/${id}`);
        showAlert('Usuario eliminado exitosamente', 'success');
        cargarUsuarios();
      } catch (error: any) {
        console.error('Error al eliminar usuario:', error);
        showAlert(error.response?.data?.error || 'Error al eliminar usuario', 'error');
      }
    });
  };

  const abrirModalPassword = (id: number) => {
    setSelectedUserId(id);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const cambiarPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showAlert('Por favor completa todos los campos', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Las contraseñas no coinciden', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put(`/usuarios/${selectedUserId}/cambiar-password`, {
        password: newPassword
      });
      showAlert('Contraseña actualizada exitosamente', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      showAlert(error.response?.data?.error || 'Error al cambiar la contraseña', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.codigo_alumno?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Gestión de Usuarios
        </h1>
        <button 
          onClick={() => router.push('/dashboard/usuarios/nuevo')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre Completo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Código/DPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {usuario.nombre} {usuario.apellido}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {usuario.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {usuario.codigo_alumno || usuario.dpi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {usuario.rol_nombre}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.activo
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/dashboard/usuarios/${usuario.id}/editar`)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Editar"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button 
                        onClick={() => abrirModalPassword(usuario.id)}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        title="Cambiar contraseña"
                      >
                        <FiKey size={18} />
                      </button>
                      <button 
                        onClick={() => toggleEstado(usuario.id, usuario.activo)}
                        className={`${
                          usuario.activo 
                            ? 'text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300' 
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                        }`}
                        title={usuario.activo ? 'Suspender' : 'Activar'}
                      >
                        {usuario.activo ? <FiSlash size={18} /> : <FiPower size={18} />}
                      </button>
                      <button 
                        onClick={() => eliminarUsuario(usuario.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Eliminar"
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

        {usuariosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No se encontraron usuarios
          </div>
        )}
      </div>

      {/* Modal para cambiar contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Cambiar Contraseña
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirma la contraseña"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cambiarPassword}
                disabled={changingPassword}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={changingPassword}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
