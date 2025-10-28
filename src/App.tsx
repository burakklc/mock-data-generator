import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parse as parseWithPointers } from 'json-source-map';
import type { GeneratorMode, Language, ManualField } from './types';
import ManualFieldEditor from './components/ManualFieldEditor';
import LinedTextArea from './components/LinedTextArea';
import { parseCreateTableScript } from './utils/sqlParser';
import { manualFieldsToSchema } from './utils/manualSchema';
import { generateRecords, type ValidationIssue } from './utils/generator';
import { downloadCsv, downloadJson, downloadSql, toJsonString } from './utils/exporters';
import { inferSchemaFromSample } from './utils/schemaInference';
import { getExampleSnippets, type ExampleSnippet } from './data/examples';
import { getHowToSections } from './data/howTo';
import { languageOptions, translations } from './i18n';

type ValidationIssueWithLocation = ValidationIssue & { line?: number; column?: number };

const modeCardIcons: Record<GeneratorMode, ReactNode> = {
  jsonSchema: (
    <svg viewBox="0 0 24 24" focusable="false" role="img" aria-hidden="true">
      <path
        d="M6.5 3A2.5 2.5 0 0 0 4 5.5v13A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V8.414a2.5 2.5 0 0 0-.732-1.768l-3.914-3.914A2.5 2.5 0 0 0 13.586 2H6.5z"
        fill="currentColor"
      />
      <path
        d="M14 2.75v4a1.25 1.25 0 0 0 1.25 1.25h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8 14.5h8M8 17.5h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="8" y="9.5" width="8" height="2" rx="1" fill="currentColor" opacity="0.65" />
    </svg>
  ),
  createTable: (
    <svg viewBox="0 0 24 24" focusable="false" role="img" aria-hidden="true">
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v13A2.5 2.5 0 0 1 16.5 21h-9A2.5 2.5 0 0 1 5 18.5v-13z"
        fill="currentColor"
      />
      <path
        d="M8 8h8M8 11.5h8M8 15h5"
        stroke="var(--color-button-text)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8.25 18H11"
        stroke="var(--color-button-text)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  manual: (
    <svg viewBox="0 0 24 24" focusable="false" role="img" aria-hidden="true">
      <path
        d="M6.75 4A2.75 2.75 0 0 0 4 6.75v10.5A2.75 2.75 0 0 0 6.75 20H17.5l2.5-2.5V6.75A2.75 2.75 0 0 0 17.25 4h-10.5z"
        fill="currentColor"
      />
      <path
        d="M9 8.5h6M9 12h6"
        stroke="var(--color-button-text)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9 15.5h3.5"
        stroke="var(--color-button-text)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M17 21v-3l3 3h-3z" fill="var(--color-button-text)" />
    </svg>
  ),
};

const definitionTabIcons: Record<'definition' | 'examples', ReactNode> = {
  definition: (
    <svg viewBox="0 0 20 20" focusable="false" role="img" aria-hidden="true">
      <rect x="3.5" y="3.5" width="13" height="13" rx="2.5" fill="currentColor" opacity="0.16" />
      <path
        d="M6 7.75h8M6 10h5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="6" y="12.25" width="4" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  ),
  examples: (
    <svg viewBox="0 0 20 20" focusable="false" role="img" aria-hidden="true">
      <rect x="3.5" y="3.5" width="13" height="13" rx="2.5" fill="currentColor" opacity="0.16" />
      <path
        d="M8.5 7.5 6.5 10l2 2.5M11.5 7.5l2 2.5-2 2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
};

const definitionTabsOrder: Array<'definition' | 'examples'> = ['definition', 'examples'];

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
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'en';
    }
    const stored = window.localStorage.getItem('mdg.language');
    return stored === 'tr' ? 'tr' : 'en';
  });
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
  const [validationErrors, setValidationErrors] = useState<ValidationIssue[]>([]);
  const [validationContext, setValidationContext] = useState<{ definition: string; mode: GeneratorMode } | null>(null);
  const [sampleJson, setSampleJson] = useState<string>('');
  const [schemaAssistantError, setSchemaAssistantError] = useState<string | null>(null);
  const [schemaAssistantMessage, setSchemaAssistantMessage] = useState<string | null>(null);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);
  const copyResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const definitionPanelRef = useRef<HTMLDivElement | null>(null);
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

  const t = translations[language];

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.classList.toggle('theme-dark', isDarkMode);
    root.classList.add('theme-transition');
    const timer = window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 320);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mdg.theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mdg.language', language);
    }
  }, [language]);

  useEffect(() => {
    setSchemaAssistantError(null);
    setSchemaAssistantMessage(null);
  }, [language]);

  useEffect(
    () => () => {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = isNavOpen ? 'hidden' : previousOverflow || '';
    return () => {
      style.overflow = previousOverflow;
    };
  }, [isNavOpen]);

  useEffect(() => {
    if (!isNavOpen || typeof window === 'undefined') {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNavOpen]);

  useEffect(() => {
    if (activeDefinitionTab !== 'examples') {
      setCopiedExample(null);
    }
  }, [activeDefinitionTab]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsNavOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const manualSchemaPreview = useMemo(() => {
    if (mode !== 'manual') return '';
    const { schema } = manualFieldsToSchema(manualFields);
    return JSON.stringify(schema, null, 2);
  }, [manualFields, mode]);

  const currentExamples = useMemo(() => getExampleSnippets(language)[mode], [language, mode]);
  const howToSections = useMemo(() => getHowToSections(language), [language]);

  const closeNav = () => setIsNavOpen(false);

  const handleMainTabChange = (tab: 'generator' | 'howTo') => {
    setActiveMainTab(tab);
    closeNav();
  };

  const handleModeChange = (value: GeneratorMode) => {
    setMode(value);
    setActiveDefinitionTab('definition');
    setCopiedExample(null);
    setSchemaAssistantError(null);
    setSchemaAssistantMessage(null);
    closeNav();
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
        return { schema: null, errors: [t.schemaParseErrorPrefix + (error as Error).message] };
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
      setSchemaAssistantError(t.schemaHelper.emptyError);
      return;
    }
    try {
      const parsed = JSON.parse(sampleJson);
      const inferred = inferSchemaFromSample(parsed);
      setDefinition(JSON.stringify(inferred, null, 2));
      setSchemaAssistantMessage(t.schemaHelper.success);
      setActiveDefinitionTab('definition');
    } catch (error) {
      setSchemaAssistantError(t.schemaHelper.parseErrorPrefix + (error as Error).message);
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
      console.error('Copy failed', error);
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
      if (validation.length > 0) {
        setValidationContext({ definition, mode });
      } else {
        setValidationContext(null);
      }
      if (table) {
        setTableName(table);
      }
    } catch (error) {
      setSchemaErrors([(error as Error).message]);
      setRecords([]);
      setValidationErrors([]);
      setValidationContext(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const validationErrorsWithLocation = useMemo<ValidationIssueWithLocation[]>(() => {
    if (validationErrors.length === 0) {
      return [];
    }
    const contextDefinition = validationContext?.definition ?? definition;
    const contextMode = validationContext?.mode ?? mode;
    if (contextMode !== 'jsonSchema') {
      return validationErrors.map((issue) => ({ ...issue }));
    }
    try {
      const { pointers } = parseWithPointers(contextDefinition);
      return validationErrors.map((issue) => {
        const pointerCandidates: string[] = [];

        const addPointerCandidates = (pointer: string | null | undefined) => {
          if (pointer == null) {
            return;
          }
          let normalized = pointer;
          if (normalized.startsWith('#')) {
            normalized = normalized.slice(1);
          }
          if (normalized && !normalized.startsWith('/')) {
            normalized = `/${normalized}`;
          }
          if (normalized === '') {
            pointerCandidates.push('');
            return;
          }
          pointerCandidates.push(normalized);
          const segments = normalized.split('/');
          while (segments.length > 1) {
            segments.pop();
            const candidate = segments.join('/');
            pointerCandidates.push(candidate);
          }
        };

        addPointerCandidates(issue.schemaPath);
        addPointerCandidates(issue.instancePath || '');
        if (!pointerCandidates.length) {
          pointerCandidates.push('');
        }
        let pointerEntry;
        for (const candidate of pointerCandidates) {
          const candidateEntry = pointers[candidate];
          if (candidateEntry) {
            pointerEntry = candidateEntry;
            break;
          }
        }
        const fallbackEntry = pointerEntry ?? pointers[''];
        const location = fallbackEntry?.value ?? fallbackEntry?.key;
        const line = location?.line != null ? location.line + 1 : undefined;
        const column = location?.column != null ? location.column + 1 : undefined;
        return { ...issue, line, column };
      });
    } catch {
      return validationErrors.map((issue) => ({ ...issue }));
    }
  }, [validationErrors, validationContext, definition, mode]);

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
      <div className="app__brand">
        <div className="brand-mark" aria-hidden="true">
          MD
        </div>
        <div className="brand-copy">
          <h1>Mock Data Generator</h1>
          <p>{t.brandTagline}</p>
        </div>
      </div>
      <button
        type="button"
        className={`menu-toggle ${isNavOpen ? 'is-active' : ''}`}
        onClick={() => setIsNavOpen((previous) => !previous)}
        aria-label={isNavOpen ? t.menuToggle.close : t.menuToggle.open}
        aria-expanded={isNavOpen}
        aria-controls="app-navigation"
      >
        <span className="menu-icon" />
      </button>
      <nav id="app-navigation" className={`app__nav ${isNavOpen ? 'is-open' : ''}`}>
        <div className="nav-inner">
          <div className="nav-section">
            <span className="nav-label">{t.nav.viewLabel}</span>
            <div className="view-tabs">
              <button
                type="button"
                className={activeMainTab === 'generator' ? 'active' : ''}
                onClick={() => handleMainTabChange('generator')}
              >
                {t.nav.viewTabs.generator}
              </button>
              <button
                type="button"
                className={activeMainTab === 'howTo' ? 'active' : ''}
                onClick={() => handleMainTabChange('howTo')}
              >
                {t.nav.viewTabs.howTo}
              </button>
            </div>
          </div>
          <div className="nav-section">
            <span className="nav-label">{t.nav.modeLabel}</span>
            <div className="mode-selector">
              {(Object.keys(t.modeNames) as GeneratorMode[]).map((key) => (
                <button
                  key={key}
                  className={key === mode ? 'active' : ''}
                  type="button"
                  onClick={() => handleModeChange(key)}
                >
                  {t.modeNames[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="nav-section nav-section--language">
            <span className="nav-label">{t.nav.languageLabel}</span>
            <div className="language-switcher">
              {languageOptions.map((option) => {
                const isActive = option.value === language;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={isActive ? 'active' : ''}
                    onClick={() => {
                      if (!isActive) {
                        setLanguage(option.value);
                      }
                    }}
                    aria-pressed={isActive}
                    aria-label={option.fullLabel}
                    title={option.fullLabel}
                  >
                    {option.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="nav-footer">
            <button
              type="button"
              className={`theme-toggle ${isDarkMode ? 'is-dark' : ''}`}
              onClick={() => setIsDarkMode((previous) => !previous)}
              aria-pressed={isDarkMode}
              aria-label={isDarkMode ? t.themeToggle.toLightAria : t.themeToggle.toDarkAria}
              title={isDarkMode ? t.themeToggle.toLightAria : t.themeToggle.toDarkAria}
            >
              <span className="theme-toggle__icon" aria-hidden="true">
                {isDarkMode ? (
                  <svg viewBox="0 0 24 24">
                    <path
                        d="M15.25 4.5a.75.75 0 0 0-.71 1 6.5 6.5 0 1 1-8.04 8.04.75.75 0 0 0-1 .71 8 8 0 1 0 9.75-9.75z"
                        fill="currentColor"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
                      <path
                        d="M12 3v1.5M12 19.5V21M4.5 12H3M21 12h-1.5M6.22 6.22 5.16 5.16M18.84 18.84l-1.06-1.06M6.22 17.78 5.16 18.84M18.84 5.16l-1.06 1.06"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="theme-toggle__copy">
                  <span className="theme-toggle__label">
                    {isDarkMode ? t.themeToggle.darkActive : t.themeToggle.lightActive}
                  </span>
                  <span className="theme-toggle__caption">{t.themeToggle.caption}</span>
                </span>
              </button>
            </div>
          </div>
        </nav>
      </header>
      {isNavOpen && <div className="nav-overlay" aria-hidden="true" onClick={closeNav} />}

      {activeMainTab === 'generator' ? (
        <>
          <section className="hero">
            <div className="hero__content">
              <h2>{t.hero.title}</h2>
              <p>{t.hero.description}</p>
              <div className="hero__actions">
                <button
                  type="button"
                  className="hero__cta"
                  onClick={() => definitionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  {t.hero.ctaPrimary}
                </button>
                <button type="button" className="hero__secondary" onClick={() => handleMainTabChange('howTo')}>
                  {t.hero.ctaSecondary}
                </button>
              </div>
              <ul className="hero__highlights">
                {t.hero.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
            <div className="hero__modes">
              <span className="hero__modes-label">{t.hero.modeLabel}</span>
              <div className="mode-cards">
                {(Object.keys(t.modeNames) as GeneratorMode[]).map((key) => {
                  const copy = t.modeCards[key];
                  const isActive = mode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`mode-card ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleModeChange(key)}
                      aria-pressed={isActive}
                      aria-label={`${t.modeNames[key]}: ${copy.description}`}
                    >
                      <span className="mode-card__icon" aria-hidden="true">
                        {modeCardIcons[key]}
                      </span>
                      <div className="mode-card__body">
                        <div className="mode-card__meta">
                          <span className="mode-card__highlight">{copy.highlight}</span>
                          <h3>{t.modeNames[key]}</h3>
                        </div>
                        <p>{copy.description}</p>
                      </div>
                      {isActive && <span className="mode-card__status">{t.modeSelectedLabel}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
          <main className="layout">
            <section className="panel panel--definition" ref={definitionPanelRef}>
              <div className="panel__header">
                <h2>{t.definitionPanel.title}</h2>
                <div className="panel__actions">
                  <label>
                    {t.definitionPanel.recordCountLabel}
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={recordCount}
                      onChange={(event) => setRecordCount(Math.min(1000, Math.max(1, Number(event.target.value))))}
                    />
                  </label>
                  <div className="edge-slider">
                    <span>{t.definitionPanel.edgeCaseLabel}</span>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={edgeCaseRatio}
                      onChange={(event) => setEdgeCaseRatio(Number(event.target.value))}
                      aria-label={t.definitionPanel.edgeCaseSliderAria}
                    />
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={edgeCaseRatio}
                      onChange={(event) =>
                        setEdgeCaseRatio(Math.min(50, Math.max(0, Number(event.target.value) || 0)))
                      }
                      aria-label={t.definitionPanel.edgeCaseNumberAria}
                    />
                    <span className="edge-slider__value">%{edgeCaseRatio}</span>
                  </div>
                  <button type="button" onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? t.definitionPanel.generateBusy : t.definitionPanel.generateIdle}
                  </button>
                </div>
              </div>

              <details className="edge-info">
                <summary>{t.definitionPanel.edgeSummary}</summary>
                <p>{t.definitionPanel.edgeDescription(edgeCaseRatio)}</p>
                <ul>
                  {t.definitionPanel.edgeBullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>

              <div className="definition-tabs">
                {definitionTabsOrder.map((tabKey) => {
                  const isActive = activeDefinitionTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      className={isActive ? 'active' : ''}
                      onClick={() => setActiveDefinitionTab(tabKey)}
                    >
                      <span className="tab-icon" aria-hidden="true">
                        {definitionTabIcons[tabKey]}
                      </span>
                      <span className="tab-label">{t.definitionTabs[tabKey]}</span>
                    </button>
                  );
                })}
              </div>

              {activeDefinitionTab === 'definition' ? (
                mode !== 'manual' ? (
                  <>
                    <LinedTextArea
                      value={definition}
                      onChange={(event) => setDefinition(event.target.value)}
                      spellCheck={false}
                      className="schema-input"
                      wrapperClassName="schema-input-wrapper"
                      rows={18}
                    />
                    {mode === 'jsonSchema' && (
                      <div className="schema-helper">
                        <div>
                          <h3>{t.schemaHelper.title}</h3>
                          <p>{t.schemaHelper.description}</p>
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
                          placeholder={t.schemaHelper.placeholder}
                        />
                        <div className="schema-helper__actions">
                          <button
                            type="button"
                            onClick={handleSchemaInference}
                            disabled={isGenerating || !sampleJson.trim()}
                          >
                            {t.schemaHelper.action}
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
                        copy={t.manualEditor}
                      />
                    ))}
                    <button type="button" className="add-field" onClick={addManualField}>
                      {t.manualEditor.addField}
                    </button>
                    <div className="manual-preview">
                      <h3>{t.manualEditor.previewTitle}</h3>
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
                          {copiedExample === example.id ? t.examples.copied : t.examples.copy}
                        </button>
                      </header>
                      <pre className={`code-block code-block--${example.language}`}>
                        {example.content}
                      </pre>
                    </article>
                  ))}
                  {currentExamples.length === 0 && <p className="empty">{t.examples.empty}</p>}
                </div>
              )}

              {schemaErrors.length > 0 && (
                <div className="error-box">
                  <h3>{t.schemaErrorsTitle}</h3>
                  <ul>
                    {schemaErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

          <section className="panel panel--preview">
            <div className="panel__header panel__header--stack">
              <div className="panel__title">
                <h2>{t.previewPanel.title}</h2>
                <p className="panel__subtitle">{t.previewPanel.subtitle}</p>
              </div>
              {records.length > 0 && (
                <div className="preview-meta">
                  <span className="preview-chip">{t.previewPanel.recordChip(records.length)}</span>
                  <span className="preview-chip preview-chip--muted">
                    {previewRecords.length < records.length
                      ? t.previewPanel.limitedChip(previewRecords.length, records.length)
                      : t.previewPanel.allChip(previewRecords.length)}
                  </span>
                </div>
              )}
            </div>
            <div className="export-actions">
              <button
                type="button"
                onClick={() => downloadJson(records)}
                disabled={exportDisabled}
                data-tooltip={t.exportButtons.json.tooltip}
                title={t.exportButtons.json.tooltip}
              >
                <span className="export-actions__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M12 3v12.25"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M8.5 12.5 12 16l3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M6 18.5h12"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </span>
                <span className="export-actions__body">
                  <span className="export-actions__label">{t.exportButtons.json.label}</span>
                  <span className="export-actions__description">{t.exportButtons.json.description}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => downloadCsv(records)}
                disabled={exportDisabled}
                data-tooltip={t.exportButtons.csv.tooltip}
                title={t.exportButtons.csv.tooltip}
              >
                <span className="export-actions__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M6.5 4A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 17.5 4h-11z"
                      fill="currentColor"
                      opacity="0.18"
                    />
                    <path
                      d="M7.5 8h9M7.5 12h9M7.5 16h9"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </span>
                <span className="export-actions__body">
                  <span className="export-actions__label">{t.exportButtons.csv.label}</span>
                  <span className="export-actions__description">{t.exportButtons.csv.description}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => downloadSql(records, tableName || 'mock_data')}
                disabled={exportDisabled}
                data-tooltip={t.exportButtons.sql.tooltip}
                title={t.exportButtons.sql.tooltip}
              >
                <span className="export-actions__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v11A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5v-11z"
                      fill="currentColor"
                    />
                    <path
                      d="M8.5 9h7M8.5 12h4"
                      stroke="var(--color-button-text)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M8.5 15h3"
                      stroke="var(--color-button-text)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </span>
                <span className="export-actions__body">
                  <span className="export-actions__label">{t.exportButtons.sql.label}</span>
                  <span className="export-actions__description">{t.exportButtons.sql.description}</span>
                </span>
              </button>
            </div>
            {records.length === 0 ? (
              <p className="empty">{t.previewPanel.empty}</p>
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
                  <summary>{t.previewPanel.jsonSummary}</summary>
                  <pre className="json-preview">{jsonPreview}</pre>
                </details>
              </>
            )}
            {validationErrorsWithLocation.length > 0 && (
              <div className="warning-box">
                <h3>{t.validationTitle}</h3>
                <ul>
                  {validationErrorsWithLocation.map((error, index) => {
                    const contextParts: string[] = [];
                    if (error.line != null) {
                      contextParts.push(`Satır ${error.line}`);
                    }
                    contextParts.push(`Kayıt ${error.recordNumber}`);
                    const prefix = contextParts.length ? `${contextParts.join(' • ')}: ` : '';
                    const suggestion = error.suggestion ? ` — Çözüm: ${error.suggestion}` : '';
                    return (
                      <li key={`${error.schemaPath}-${error.instancePath}-${error.recordNumber}-${index}`}>
                        {prefix}
                        {error.message}
                        {suggestion}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </main>
        </>
      ) : (
        <main className="layout layout--single">
          <section className="panel howto-panel">
            <h2>{t.howToTitle}</h2>
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
