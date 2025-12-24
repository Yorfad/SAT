import { useState } from 'react';

export interface RecurrenceStep {
  interval_days: number;
  repeat: number;
}

export interface RecurrenceRules {
  variable_pattern: RecurrenceStep[];
  completion_days: number[];
  activation_days_before: number;
  day_of_week: number | null;
}

interface Props {
  rules: RecurrenceRules;
  onChange: (rules: RecurrenceRules) => void;
  disabled?: boolean;
}

export default function RecurrencePatternBuilder({ rules, onChange, disabled }: Props) {
  const [newInterval, setNewInterval] = useState<number>(30);

  const pattern = rules.variable_pattern || [];

  const addStep = () => {
    if (newInterval < 1) return;

    const newPattern = [...pattern, { interval_days: newInterval, repeat: 1 }];
    onChange({ ...rules, variable_pattern: newPattern });
    setNewInterval(30);
  };

  const updateStep = (index: number, field: keyof RecurrenceStep, value: number) => {
    const newPattern = [...pattern];
    newPattern[index] = { ...newPattern[index], [field]: value };
    onChange({ ...rules, variable_pattern: newPattern });
  };

  const removeStep = (index: number) => {
    const newPattern = pattern.filter((_, i) => i !== index);
    onChange({ ...rules, variable_pattern: newPattern });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pattern.length - 1) return;

    const newPattern = [...pattern];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newPattern[index], newPattern[targetIndex]] = [newPattern[targetIndex], newPattern[index]];
    onChange({ ...rules, variable_pattern: newPattern });
  };

  // Calcular preview del ciclo
  const calculatePreview = () => {
    if (pattern.length === 0) return null;

    let days = 0;
    const preview: string[] = [];

    pattern.forEach((step) => {
      for (let r = 0; r < step.repeat; r++) {
        days += step.interval_days;
        preview.push(`Tarea ${preview.length + 1}: día ${days}`);
      }
    });

    const totalCycleDays = days;
    return { preview: preview.slice(0, 6), totalCycleDays, hasMore: preview.length > 6 };
  };

  const previewData = calculatePreview();

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">
          Patrón de Recurrencia Variable
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Define los intervalos entre cada tarea. El ciclo se repetirá automáticamente.
        </p>

        {/* Lista de pasos */}
        {pattern.length === 0 ? (
          <div className="text-center py-4 text-slate-500 border border-dashed border-slate-700 rounded-lg mb-4">
            No hay pasos definidos. Agrega al menos un intervalo.
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {pattern.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-3"
              >
                {/* Botones de orden */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0 || disabled}
                    className="text-slate-500 hover:text-slate-300 disabled:opacity-30 text-xs leading-none"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === pattern.length - 1 || disabled}
                    className="text-slate-500 hover:text-slate-300 disabled:opacity-30 text-xs leading-none"
                  >
                    ▼
                  </button>
                </div>

                {/* Número de paso */}
                <span className="text-orange-400 font-medium text-sm w-6">
                  #{index + 1}
                </span>

                {/* Intervalo */}
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-slate-400 text-sm">Cada</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={step.interval_days}
                    onChange={(e) => updateStep(index, 'interval_days', parseInt(e.target.value) || 1)}
                    disabled={disabled}
                    className="w-20 bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm text-center"
                  />
                  <span className="text-slate-400 text-sm">días</span>
                </div>

                {/* Repeticiones */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">repetir</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={step.repeat}
                    onChange={(e) => updateStep(index, 'repeat', parseInt(e.target.value) || 1)}
                    disabled={disabled}
                    className="w-14 bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm text-center"
                  />
                  <span className="text-slate-400 text-sm">vez{step.repeat > 1 ? 'ces' : ''}</span>
                </div>

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  disabled={disabled}
                  className="text-red-400 hover:text-red-300 disabled:opacity-50 p-1"
                  title="Eliminar paso"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Agregar nuevo paso */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
          <span className="text-slate-400 text-sm">Agregar intervalo de</span>
          <input
            type="number"
            min="1"
            max="365"
            value={newInterval}
            onChange={(e) => setNewInterval(parseInt(e.target.value) || 30)}
            disabled={disabled}
            className="w-20 bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm text-center"
          />
          <span className="text-slate-400 text-sm">días</span>
          <button
            type="button"
            onClick={addStep}
            disabled={disabled || newInterval < 1}
            className="ml-2 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Vista previa del ciclo */}
      {previewData && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">
            Vista Previa del Ciclo
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {previewData.preview.map((item, idx) => (
              <div key={idx} className="text-slate-400">
                {item}
              </div>
            ))}
          </div>
          {previewData.hasMore && (
            <p className="text-xs text-slate-500 mt-2">... y más tareas</p>
          )}
          <p className="text-xs text-orange-400 mt-3">
            Ciclo total: {previewData.totalCycleDays} días, luego se repite
          </p>
        </div>
      )}

      {/* Días de anticipación */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-300">
          Activar tarea con anticipación de
        </label>
        <input
          type="number"
          min="1"
          max="30"
          value={rules.activation_days_before}
          onChange={(e) => onChange({ ...rules, activation_days_before: parseInt(e.target.value) || 7 })}
          disabled={disabled}
          className="w-16 bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-sm text-center"
        />
        <span className="text-sm text-slate-300">días</span>
      </div>
    </div>
  );
}
