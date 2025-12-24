import { useState } from 'react';

export interface Activity {
  id?: number;
  activity_name: string;
  description: string | null;
  display_order: number;
  is_required: boolean;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface Props {
  activities: Activity[];
  onChange: (activities: Activity[]) => void;
  disabled?: boolean;
}

export default function ActivityListBuilder({ activities, onChange, disabled }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const addActivity = () => {
    const newActivity: Activity = {
      activity_name: '',
      description: null,
      display_order: activities.filter(a => !a.isDeleted).length,
      is_required: true,
      isNew: true
    };
    onChange([...activities, newActivity]);
    setEditingId(activities.length);
  };

  const updateActivity = (index: number, updates: Partial<Activity>) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], ...updates };
    onChange(newActivities);
  };

  const deleteActivity = (index: number) => {
    const activity = activities[index];
    if (activity.id) {
      // Marcar como eliminado para el backend
      updateActivity(index, { isDeleted: true });
    } else {
      // Si es nuevo, simplemente remover
      const newActivities = activities.filter((_, i) => i !== index);
      onChange(newActivities);
    }
  };

  const moveActivity = (index: number, direction: 'up' | 'down') => {
    const visibleActivities = activities.map((a, i) => ({ ...a, originalIndex: i })).filter(a => !a.isDeleted);
    const visibleIndex = visibleActivities.findIndex(a => a.originalIndex === index);

    if (direction === 'up' && visibleIndex > 0) {
      const targetIndex = visibleActivities[visibleIndex - 1].originalIndex;
      const newActivities = [...activities];
      const tempOrder = newActivities[index].display_order;
      newActivities[index].display_order = newActivities[targetIndex].display_order;
      newActivities[targetIndex].display_order = tempOrder;
      onChange(newActivities);
    } else if (direction === 'down' && visibleIndex < visibleActivities.length - 1) {
      const targetIndex = visibleActivities[visibleIndex + 1].originalIndex;
      const newActivities = [...activities];
      const tempOrder = newActivities[index].display_order;
      newActivities[index].display_order = newActivities[targetIndex].display_order;
      newActivities[targetIndex].display_order = tempOrder;
      onChange(newActivities);
    }
  };

  const visibleActivities = activities
    .map((a, i) => ({ ...a, originalIndex: i }))
    .filter(a => !a.isDeleted)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">
          Define los pasos que el empleado debe completar para este servicio
        </p>
        <button
          type="button"
          onClick={addActivity}
          disabled={disabled}
          className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          + Agregar Actividad
        </button>
      </div>

      {visibleActivities.length === 0 ? (
        <div className="text-center py-6 text-slate-500 border border-dashed border-slate-700 rounded-lg">
          No hay actividades definidas. Las actividades son opcionales.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleActivities.map((activity, visibleIdx) => (
            <div
              key={activity.originalIndex}
              className="bg-slate-800 border border-slate-700 rounded-lg p-3"
            >
              {editingId === activity.originalIndex ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nombre de la actividad"
                    value={activity.activity_name}
                    onChange={(e) => updateActivity(activity.originalIndex, { activity_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                    autoFocus
                  />
                  <textarea
                    placeholder="Descripción (opcional)"
                    value={activity.description || ''}
                    onChange={(e) => updateActivity(activity.originalIndex, { description: e.target.value || null })}
                    className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm"
                    rows={2}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={activity.is_required}
                        onChange={(e) => updateActivity(activity.originalIndex, { is_required: e.target.checked })}
                        className="rounded bg-slate-700 border-slate-600"
                      />
                      Requerido
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
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveActivity(activity.originalIndex, 'up')}
                      disabled={visibleIdx === 0 || disabled}
                      className="text-slate-500 hover:text-slate-300 disabled:opacity-30 text-xs"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveActivity(activity.originalIndex, 'down')}
                      disabled={visibleIdx === visibleActivities.length - 1 || disabled}
                      className="text-slate-500 hover:text-slate-300 disabled:opacity-30 text-xs"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{activity.activity_name || '(Sin nombre)'}</span>
                      {activity.is_required && (
                        <span className="text-xs px-1.5 py-0.5 bg-orange-900/50 text-orange-400 rounded">
                          Requerido
                        </span>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-sm text-slate-400 mt-0.5">{activity.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(activity.originalIndex)}
                      disabled={disabled}
                      className="text-sm text-orange-400 hover:text-orange-300 disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteActivity(activity.originalIndex)}
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
