import { useState, useEffect } from 'react';

interface NumericInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  allowDecimals?: boolean;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Input numérico que permite escribir y borrar libremente.
 * Solo convierte a número cuando pierde el foco.
 */
export default function NumericInput({
  value,
  onChange,
  className = '',
  placeholder = '',
  min,
  max,
  allowDecimals = true,
  required = false,
  disabled = false
}: NumericInputProps) {
  // Estado local string para permitir edición libre
  const [localValue, setLocalValue] = useState(() =>
    value !== null && value !== undefined ? String(value) : ''
  );

  // Sincronizar cuando el valor externo cambia (ej: reset de formulario)
  useEffect(() => {
    const newVal = value !== null && value !== undefined ? String(value) : '';
    if (newVal !== localValue && document.activeElement !== inputRef.current) {
      setLocalValue(newVal);
    }
  }, [value]);

  const inputRef = { current: null as HTMLInputElement | null };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Validar formato
    const pattern = allowDecimals ? /^\d*\.?\d*$/ : /^\d*$/;
    if (val === '' || pattern.test(val)) {
      setLocalValue(val);
    }
  };

  const handleBlur = () => {
    let numValue: number | null = null;

    if (localValue !== '') {
      numValue = parseFloat(localValue);
      if (isNaN(numValue)) {
        numValue = null;
      } else {
        // Aplicar límites
        if (min !== undefined && numValue < min) numValue = min;
        if (max !== undefined && numValue > max) numValue = max;
      }
    }

    // Actualizar estado local con valor formateado
    setLocalValue(numValue !== null ? String(numValue) : '');

    // Notificar al padre
    onChange(numValue);
  };

  return (
    <input
      ref={(el) => { inputRef.current = el; }}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  );
}
