import { useState } from 'react';

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'file' | 'textarea' | 'email' | 'phone' | 'checkbox';

export interface FormField {
  id?: number;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  placeholder: string | null;
  default_value: string | null;
  is_required: boolean;
  validation_rules: any | null;
  select_options: string[] | null;
  display_order: number;
  help_text: string | null;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface Props {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  disabled?: boolean;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Selección única' },
  { value: 'multiselect', label: 'Selección múltiple' },
  { value: 'file', label: 'Archivo' },
  { value: 'checkbox', label: 'Checkbox' },
];

export default function FormFieldBuilder({ fields, onChange, disabled }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [optionsText, setOptionsText] = useState<string>('');

  const addField = () => {
    const newField: FormField = {
      field_name: `campo_${fields.length + 1}`,
      field_label: '',
      field_type: 'text',
      placeholder: null,
      default_value: null,
      is_required: false,
      validation_rules: null,
      select_options: null,
      display_order: fields.filter(f => !f.isDeleted).length,
      help_text: null,
      isNew: true
    };
    onChange([...fields, newField]);
    setEditingId(fields.length);
    setOptionsText('');
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const deleteField = (index: number) => {
    const field = fields[index];
    if (field.id) {
      updateField(index, { isDeleted: true });
    } else {
      onChange(fields.filter((_, i) => i !== index));
    }
  };

  const startEditing = (index: number) => {
    const field = fields[index];
    setEditingId(index);
    setOptionsText(field.select_options?.join('\n') || '');
  };

  const saveOptions = (index: number) => {
    const options = optionsText.split('\n').filter(o => o.trim());
    updateField(index, { select_options: options.length > 0 ? options : null });
  };

  const getFieldTypeLabel = (type: FieldType) => {
    return FIELD_TYPES.find(t => t.value === type)?.label || type;
  };

  const visibleFields = fields
    .map((f, i) => ({ ...f, originalIndex: i }))
    .filter(f => !f.isDeleted)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">
          Define los campos que el cliente debe completar para este servicio
        </p>
        <button
          type="button"
          onClick={addField}
          disabled={disabled}
          className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          + Agregar Campo
        </button>
      </div>

      {visibleFields.length === 0 ? (
        <div className="text-center py-6 text-slate-500 border border-dashed border-slate-700 rounded-lg">
          No hay campos definidos. Los clientes no necesitarán completar formulario.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleFields.map((field) => (
            <div
              key={field.originalIndex}
              className="bg-slate-800 border border-slate-700 rounded-lg p-3"
            >
              {editingId === field.originalIndex ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Etiqueta</label>
                      <input
                        type="text"
                        placeholder="Ej: Número de NIT"
                        value={field.field_label}
                        onChange={(e) => {
                          const label = e.target.value;
                          // Generar nombre interno automáticamente desde la etiqueta
                          const fieldName = label
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
                            .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
                            .trim()
                            .replace(/\s+/g, '_') || `campo_${field.originalIndex + 1}`;
                          updateField(field.originalIndex, { field_label: label, field_name: fieldName });
                        }}
                        className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tipo de campo</label>
                      <select
                        value={field.field_type}
                        onChange={(e) => updateField(field.originalIndex, { field_type: e.target.value as FieldType })}
                        className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                      >
                        {FIELD_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Placeholder</label>
                    <input
                      type="text"
                      placeholder="Texto de ayuda dentro del campo"
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(field.originalIndex, { placeholder: e.target.value || null })}
                      className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                    />
                  </div>

                  {(field.field_type === 'select' || field.field_type === 'multiselect') && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Opciones (una por línea)</label>
                      <textarea
                        value={optionsText}
                        onChange={(e) => setOptionsText(e.target.value)}
                        onBlur={() => saveOptions(field.originalIndex)}
                        placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                        className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                        rows={3}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Texto de ayuda (opcional)</label>
                    <input
                      type="text"
                      placeholder="Información adicional para el cliente"
                      value={field.help_text || ''}
                      onChange={(e) => updateField(field.originalIndex, { help_text: e.target.value || null })}
                      className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={field.is_required}
                        onChange={(e) => updateField(field.originalIndex, { is_required: e.target.checked })}
                        className="rounded bg-slate-700 border-slate-600"
                      />
                      Campo requerido
                    </label>
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
                      <span className="text-white font-medium">{field.field_label || '(Sin etiqueta)'}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">
                        {getFieldTypeLabel(field.field_type)}
                      </span>
                      {field.is_required && (
                        <span className="text-xs px-1.5 py-0.5 bg-orange-900/50 text-orange-400 rounded">
                          Requerido
                        </span>
                      )}
                    </div>
                    {field.help_text && (
                      <p className="text-sm text-slate-400 mt-0.5">{field.help_text}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(field.originalIndex)}
                      disabled={disabled}
                      className="text-sm text-orange-400 hover:text-orange-300 disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteField(field.originalIndex)}
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
