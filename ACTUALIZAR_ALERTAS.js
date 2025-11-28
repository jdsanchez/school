// Script para actualizar todos los alert() y confirm() a usar AlertContext
// Instrucciones de uso manual:

/*
ARCHIVOS A ACTUALIZAR:

1. frontend/src/app/dashboard/roles/page.tsx
   - Importar: import { useAlert } from '@/contexts/AlertContext';
   - Hook: const { showAlert, showConfirm } = useAlert();
   - Reemplazar:
     * alert(...) → showAlert(..., 'error'|'success'|'warning')
     * confirm('mensaje') → showConfirm('mensaje', () => { código })

2. frontend/src/app/dashboard/usuarios/nuevo/page.tsx
   - Ya actualizado con imports
   - Reemplazar todos los alert() con showAlert()

3. frontend/src/app/dashboard/pagos/page.tsx
   - Ya actualizado con imports
   - Reemplazar:
     * alert('Error: Usuario no identificado...') → showAlert(..., 'error')
     * alert('Debe proporcionar un motivo...') → showAlert(..., 'warning')
     * alert('Pago confirmado...') → showAlert(..., 'success')
     * window.confirm(...) → showConfirm(...)

4. frontend/src/app/dashboard/permisos/page.tsx
   - Ya actualizado con imports
   - Reemplazar:
     * alert('Permisos guardados exitosamente') → showAlert(..., 'success')
     * alert('Error al guardar permisos') → showAlert(..., 'error')

5. frontend/src/app/dashboard/reporte-asistencia/page.tsx
   - Ya actualizado con imports
   - Reemplazar:
     * alert('Selecciona un curso') → showAlert(..., 'warning')
     * alert('Error al cargar el reporte') → showAlert(..., 'error')

6. frontend/src/app/dashboard/menu-admin/page.tsx
   - Importar: import { useAlert } from '@/contexts/AlertContext';
   - Hook: const { showAlert, showConfirm } = useAlert();
   - Reemplazar:
     * confirm('¿Eliminar este menú?...') → showConfirm(...)
     * confirm('¿Eliminar este submenú?') → showConfirm(...)

7. frontend/src/app/dashboard/cursos/[id]/tareas/page.tsx
   - Importar: import { useAlert } from '@/contexts/AlertContext';
   - Hook: const { showAlert, showConfirm } = useAlert();
   - Reemplazar:
     * confirm('¿Estás seguro de eliminar esta tarea?') → showConfirm(...)

8. frontend/src/app/dashboard/cursos/page.tsx
   - Ya actualizado con imports
   - Reemplazar:
     * confirm('¿Estás seguro de eliminar este curso?') → showConfirm(...)

9. frontend/src/app/dashboard/mis-tareas/[id]/page.tsx
   - Importar: import { useAlert } from '@/contexts/AlertContext';
   - Hook: const { showAlert } = useAlert();
   - Reemplazar:
     * alert('El archivo no debe superar 10MB') → showAlert(..., 'warning')
     * alert('Tipo de archivo no permitido...') → showAlert(..., 'warning')
*/

// PLANTILLA DE REEMPLAZO:

// alert('mensaje') → showAlert('mensaje', 'tipo')
// Tipos: 'success', 'error', 'warning', 'info'

// confirm('¿mensaje?') → 
// showConfirm('¿mensaje?', () => {
//   // código a ejecutar si confirma
// });

export const ARCHIVOS_PENDIENTES = [
  'roles/page.tsx',
  'usuarios/nuevo/page.tsx', 
  'pagos/page.tsx',
  'permisos/page.tsx',
  'reporte-asistencia/page.tsx',
  'menu-admin/page.tsx',
  'cursos/[id]/tareas/page.tsx',
  'cursos/page.tsx',
  'mis-tareas/[id]/page.tsx'
];
