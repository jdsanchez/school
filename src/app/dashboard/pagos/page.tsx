'use client';

import { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiSearch, FiFilter, FiCheck, FiX, FiEye, 
  FiDownload, FiCalendar, FiCreditCard, FiAlertCircle 
} from 'react-icons/fi';
import api, { getServerURL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';

interface Pago {
  id: number;
  curso_id: number;
  alumno_id: number;
  monto: number;
  metodo_pago: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Depósito';
  estado: 'Pendiente' | 'Pagado' | 'Atrasado' | 'Parcial' | 'Cancelado';
  fecha_limite: string;
  fecha_pago: string | null;
  comprobante: string | null;
  numero_referencia: string | null;
  observaciones: string | null;
  confirmado_por: number | null;
  fecha_confirmacion: string | null;
  curso_nombre: string;
  curso_codigo: string;
  alumno_nombre: string;
  codigo_estudiante: string;
  alumno_email: string;
  confirmado_por_nombre: string | null;
}

interface Estadisticas {
  total_pagos: number;
  pagados: number;
  pendientes: number;
  atrasados: number;
  total_recaudado: number;
  total_pendiente: number;
}

export default function PagosPage() {
  const { usuario } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagosPendientes, setPagosPendientes] = useState<Pago[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [observacionRechazo, setObservacionRechazo] = useState('');
  const [cursosDisponibles, setCursosDisponibles] = useState<any[]>([]);
  const [cursoParaPago, setCursoParaPago] = useState<any>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [pagoData, setPagoData] = useState({
    metodo_pago: 'Transferencia',
    numero_referencia: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
    if (usuario?.rol_nombre === 'Alumno') {
      cargarCursosDisponibles();
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario) {
      cargarDatos();
    }
  }, [filtroEstado]);

  const cargarCursosDisponibles = async () => {
    try {
      const response = await api.get('/cursos');
      // Filtrar cursos donde el alumno está inscrito y:
      // - No tiene pago registrado, O
      // - Tiene pago pero está Pendiente, Atrasado o Parcial
      const cursosConPagosPendientes = response.data.filter(
        (curso: any) => curso.esta_inscrito && curso.costo > 0 && 
        (!curso.estado_pago || curso.estado_pago === 'Pendiente' || curso.estado_pago === 'Atrasado' || curso.estado_pago === 'Parcial')
      );
      setCursosDisponibles(cursosConPagosPendientes);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    }
  };

  const cargarDatos = async () => {
    try {
      const params: any = {};
      if (filtroEstado) params.estado = filtroEstado;

      console.log('🔄 Cargando datos de pagos...');
      const [pagosRes, statsRes, pendientesRes] = await Promise.all([
        api.get('/pagos', { params }),
        api.get('/pagos/estadisticas'),
        api.get('/pagos', { params: { estado: 'Pendiente' } })
      ]);

      console.log('📊 Datos recibidos:', {
        pagos: pagosRes.data.length,
        pendientes: pendientesRes.data.length,
        estadisticas: statsRes.data
      });

      setPagos(pagosRes.data);
      setPagosPendientes(pendientesRes.data);
      setEstadisticas(statsRes.data.resumen);
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarPago = async (pago: Pago) => {
    if (!usuario?.id) {
      showAlert('Error: Usuario no identificado. Por favor, recarga la página.', 'error');
      return;
    }

    showConfirm(`¿Confirmar el pago de ${pago.alumno_nombre} por Q${pago.monto}?`, async () => {
      console.log('🔍 Usuario actual:', usuario);
      console.log('🔍 Datos a enviar:', {
        confirmado_por: usuario.id,
        observaciones: 'Pago verificado y confirmado'
      });

    try {
      const response = await api.put(`/pagos/${pago.id}/confirmar`, {
        confirmado_por: usuario.id,
        observaciones: 'Pago verificado y confirmado'
      });
      console.log('✅ Respuesta del servidor:', response.data);
      showAlert('Pago confirmado exitosamente', 'success');
      cargarDatos();
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('❌ Respuesta del error:', error.response?.data);
      showAlert(error.response?.data?.message || 'Error al confirmar pago', 'error');
    }
    });
  };

  const rechazarPago = async (pago: Pago) => {
    setPagoSeleccionado(pago);
    setShowModal(true);
  };

  const confirmarRechazo = async () => {
    if (!usuario?.id) {
      showAlert('Error: Usuario no identificado. Por favor, recarga la página.', 'error');
      return;
    }

    if (!observacionRechazo.trim()) {
      showAlert('Debe proporcionar un motivo de rechazo', 'warning');
      return;
    }

    try {
      await api.put(`/pagos/${pagoSeleccionado!.id}/rechazar`, {
        rechazado_por: usuario.id,
        observaciones: observacionRechazo
      });
      showAlert('Pago rechazado', 'success');
      setShowModal(false);
      setPagoSeleccionado(null);
      setObservacionRechazo('');
      cargarDatos();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Error al rechazar pago', 'error');
    }
  };

  const abrirModalPago = (curso: any) => {
    setCursoParaPago(curso);
    setShowPagoModal(true);
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
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
      cargarCursosDisponibles();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Error al registrar pago', 'error');
    }
  };

  const verComprobante = (comprobante: string) => {
    const url = `${getServerURL()}/uploads/comprobantes/${comprobante}`;
    window.open(url, '_blank');
  };

  const pagosFiltrados = pagos.filter(pago => {
    const busqueda = searchTerm.toLowerCase();
    return (
      pago.alumno_nombre.toLowerCase().includes(busqueda) ||
      pago.codigo_estudiante.toLowerCase().includes(busqueda) ||
      pago.curso_nombre.toLowerCase().includes(busqueda) ||
      pago.curso_codigo.toLowerCase().includes(busqueda) ||
      pago.numero_referencia?.toLowerCase().includes(busqueda)
    );
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pagado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Atrasado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Parcial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Cancelado': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetodoIcon = (metodo: string) => {
    switch (metodo) {
      case 'Efectivo': return '💵';
      case 'Transferencia': return '🏦';
      case 'Tarjeta': return '💳';
      case 'Depósito': return '📄';
      default: return '💰';
    }
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiDollarSign className="text-green-600" />
          Gestión de Pagos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Administra los pagos de cursos y confirmaciones
        </p>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Pagos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {estadisticas.total_pagos}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow">
            <p className="text-green-600 dark:text-green-400 text-sm">Pagados</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {estadisticas.pagados}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg shadow">
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {estadisticas.pendientes}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg shadow">
            <p className="text-red-600 dark:text-red-400 text-sm">Atrasados</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {estadisticas.atrasados}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow">
            <p className="text-blue-600 dark:text-blue-400 text-sm">Recaudado</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              Q.{estadisticas.total_recaudado.toFixed(2)}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg shadow">
            <p className="text-orange-600 dark:text-orange-400 text-sm">Por Cobrar</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              Q.{estadisticas.total_pendiente.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Sección de Pagos Pendientes de Autorización (Solo Admin/Director) */}
      {(usuario?.rol_nombre === 'Admin' || usuario?.rol_nombre === 'Director') && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500 p-3 rounded-full">
                  <FiAlertCircle className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Pagos Pendientes de Autorización
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pagosPendientes.length} pago{pagosPendientes.length !== 1 ? 's' : ''} esperando tu aprobación
                  </p>
                </div>
              </div>
            </div>

            {pagosPendientes.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg">
                <FiCheck className="mx-auto text-5xl text-green-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  No hay pagos pendientes de autorización
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pagosPendientes.map((pago) => (
                  <div key={pago.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getMetodoIcon(pago.metodo_pago)}</span>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {pago.alumno_nombre}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {pago.codigo_estudiante} • {pago.alumno_email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          Q.{Number(pago.monto).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {pago.curso_nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Código: {pago.curso_codigo}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Método:</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {pago.metodo_pago}
                        </p>
                      </div>
                      {pago.numero_referencia && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Referencia:</p>
                          <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white break-all">
                            {pago.numero_referencia}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Fecha límite:</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatFecha(pago.fecha_limite)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Registrado:</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatFecha(pago.fecha_pago)}
                        </p>
                      </div>
                    </div>

                    {pago.observaciones && (
                      <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observaciones:</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {pago.observaciones}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {pago.comprobante && (
                        <button
                          onClick={() => verComprobante(pago.comprobante!)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                        >
                          <FiEye size={16} />
                          Ver Comprobante
                        </button>
                      )}
                      <button
                        onClick={() => confirmarPago(pago)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                      >
                        <FiCheck size={16} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => rechazarPago(pago)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                      >
                        <FiX size={16} />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cursos Disponibles para Pago (Solo Alumnos) */}
      {usuario?.rol_nombre === 'Alumno' && cursosDisponibles.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <FiAlertCircle className="text-orange-500" />
            Mis Cursos - Pagos Pendientes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Tienes {cursosDisponibles.length} curso{cursosDisponibles.length !== 1 ? 's' : ''} pendiente{cursosDisponibles.length !== 1 ? 's' : ''} de pago
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cursosDisponibles.map((curso) => (
              <div key={curso.id} className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${
                curso.estado_pago === 'Atrasado' ? 'border-red-500' : 
                curso.estado_pago === 'Parcial' ? 'border-yellow-500' : 
                curso.estado_pago === 'Pendiente' ? 'border-blue-500' : 'border-orange-500'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{curso.nombre}</h3>
                  {curso.estado_pago && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      curso.estado_pago === 'Atrasado' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      curso.estado_pago === 'Parcial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      curso.estado_pago === 'Pendiente' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {curso.estado_pago}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{curso.codigo}</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-3">
                  Q.{Number(curso.costo || 0).toFixed(2)}
                </p>
                <button
                  onClick={() => abrirModalPago(curso)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                    curso.estado_pago === 'Atrasado' ? 'bg-red-600 hover:bg-red-700' :
                    curso.estado_pago === 'Parcial' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    curso.estado_pago === 'Pendiente' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <FiDollarSign />
                  {curso.estado_pago === 'Atrasado' ? 'Pagar Ahora' :
                   curso.estado_pago === 'Parcial' ? 'Completar Pago' :
                   curso.estado_pago === 'Pendiente' ? 'Actualizar Pago' :
                   'Pagar Curso'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por alumno, código, curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Atrasado">Atrasado</option>
              <option value="Parcial">Parcial</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Límite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Comprobante
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {pagosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <FiAlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No se encontraron pagos</p>
                  </td>
                </tr>
              ) : (
                pagosFiltrados.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {pago.alumno_nombre}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {pago.codigo_estudiante}
                        </div>
                      </div>
                    </td>
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
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        Q.{pago.monto.toFixed(2)}
                      </div>
                      {pago.numero_referencia && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Ref: {pago.numero_referencia}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                        <span>{getMetodoIcon(pago.metodo_pago)}</span>
                        <span>{pago.metodo_pago}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(pago.estado)}`}>
                        {pago.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <FiCalendar className="text-gray-400" />
                        {formatFecha(pago.fecha_limite)}
                      </div>
                      {pago.fecha_pago && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Pagado: {formatFecha(pago.fecha_pago)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {pago.comprobante ? (
                        <button
                          onClick={() => verComprobante(pago.comprobante!)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Ver comprobante"
                        >
                          <FiEye className="inline h-5 w-5" />
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {pago.estado === 'Pendiente' || pago.estado === 'Atrasado' ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => confirmarPago(pago)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300
                                     p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30"
                            title="Confirmar pago"
                          >
                            <FiCheck className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => rechazarPago(pago)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300
                                     p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                            title="Rechazar pago"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </div>
                      ) : pago.estado === 'Pagado' ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {pago.confirmado_por_nombre && (
                            <div>Por: {pago.confirmado_por_nombre}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Rechazo */}
      {showModal && pagoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Rechazar Pago
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Alumno: <strong>{pagoSeleccionado.alumno_nombre}</strong><br />
                Curso: <strong>{pagoSeleccionado.curso_nombre}</strong><br />
                Monto: <strong>Q.{pagoSeleccionado.monto.toFixed(2)}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo del Rechazo *
                </label>
                <textarea
                  value={observacionRechazo}
                  onChange={(e) => setObservacionRechazo(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe el motivo del rechazo..."
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setPagoSeleccionado(null);
                    setObservacionRechazo('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                           dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRechazo}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
                           flex items-center gap-2"
                >
                  <FiX />
                  Rechazar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Pago */}
      {showPagoModal && cursoParaPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full my-8">
            <form onSubmit={handleRegistrarPago} className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Registrar Pago de Curso
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
