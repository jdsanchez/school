'use client';

import { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiCalendar, FiCreditCard, FiAlertCircle, 
  FiCheckCircle, FiUpload, FiBook, FiClock, FiX, FiEye 
} from 'react-icons/fi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CursoPendiente {
  curso_id: number;
  nombre: string;
  codigo: string;
  costo: number;
  fecha_limite: string | null;
  estado_pago: string | null;
  pago_id: number | null;
  horario: string;
  maestro_nombre: string;
}

interface MiPago {
  id: number;
  curso_nombre: string;
  curso_codigo: string;
  monto: number;
  metodo_pago: string;
  estado: string;
  fecha_limite: string;
  fecha_pago: string | null;
  comprobante: string | null;
  numero_referencia: string | null;
  observaciones: string | null;
  fecha_confirmacion: string | null;
}

export default function MisPagosPage() {
  const { usuario } = useAuth();
  const [cursosPendientes, setCursosPendientes] = useState<CursoPendiente[]>([]);
  const [misPagos, setMisPagos] = useState<MiPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<CursoPendiente | null>(null);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<MiPago | null>(null);
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
    setLoading(true);
    try {
      await Promise.all([cargarCursosPendientes(), cargarMisPagos()]);
    } finally {
      setLoading(false);
    }
  };

  const cargarCursosPendientes = async () => {
    try {
      const response = await api.get('/cursos/mis-asignaciones');
      // Filtrar cursos que requieren pago y no están confirmados como pagados
      const pendientes = response.data.filter((curso: any) => 
        curso.costo > 0 && 
        curso.estado_pago !== 'Pagado'
      );
      setCursosPendientes(pendientes);
    } catch (error) {
      console.error('Error al cargar cursos pendientes:', error);
    }
  };

  const cargarMisPagos = async () => {
    try {
      const response = await api.get('/pagos/mis-pagos');
      setMisPagos(response.data);
    } catch (error) {
      console.error('Error al cargar mis pagos:', error);
    }
  };

  const abrirModalPago = (curso: CursoPendiente) => {
    setCursoSeleccionado(curso);
    setShowPagoModal(true);
  };

  const abrirDetallesPago = async (curso: CursoPendiente) => {
    try {
      // Buscar el pago en el historial
      const pagoEncontrado = misPagos.find(p => p.curso_nombre === curso.nombre);
      if (pagoEncontrado) {
        setPagoSeleccionado(pagoEncontrado);
        setShowDetalleModal(true);
      }
    } catch (error) {
      console.error('Error al abrir detalles:', error);
    }
  };

  const handleSubmitPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoSeleccionado || !usuario) return;

    try {
      const formData = new FormData();
      formData.append('curso_id', cursoSeleccionado.curso_id.toString());
      formData.append('alumno_id', usuario.id.toString());
      formData.append('monto', cursoSeleccionado.costo.toString());
      formData.append('metodo_pago', pagoData.metodo_pago);
      formData.append('numero_referencia', pagoData.numero_referencia);
      formData.append('observaciones', pagoData.observaciones);
      
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      await api.post('/pagos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Pago registrado exitosamente. Espera la confirmación del administrador.');
      setShowPagoModal(false);
      setCursoSeleccionado(null);
      setPagoData({ metodo_pago: 'Transferencia', numero_referencia: '', observaciones: '' });
      setComprobante(null);
      cargarDatos();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al registrar el pago');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: any = {
      'Pagado': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Atrasado': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Parcial': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Cancelado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Pagos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona los pagos de tus cursos asignados
        </p>
      </div>

      {/* Cursos Pendientes de Pago */}
      {cursosPendientes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertCircle className="text-red-600 text-xl" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Cursos Pendientes de Pago ({cursosPendientes.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursosPendientes.map((curso) => (
              <div
                key={curso.curso_id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${
                  curso.estado_pago === 'Atrasado' 
                    ? 'border-red-500' 
                    : curso.estado_pago === 'Parcial'
                    ? 'border-orange-500'
                    : 'border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {curso.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{curso.codigo}</p>
                  </div>
                  {curso.estado_pago && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(curso.estado_pago)}`}>
                      {curso.estado_pago}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <FiBook size={16} />
                    <span>{curso.maestro_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock size={16} />
                    <span>{curso.horario}</span>
                  </div>
                  {curso.fecha_limite && (
                    <div className="flex items-center gap-2">
                      <FiCalendar size={16} />
                      <span>Límite: {new Date(curso.fecha_limite).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total a Pagar</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      Q{Number(curso.costo).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {curso.estado_pago === 'Pendiente' ? (
                      <button
                        onClick={() => abrirDetallesPago(curso)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FiEye size={16} />
                        Ver Detalles
                      </button>
                    ) : (
                      <button
                        onClick={() => abrirModalPago(curso)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FiDollarSign size={16} />
                        Pagar Ahora
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de Pagos */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Historial de Pagos
        </h2>

        {misPagos.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <FiDollarSign className="mx-auto text-5xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              No tienes pagos registrados
            </h3>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Curso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Comprobante
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {misPagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {pago.curso_nombre}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {pago.curso_codigo}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          Q{Number(pago.monto).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <FiCreditCard size={16} />
                          {pago.metodo_pago}
                        </div>
                        {pago.numero_referencia && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Ref: {pago.numero_referencia}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(pago.estado)}`}>
                          {pago.estado}
                        </span>
                        {pago.fecha_confirmacion && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Confirmado: {new Date(pago.fecha_confirmacion).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pago.comprobante ? (
                          <a
                            href={`http://localhost:5000${pago.comprobante}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 flex items-center gap-1 text-sm"
                          >
                            <FiCheckCircle size={16} />
                            Ver
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Sin archivo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Pago */}
      {showPagoModal && cursoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Registrar Pago
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {cursoSeleccionado.nombre} - {cursoSeleccionado.codigo}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPagoModal(false);
                    setCursoSeleccionado(null);
                    setPagoData({ metodo_pago: 'Transferencia', numero_referencia: '', observaciones: '' });
                    setComprobante(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitPago} className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Monto a Pagar:</span>
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    Q{Number(cursoSeleccionado.costo).toFixed(2)}
                  </span>
                </div>
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
                    Número de Referencia {pagoData.metodo_pago !== 'Efectivo' && '*'}
                  </label>
                  <input
                    type="text"
                    value={pagoData.numero_referencia}
                    onChange={(e) => setPagoData({ ...pagoData, numero_referencia: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: 123456789"
                    required={pagoData.metodo_pago !== 'Efectivo'}
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
                    Sube una foto o PDF del comprobante (opcional pero recomendado)
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

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
                <div className="flex gap-2">
                  <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Tu pago será revisado por un administrador. Recibirás una notificación cuando sea confirmado o rechazado.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPagoModal(false);
                    setCursoSeleccionado(null);
                    setPagoData({ metodo_pago: 'Transferencia', numero_referencia: '', observaciones: '' });
                    setComprobante(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <FiUpload />
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles del Pago */}
      {showDetalleModal && pagoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Detalles del Pago
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {pagoSeleccionado.curso_nombre} - {pagoSeleccionado.curso_codigo}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetalleModal(false);
                    setPagoSeleccionado(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Estado del Pago */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">Estado:</span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getEstadoBadge(pagoSeleccionado.estado)}`}>
                    {pagoSeleccionado.estado}
                  </span>
                </div>

                {pagoSeleccionado.estado === 'Pendiente' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex gap-2">
                      <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Tu pago está siendo revisado por un administrador. Te notificaremos cuando sea confirmado.
                      </p>
                    </div>
                  </div>
                )}

                {pagoSeleccionado.estado === 'Pagado' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex gap-2">
                      <FiCheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
                          Pago Confirmado
                        </p>
                        {pagoSeleccionado.fecha_confirmacion && (
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Confirmado el: {new Date(pagoSeleccionado.fecha_confirmacion).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Información del Pago */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monto Pagado</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      Q{Number(pagoSeleccionado.monto).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Método de Pago</p>
                    <div className="flex items-center gap-2">
                      <FiCreditCard className="text-gray-600 dark:text-gray-400" />
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {pagoSeleccionado.metodo_pago}
                      </p>
                    </div>
                  </div>
                </div>

                {pagoSeleccionado.numero_referencia && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Número de Referencia</p>
                    <p className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-gray-900 dark:text-white">
                      {pagoSeleccionado.numero_referencia}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha Límite</p>
                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-gray-600 dark:text-gray-400" size={16} />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(pagoSeleccionado.fecha_limite).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {pagoSeleccionado.fecha_pago && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha de Pago</p>
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-600 dark:text-gray-400" size={16} />
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(pagoSeleccionado.fecha_pago).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {pagoSeleccionado.observaciones && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observaciones</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {pagoSeleccionado.observaciones}
                    </p>
                  </div>
                )}
              </div>

              {/* Comprobante */}
              {pagoSeleccionado.comprobante && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Comprobante de Pago
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    {pagoSeleccionado.comprobante.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <div className="space-y-3">
                        <img
                          src={`http://localhost:5000${pagoSeleccionado.comprobante}`}
                          alt="Comprobante"
                          className="max-w-full h-auto rounded-lg shadow-md"
                        />
                        <a
                          href={`http://localhost:5000${pagoSeleccionado.comprobante}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                        >
                          <FiEye size={16} />
                          Ver en tamaño completo
                        </a>
                      </div>
                    ) : (
                      <a
                        href={`http://localhost:5000${pagoSeleccionado.comprobante}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <FiCheckCircle size={20} />
                        <span>Ver documento PDF</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowDetalleModal(false);
                    setPagoSeleccionado(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
