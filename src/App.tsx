import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeneratorMode, ManualField } from './types';
import ManualFieldEditor from './components/ManualFieldEditor';
import { parseCreateTableScript } from './utils/sqlParser';
import { manualFieldsToSchema } from './utils/manualSchema';
import { generateRecords } from './utils/generator';
import { downloadCsv, downloadJson, downloadSql, toJsonString } from './utils/exporters';
import { inferSchemaFromSample } from './utils/schemaInference';
import { exampleSnippets, type ExampleSnippet } from './data/examples';
import { howToSections } from './data/howTo';

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
  const [activeMainTab, setActiveMainTab] = useState<'generator' | 'howTo'>('generator');
  const [activeDefinitionTab, setActiveDefinitionTab] = useState<'definition' | 'examples'>('definition');
  const [definition, setDefinition] = useState<string>(getDefaultInput('jsonSchema'));
  const [manualFields, setManualFields] = useState<ManualField[]>([createManualField()]);
  const [recordCount, setRecordCount] = useState<number>(5);
  const [edgeCaseRatio, setEdgeCaseRatio] = useState<number>(0);
  const [records, setRecords] = useState<any[]>([]);
  const [tableName, setTableName] = useState<string>('mock_data');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [sampleJson, setSampleJson] = useState<string>('');
  const [schemaAssistantError, setSchemaAssistantError] = useState<string | null>(null);
  const [schemaAssistantMessage, setSchemaAssistantMessage] = useState<string | null>(null);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  const copyResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const stored = window.localStorage.getItem('mdg.theme');
    if (stored === 'dark') {
      return true;
    }
    if (stored === 'light') {
      return false;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('theme-dark', isDarkMode);
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mdg.theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  useEffect(
    () => () => {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (activeDefinitionTab !== 'examples') {
      setCopiedExample(null);
    }
  }, [activeDefinitionTab]);

  const manualSchemaPreview = useMemo(() => {
    if (mode !== 'manual') return '';
    const { schema } = manualFieldsToSchema(manualFields);
    return JSON.stringify(schema, null, 2);
  }, [manualFields, mode]);

  const currentExamples = useMemo(() => exampleSnippets[mode], [mode]);

  const handleModeChange = (value: GeneratorMode) => {
    setMode(value);
    setActiveDefinitionTab('definition');
    setCopiedExample(null);
    setSchemaAssistantError(null);
    setSchemaAssistantMessage(null);
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

  const handleSchemaInference = () => {
    setSchemaAssistantError(null);
    setSchemaAssistantMessage(null);
    if (!sampleJson.trim()) {
      setSchemaAssistantError('Örnek JSON boş olamaz.');
      return;
    }
    try {
      const parsed = JSON.parse(sampleJson);
      const inferred = inferSchemaFromSample(parsed);
      setDefinition(JSON.stringify(inferred, null, 2));
      setSchemaAssistantMessage('Şema örnek JSON\'dan üretildi.');
      setActiveDefinitionTab('definition');
    } catch (error) {
      setSchemaAssistantError('Örnek JSON parse edilemedi: ' + (error as Error).message);
    }
  };

  const handleExampleCopy = async (example: ExampleSnippet) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(example.content);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = example.content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedExample(example.id);
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current);
      }
      copyResetTimeout.current = setTimeout(() => setCopiedExample(null), 2000);
    } catch (error) {
      console.error('Kopyalama başarısız oldu', error);
    }
  };

  const handleGenerate = async () => {
    const { schema, errors, table } = resolveSchema();
    setSchemaErrors(errors);
    if (!schema || errors.length > 0) {
      return;
    }
    setIsGenerating(true);
    try {
      const { records: generated, validationErrors: validation } = await generateRecords(
        schema,
        recordCount,
        edgeCaseRatio,
      );
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
        <div className="app__controls">
          <div className="view-tabs">
            <button
              type="button"
              className={activeMainTab === 'generator' ? 'active' : ''}
              onClick={() => setActiveMainTab('generator')}
            >
              Veri Üretici
            </button>
            <button
              type="button"
              className={activeMainTab === 'howTo' ? 'active' : ''}
              onClick={() => setActiveMainTab('howTo')}
            >
              Nasıl Kullanılır?
            </button>
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
          <button type="button" className="theme-toggle" onClick={() => setIsDarkMode((previous) => !previous)}>
            {isDarkMode ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
          </button>
        </div>
      </header>

      {activeMainTab === 'generator' ? (
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
                <div className="edge-slider">
                  <span>Edge case oranı</span>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={5}
                    value={edgeCaseRatio}
                    onChange={(event) => setEdgeCaseRatio(Number(event.target.value))}
                    aria-label="Edge case oranı"
                  />
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={edgeCaseRatio}
                    onChange={(event) =>
                      setEdgeCaseRatio(Math.min(50, Math.max(0, Number(event.target.value) || 0)))
                    }
                    aria-label="Edge case oranı yüzde"
                  />
                  <span className="edge-slider__value">%{edgeCaseRatio}</span>
                </div>
                <button type="button" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? 'Üretiliyor…' : 'Veri Üret'}
                </button>
              </div>
            </div>

            <details className="edge-info">
              <summary>Edge case açıklaması</summary>
              <p>
                Edge case kayıtları, sınır değerlerin ve beklenmeyen kombinasyonların test edilmesine yardımcı olur. Veri
                kümesinin %{edgeCaseRatio} kadarı uç örneklerden oluşur.
              </p>
              <ul>
                <li>Minimum veya maksimum kısıtlarının dışına çıkan değerler</li>
                <li>Pattern veya enum tanımlarına uymayan string içerikleri</li>
                <li>Zorunlu olmayan alanların boş bırakıldığı veya NULL döndüğü senaryolar</li>
              </ul>
            </details>

            <div className="definition-tabs">
              <button
                type="button"
                className={activeDefinitionTab === 'definition' ? 'active' : ''}
                onClick={() => setActiveDefinitionTab('definition')}
              >
                Tanım
              </button>
              <button
                type="button"
                className={activeDefinitionTab === 'examples' ? 'active' : ''}
                onClick={() => setActiveDefinitionTab('examples')}
              >
                Örnekler
              </button>
            </div>

            {activeDefinitionTab === 'definition' ? (
              mode !== 'manual' ? (
                <>
                  <textarea
                    value={definition}
                    onChange={(event) => setDefinition(event.target.value)}
                    spellCheck={false}
                    className="schema-input"
                    rows={18}
                  />
                  {mode === 'jsonSchema' && (
                    <div className="schema-helper">
                      <div>
                        <h3>AI Destekli Şema Çıkarma</h3>
                        <p>Örnek JSON verisini yapıştırın, şema otomatik çıkarılsın.</p>
                      </div>
                      <textarea
                        value={sampleJson}
                        onChange={(event) => {
                          setSampleJson(event.target.value);
                          setSchemaAssistantError(null);
                          setSchemaAssistantMessage(null);
                        }}
                        spellCheck={false}
                        className="schema-helper__input"
                        rows={8}
                        placeholder='[{"id":1,"name":"Ada","email":"ada@example.com"}]'
                      />
                      <div className="schema-helper__actions">
                        <button
                          type="button"
                          onClick={handleSchemaInference}
                          disabled={isGenerating || !sampleJson.trim()}
                        >
                          Örnekten Şema Üret
                        </button>
                        {schemaAssistantMessage && (
                          <span className="schema-helper__status schema-helper__status--success">
                            {schemaAssistantMessage}
                          </span>
                        )}
                        {schemaAssistantError && (
                          <span className="schema-helper__status schema-helper__status--error">
                            {schemaAssistantError}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
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
              )
            ) : (
              <div className="examples-list">
                {currentExamples.map((example) => (
                  <article key={example.id} className="example-card">
                    <header>
                      <div>
                        <h3>{example.title}</h3>
                        {example.description && <p>{example.description}</p>}
                      </div>
                      <button type="button" onClick={() => handleExampleCopy(example)}>
                        {copiedExample === example.id ? 'Kopyalandı!' : 'Kopyala'}
                      </button>
                    </header>
                    <pre className={`code-block code-block--${example.language}`}>
                      {example.content}
                    </pre>
                  </article>
                ))}
                {currentExamples.length === 0 && <p className="empty">Bu mod için henüz örnek eklenmedi.</p>}
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
      ) : (
        <main className="layout layout--single">
          <section className="panel howto-panel">
            <h2>Uygulama Nasıl Kullanılır?</h2>
            {howToSections.map((section) => (
              <article key={section.title} className="howto-section">
                <h3>{section.title}</h3>
                <ul>
                  {section.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </main>
      )}
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
