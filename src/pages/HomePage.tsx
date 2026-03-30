import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileJson,
  Database,
  Table,
  Code2,
  Download,
  Copy,
  Check,
  Settings2,
  RefreshCw,
  Braces,
  Share2,
  LayoutTemplate,
  FileCode
} from 'lucide-react';

import LZString from 'lz-string';
import { DashboardShell } from '../components/DashboardShell';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sidebar } from '../components/Sidebar';
import { ApiMockWorkspace } from '../components/ApiMockWorkspace';
import { CodePreview } from '../components/CodePreview';
import { TemplateGallery } from '../components/TemplateGallery';
import LinedTextArea from '../components/LinedTextArea';
import { generateRecords, type GenerationOutcome } from '../utils/generator';
import {
  toJsonString,
  toCsvString,
  toSqlInsert,
  downloadJson,
  downloadExcel,
  downloadSql
} from '../utils/exporters';
import { manualFieldsToSchema } from '../utils/manualSchema';
import type { ManualField } from '../types';


function createNewField(): ManualField {
  return {
    id: Math.random().toString(36).slice(2),
    name: 'newField',
    type: 'string',
    required: true
  };
}

const TOOLS = [
  {
    id: 'json',
    title: 'JSON Generator',
    description: 'Generate robust JSON datasets with schema validation.',
    icon: FileJson,
    color: 'text-yellow-400',
    preview: '{ "id": 1, "name": "..." }'
  },
  {
    id: 'csv',
    title: 'CSV / Excel',
    description: 'Create spreadsheet-ready data for analysis.',
    icon: Table,
    color: 'text-green-400',
    preview: 'id,name\n1,Alice'
  },
  {
    id: 'sql',
    title: 'SQL Insert',
    description: 'Generate INSERT statements for your database.',
    icon: Database,
    color: 'text-blue-400',
    preview: 'INSERT INTO users...'
  },
  {
    id: 'api',
    title: 'Custom API',
    description: 'Mock API endpoints with dynamic responses.',
    icon: Code2,
    color: 'text-purple-400',
    preview: 'GET /api/users'
  }
];

export default function HomePage() {
  const [view, setView] = useState<'hero' | 'workspace'>('hero');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const [fields, setFields] = useState<ManualField[]>([
    { id: '1', name: 'id', type: 'integer', required: true },
    { id: '2', name: 'firstName', type: 'string', required: true },
    { id: '3', name: 'email', type: 'string', pattern: '^\\\\S+@\\\\S+\\\\.\\\\S+$', required: true },
    { 
      id: '4', 
      name: 'address', 
      type: 'object', 
      required: false,
      children: [
        { id: '4a', name: 'street', type: 'string', required: true },
        { id: '4b', name: 'city', type: 'string', required: true }
      ]
    }
  ]);
  
  const [recordCount, setRecordCount] = useState(10);
  const [locale, setLocale] = useState<'en' | 'tr' | 'de'>('en');
  const [seed, setSeed] = useState<number | undefined>();
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Bidirectional Sync State
  const [schemaMode, setSchemaMode] = useState<'visual' | 'json'>('visual');
  const [jsonSchemaText, setJsonSchemaText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [apiCopied, setApiCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Load from URL Hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#schema=', '');
    if (hash) {
      try {
        const decoded = LZString.decompressFromEncodedURIComponent(hash);
        if (decoded) {
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed)) {
            setFields(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to parse schema from URL", e);
      }
    }
  }, []);

  // Update JSON text when fields change (if not in JSON mode)
  useEffect(() => {
    if (schemaMode === 'visual') {
      try {
        setJsonSchemaText(JSON.stringify(fields, null, 2));
        setJsonError('');
      } catch (e) {
        // Safe fallback
      }
    }
  }, [fields, schemaMode]);

  const handleJsonChange = (val: string) => {
    setJsonSchemaText(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        setFields(parsed);
        setJsonError('');
      } else {
        setJsonError('Schema must be an array of fields.');
      }
    } catch (e) {
      setJsonError('Invalid JSON format.');
    }
  };

  // Initial generation on load or field change
  useMemo(() => {
    const generate = async () => {
      const result = manualFieldsToSchema(fields);
      if (!result.errors.length) {
        const outcome = await generateRecords(result.schema, {
          count: recordCount,
          locale,
          seed
        }, 0);
        setGeneratedData(outcome.records);
      }
    };
    generate();
  }, [fields, recordCount, locale, seed]);

  const previewCode = useMemo(() => {
    if (!generatedData.length) return '';
    if (activeTool === 'csv') return toCsvString(generatedData);
    if (activeTool === 'sql') return toSqlInsert(generatedData, 'mock_table');
    return toJsonString(generatedData);
  }, [generatedData, activeTool]);

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
    setView('workspace');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyApi = () => {
    const apiWrap = {
      data: generatedData,
      meta: {
        total: generatedData.length,
        status: 200,
        message: "success"
      }
    };
    navigator.clipboard.writeText(JSON.stringify(apiWrap, null, 2));
    setApiCopied(true);
    setTimeout(() => setApiCopied(false), 2000);
  };

  const handleShare = () => {
    try {
      const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(fields));
      window.history.replaceState(null, '', `#schema=${encoded}`);
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch(e) {}
  };

  const handleDownload = () => {
    if (activeTool === 'csv') downloadExcel(generatedData);
    else if (activeTool === 'sql') downloadSql(generatedData, 'mock_table');
    else downloadJson(generatedData);
  };

  return (
    <DashboardShell activeView={view}>
      {/* HERO VIEW */}
      {view === 'hero' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16 z-10"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Generate test data in seconds.
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              Create realistic JSON, CSV, and SQL datasets without the friction.
              <br />
              Runs entirely in your browser.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl z-10">
            {TOOLS.map((tool) => (
              <Card
                key={tool.id}
                layoutId={`card-${tool.id}`}
                onClick={() => handleToolSelect(tool.id)}
                className="group hover:bg-gray-800/80"
              >
                <CardHeader className="flex items-start justify-between pb-2">
                  <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                    <tool.icon className={cn("w-6 h-6", tool.color)} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-gray-500">
                    Click to open
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold text-gray-200 mb-2">{tool.title}</h3>
                  <p className="text-sm text-gray-500">{tool.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* WORKSPACE VIEW */}
      {view === 'workspace' && (
        activeTool === 'api' ? (
          <div className="flex flex-col flex-1 h-screen relative">
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0d1117] flex-shrink-0 z-20">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView('hero')}
                  className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  ← Back
                </button>
                <div className="h-4 w-[1px] bg-gray-700" />
                <span className="text-sm font-semibold text-gray-200">
                  Custom API Simulator
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
               <ApiMockWorkspace />
            </div>
          </div>
        ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR CONFIG (With Sync Toggle) */}
          <div className="flex flex-col w-[380px] border-r border-gray-800 bg-gray-900/30">
              <div className="h-12 flex items-center bg-[#0d1117] border-b border-gray-800 px-2 justify-between">
                <div className="flex bg-gray-900 rounded border border-gray-800 overflow-hidden flex-1 mr-2">
                  <button
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium transition-colors ${schemaMode === 'visual' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setSchemaMode('visual')}
                  >
                    <Settings2 className="w-3.5 h-3.5" /> Visual
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium transition-colors ${schemaMode === 'json' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setSchemaMode('json')}
                  >
                    <Braces className="w-3.5 h-3.5" /> JSON
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => setIsTemplateGalleryOpen(true)} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-purple-400" title="Templates">
                    <LayoutTemplate className="w-4 h-4" />
                  </button>
                  <button onClick={handleShare} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-blue-400" title="Share Link">
                    {shareCopied ? <Check className="w-4 h-4 text-green-400"/> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            
            <div className="flex-1 overflow-hidden relative">
              {schemaMode === 'visual' ? (
                <Sidebar
                  fields={fields}
                  onChange={setFields}
                />
              ) : (
                <div className="h-full flex flex-col p-2 bg-dark">
                  <LinedTextArea 
                    value={jsonSchemaText}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder="Enter ManualField[] JSON array..."
                  />
                  {jsonError && (
                    <div className="p-2 mt-2 text-xs text-red-400 bg-red-400/10 rounded border border-red-500/20 break-words">
                      {jsonError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MAIN PREVIEW AREA */}
          <div className="flex-1 flex flex-col bg-[#0d1117]">
            {/* TOOLBAR */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0d1117] overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  onClick={() => setView('hero')}
                  className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  ← Back
                </button>
                <div className="h-4 w-[1px] bg-gray-700" />
                <span className="text-sm font-semibold text-gray-200">
                  {TOOLS.find(t => t.id === activeTool)?.title}
                </span>
              </div>

              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-medium">Locale:</label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as any)}
                    className="w-16 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 py-1 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="en">EN</option>
                    <option value="tr">TR</option>
                    <option value="de">DE</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-medium">Seed:</label>
                  <input
                    type="number"
                    value={seed ?? ''}
                    onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Random"
                    className="w-20 bg-gray-800 border border-gray-700 rounded text-xs text-center py-1 focus:ring-1 focus:ring-primary text-gray-300 focus:outline-none placeholder:text-gray-600"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-medium">Rows:</label>
                  <input
                    type="number"
                    value={recordCount}
                    onChange={(e) => setRecordCount(Number(e.target.value))}
                    className="w-16 bg-gray-800 border border-gray-700 rounded text-xs text-center py-1 focus:ring-1 focus:ring-primary text-gray-300 focus:outline-none"
                  />
                </div>

                <div className="h-4 w-[1px] bg-gray-700 mx-1" />

                <Button variant="ghost" size="sm" onClick={handleCopyApi} className="text-purple-400 hover:bg-purple-400/10 hover:text-purple-300 px-2">
                  {apiCopied ? <Check className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                  <span className="ml-1 hidden xl:inline">{apiCopied ? 'Copied' : 'As API'}</span>
                </Button>

                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span className="ml-2 hidden xl:inline">{copied ? 'Copied' : 'Copy'}</span>
                </Button>

                <Button size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* CODE PREVIEW */}
            <CodePreview code={previewCode} />
          </div>
        </div>
        )
      )}

      <TemplateGallery 
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onSelect={(newFields) => setFields(newFields)}
      />
    </DashboardShell>
  );
}

// Helper utility for classnames
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
