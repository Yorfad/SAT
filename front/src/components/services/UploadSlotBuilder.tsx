import { useState } from 'react';

export interface UploadSlot {
  id?: number;
  slot_name: string;
  slot_label: string;
  description: string | null;
  display_order: number;
  is_required: boolean;
  visibility: 'admin_only' | 'client_only' | 'both';
  send_via_whatsapp: boolean;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface Props {
  slots: UploadSlot[];
  onChange: (slots: UploadSlot[]) => void;
  disabled?: boolean;
}

// Genera un identificador único basado en la etiqueta
const generateSlotName = (label: string, index: number): string => {
  if (!label.trim()) {
    return `archivo_${index + 1}`;
  }
  // Normalizar: quitar acentos, convertir a minúsculas, reemplazar espacios con guiones bajos
  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .trim()
    .replace(/\s+/g, '_'); // Espacios a guiones bajos

  return `slot_${index + 1}_${normalized}`;
};

export default function UploadSlotBuilder({ slots, onChange, disabled }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const addSlot = () => {
    const nextIndex = slots.filter(s => !s.isDeleted).length;
    const newSlot: UploadSlot = {
      slot_name: `archivo_${nextIndex + 1}`,
      slot_label: '',
      description: null,
      display_order: nextIndex,
      is_required: true,
      visibility: 'both',
      send_via_whatsapp: false,
      isNew: true
    };
    onChange([...slots, newSlot]);
    setEditingId(slots.length);
  };

  const updateSlot = (index: number, updates: Partial<UploadSlot>) => {
    const newSlots = [...slots];
    const updatedSlot = { ...newSlots[index], ...updates };

    // Si cambia la etiqueta, auto-generar el identificador
    if (updates.slot_label !== undefined) {
      updatedSlot.slot_name = generateSlotName(updates.slot_label, index);
    }

    newSlots[index] = updatedSlot;
    onChange(newSlots);
  };

  const deleteSlot = (index: number) => {
    const slot = slots[index];
    if (slot.id) {
      updateSlot(index, { isDeleted: true });
    } else {
      onChange(slots.filter((_, i) => i !== index));
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'admin_only': return 'Solo Admin';
      case 'client_only': return 'Solo Cliente';
      case 'both': return 'Admin y Cliente';
      default: return visibility;
    }
  };

  const visibleSlots = slots
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter(s => !s.isDeleted)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">
          Define los archivos que el empleado debe subir al completar la tarea
        </p>
        <button
          type="button"
          onClick={addSlot}
          disabled={disabled}
          className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          + Agregar Espacio
        </button>
      </div>

      {visibleSlots.length === 0 ? (
        <div className="text-center py-6 text-slate-500 border border-dashed border-slate-700 rounded-lg">
          No hay espacios de carga definidos. Los empleados no necesitarán subir archivos.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleSlots.map((slot) => (
            <div
              key={slot.originalIndex}
              className="bg-slate-800 border border-slate-700 rounded-lg p-3"
            >
              {editingId === slot.originalIndex ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nombre del archivo</label>
                    <input
                      type="text"
                      placeholder="Ej: Comprobante de pago"
                      value={slot.slot_label}
                      onChange={(e) => updateSlot(slot.originalIndex, { slot_label: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                      autoFocus
                    />
                    {slot.slot_label && (
                      <p className="text-xs text-slate-500 mt-1">
                        ID: <code className="text-slate-400 bg-slate-800 px-1 rounded">{slot.slot_name}</code>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Descripción (opcional)</label>
                    <input
                      type="text"
                      placeholder="Descripción para el empleado"
                      value={slot.description || ''}
                      onChange={(e) => updateSlot(slot.originalIndex, { description: e.target.value || null })}
                      className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Visibilidad</label>
                      <select
                        value={slot.visibility}
                        onChange={(e) => updateSlot(slot.originalIndex, { visibility: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                      >
                        <option value="both">Admin y Cliente</option>
                        <option value="admin_only">Solo Admin</option>
                        <option value="client_only">Solo Cliente</option>
                      </select>
                    </div>
                    <div className="flex flex-col justify-end gap-2">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={slot.is_required}
                          onChange={(e) => updateSlot(slot.originalIndex, { is_required: e.target.checked })}
                          className="rounded bg-slate-700 border-slate-600"
                        />
                        Requerido
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={slot.send_via_whatsapp}
                          onChange={(e) => updateSlot(slot.originalIndex, { send_via_whatsapp: e.target.checked })}
                          className="rounded bg-slate-700 border-slate-600"
                        />
                        Enviar por WhatsApp
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-sm text-orange-400 hover:text-orange-300"
                    >
                      Listo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{slot.slot_label || '(Sin etiqueta)'}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                        {getVisibilityLabel(slot.visibility)}
                      </span>
                      {slot.is_required && (
                        <span className="text-xs px-1.5 py-0.5 bg-orange-900/50 text-orange-400 rounded">
                          Requerido
                        </span>
                      )}
                      {slot.send_via_whatsapp && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-900/50 text-green-400 rounded">
                          WhatsApp
                        </span>
                      )}
                    </div>
                    {slot.description && (
                      <p className="text-sm text-slate-400 mt-0.5">{slot.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(slot.originalIndex)}
                      disabled={disabled}
                      className="text-sm text-orange-400 hover:text-orange-300 disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSlot(slot.originalIndex)}
                      disabled={disabled}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
