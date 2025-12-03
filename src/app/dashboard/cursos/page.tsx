'use client';

import { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiUsers, FiCalendar, FiUser, FiDollarSign, FiCheckCircle, FiAlertCircle, FiEye, FiFileText, FiClipboard } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  maestro_id: number;
  maestro_nombre: string;
  maestro_email: string;
  cupo_maximo: number;
  creditos: number;
  costo: number;
  horario: string;
  aula: string;
  activo: boolean;
  alumnos_inscritos: number;
  total_tareas: number;
  esta_inscrito?: boolean;
  pago_realizado?: boolean;
  estado_pago?: 'Pendiente' | 'Pagado' | 'Atrasado' | 'Parcial' | 'Cancelado' | null;
  pago_id?: number | null;
}

interface Maestro {
  id: number;
  nombre_completo: string;
  email: string;
  cursos_activos: number;
}

export default function CursosPage() {
  const { usuario } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [cursoParaPago, setCursoParaPago] = useState<Curso | null>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);

  const [pagoData, setPagoData] = useState({
    metodo_pago: 'Transferencia',
    numero_referencia: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const cursosRes = await api.get('/cursos');
      setCursos(cursosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (curso: Curso) => {
    router.push(`/dashboard/cursos/${curso.id}/editar`);
  };

  const handleDelete = async (id: number) => {
    showConfirm('¿Estás seguro de eliminar este curso?', async () => {
      try {
        await api.delete(`/cursos/${id}`);
        showAlert('Curso eliminado exitosamente', 'success');
        cargarDatos();
      } catch (error: any) {
        showAlert(error.response?.data?.mensaje || 'Error al eliminar curso', 'error');
      }
    });
  };

  const abrirModalPago = (curso: Curso) => {
    setCursoParaPago(curso);
    setShowPagoModal(true);
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoParaPago || !usuario) return;

    try {
      const formDataPago = new FormData();
      formDataPago.append('curso_id', cursoParaPago.id.toString());
      formDataPago.append('alumno_id', usuario.id.toString());
      formDataPago.append('monto', Number(cursoParaPago.costo || 0).toString());
      formDataPago.append('metodo_pago', pagoData.metodo_pago);
      formDataPago.append('fecha_limite', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      formDataPago.append('numero_referencia', pagoData.numero_referencia);
      formDataPago.append('observaciones', pagoData.observaciones);
      
      if (comprobante) {
        formDataPago.append('comprobante', comprobante);
      }

      await api.post('/pagos', formDataPago, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showAlert('Pago registrado exitosamente. Espera confirmación del administrador.', 'success');
      setShowPagoModal(false);
      setCursoParaPago(null);
      setPagoData({ metodo_pago: 'Transferencia', numero_referencia: '', observaciones: '' });
      setComprobante(null);
      cargarDatos();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Error al registrar pago', 'error');
    }
  };

  const verAlumnosInscritos = (curso: Curso) => {
    router.push(`/dashboard/cursos/${curso.id}/alumnos`);
  };

  const cursosFiltrados = cursos.filter(
    (curso) =>
      curso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.maestro_nombre.toLowerCase().includes(searchTerm.toLowerCase())
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
          Gestión de Cursos
        </h1>
        <button
          onClick={() => router.push('/dashboard/cursos/nuevo')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus />
          Nuevo Curso
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursosFiltrados.map((curso) => (
            <div
              key={curso.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {curso.nombre}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{curso.codigo}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    curso.activo
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {curso.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                {curso.descripcion}
              </p>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <FiUser size={14} />
                  <span>{curso.maestro_nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar size={14} />
                  <span>
                    {new Date(curso.fecha_inicio).toLocaleDateString()} -{' '}
                    {new Date(curso.fecha_fin).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUsers size={14} />
                  <span>
                    {curso.alumnos_inscritos} / {curso.cupo_maximo} alumnos
                  </span>
                </div>
                {curso.costo > 0 && (
                  <div className="flex items-center gap-2 font-bold text-green-600 dark:text-green-400">
                    <FiDollarSign size={14} />
                    <span>Q.{Number(curso.costo || 0).toFixed(2)}</span>
                  </div>
                )}
                {curso.aula && (
                  <div className="text-xs">
                    📍 {curso.aula} • {curso.horario}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                {/* Alumnos NO pueden inscribirse por sí mismos - La inscripción debe ser realizada por Admin/Director/Maestro */}
                {usuario?.rol_nombre === 'Alumno' && curso.esta_inscrito && (
                  <>
                    {/* Botón Ver Tareas si está inscrito y hay tareas */}
                    {curso.total_tareas > 0 && (
                      <button
                        onClick={() => router.push('/dashboard/mis-tareas')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        <FiClipboard size={16} />
                        Ver Tareas ({curso.total_tareas})
                      </button>
                    )}
                    
                    {/* Botón de Pago si el curso tiene costo */}
                    {curso.costo > 0 && (
                      <>
                        {curso.estado_pago === 'Pagado' ? (
                          <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-lg text-sm font-semibold">
                            <FiCheckCircle size={16} />
                            Pago Confirmado
                          </div>
                        ) : curso.estado_pago === 'Pendiente' ? (
                          <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-lg text-sm font-semibold">
                            <FiAlertCircle size={16} />
                            Pago en Revisión
                          </div>
                        ) : curso.estado_pago === 'Atrasado' || curso.estado_pago === 'Parcial' ? (
                          <button
                            onClick={() => abrirModalPago(curso)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-semibold"
                          >
                            <FiDollarSign size={16} />
                            {curso.estado_pago === 'Atrasado' ? 'Pago Atrasado - Pagar' : 'Completar Pago'}
                          </button>
                        ) : (
                          <button
                            onClick={() => abrirModalPago(curso)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                          >
                            <FiDollarSign size={16} />
                            Pagar Curso
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
                
                {(usuario?.rol_nombre === 'Admin' || usuario?.rol_nombre === 'Director') && (
                  <>
                    <button
                      onClick={() => router.push(`/dashboard/cursos/${curso.id}/tareas`)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      <FiClipboard size={16} />
                      Ver Tareas
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/cursos/${curso.id}/tareas/nueva`)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <FiFileText size={16} />
                      Asignar Tarea
                    </button>
                    <button
                      onClick={() => verAlumnosInscritos(curso)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      <FiEye size={16} />
                      Ver Alumnos ({curso.alumnos_inscritos})
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(curso)}
                        className="flex-1 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        <FiEdit size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(curso.id)}
                        className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      >
                        <FiTrash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
                
                {usuario?.rol_nombre === 'Maestro' && (
                  <>
                    <button
                      onClick={() => router.push(`/dashboard/cursos/${curso.id}/tareas`)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      <FiClipboard size={16} />
                      Ver Tareas
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/cursos/${curso.id}/tareas/nueva`)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <FiFileText size={16} />
                      Asignar Tarea
                    </button>
                    <button
                      onClick={() => verAlumnosInscritos(curso)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      <FiEye size={16} />
                      Ver Alumnos ({curso.alumnos_inscritos})
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {cursosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No se encontraron cursos
          </div>
        )}
      </div>

      {/* Modal de Pago */}
      {showPagoModal && cursoParaPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full my-8">
            <form onSubmit={handlePago} className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Registrar Pago
              </h3>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Curso:</strong> {cursoParaPago.nombre}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Código:</strong> {cursoParaPago.codigo}
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">
                  Monto: Q.{Number(cursoParaPago.costo || 0).toFixed(2)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={pagoData.metodo_pago}
                    onChange={(e) => setPagoData({ ...pagoData, metodo_pago: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Depósito">Depósito Bancario</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Referencia
                  </label>
                  <input
                    type="text"
                    value={pagoData.numero_referencia}
                    onChange={(e) => setPagoData({ ...pagoData, numero_referencia: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Número de transacción o boleta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comprobante de Pago
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Sube una foto o PDF del comprobante (opcional)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={pagoData.observaciones}
                    onChange={(e) => setPagoData({ ...pagoData, observaciones: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Información adicional sobre el pago..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPagoModal(false);
                    setCursoParaPago(null);
                    setPagoData({ metodo_pago: 'Transferencia', numero_referencia: '', observaciones: '' });
                    setComprobante(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <FiDollarSign />
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

