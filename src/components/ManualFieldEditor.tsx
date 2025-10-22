import { useMemo } from 'react';
import type { ManualField } from '../types';
import type { ManualFieldCopy } from '../i18n';

interface ManualFieldEditorProps {
  field: ManualField;
  onChange: (field: ManualField) => void;
  onRemove: (id: string) => void;
  copy: ManualFieldCopy;
}

const numericTypes = new Set(['number', 'integer']);

export default function ManualFieldEditor({ field, onChange, onRemove, copy }: ManualFieldEditorProps) {
  const requiresNumericConstraints = useMemo(() => numericTypes.has(field.type), [field.type]);
  const requiresStringConstraints = useMemo(() => field.type === 'string', [field.type]);

  const handleChange = (key: keyof ManualField, value: unknown) => {
    onChange({ ...field, [key]: value });
  };

  return (
    <div className="manual-field">
      <div className="manual-field__header">
        <strong>{field.name || copy.newFieldFallback}</strong>
        <button type="button" onClick={() => onRemove(field.id)}>
          {copy.remove}
        </button>
      </div>
      <div className="manual-field__grid">
        <label>
          {copy.fieldName}
          <input value={field.name} onChange={(event) => handleChange('name', event.target.value)} />
        </label>
        <label>
          {copy.dataType}
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
          {copy.required}
        </label>
        {requiresStringConstraints && (
          <>
            <label>
              {copy.minLength}
              <input
                type="number"
                min={0}
                value={field.minLength ?? ''}
                onChange={(event) =>
                  handleChange('minLength', event.target.value ? Number(event.target.value) : undefined)
                }
              />
            </label>
            <label>
              {copy.maxLength}
              <input
                type="number"
                min={0}
                value={field.maxLength ?? ''}
                onChange={(event) =>
                  handleChange('maxLength', event.target.value ? Number(event.target.value) : undefined)
                }
              />
            </label>
            <label>
              {copy.pattern}
              <input
                value={field.pattern ?? ''}
                onChange={(event) => handleChange('pattern', event.target.value || undefined)}
                placeholder={copy.patternPlaceholder}
              />
            </label>
            <label>
              {copy.enum}
              <input
                value={field.enumValues ?? ''}
                onChange={(event) => handleChange('enumValues', event.target.value)}
                placeholder={copy.enumPlaceholder}
              />
            </label>
          </>
        )}
        {requiresNumericConstraints && (
          <>
            <label>
              {copy.minimum}
              <input
                type="number"
                value={field.minimum ?? ''}
                onChange={(event) =>
                  handleChange('minimum', event.target.value ? Number(event.target.value) : undefined)
                }
              />
            </label>
            <label>
              {copy.maximum}
              <input
                type="number"
                value={field.maximum ?? ''}
                onChange={(event) =>
                  handleChange('maximum', event.target.value ? Number(event.target.value) : undefined)
                }
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
