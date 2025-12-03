'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';

interface Maestro {
  id: number;
  nombre_completo: string;
  email: string;
  cursos_activos: number;
}

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  maestro_id: number;
  cupo_maximo: number;
  creditos: number;
  costo: number;
  horario: string;
  aula: string;
  activo: boolean;
}

interface HorarioItem {
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
}

const DIAS_SEMANA = [
  { value: 'Lunes', label: 'Lunes' },
  { value: 'Martes', label: 'Martes' },
  { value: 'Miércoles', label: 'Miércoles' },
  { value: 'Jueves', label: 'Jueves' },
  { value: 'Viernes', label: 'Viernes' },
  { value: 'Sábado', label: 'Sábado' },
  { value: 'Domingo', label: 'Domingo' },
];

const HORAS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function EditarCursoPage() {
  const { showAlert } = useAlert();
  const params = useParams();
  const router = useRouter();
  const cursoId = params.id as string;
  
  const [maestros, setMaestros] = useState<Maestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [horarios, setHorarios] = useState<HorarioItem[]>([{ dias: [], hora_inicio: '08:00', hora_fin: '09:00' }]);

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    maestro_id: '',
    cupo_maximo: 30,
    creditos: 0,
    costo: 0,
    horario: '',
    aula: '',
    activo: true,
  });

  useEffect(() => {
    cargarDatos();
  }, [cursoId]);

  const parsearHorario = (horarioTexto: string): HorarioItem[] => {
    if (!horarioTexto) return [{ dias: [], hora_inicio: '08:00', hora_fin: '09:00' }];
    
    const segmentos = horarioTexto.split(' • ');
    return segmentos.map(segmento => {
      const match = segmento.match(/([^\d]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})/);
      if (match) {
        const diasStr = match[1].trim();
        const dias = diasStr.split('-').map(d => d.trim());
        return {
          dias,
          hora_inicio: match[2],
          hora_fin: match[3]
        };
      }
      return { dias: [], hora_inicio: '08:00', hora_fin: '09:00' };
    });
  };

  const cargarDatos = async () => {
    try {
      const [cursoRes, maestrosRes] = await Promise.all([
        api.get(`/cursos/${cursoId}`),
        api.get('/cursos/maestros')
      ]);
      
      const curso: Curso = cursoRes.data;
      
      // Convertir fechas de ISO a formato YYYY-MM-DD
      const fechaInicio = curso.fecha_inicio ? new Date(curso.fecha_inicio).toISOString().split('T')[0] : '';
      const fechaFin = curso.fecha_fin ? new Date(curso.fecha_fin).toISOString().split('T')[0] : '';
      
      setFormData({
        nombre: curso.nombre,
        codigo: curso.codigo,
        descripcion: curso.descripcion,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        maestro_id: curso.maestro_id.toString(),
        cupo_maximo: curso.cupo_maximo,
        creditos: curso.creditos,
        costo: Number(curso.costo) || 0,
        horario: curso.horario || '',
        aula: curso.aula || '',
        activo: curso.activo,
      });
      
      // Parsear horario existente
      if (curso.horario) {
        setHorarios(parsearHorario(curso.horario));
      }
      
      setMaestros(maestrosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showAlert('Error al cargar el curso', 'error');
    } finally {
      setLoading(false);
    }
  };

  const agregarHorario = () => {
    setHorarios([...horarios, { dias: [], hora_inicio: '08:00', hora_fin: '09:00' }]);
  };

  const eliminarHorario = (index: number) => {
    if (horarios.length > 1) {
      setHorarios(horarios.filter((_, i) => i !== index));
    }
  };

  const actualizarHorario = (index: number, campo: keyof HorarioItem, valor: any) => {
    const nuevosHorarios = [...horarios];
    nuevosHorarios[index] = { ...nuevosHorarios[index], [campo]: valor };
    setHorarios(nuevosHorarios);
  };

  const toggleDia = (index: number, dia: string) => {
    const horario = horarios[index];
    const nuevosDias = horario.dias.includes(dia)
      ? horario.dias.filter(d => d !== dia)
      : [...horario.dias, dia];
    actualizarHorario(index, 'dias', nuevosDias);
  };

  const generarTextoHorario = () => {
    return horarios
      .filter(h => h.dias.length > 0)
      .map(h => `${h.dias.join('-')} ${h.hora_inicio}-${h.hora_fin}`)
      .join(' • ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const horarioTexto = generarTextoHorario();
      await api.put(`/cursos/${cursoId}`, { ...formData, horario: horarioTexto });
      showAlert('Curso actualizado exitosamente', 'success');
      router.push('/dashboard/cursos');
    } catch (error: any) {
      showAlert(error.response?.data?.mensaje || 'Error al actualizar curso', 'error');
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Editar Curso
        </h1>
      </div>

      {/* Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Curso *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Desarrollo Web Front-End"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código *
              </label>
              <input
                type="text"
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: DEV-101"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Descripción del curso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maestro *
            </label>
            <select
              required
              value={formData.maestro_id}
              onChange={(e) => setFormData({ ...formData, maestro_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Seleccionar maestro</option>
              {maestros.map((maestro) => (
                <option key={maestro.id} value={maestro.id}>
                  {maestro.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Inicio *
              </label>
              <input
                type="date"
                required
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Fin *
              </label>
              <input
                type="date"
                required
                value={formData.fecha_fin}
                onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cupo Máximo
              </label>
              <input
                type="number"
                min="1"
                value={formData.cupo_maximo}
                onChange={(e) => setFormData({ ...formData, cupo_maximo: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Créditos
              </label>
              <input
                type="number"
                min="0"
                value={formData.creditos}
                onChange={(e) => setFormData({ ...formData, creditos: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Costo (Q)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costo || ''}
                onChange={(e) => setFormData({ ...formData, costo: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aula
            </label>
            <input
              type="text"
              value={formData.aula}
              onChange={(e) => setFormData({ ...formData, aula: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: Aula 101"
            />
          </div>

          {/* Estado del Curso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado del Curso
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="activo"
                  checked={formData.activo === true}
                  onChange={() => setFormData({ ...formData, activo: true })}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  Activo
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="activo"
                  checked={formData.activo === false}
                  onChange={() => setFormData({ ...formData, activo: false })}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                  Inactivo
                </span>
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Los cursos inactivos no aparecerán disponibles para nuevas inscripciones
            </p>
          </div>

          {/* Horarios */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Horarios del Curso
              </label>
              <button
                type="button"
                onClick={agregarHorario}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus size={16} />
                Agregar Horario
              </button>
            </div>

            {horarios.map((horario, index) => (
              <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Horario {index + 1}
                  </span>
                  {horarios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarHorario(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Días de la Semana
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DIAS_SEMANA.map((dia) => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => toggleDia(index, dia.value)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          horario.dias.includes(dia.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {dia.label.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hora Inicio
                    </label>
                    <select
                      value={horario.hora_inicio}
                      onChange={(e) => actualizarHorario(index, 'hora_inicio', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {HORAS.map((hora) => (
                        <option key={hora} value={hora}>
                          {hora}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hora Fin
                    </label>
                    <select
                      value={horario.hora_fin}
                      onChange={(e) => actualizarHorario(index, 'hora_fin', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {HORAS.map((hora) => (
                        <option key={hora} value={hora}>
                          {hora}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {generarTextoHorario() && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Vista previa:</span> {generarTextoHorario()}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <FiSave />
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
