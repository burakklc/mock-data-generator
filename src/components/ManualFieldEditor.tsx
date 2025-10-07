import { useMemo } from 'react';
import type { ManualField } from '../types';

interface ManualFieldEditorProps {
  field: ManualField;
  onChange: (field: ManualField) => void;
  onRemove: (id: string) => void;
}

const numericTypes = new Set(['number', 'integer']);

export default function ManualFieldEditor({ field, onChange, onRemove }: ManualFieldEditorProps) {
  const requiresNumericConstraints = useMemo(() => numericTypes.has(field.type), [field.type]);
  const requiresStringConstraints = useMemo(() => field.type === 'string', [field.type]);

  const handleChange = (key: keyof ManualField, value: unknown) => {
    onChange({ ...field, [key]: value });
  };

  return (
    <div className="manual-field">
      <div className="manual-field__header">
        <strong>{field.name || 'Yeni Alan'}</strong>
        <button type="button" onClick={() => onRemove(field.id)}>
          Sil
        </button>
      </div>
      <div className="manual-field__grid">
        <label>
          Alan Adı
          <input value={field.name} onChange={(event) => handleChange('name', event.target.value)} />
        </label>
        <label>
          Veri Tipi
          <select value={field.type} onChange={(event) => handleChange('type', event.target.value)}>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="integer">Integer</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
          </select>
        </label>
        <label className="manual-field__checkbox">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(event) => handleChange('required', event.target.checked)}
          />
          Zorunlu
        </label>
        {requiresStringConstraints && (
          <>
            <label>
              Min. Uzunluk
              <input
                type="number"
                min={0}
                value={field.minLength ?? ''}
                onChange={(event) => handleChange('minLength', event.target.value ? Number(event.target.value) : undefined)}
              />
            </label>
            <label>
              Max. Uzunluk
              <input
                type="number"
                min={0}
                value={field.maxLength ?? ''}
                onChange={(event) => handleChange('maxLength', event.target.value ? Number(event.target.value) : undefined)}
              />
            </label>
            <label>
              Pattern (RegExp)
              <input
                value={field.pattern ?? ''}
                onChange={(event) => handleChange('pattern', event.target.value || undefined)}
                placeholder="^[A-Z]{3}$"
              />
            </label>
            <label>
              Enum (virgülle ayrılmış)
              <input
                value={field.enumValues ?? ''}
                onChange={(event) => handleChange('enumValues', event.target.value)}
                placeholder="A, B, C"
              />
            </label>
          </>
        )}
        {requiresNumericConstraints && (
          <>
            <label>
              Minimum
              <input
                type="number"
                value={field.minimum ?? ''}
                onChange={(event) => handleChange('minimum', event.target.value ? Number(event.target.value) : undefined)}
              />
            </label>
            <label>
              Maksimum
              <input
                type="number"
                value={field.maximum ?? ''}
                onChange={(event) => handleChange('maximum', event.target.value ? Number(event.target.value) : undefined)}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
