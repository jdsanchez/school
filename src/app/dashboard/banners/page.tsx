'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiEye, FiEyeOff, FiUpload } from 'react-icons/fi';
import api, { getServerURL } from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';

interface Banner {
  id: number;
  titulo: string;
  descripcion: string | null;
  imagen: string;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export default function BannersPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: '',
    orden: 0,
    activo: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [useUrl, setUseUrl] = useState(false);

  // Verificar que el usuario sea Admin
  useEffect(() => {
    if (usuario && usuario.rol_nombre !== 'Admin' && usuario.rol_nombre !== 'Director') {
      showAlert('No tienes permiso para acceder a esta página', 'error');
      router.push('/dashboard');
    }
  }, [usuario, router]);

  useEffect(() => {
    if (usuario && (usuario.rol_nombre === 'Admin' || usuario.rol_nombre === 'Director')) {
      cargarBanners();
    }
  }, [usuario]);

  const cargarBanners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/banners/admin');
      setBanners(response.data);
    } catch (error) {
      console.error('Error al cargar banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = new FormData();
      data.append('titulo', formData.titulo);
      data.append('descripcion', formData.descripcion);
      data.append('orden', formData.orden.toString());
      data.append('activo', formData.activo ? '1' : '0');
      
      if (useUrl && formData.imagen_url) {
        data.append('imagen_url', formData.imagen_url);
      } else if (imageFile) {
        data.append('imagen', imageFile);
      } else if (!editingBanner) {
        showAlert('Debes seleccionar una imagen o proporcionar una URL', 'warning');
        return;
      }

      if (editingBanner) {
        await api.put(`/banners/${editingBanner.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/banners', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      cargarBanners();
      cerrarModal();
      showAlert('Banner guardado exitosamente', 'success');
    } catch (error: any) {
      console.error('Error al guardar banner:', error);
      showAlert(error.response?.data?.message || 'Error al guardar banner', 'error');
    }
  };

  const eliminarBanner = async (id: number) => {
    showConfirm('¿Estás seguro de eliminar este banner?', async () => {
      try {
        await api.delete(`/banners/${id}`);
        cargarBanners();
        showAlert('Banner eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error al eliminar banner:', error);
        showAlert('Error al eliminar banner', 'error');
      }
    });
  };

  const toggleActivo = async (id: number) => {
    try {
      await api.put(`/banners/${id}/toggle`);
      cargarBanners();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const abrirModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        titulo: banner.titulo,
        descripcion: banner.descripcion || '',
        imagen_url: banner.imagen.startsWith('http') ? banner.imagen : '',
        orden: banner.orden,
        activo: banner.activo
      });
      setImagePreview(banner.imagen.startsWith('http') ? banner.imagen : `${getServerURL()}${banner.imagen}`);
      setUseUrl(banner.imagen.startsWith('http'));
    } else {
      setEditingBanner(null);
      setFormData({
        titulo: '',
        descripcion: '',
        imagen_url: '',
        orden: banners.length,
        activo: true
      });
      setImagePreview('');
      setUseUrl(false);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Banners del Login
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las imágenes del slider en la página de inicio de sesión
          </p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FiPlus /> Nuevo Banner
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${
                !banner.activo ? 'opacity-60' : ''
              }`}
            >
              <div className="relative h-48">
                <img
                  src={banner.imagen.startsWith('http') ? banner.imagen : `${getServerURL()}${banner.imagen}`}
                  alt={banner.titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                    #{banner.orden}
                  </span>
                  <button
                    onClick={() => toggleActivo(banner.id)}
                    className={`p-2 rounded ${
                      banner.activo
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    } text-white`}
                  >
                    {banner.activo ? <FiEye /> : <FiEyeOff />}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {banner.titulo}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {banner.descripcion || 'Sin descripción'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModal(banner)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center justify-center gap-2"
                  >
                    <FiEdit2 /> Editar
                  </button>
                  <button
                    onClick={() => eliminarBanner(banner.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imagen *
                  </label>
                  
                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setUseUrl(false)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                        !useUrl
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <FiUpload className="inline mr-2" />
                      Subir Archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseUrl(true)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                        useUrl
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <FiImage className="inline mr-2" />
                      URL Externa
                    </button>
                  </div>

                  {useUrl ? (
                    <input
                      type="url"
                      value={formData.imagen_url}
                      onChange={(e) => {
                        setFormData({ ...formData, imagen_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  )}

                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={formData.orden}
                      onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.activo ? '1' : '0'}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.value === '1' })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="1">Activo</option>
                      <option value="0">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {editingBanner ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
