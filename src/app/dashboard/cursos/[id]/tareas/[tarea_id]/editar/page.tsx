'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiUpload, FiX, FiFileText } from 'react-icons/fi';
import api from '@/lib/api';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_entrega: string;
  puntos_totales: number;
  archivo_adjunto: string | null;
}

export default function EditarTareaPage() {
  const router = useRouter();
  const params = useParams();
  const cursoId = params?.id as string;
  const tareaId = params?.tarea_id as string;

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [tarea, setTarea] = useState<Tarea | null>(null);
  
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [puntosTotales, setPuntosTotales] = useState(100);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mantenerArchivo, setMantenerArchivo] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    cargarTarea();
  }, [tareaId]);

  const cargarTarea = async () => {
    try {
      const response = await api.get(`/tareas/curso/${cursoId}`);
      const tareaEncontrada = response.data.find((t: any) => t.id === parseInt(tareaId));
      if (tareaEncontrada) {
        setTarea(tareaEncontrada);
        setTitulo(tareaEncontrada.titulo);
        setDescripcion(tareaEncontrada.descripcion || '');
        
        // Convertir fecha de MySQL a formato datetime-local
        const fecha = new Date(tareaEncontrada.fecha_entrega);
        const fechaLocal = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
        setFechaEntrega(fechaLocal.toISOString().slice(0, 16));
        
        setPuntosTotales(tareaEncontrada.puntos_totales);
      }
    } catch (error) {
      console.error('Error al cargar tarea:', error);
      alert('Error al cargar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (file.size > maxSize) {
      alert('El archivo no debe superar 10MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido');
      return;
    }

    setArchivo(file);
    setMantenerArchivo(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const eliminarArchivoActual = () => {
    setMantenerArchivo(false);
    setArchivo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      alert('El título es obligatorio');
      return;
    }

    if (!fechaEntrega) {
      alert('La fecha de entrega es obligatoria');
      return;
    }

    if (puntosTotales <= 0) {
      alert('Los puntos deben ser mayor a 0');
      return;
    }

    setGuardando(true);

    const formData = new FormData();
    formData.append('titulo', titulo.trim());
    formData.append('descripcion', descripcion.trim());
    formData.append('fecha_entrega', fechaEntrega);
    formData.append('puntos_totales', puntosTotales.toString());
    
    if (archivo) {
      formData.append('archivo_adjunto', archivo);
    } else if (!mantenerArchivo) {
      formData.append('eliminar_archivo', 'true');
    }

    try {
      await api.put(`/tareas/${tareaId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Tarea actualizada exitosamente');
      router.push(`/dashboard/cursos/${cursoId}/tareas`);
    } catch (error: any) {
      console.error('Error al actualizar tarea:', error);
      alert(error.response?.data?.message || 'Error al actualizar la tarea');
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

  if (!tarea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Tarea no encontrada</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline"
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
            Editar Tarea
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Modifica los detalles de la tarea
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        {/* Título */}
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ej: Tarea de Matemáticas - Capítulo 5"
          />
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describe los detalles de la tarea..."
          />
        </div>

        {/* Fecha y Puntos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fechaEntrega" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de entrega <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="fechaEntrega"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="puntos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Puntos totales <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="puntos"
              value={puntosTotales}
              onChange={(e) => setPuntosTotales(parseInt(e.target.value) || 0)}
              min="1"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Archivo adjunto actual */}
        {tarea.archivo_adjunto && mantenerArchivo && !archivo && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiFileText className="text-blue-600" size={24} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Archivo actual: {tarea.archivo_adjunto}
                  </p>
                  <a
                    href={`${getServerURL()}/uploads/tareas/${tarea.archivo_adjunto}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Descargar
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={eliminarArchivoActual}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Subir nuevo archivo */}
        {(!tarea.archivo_adjunto || !mantenerArchivo) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {tarea.archivo_adjunto && !mantenerArchivo ? 'Nuevo archivo (opcional)' : 'Archivo adjunto (opcional)'}
            </label>
            
            {!archivo ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <FiUpload className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Arrastra un archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  PDF, Word, Excel, PowerPoint o Imágenes (máx. 10MB)
                </p>
                <input
                  type="file"
                  id="archivo"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                />
                <label
                  htmlFor="archivo"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Seleccionar archivo
                </label>
              </div>
            ) : (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiFileText className="text-2xl text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {archivo.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(archivo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setArchivo(null)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
