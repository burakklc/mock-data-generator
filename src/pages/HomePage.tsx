import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parse as parseWithPointers } from 'json-source-map';
import type { GeneratorMode, Language, ManualField } from '../types';
import ManualFieldEditor from '../components/ManualFieldEditor';
import LinedTextArea from '../components/LinedTextArea';
import { parseCreateTableScript } from '../utils/sqlParser';
import { manualFieldsToSchema } from '../utils/manualSchema';
import { generateRecords, type ValidationIssue } from '../utils/generator';
import {
  downloadCsv,
  downloadJson,
  downloadSql,
  downloadGraphQL,
  downloadTypeScript,
  toJsonString,
  toGraphQL,
  toTypeScript,
} from '../utils/exporters';
import { inferSchemaFromSample } from '../utils/schemaInference';
import { getExampleSnippets, type ExampleSnippet } from '../data/examples';
import { getHowToSections } from '../data/howTo';
import { languageOptions, translations } from '../i18n';
import SEO from '../components/SEO';
import AdUnit from '../components/AdUnit';

type ValidationIssueWithLocation = ValidationIssue & { line?: number; column?: number };

const modeIcons: Record<GeneratorMode, ReactNode> = {
  jsonSchema: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  ),
  createTable: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18" />
    </svg>
  ),
  manual: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  graphql: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" />
      <path d="M12 12l8.5-5M12 12v10M12 12L3.5 7" />
    </svg>
  ),
  typescript: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
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
  if (mode === 'jsonSchema' || mode === 'typescript' || mode === 'graphql') return initialSchema;
  if (mode === 'createTable') return initialCreateTable;
  return '';
}

export default function HomePage() {
  const [mode, setMode] = useState<GeneratorMode>('jsonSchema');
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem('mdg.language');
    return stored === 'tr' ? 'tr' : 'en';
  });
  const [definition, setDefinition] = useState<string>(getDefaultInput('jsonSchema'));
  const [manualFields, setManualFields] = useState<ManualField[]>([createManualField()]);
  const [recordCount, setRecordCount] = useState<number>(5);
  const [edgeCaseRatio, setEdgeCaseRatio] = useState<number>(0);
  const [records, setRecords] = useState<any[]>([]);
  const [tableName, setTableName] = useState<string>('mock_data');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationIssue[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('mdg.theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  const t = translations[language];
  const generatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('theme-dark', isDarkMode);
    window.localStorage.setItem('mdg.theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    window.localStorage.setItem('mdg.language', language);
  }, [language]);

  const handleModeChange = (newMode: GeneratorMode) => {
    setMode(newMode);
    setDefinition(getDefaultInput(newMode));
    setRecords([]);
    setSchemaErrors([]);
    if (newMode === 'manual') {
      setManualFields([createManualField()]);
    }
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSchemaErrors([]);
    setValidationErrors([]);
    try {
      let schema: any;
      let table: string | undefined;

      if (mode === 'manual') {
        const result = manualFieldsToSchema(manualFields);
        schema = result.schema;
        if (result.errors.length) throw new Error(result.errors.join(', '));
      } else if (mode === 'createTable') {
        const result = parseCreateTableScript(definition);
        schema = result.schema;
        table = result.tableName;
        if (result.errors.length) throw new Error(result.errors.join(', '));
      } else {
        try {
          schema = JSON.parse(definition);
        } catch (e) {
          throw new Error('Invalid JSON Schema');
        }
      }

      if (table) setTableName(table);

      const { records: generated, validationErrors: validation } = await generateRecords(
        schema,
        recordCount,
        edgeCaseRatio,
      );
      setRecords(generated);
      setValidationErrors(validation);
    } catch (error) {
      setSchemaErrors([(error as Error).message]);
      setRecords([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (format: 'json' | 'csv' | 'sql' | 'graphql' | 'typescript') => {
    if (!records.length) return;
    switch (format) {
      case 'json':
        downloadJson(records);
        break;
      case 'csv':
        downloadCsv(records);
        break;
      case 'sql':
        downloadSql(records, tableName);
        break;
      case 'graphql':
        downloadGraphQL(records, 'MockData');
        break;
      case 'typescript':
        downloadTypeScript(records, 'MockData');
        break;
    }
  };

  const previewContent = useMemo(() => {
    if (!records.length) return '';
    if (mode === 'graphql') return toGraphQL(records);
    if (mode === 'typescript') return toTypeScript(records);
    return toJsonString(records);
  }, [records, mode]);

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app">
      <SEO
        title="Mock Data Generator"
        description="Generate realistic mock data fast from JSON Schema, SQL, GraphQL, or TypeScript interfaces."
      />
      <header className="app__header">
        <div className="app__brand">
          <div className="brand-mark">MD</div>
          <div className="brand-copy">
            <h1>Mock Data Generator</h1>
            <p>{t.brandTagline}</p>
          </div>
        </div>
        <div className="app__actions">
          <div className="language-switcher">
            {languageOptions.map((opt) => (
              <button
                key={opt.value}
                className={language === opt.value ? 'active' : ''}
                onClick={() => setLanguage(opt.value)}
              >
                {opt.shortLabel}
              </button>
            ))}
          </div>
          <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <header className="hero">
        <div className="hero__content">
          <h1>Generate Mock Data Instantly</h1>
          <p>
            Create realistic test data for your applications. Support for JSON Schema, SQL, GraphQL, and TypeScript.
            Private, fast, and runs entirely in your browser.
          </p>
          <div className="hero__actions">
            <button
              className="hero__cta"
              onClick={() => {
                handleModeChange('jsonSchema');
                scrollToGenerator();
              }}
            >
              Start with JSON
            </button>
            <button
              className="hero__secondary"
              onClick={() => {
                handleModeChange('createTable');
                scrollToGenerator();
              }}
            >
              Start with SQL
            </button>
            <button
              className="hero__secondary"
              onClick={() => {
                handleModeChange('graphql');
                scrollToGenerator();
              }}
            >
              Start with GraphQL
            </button>
          </div>
        </div>
      </header>

      <div ref={generatorRef} className="generator-layout">
        <div className="generator-toolbar">
          <div className="mode-selector">
            {(Object.keys(modeIcons) as GeneratorMode[]).map((m) => (
              <button key={m} className={mode === m ? 'active' : ''} onClick={() => handleModeChange(m)}>
                {modeIcons[m]}
                <span>
                  {m === 'jsonSchema'
                    ? 'JSON'
                    : m === 'createTable'
                      ? 'SQL'
                      : m === 'graphql'
                        ? 'GraphQL'
                        : m === 'typescript'
                          ? 'TypeScript'
                          : 'Manual'}
                </span>
              </button>
            ))}
          </div>
          <div className="generator-controls">
            <label>
              Rows:
              <input
                type="number"
                value={recordCount}
                onChange={(e) => setRecordCount(Number(e.target.value))}
                min="1"
                max="1000"
              />
            </label>
            <button className="generate-btn" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Data'}
            </button>
          </div>
        </div>

        <div className="generator-workspace">
          <div className="workspace-panel input-panel">
            {mode === 'manual' ? (
              <div className="manual-editor">
                {manualFields.map((field) => (
                  <ManualFieldEditor
                    key={field.id}
                    field={field}
                    onChange={handleManualFieldChange}
                    onRemove={handleManualFieldRemove}
                    copy={t.manualEditor}
                  />
                ))}
                <button type="button" className="add-field" onClick={addManualField}>
                  {t.manualEditor.addField}
                </button>
              </div>
            ) : (
              <LinedTextArea
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
              />
            )}
            {schemaErrors.length > 0 && (
              <div className="error-box">
                <h4>Error</h4>
                <ul>
                  {schemaErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="workspace-panel output-panel">
            {records.length > 0 ? (
              <>
                <div className="output-toolbar">
                  <span>{records.length} records generated</span>
                  <div className="export-actions">
                    <button onClick={() => handleExport('json')}>JSON</button>
                    <button onClick={() => handleExport('csv')}>CSV</button>
                    <button onClick={() => handleExport('sql')}>SQL</button>
                    <button onClick={() => handleExport('graphql')}>GQL</button>
                    <button onClick={() => handleExport('typescript')}>TS</button>
                  </div>
                </div>
                <pre className="preview-code">{previewContent}</pre>
              </>
            ) : (
              <div className="empty-state">
                <p>Click "Generate Data" to see results here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="home-story">
        <div className="home-story__text">
          <h2>Why MockData.net?</h2>
          <p>
            MockData.net helps developers, testers, and data engineers generate realistic test data in seconds. Whether
            you need user profiles, e-commerce transactions, or IoT logs, our tool creates consistent and valid datasets
            for your projects.
          </p>
          <p>
            <strong>Privacy First:</strong> All data generation happens locally in your browser. No schemas or generated
            data are ever sent to our servers.
          </p>
        </div>
        <div className="home-story__aside">
          <AdUnit slot="1234567890" />
        </div>
      </section>
    </div>
  );
}
