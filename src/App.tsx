import { useMemo, useState } from 'react';
import type { GeneratorMode, ManualField } from './types';
import ManualFieldEditor from './components/ManualFieldEditor';
import { parseCreateTableScript } from './utils/sqlParser';
import { manualFieldsToSchema } from './utils/manualSchema';
import { generateRecords } from './utils/generator';
import { downloadCsv, downloadJson, downloadSql, toJsonString } from './utils/exporters';

const modeLabels: Record<GeneratorMode, string> = {
  jsonSchema: 'JSON Schema',
  createTable: 'CREATE TABLE',
  manual: 'Manuel Tanım',
};

const initialSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "integer", "minimum": 1 },
    "name": { "type": "string", "minLength": 3 },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["id", "name", "email"]
}`;

const initialCreateTable = `CREATE TABLE users (
  id INTEGER NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  age INTEGER CHECK (age >= 18)
);`;

function createManualField(): ManualField {
  return {
    id: Math.random().toString(36).slice(2),
    name: '',
    type: 'string',
    required: true,
  };
}

function getDefaultInput(mode: GeneratorMode): string {
  if (mode === 'jsonSchema') return initialSchema;
  if (mode === 'createTable') return initialCreateTable;
  return '';
}

export default function App() {
  const [mode, setMode] = useState<GeneratorMode>('jsonSchema');
  const [definition, setDefinition] = useState<string>(getDefaultInput('jsonSchema'));
  const [manualFields, setManualFields] = useState<ManualField[]>([createManualField()]);
  const [recordCount, setRecordCount] = useState<number>(5);
  const [includeEdgeCases, setIncludeEdgeCases] = useState<boolean>(false);
  const [records, setRecords] = useState<any[]>([]);
  const [tableName, setTableName] = useState<string>('mock_data');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const manualSchemaPreview = useMemo(() => {
    if (mode !== 'manual') return '';
    const { schema } = manualFieldsToSchema(manualFields);
    return JSON.stringify(schema, null, 2);
  }, [manualFields, mode]);

  const handleModeChange = (value: GeneratorMode) => {
    setMode(value);
    if (value === 'manual') {
      setRecords([]);
      setSchemaErrors([]);
      return;
    }
    setDefinition(getDefaultInput(value));
    setRecords([]);
    setSchemaErrors([]);
  };

  const handleManualFieldChange = (nextField: ManualField) => {
    setManualFields((previous) => previous.map((field) => (field.id === nextField.id ? nextField : field)));
  };

  const handleManualFieldRemove = (id: string) => {
    setManualFields((previous) => previous.filter((field) => field.id !== id));
  };

  const addManualField = () => {
    setManualFields((previous) => [...previous, createManualField()]);
  };

  const resolveSchema = (): { schema: any; errors: string[]; table?: string } => {
    if (mode === 'jsonSchema') {
      try {
        const schema = JSON.parse(definition);
        return { schema, errors: [] };
      } catch (error) {
        return { schema: null, errors: ['JSON Schema parse edilemedi: ' + (error as Error).message] };
      }
    }
    if (mode === 'createTable') {
      const { schema, errors, tableName: parsedTableName } = parseCreateTableScript(definition);
      if (parsedTableName) {
        setTableName(parsedTableName);
      }
      return { schema, errors, table: parsedTableName };
    }
    const { schema, errors } = manualFieldsToSchema(manualFields);
    return { schema, errors };
  };

  const handleGenerate = async () => {
    const { schema, errors, table } = resolveSchema();
    setSchemaErrors(errors);
    if (!schema || errors.length > 0) {
      return;
    }
    setIsGenerating(true);
    try {
      const { records: generated, validationErrors: validation } = await generateRecords(schema, recordCount, includeEdgeCases);
      setRecords(generated);
      setValidationErrors(validation);
      if (table) {
        setTableName(table);
      }
    } catch (error) {
      setSchemaErrors([(error as Error).message]);
      setRecords([]);
      setValidationErrors([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const previewRecords = useMemo(() => records.slice(0, 20), [records]);
  const previewColumns = useMemo(() => {
    const set = new Set<string>();
    previewRecords.forEach((record) => {
      Object.keys(record || {}).forEach((key) => set.add(key));
    });
    return Array.from(set);
  }, [previewRecords]);
  const jsonPreview = useMemo(() => (previewRecords.length ? toJsonString(previewRecords) : ''), [previewRecords]);

  const exportDisabled = records.length === 0;

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Mock Data Generator</h1>
          <p>JSON Schema, SQL veya manuel tanımlardan hızlıca sahte veri üretin.</p>
        </div>
        <div className="mode-selector">
          {(Object.keys(modeLabels) as GeneratorMode[]).map((key) => (
            <button
              key={key}
              className={key === mode ? 'active' : ''}
              type="button"
              onClick={() => handleModeChange(key)}
            >
              {modeLabels[key]}
            </button>
          ))}
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel__header">
            <h2>Yapı Tanımı</h2>
            <div className="panel__actions">
              <label>
                Kayıt sayısı
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={recordCount}
                  onChange={(event) => setRecordCount(Math.min(1000, Math.max(1, Number(event.target.value))))}
                />
              </label>
              <label className="edge-checkbox">
                <input
                  type="checkbox"
                  checked={includeEdgeCases}
                  onChange={(event) => setIncludeEdgeCases(event.target.checked)}
                />
                Edge case üret
              </label>
              <button type="button" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? 'Üretiliyor…' : 'Veri Üret'}
              </button>
            </div>
          </div>
          {mode !== 'manual' ? (
            <textarea
              value={definition}
              onChange={(event) => setDefinition(event.target.value)}
              spellCheck={false}
              className="schema-input"
              rows={18}
            />
          ) : (
            <div className="manual-editor">
              {manualFields.map((field) => (
                <ManualFieldEditor
                  key={field.id}
                  field={field}
                  onChange={handleManualFieldChange}
                  onRemove={handleManualFieldRemove}
                />
              ))}
              <button type="button" className="add-field" onClick={addManualField}>
                Alan Ekle
              </button>
              <div className="manual-preview">
                <h3>Oluşan JSON Schema</h3>
                <pre>{manualSchemaPreview}</pre>
              </div>
            </div>
          )}
          {schemaErrors.length > 0 && (
            <div className="error-box">
              <h3>Tanım Hataları</h3>
              <ul>
                {schemaErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>Önizleme & Dışa Aktarım</h2>
            <div className="panel__actions">
              <button type="button" onClick={() => downloadJson(records)} disabled={exportDisabled}>
                JSON indir
              </button>
              <button type="button" onClick={() => downloadCsv(records)} disabled={exportDisabled}>
                CSV indir
              </button>
              <button
                type="button"
                onClick={() => downloadSql(records, tableName || 'mock_data')}
                disabled={exportDisabled}
              >
                SQL INSERT indir
              </button>
            </div>
          </div>
          {records.length === 0 ? (
            <p className="empty">Henüz veri üretilmedi.</p>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {previewColumns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRecords.map((record, index) => (
                      <tr key={index}>
                        {previewColumns.map((column) => (
                          <td key={column}>{formatCell(record[column])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details>
                <summary>JSON Önizlemesi</summary>
                <pre className="json-preview">{jsonPreview}</pre>
              </details>
            </>
          )}
          {validationErrors.length > 0 && (
            <div className="warning-box">
              <h3>Validasyon Uyarıları</h3>
              <ul>
                {validationErrors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
