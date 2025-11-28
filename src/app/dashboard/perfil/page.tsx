'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit, FiSave, FiX, FiKey } from 'react-icons/fi';
import api from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';

export default function PerfilPage() {
  const { usuario, actualizarUsuario } = useAuth();
  const { showAlert } = useAlert();
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    genero: '',
    dpi: '',
    codigo_alumno: ''
  });

  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    nuevaPassword: '',
    confirmarPassword: ''
  });

  useEffect(() => {
    if (usuario) {
      cargarPerfil();
    }
  }, [usuario]);

  const cargarPerfil = async () => {
    try {
      const response = await api.get(`/usuarios/${usuario.id}`);
      const userData = response.data;
      
      setFormData({
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        email: userData.email || '',
        telefono: userData.telefono || '',
        direccion: userData.direccion || '',
        fecha_nacimiento: userData.fecha_nacimiento ? userData.fecha_nacimiento.split('T')[0] : '',
        genero: userData.genero || '',
        dpi: userData.dpi || '',
        codigo_alumno: userData.codigo_alumno || ''
      });
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      showAlert('Error al cargar los datos del perfil', 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    
    setGuardando(true);

    try {
      await api.put(`/usuarios/${usuario.id}`, {
        ...formData,
        rol_id: usuario.rol_id,
        activo: usuario.activo
      });

      // Actualizar el usuario en el contexto
      await actualizarUsuario();

      showAlert('Perfil actualizado exitosamente', 'success');
      setEditando(false);
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      showAlert(error.response?.data?.error || 'Error al actualizar el perfil', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPassword = async () => {
    if (!usuario) return;

    if (!passwordData.passwordActual || !passwordData.nuevaPassword || !passwordData.confirmarPassword) {
      showAlert('Por favor completa todos los campos', 'warning');
      return;
    }

    if (passwordData.nuevaPassword !== passwordData.confirmarPassword) {
      showAlert('Las contraseñas no coinciden', 'warning');
      return;
    }

    if (passwordData.nuevaPassword.length < 6) {
      showAlert('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put(`/usuarios/${usuario.id}/cambiar-mi-password`, {
        passwordActual: passwordData.passwordActual,
        nuevaPassword: passwordData.nuevaPassword
      });

      showAlert('Contraseña actualizada exitosamente', 'success');
      setShowPasswordModal(false);
      setPasswordData({
        passwordActual: '',
        nuevaPassword: '',
        confirmarPassword: ''
      });
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      showAlert(error.response?.data?.error || 'Error al cambiar la contraseña', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const cancelarEdicion = () => {
    cargarPerfil();
    setEditando(false);
  };

  if (!usuario) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600">
              <FiUser size={48} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {formData.nombre} {formData.apellido}
              </h1>
              <p className="text-blue-100 text-lg">{usuario.rol_nombre}</p>
              {formData.codigo_alumno && (
                <p className="text-blue-200 mt-1">Código: {formData.codigo_alumno}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <FiKey size={18} />
              Cambiar Contraseña
            </button>
            {!editando ? (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <FiEdit size={18} />
                Editar Perfil
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={guardando}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <FiSave size={18} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <FiX size={18} />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Información Personal
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiUser className="inline mr-2" />
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                disabled={!editando}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiUser className="inline mr-2" />
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                disabled={!editando}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiMail className="inline mr-2" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!editando}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiPhone className="inline mr-2" />
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                disabled={!editando}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>

            {/* DPI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                DPI
              </label>
              <input
                type="text"
                name="dpi"
                value={formData.dpi}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            {/* Código Alumno */}
            {formData.codigo_alumno && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código de Alumno
                </label>
                <input
                  type="text"
                  name="codigo_alumno"
                  value={formData.codigo_alumno}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                />
              </div>
            )}

            {/* Fecha de Nacimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline mr-2" />
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleInputChange}
                disabled={!editando}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>

            {/* Género */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Género
              </label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                disabled={!editando}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiMapPin className="inline mr-2" />
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                disabled={!editando}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Cambiar Contraseña
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  name="passwordActual"
                  value={passwordData.passwordActual}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Tu contraseña actual"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="nuevaPassword"
                  value={passwordData.nuevaPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="confirmarPassword"
                  value={passwordData.confirmarPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirma la nueva contraseña"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCambiarPassword}
                disabled={changingPassword}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    passwordActual: '',
                    nuevaPassword: '',
                    confirmarPassword: ''
                  });
                }}
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
