import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../../lib/api'
import { useAuthenticatedFile, downloadAuthenticatedFile } from '../../hooks/useAuthenticatedFile'

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [revealPassword, setRevealPassword] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [nextPaymentDate, setNextPaymentDate] = useState('')
  const [observationText, setObservationText] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [isPrimary, setIsPrimary] = useState(false)
  const [loadingUpload, setLoadingUpload] = useState(false)

  // Obtener detalles de la tarea
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await api.get(`/services/checklist/${taskId}`)
      return response.data
    },
    enabled: !!taskId
  })

  // Obtener observaciones del cliente
  const { data: observations = [] } = useQuery({
    queryKey: ['client-observations', task?.client_id],
    queryFn: async () => {
      if (!task?.client_id) return []
      const response = await api.get(`/observations/clients/${task.client_id}/observations`)
      return response.data
    },
    enabled: !!task?.client_id
  })

  // Cargar archivos con autenticación
  const taskFile = useAuthenticatedFile(task?.file_path)
  const omisoFile = useAuthenticatedFile(task?.omiso_info?.archivo_path)

  // Marcar tarea como completada
  const completeTask = useMutation({
    mutationFn: async (data: { file?: File; nextPaymentDate?: string; observation_text?: string; rating?: number | null; is_primary?: boolean }) => {
      const formData = new FormData()
      if (data.file) formData.append('file', data.file)
      if (data.nextPaymentDate) formData.append('nextPaymentDate', data.nextPaymentDate)
      if (data.observation_text) formData.append('observation_text', data.observation_text)
      if (data.rating !== null && data.rating !== undefined) formData.append('rating', data.rating.toString())
      if (data.is_primary) formData.append('is_primary', 'true')

      return api.post(`/services/checklist/${taskId}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['myClients'] })
      queryClient.invalidateQueries({ queryKey: ['client-observations'] })
      navigate('/admin/tasks')
    }
  })

  // Eliminar observación
  const deleteObservationMutation = useMutation({
    mutationFn: async (observationId: number) => {
      return await api.delete(`/observations/${observationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-observations'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Error al eliminar observación')
    }
  })

  if (isLoading) return <div className="p-6"><div className="text-slate-300">Cargando…</div></div>
  if (!task) return <div className="p-6"><div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300">Tarea no encontrada</div></div>

  const taskType = task.task_name?.toLowerCase() || ''
  const isLibros = taskType.includes('libro')
  const isDeclaracion = taskType.includes('declaración') || taskType.includes('declaracion') || taskType.includes('septiembre') || taskType.includes('declaracion de sat')
  const isFactura = taskType.includes('factura') && !taskType.includes('rectificador')
  const isRectificador = taskType.includes('rectificador')
  const isOmisos = taskType.includes('omisos')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingUpload(true)
    try {
      // Validar que para libros se requiera la fecha
      if (isLibros && !nextPaymentDate && !task.next_payment_date) {
        alert('Debes especificar la próxima fecha de pago de libros')
        setLoadingUpload(false)
        return
      }

      // Validar que se suba archivo (TODOS los tipos excepto libros requieren archivo)
      // Para omisos es OBLIGATORIO siempre
      if (isOmisos && !file && !task.file_path) {
        alert('Debes subir el archivo de resolución del omiso para completar esta tarea')
        setLoadingUpload(false)
        return
      }

      // Para otros tipos (excepto libros), también es obligatorio
      if (!isLibros && !isOmisos && !file && !task.file_path) {
        alert('Debes subir un archivo para completar esta tarea')
        setLoadingUpload(false)
        return
      }

      await completeTask.mutateAsync({
        file: file || undefined,
        nextPaymentDate: isLibros && nextPaymentDate ? nextPaymentDate : undefined,
        observation_text: observationText || undefined,
        rating: rating !== null ? rating : undefined,
        is_primary: isPrimary
      })
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error al completar tarea')
    } finally {
      setLoadingUpload(false)
    }
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/admin/tasks')}
        className="mb-4 text-orange-400 hover:text-orange-300 font-medium transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a tareas
      </button>

      <h1 className="text-2xl font-semibold mb-6 text-slate-100">{task.task_name}</h1>

      {/* Información del Cliente */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-100">Información del Cliente</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400">Nombre</label>
            <p className="font-medium text-slate-200">{task.client_name}</p>
          </div>
          <div>
            <label className="text-sm text-slate-400">NIT</label>
            <p className="font-medium text-slate-200">{task.client_nit || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-slate-400">Correo</label>
            <p className="font-medium text-slate-200">{task.client_email || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-slate-400">Contraseña SAT</label>
            <div className="flex items-center gap-2">
              <p className="font-mono text-slate-200">
                {revealPassword ? (task.client_sat_password || 'No configurada') : '••••••••'}
              </p>
              <button
                onClick={() => setRevealPassword(!revealPassword)}
                className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
              >
                {revealPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información del Omiso (si aplica) */}
      {isOmisos && task.omiso_info && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-red-400">Información del Omiso</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-red-300 font-medium">Motivo:</label>
              <p className="text-slate-200">{task.omiso_info.motivo}</p>
            </div>
            <div>
              <label className="text-sm text-red-300 font-medium">Fecha de creación:</label>
              <p className="text-slate-200">{new Date(task.omiso_info.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm text-red-300 font-medium block mb-2">Archivo original del omiso (evidencia):</label>

              {/* Vista previa del archivo de prueba */}
              <div className="space-y-3">
                {omisoFile.isLoading ? (
                  <div className="bg-slate-800 p-4 rounded border border-slate-600 text-center text-slate-300">
                    Cargando archivo...
                  </div>
                ) : omisoFile.error ? (
                  <div className="bg-red-900/30 p-4 rounded border border-red-800 text-center text-red-300">
                    Error al cargar archivo: {omisoFile.error}
                  </div>
                ) : omisoFile.blobUrl ? (
                  <>
                    {/* Detectar tipo de archivo por extensión */}
                    {task.omiso_info.archivo_path?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <div className="bg-slate-900 rounded border border-slate-600 p-2">
                        <img
                          src={omisoFile.blobUrl}
                          alt="Vista previa del archivo del omiso"
                          className="w-full h-auto max-h-[400px] object-contain rounded"
                        />
                      </div>
                    ) : task.omiso_info.archivo_path?.toLowerCase().endsWith('.pdf') ? (
                      <div className="bg-slate-900 rounded border border-slate-600">
                        <iframe
                          src={omisoFile.blobUrl}
                          className="w-full h-[400px] rounded"
                          title="Vista previa PDF del omiso"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-slate-800 p-4 rounded border border-slate-600">
                        <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-slate-200">Archivo del Omiso</p>
                          <p className="text-xs text-slate-400">Click en descargar para ver</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}

                <button
                  onClick={() => task.omiso_info.archivo_path && downloadAuthenticatedFile(task.omiso_info.archivo_path, 'archivo_omiso')}
                  className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Descargar Archivo del Omiso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archivo Subido (si existe) */}
      {task.file_path && task.status === 'completed' && (
        <div className="bg-green-900/20 border border-green-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-green-400">
            {isOmisos ? 'Archivo de Resolución' : 'Archivo Subido'}
          </h2>
          <div className="space-y-3">
            {taskFile.isLoading ? (
              <div className="bg-slate-700 p-4 rounded border border-slate-600 text-center text-slate-400">
                Cargando archivo...
              </div>
            ) : taskFile.error ? (
              <div className="bg-red-50 p-4 rounded border border-red-300 text-center text-red-600">
                Error al cargar archivo: {taskFile.error}
              </div>
            ) : taskFile.blobUrl ? (
              <>
                {task.file_type?.startsWith('image/') ? (
                  <div className="bg-slate-700 rounded border border-slate-600 p-2">
                    <img
                      src={taskFile.blobUrl}
                      alt="Vista previa"
                      className="w-full h-auto max-h-[600px] object-contain rounded"
                    />
                  </div>
                ) : task.file_type?.includes('pdf') ? (
                  <div className="bg-slate-700 rounded border border-slate-600">
                    <iframe
                      src={taskFile.blobUrl}
                      className="w-full h-[600px] rounded"
                      title="Vista previa PDF"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-700 p-4 rounded border border-slate-600">
                    <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-slate-100">Archivo Subido</p>
                      <p className="text-xs text-gray-500">Tipo: {task.file_type || 'Desconocido'}</p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
            <button
              onClick={() => task.file_path && downloadAuthenticatedFile(task.file_path, 'archivo')}
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Descargar Archivo
            </button>
          </div>
        </div>
      )}

      {/* Formulario según tipo de tarea */}
      {task.status !== 'completed' && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">Completar Tarea</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLibros && (
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Próxima fecha de pago de libros (requerido)
                </label>
                <input
                  type="date"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                  required
                  className="w-full bg-slate-600 border border-slate-500 text-slate-200 rounded p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Establece cuándo será el próximo pago de libros para este cliente
                </p>
              </div>
            )}

            {(isLibros || isDeclaracion || isFactura || isRectificador || isOmisos) && (
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  {isLibros && 'Archivo de comprobante de pago de libros'}
                  {isDeclaracion && 'Captura de pantalla de la declaración (Declaración a 0 de la SAT)'}
                  {isFactura && `Archivo de factura del mes ${task.invoice_month}/${task.invoice_year}`}
                  {isRectificador && `Archivo rectificador del mes ${task.invoice_month}/${task.invoice_year}`}
                  {isOmisos && 'Archivo de resolución del omiso (requerido)'}
                  {!isLibros && !isOmisos && ' (requerido)'}
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required={!isLibros && !task.file_path}
                  accept={isDeclaracion ? 'image/*' : '.pdf,.jpg,.jpeg,.png'}
                  className="w-full bg-slate-600 border border-slate-500 text-slate-200 rounded p-2 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-orange-600 file:text-white file:cursor-pointer hover:file:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {isLibros && 'Sube un archivo que muestre el comprobante de pago de libros'}
                  {isDeclaracion && 'Sube una captura de pantalla de la declaración a 0 realizada en la plataforma SAT. Esta se realiza entre la última semana del mes y la primera del siguiente.'}
                  {isFactura && `Sube el archivo PDF o imagen de la factura del mes ${task.invoice_month}/${task.invoice_year}. Debe realizarse entre la última semana del mes ${task.invoice_month} y la primera semana del mes siguiente.`}
                  {isRectificador && `Sube el archivo PDF o imagen del rectificador del mes ${task.invoice_month}/${task.invoice_year}. Debe realizarse entre la última semana del mes ${task.invoice_month} y la primera semana del mes siguiente.`}
                  {isOmisos && 'Sube el documento o evidencia que demuestra la resolución del omiso. Este archivo quedará registrado como prueba de que el problema fue solucionado.'}
                </p>
              </div>
            )}

            {/* Observaciones y Calificación (Opcional) */}
            <div className="border-t border-slate-600 pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3 text-slate-200">Observaciones (Opcional)</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Calificación del servicio (1-5 estrellas)
                </label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? null : star)}
                      className={`text-3xl transition-colors ${
                        rating !== null && star <= rating
                          ? 'text-yellow-400'
                          : 'text-slate-500 hover:text-yellow-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  {rating !== null && (
                    <span className="ml-2 text-sm text-slate-300">
                      {rating}/5
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Opcional: Califica la interacción con el cliente (1 = muy mala, 5 = excelente)
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Comentarios sobre el servicio
                </label>
                <textarea
                  value={observationText}
                  onChange={(e) => setObservationText(e.target.value)}
                  className="w-full bg-slate-600 border border-slate-500 text-slate-200 placeholder-slate-400 rounded p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Ej: El cliente fue muy amable y proporcionó todos los documentos a tiempo..."
                />
                <p className="text-xs text-slate-400 mt-1">
                  Opcional: Agrega comentarios sobre cómo fue trabajar con el cliente en esta tarea
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 bg-slate-600 border-slate-500 rounded focus:ring-yellow-500"
                />
                <label htmlFor="isPrimary" className="text-sm text-slate-200 cursor-pointer">
                  Marcar como observación importante (se mostrará destacada en el perfil del cliente)
                </label>
              </div>
              <p className="text-xs text-slate-400 mt-1 ml-6">
                Solo puede haber una observación importante por cliente. Si marcas esta, se desmarcará la anterior automáticamente.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loadingUpload || completeTask.isPending}
                className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loadingUpload ? 'Guardando...' : 'Completar Tarea'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/tasks')}
                className="px-6 py-2 bg-slate-600 text-slate-200 rounded hover:bg-slate-500 font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t border-slate-600">
            <p className="text-sm text-slate-300">
              <strong className="text-slate-200">Mes/Año:</strong> {task.invoice_month}/{task.invoice_year}
            </p>
            <p className="text-sm text-slate-300 mt-2">
              <strong className="text-slate-200">Estado actual:</strong>{' '}
              <span className={`px-2 py-1 rounded text-xs font-medium border ${
                task.status === 'completed' ? 'bg-green-900/30 text-green-400 border-green-800' :
                task.status === 'pending' ? 'bg-amber-900/30 text-amber-400 border-amber-800' :
                'bg-slate-600 text-slate-300 border-slate-500'
              }`}>
                {task.status}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Información adicional para tareas completadas */}
      {task.status === 'completed' && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">Información de la Tarea</h2>
          <p className="text-sm text-slate-300">
            <strong className="text-slate-200">Mes/Año:</strong> {task.invoice_month}/{task.invoice_year}
          </p>
          <p className="text-sm text-slate-300 mt-2">
            <strong className="text-slate-200">Estado:</strong>{' '}
            <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
              Completada
            </span>
          </p>
        </div>
      )}

      {/* Tabla de observaciones del cliente */}
      {task && observations.length > 0 && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-100">Historial de Observaciones - {task.client_name}</h2>

          <div className="overflow-x-auto rounded-lg border border-slate-600">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left border-b border-slate-600">
                  <th className="pb-2 pt-3 px-3 font-medium text-slate-300">Servicio</th>
                  <th className="pb-2 pt-3 px-3 font-medium text-slate-300">Mes/Año</th>
                  <th className="pb-2 pt-3 px-3 font-medium text-slate-300">Rating</th>
                  <th className="pb-2 pt-3 px-3 font-medium text-slate-300">Observación</th>
                  <th className="pb-2 pt-3 px-3 font-medium text-slate-300">Creado por</th>
                  <th className="pb-2 pt-3 px-3 font-medium text-slate-300">Fecha</th>
                  <th className="pb-2 pt-3 px-3 font-medium text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {observations.map((obs: any) => (
                  <tr
                    key={obs.id}
                    className={`${
                      obs.is_primary ? 'bg-yellow-900/20' : 'bg-slate-700'
                    } hover:bg-slate-600 transition-colors`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {obs.is_primary && (
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                        <span className="font-medium text-slate-200">{obs.task_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {obs.invoice_month}/{obs.invoice_year}
                    </td>
                    <td className="py-3 px-3">
                      {obs.rating !== null ? (
                        <span className="text-yellow-400">
                          {"★".repeat(obs.rating)}{"☆".repeat(5 - obs.rating)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Sin calificar</span>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-md">
                      {obs.observation_text ? (
                        <p className="text-slate-300 text-sm">{obs.observation_text}</p>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Sin comentarios</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {obs.created_by_name}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-xs">
                      {new Date(obs.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => {
                          if (confirm('¿Seguro que quieres eliminar esta observación?')) {
                            deleteObservationMutation.mutate(obs.id)
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Mostrando {observations.length} observación(es) total(es) de este cliente
          </p>
        </div>
      )}
    </div>
  )
}

