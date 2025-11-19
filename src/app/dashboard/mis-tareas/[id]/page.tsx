'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiDownload, FiUpload, FiCheckCircle, FiAlertCircle, FiX, FiFileText } from 'react-icons/fi';
import api from '@/lib/api';

interface DetalleTarea {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_asignacion: string;
  fecha_entrega: string;
  puntos_totales: number;
  archivo_adjunto: string | null;
  curso_nombre: string;
  curso_codigo: string;
  curso_id: number;
  maestro_nombre: string;
  entrega_id: number | null;
  fecha_mi_entrega: string | null;
  archivo_entrega: string | null;
  estado: string | null;
  calificacion: number | null;
  comentarios_calificacion: string | null;
  comentarios_alumno: string | null;
}

export default function DetalleTareaPage() {
  const router = useRouter();
  const params = useParams();
  const tareaId = params?.id as string;

  const [tarea, setTarea] = useState<DetalleTarea | null>(null);
  const [loading, setLoading] = useState(true);
  const [entregando, setEntregando] = useState(false);
  
  // Estado para el formulario de entrega
  const [archivo, setArchivo] = useState<File | null>(null);
  const [comentarios, setComentarios] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    cargarDetalleTarea();
  }, [tareaId]);

  const cargarDetalleTarea = async () => {
    try {
      const response = await api.get('/tareas/mis-tareas');
      const todasTareas = response.data;
      const tareaEncontrada = todasTareas.find((t: DetalleTarea) => t.id === parseInt(tareaId));
      setTarea(tareaEncontrada || null);
    } catch (error) {
      console.error('Error al cargar detalle de tarea:', error);
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
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (file.size > maxSize) {
      alert('El archivo no debe superar 10MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se aceptan: PDF, Word, Excel e imágenes');
      return;
    }

    setArchivo(file);
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

  const handleEntregarTarea = async () => {
    if (!archivo) {
      alert('Debes adjuntar un archivo');
      return;
    }

    setEntregando(true);
    const formData = new FormData();
    formData.append('archivo_entrega', archivo);
    if (comentarios.trim()) {
      formData.append('comentarios', comentarios.trim());
    }

    try {
      await api.post(`/tareas/${tareaId}/entregar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Tarea entregada exitosamente');
      router.push('/dashboard/mis-tareas');
    } catch (error: any) {
      console.error('Error al entregar tarea:', error);
      alert(error.response?.data?.message || 'Error al entregar tarea');
    } finally {
      setEntregando(false);
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

  const fechaEntrega = new Date(tarea.fecha_entrega);
  const ahora = new Date();
  const estaAtrasada = fechaEntrega < ahora && !tarea.entrega_id;

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
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {tarea.titulo}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {tarea.curso_nombre} ({tarea.curso_codigo}) • {tarea.maestro_nombre}
          </p>
        </div>
      </div>

      {/* Estado */}
      <div className="flex gap-3">
        {tarea.calificacion !== null ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <FiCheckCircle size={18} />
            Calificada: {tarea.calificacion}/{tarea.puntos_totales}
          </span>
        ) : tarea.entrega_id ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <FiCheckCircle size={18} />
            Entregada
          </span>
        ) : estaAtrasada ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <FiAlertCircle size={18} />
            Atrasada
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <FiAlertCircle size={18} />
            Pendiente
          </span>
        )}
      </div>

      {/* Información de la tarea */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de entrega</p>
            <p className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
              <FiCalendar />
              {fechaEntrega.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Puntos totales</p>
            <p className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
              <FiFileText />
              {tarea.puntos_totales} puntos
            </p>
          </div>
        </div>

        {tarea.descripcion && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Descripción</p>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {tarea.descripcion}
            </p>
          </div>
        )}

        {tarea.archivo_adjunto && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Material adjunto</p>
            <a
              href={`http://localhost:5000/uploads/tareas/${tarea.archivo_adjunto}`}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiDownload />
              Descargar archivo
            </a>
          </div>
        )}
      </div>

      {/* Mi entrega */}
      {tarea.entrega_id ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Mi Entrega
          </h2>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de entrega</p>
            <p className="text-gray-900 dark:text-white">
              {new Date(tarea.fecha_mi_entrega!).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {tarea.comentarios_alumno && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mis comentarios</p>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {tarea.comentarios_alumno}
              </p>
            </div>
          )}

          {tarea.archivo_entrega && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Archivo entregado</p>
              <a
                href={`http://localhost:5000/uploads/entregas/${tarea.archivo_entrega}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiDownload />
                Descargar mi entrega
              </a>
            </div>
          )}

          {tarea.calificacion !== null && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                Calificación: {tarea.calificacion}/{tarea.puntos_totales}
              </p>
              {tarea.comentarios_calificacion && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comentarios del maestro:
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {tarea.comentarios_calificacion}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Formulario de entrega
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Entregar Tarea
          </h2>

          {estaAtrasada && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">
                <FiAlertCircle className="inline mr-2" />
                Esta tarea está atrasada. Tu maestro puede penalizarla.
              </p>
            </div>
          )}

          {/* Área de carga de archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Archivo <span className="text-red-500">*</span>
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
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  PDF, Word, Excel o Imágenes (máx. 10MB)
                </p>
                <input
                  type="file"
                  id="archivo-entrega"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                />
                <label
                  htmlFor="archivo-entrega"
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
                  onClick={() => setArchivo(null)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Comentarios */}
          <div>
            <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comentarios (opcional)
            </label>
            <textarea
              id="comentarios"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Agrega comentarios sobre tu entrega..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              onClick={handleEntregarTarea}
              disabled={!archivo || entregando}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {entregando ? 'Entregando...' : 'Entregar Tarea'}
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
